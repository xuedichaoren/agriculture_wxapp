/**
 * 数据访问层 · 认养收成
 *
 * 收成不单独建表：由「地块面积 / 作物亩产（yieldText）/ 认养天数」推出来。
 * 演示版把「已收」按下单天数线性折算，接后端后直接读采收单：
 *   GET  /adopt/orders/:id/harvest    预估与实收斤数
 *   GET  /adopt/orders/:id/pickups    采收记录
 *   POST /adopt/orders/:id/redeem     把待收斤数安排成寄送 / 代存 / 积分
 *
 * 斤数统一用「斤」（不是 kg），跟 mock 里的 yieldText「约 12 斤」对齐。
 */
import { findPlot, findCrop, daysGone, statusText } from './adopt.js'
import { shiftDate, spanDays, todayStr } from './adopt-plan.js'

/** 1 斤折多少积分 */
export const POINTS_PER_KG = 20

/** 待收斤数的三种去向 */
export const REDEEM_WAYS = [
  { key: 'ship', name: '寄到家', short: '冷链发货', sub: '顺丰冷链 · 3 斤起寄', emoji: '📦', tip: '满 3 斤包邮' },
  { key: 'store', name: '存菜窖', short: '先存着', sub: '农场代存 · 攒够再寄', emoji: '🧺', tip: '免费存 30 天' },
  { key: 'points', name: '换积分', short: '换积分', sub: `1 斤 = ${POINTS_PER_KG} 积分`, emoji: '🎁', tip: '积分可抵现' }
]

const WAY_TEXT = { ship: '已安排寄出', store: '已存菜窖', points: '已换积分' }

function round1(n) {
  return Math.round(Number(n || 0) * 10) / 10
}

function yieldNum(text) {
  const m = String(text || '').match(/(\d+(?:\.\d+)?)/)
  return m ? Number(m[1]) : 0
}

/**
 * 面积系数：蔬菜按 20㎡ 一垄折算，果树按棵（yieldText 本身就是单棵产量）不折算
 * 夹在 0.5～2 之间，避免 10㎡ 地块算出 1 斤、40㎡ 地块算出 40 斤这种离谱值
 */
function areaFactor(plot, crop) {
  if (!plot) return 1
  if (Number(crop.days || 0) >= 120) return 1
  const f = Number(plot.area || 20) / 20
  return Math.max(0.5, Math.min(2, f))
}

/**
 * 认养单 → 收成视图
 * @param {object} a 认养单
 * @param {Array} ops 用户已安排的收成操作（store/adopt-extra.js 里的 harvestOps）
 */
export function harvestViewOf(a, ops = []) {
  if (!a) return null
  const plot = findPlot(a.plotId)
  const crops = (a.crops || []).map(findCrop).filter(Boolean)
  const total = spanDays(a.startDate, a.endDate)
  const gone = Math.min(total, Math.max(0, daysGone(a)))
  // 生长中按天数折 86% 封顶：留一点在地里，别把还没采的算成已收
  const ratio = a.status === 'ended' ? 1 : Math.min(0.86, total ? gone / total : 0)

  const rows = crops.map((c) => {
    const expect = round1(yieldNum(c.yieldText) * areaFactor(plot, c))
    const picked = round1(expect * ratio)
    const reserved = round1(
      (ops || [])
        .filter((o) => o.cropId === c.id)
        .reduce((s, o) => s + Number(o.kg || 0), 0)
    )
    const left = Math.max(0, round1(expect - picked - reserved))
    return {
      cropId: c.id,
      name: c.name,
      emoji: c.emoji,
      bg: c.bg || ['#EAF7EE', '#CFEAD8'],
      yieldText: c.yieldText,
      expect,
      picked,
      reserved,
      left,
      pct: expect ? Math.round((picked / expect) * 100) : 0
    }
  })

  const sum = (k) => round1(rows.reduce((s, r) => s + r[k], 0))
  const expect = sum('expect')
  const picked = sum('picked')
  const reserved = sum('reserved')
  const left = sum('left')

  return {
    rows,
    expect,
    picked,
    reserved,
    left,
    pct: expect ? Math.round((picked / expect) * 100) : 0,
    statusText: statusText(a.status),
    growing: a.status === 'growing',
    points: Math.floor(reserved * POINTS_PER_KG),
    nextPick: nextPickOf(rows),
    canRedeem: a.status === 'growing' && left > 0
  }
}

/** 下一次采收预告：挑剩得最多的那种作物，默认 2 天后 */
function nextPickOf(rows) {
  const row = (rows || []).slice().sort((a, b) => b.left - a.left)[0]
  if (!row || row.left <= 0) return null
  return {
    date: shiftDate(todayStr(), 2),
    cropId: row.cropId,
    cropName: row.name,
    emoji: row.emoji,
    kg: Math.min(3, row.left)
  }
}

/**
 * 收成记录：农场侧的采收（按天数模拟，每 7 天一次）+ 用户自己安排的去向
 * @returns {Array<{key,date,cropName,emoji,kg,way,wayText,mine,points}>}
 */
export function pickRecordsOf(a, ops = []) {
  if (!a) return []
  const crops = (a.crops || []).map(findCrop).filter(Boolean)
  if (!crops.length) return []
  const today = todayStr()
  const times = Math.min(5, Math.max(1, Math.floor(daysGone(a) / 7)))
  const farmSide = []
  for (let i = 0; i < times; i++) {
    const date = shiftDate(today, -(i * 7 + 1))
    if (date < String(a.startDate || '')) break
    const c = crops[i % crops.length]
    farmSide.push({
      key: 'f' + i,
      date,
      cropId: c.id,
      cropName: c.name,
      emoji: c.emoji,
      kg: round1(2.4 + ((i * 3) % 5) * 0.4),
      way: 'ship',
      wayText: '已冷链寄出',
      mine: false,
      points: 0
    })
  }
  const mine = (ops || []).map((o, i) => {
    const c = crops.find((x) => x.id === o.cropId)
    return {
      key: 'm' + i,
      date: o.date || today,
      cropId: o.cropId,
      cropName: o.cropName || (c ? c.name : '收成'),
      emoji: (c && c.emoji) || '🧺',
      kg: round1(o.kg),
      way: o.way,
      wayText: WAY_TEXT[o.way] || '已安排',
      mine: true,
      points: o.points || 0
    }
  })
  return farmSide.concat(mine).sort((x, y) => String(y.date).localeCompare(String(x.date)))
}

/** 一次安排能换多少积分（页面在弹层里实时显示） */
export function pointsOfKg(kg) {
  return Math.floor(Number(kg || 0) * POINTS_PER_KG)
}

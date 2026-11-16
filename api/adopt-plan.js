/**
 * 数据访问层 · 认养派生数据（详情 / 配送计划）
 *
 * 只做纯计算：把 mock 里的地块、认养单、农事日志组合成页面能直接渲染的视图。
 * 后端就绪后，这些字段由 GET /adoption/:id 一次返回，本文件即可整体下线。
 */
import {
  findPlot,
  plotView,
  findCrop,
  planOf,
  cycleOf,
  progressOf,
  daysGone,
  daysLeft,
  statusText,
  cropsText,
  cropsEmoji,
  logsOf,
  fmt
} from './adopt.js'

/* ---------------- 日期 ---------------- */

function parseDate(str) {
  const m = String(str || '').match(/(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

/** 'YYYY-MM-DD' 加减天数 */
export function shiftDate(dateStr, days) {
  const d = parseDate(dateStr)
  if (!d) return dateStr
  const t = new Date(d.getTime() + Math.round(Number(days || 0)) * 86400000)
  return fmt(t)
}

/** 两个日期之间相差的天数（含首尾） */
export function spanDays(startDate, endDate) {
  const s = parseDate(startDate)
  const e = parseDate(endDate)
  if (!s || !e) return 0
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / 86400000))
}

/* ---------------- 详情视图 ---------------- */

/**
 * 认养单 → 页面视图
 * @returns {null | object} 多出 plot / farm / plan / cycle / cropList / 进度等字段
 */
export function adoptionView(a) {
  if (!a) return null
  const plot = plotView(findPlot(a.plotId))
  const plan = planOf(a.planKey)
  const cycle = cycleOf(a.cycleKey)
  const crops = (a.crops || []).map(findCrop).filter(Boolean)
  return {
    ...a,
    plot,
    farm: plot ? plot.farm : {},
    plan,
    cycle,
    cropList: crops,
    cropsText: cropsText(a) || '未选作物',
    emoji: cropsEmoji(a),
    statusText: statusText(a.status),
    growing: a.status === 'growing',
    progress: progressOf(a),
    daysGone: daysGone(a),
    daysLeft: daysLeft(a),
    totalDays: spanDays(a.startDate, a.endDate),
    hasDelivery: (a.freq || 0) > 0 && (a.deliveriesTotal || 0) > 0
  }
}

/* ---------------- 配送计划 ---------------- */

/** 配送间隔（天）：每周 1 次 = 7 天，每周 2 次 = 4 天 */
const GAP = { 1: 7, 2: 4 }

export const DELIVERY_STATUS = {
  received: '已签收',
  waiting: '待配送',
  skipped: '已跳过'
}

/**
 * 生成配送单列表（按序号升序）
 *
 * 日期以「下次配送日」为锚点向两边推算，这样和认养单里的 nextDelivery 永远对得上；
 * 状态优先取本地标记（marks），没有标记时按已送次数推定。
 *
 * @param {object} a 认养单
 * @param {object} marks { [no]: 'received' | 'skipped' }
 */
export function deliveryPlanOf(a, marks = {}) {
  if (!a || !a.freq || !a.deliveriesTotal) return []
  const total = Number(a.deliveriesTotal) || 0
  const gap = GAP[a.freq] || 7
  const base = Math.min(Number(a.deliveriesDone) || 0, total)
  const anchor = a.nextDelivery || shiftDate(a.startDate, gap)
  const anchorNo = base + 1

  const list = []
  for (let no = 1; no <= total; no++) {
    const date = shiftDate(anchor, (no - anchorNo) * gap)
    let status = marks[no] || (no <= base ? 'received' : 'waiting')
    if (a.status === 'ended' && status === 'waiting') status = 'received'
    if (a.status === 'cancelled' && status === 'waiting') status = 'skipped'
    list.push({
      no,
      date,
      status,
      label: DELIVERY_STATUS[status] || '待配送',
      waybill: 'SF' + String(a.id || '').slice(-6) + String(1000 + no),
      passed: date <= todayStr()
    })
  }
  return list
}

/** 配送统计：已签收 / 待配送 / 下一次 */
export function deliveryStats(list = []) {
  const received = list.filter((d) => d.status === 'received').length
  const skipped = list.filter((d) => d.status === 'skipped').length
  const waiting = list.filter((d) => d.status === 'waiting')
  return {
    total: list.length,
    received,
    skipped,
    waiting: waiting.length,
    next: waiting[0] || null
  }
}

export function todayStr() {
  return fmt(new Date())
}

/* ---------------- 农事日志 ---------------- */

/**
 * 某块地的完整农事日志：mock 里农场写的 + 用户自己补的，按日期倒序
 * @param {string} code 地块编号，如 A-03
 * @param {Array} userLogs 本地补录的记录
 */
/**
 * 某块地的完整农事日志：农场写的（mock）+ 用户自己补的，按日期倒序
 * @param {string} code 地块编号，如 A-03
 * @param {Array} userLogs 本地补录的记录
 * @param {string} year 农场日志只有 MM-DD，用它补全年份
 */
export function timelineOf(code, userLogs = [], year = '') {
  const y = year || String(new Date().getFullYear())
  const base = (logsOf(code) || []).map((l) => ({
    ...l,
    date: String(l.date || '').length === 5 ? y + '-' + l.date : l.date,
    from: 'farm'
  }))
  const mine = (userLogs || []).map((l) => ({ ...l, from: 'me' }))
  return base
    .concat(mine)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
}

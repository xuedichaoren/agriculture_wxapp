/**
 * 农户侧「被认养」状态（本地）
 *
 * 分工：
 *   api/farm-side.js  只放种子数据与纯函数（不算状态），保证可预期；
 *   本文件            放所有会变的东西：申请通过/拒绝、调价、改名额、上下架、
 *                    发长势、勾任务，以及由这些变化重新算出来的视图模型。
 *
 * 页面统一从本文件取数据（farmPlots / farmIns / farmStats…），
 * 不要各自去拼 api + store，否则四处算账必然对不上。
 *
 * 落盘 key：nh_farmside_v1（独立，不动主 store 大对象）
 * 后端就绪后：每个 mutation 对应一个接口，函数签名不用改。
 */
import { reactive } from 'vue'
import { todayStr } from '@/common/utils.js'
import {
  MY_PLOTS,
  ADOPT_INS,
  IN_APPS,
  FARM_TASKS,
  GROWTH_PUSHES,
  insOfPlot,
  bookedOf,
  capacityOf,
  seatsLeft,
  ratioOf,
  adoptersOf,
  avatarStack,
  plotCropsText,
  plotCropsEmoji,
  plotStatusText,
  plotStatusTone,
  inStatusText,
  inStatusTone,
  inPlanName,
  inCycleName,
  inCropsText,
  incomeOfMonth,
  incomeTotal,
  pendingApps,
  nextDeliveryOf
} from '@/api/farm-side.js'

const KEY = 'nh_farmside_v1'

function load() {
  try {
    const raw = uni.getStorageSync(KEY)
    if (raw && typeof raw === 'object') return raw
  } catch (e) {}
  return null
}

const saved = load()

export const farmSide = reactive({
  /** appId -> 'accepted' | 'rejected' */
  apps: saved && saved.apps ? saved.apps : {},
  /** plotId -> { status?, price?, capacity? } */
  plots: saved && saved.plots ? saved.plots : {},
  /** 农户自己新发布的地块 */
  customPlots: saved && saved.customPlots ? saved.customPlots : [],
  /** 由「接受申请」生成的被认养订单 */
  newIns: saved && saved.newIns ? saved.newIns : [],
  /** taskId -> true */
  tasks: saved && saved.tasks ? saved.tasks : {},
  /** plotId -> [{id,date,emoji,title,text,reach}] */
  pushes: saved && saved.pushes ? saved.pushes : {},
  /** plotId -> [{date,title,text}] */
  logs: saved && saved.logs ? saved.logs : {},
  /** inId -> 本地登记的配送次数（叠加在种子数据之上） */
  delivered: saved && saved.delivered ? saved.delivered : {}
})

export function persistFarmSide() {
  try {
    uni.setStorageSync(KEY, JSON.parse(JSON.stringify(farmSide)))
  } catch (e) {}
}

export function resetFarmSide() {
  farmSide.apps = {}
  farmSide.plots = {}
  farmSide.customPlots = []
  farmSide.newIns = []
  farmSide.tasks = {}
  farmSide.pushes = {}
  farmSide.logs = {}
  farmSide.delivered = {}
  persistFarmSide()
}

/* ---------------- 小工具 ---------------- */

function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

function addMonths(dateStr, months) {
  const m = String(dateStr || '').match(/(\d{4})-(\d{2})-(\d{2})/)
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date()
  const day = d.getDate()
  d.setMonth(d.getMonth() + Number(months || 0))
  if (d.getDate() < day) d.setDate(0)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function freqOfPlan(planKey) {
  if (planKey === 'self') return 0
  if (planKey === 'full') return 2
  return 1
}

/* ---------------- 地块 ---------------- */

/** 原始地块 + 本地覆盖字段 */
function basePlots() {
  return MY_PLOTS.concat(farmSide.customPlots)
}

function rawPlot(id) {
  return basePlots().find((p) => p.id === id) || null
}

/** 某地块被认养的单子：种子单 + 接受申请生成的新单 */
export function insOf(plotId) {
  const seed = insOfPlot(plotId)
  const extra = farmSide.newIns.filter((i) => i.plotId === plotId && i.status !== 'refund')
  return seed.concat(extra)
}

/** 有效状态：暂停优先，其次按名额自动判满 */
export function effStatus(plot) {
  const ov = farmSide.plots[plot.id] || {}
  if (ov.status === 'paused') return 'paused'
  const booked = insOf(plot.id).length
  const cap = Number(ov.capacity || plot.capacity || 0)
  if (cap > 0 && booked >= cap) return 'full'
  return ov.status === 'draft' ? 'draft' : 'recruiting'
}

/** 把一块地补成页面能直接渲染的样子 */
function decorate(plot) {
  const ov = farmSide.plots[plot.id] || {}
  const merged = {
    ...plot,
    price: ov.price != null ? ov.price : plot.price,
    capacity: ov.capacity != null ? ov.capacity : plot.capacity,
    status: effStatus(plot)
  }
  const booked = insOf(merged.id).length
  const cap = Number(merged.capacity || 0)
  const stack = avatarStackList(merged.id)
  return {
    ...merged,
    booked,
    left: Math.max(0, cap - booked),
    ratio: cap ? Math.min(100, Math.round((booked / cap) * 100)) : 0,
    statusText: plotStatusText(merged.status),
    statusTone: plotStatusTone(merged.status),
    cropsText: plotCropsText(merged),
    cropsEmoji: plotCropsEmoji(merged),
    adopters: stack.list,
    moreAdopters: stack.more,
    adopterTotal: stack.total,
    monthIncome: insOf(merged.id).reduce((s, i) => s + monthlyOf(i), 0),
    ins: insOf(merged.id),
    pendingApps: farmApps(merged.id).filter((a) => a.status === 'pending').length
  }
}

function avatarStackList(plotId) {
  const seen = {}
  const out = []
  const live = farmInsOf(plotId).filter((i) => i.status === 'active' || i.status === 'ending')
  live.forEach((i) => {
    const key = i.adopter.name
    if (seen[key]) {
      seen[key].count++
      return
    }
    const item = { name: i.adopter.name, avatar: i.adopter.avatar, count: 1, status: i.status }
    seen[key] = item
    out.push(item)
  })
  return { list: out.slice(0, 4), more: Math.max(0, out.length - 4), total: out.length }
}

/** 某地块的在养认养人明细（含城市、累计金额），地块管理页用 */
export function farmAdoptersOf(plotId) {
  const map = {}
  const out = []
  farmInsOf(plotId)
    .filter((i) => i.status === 'active' || i.status === 'ending')
    .forEach((i) => {
      const key = i.adopter.name
      if (map[key]) {
        map[key].count++
        map[key].amount += Number(i.amount || 0)
        return
      }
      const item = {
        name: i.adopter.name,
        avatar: i.adopter.avatar,
        phone: i.adopter.phone,
        city: i.adopter.city,
        count: 1,
        amount: Number(i.amount || 0),
        status: i.status
      }
      map[key] = item
      out.push(item)
    })
  return out
}

/** 某地块全部订单（含已结束），用于地块管理页 */
function farmInsOf(plotId) {
  return ADOPT_INS.filter((i) => i.plotId === plotId).concat(
    farmSide.newIns.filter((i) => i.plotId === plotId)
  )
}

/**
 * 我的地块列表
 * @param {{status?:'all'|'recruiting'|'full'|'paused'}} filter
 */
export function farmPlots(filter = {}) {
  const { status = 'all' } = filter
  return basePlots()
    .map(decorate)
    .filter((p) => (status === 'all' ? p.status !== 'draft' : p.status === status))
}

export function farmPlot(id) {
  const p = rawPlot(id)
  return p ? decorate(p) : null
}

/** 发布新地块 */
export function addPlot(payload = {}) {
  const id = 'mp' + Date.now()
  const item = {
    id,
    code: payload.code || '新-' + String(basePlots().length + 1).padStart(2, '0'),
    name: payload.name || '未命名地块',
    emoji: payload.emoji || '🌱',
    bg: ['#EAF9EF', '#CBEFD9'],
    area: Number(payload.area || 10),
    rows: Number(payload.rows || 2),
    crops: payload.crops || [],
    price: Number(payload.price || 199),
    marketPrice: Number(payload.marketPrice || payload.price * 1.3 || 259),
    capacity: Number(payload.capacity || 4),
    status: 'recruiting',
    soil: payload.soil || '待补充',
    sun: payload.sun || '待补充',
    water: payload.water || '待补充',
    altitude: Number(payload.altitude || 0),
    plantDate: payload.plantDate || todayStr(),
    harvestDate: payload.harvestDate || addMonths(todayStr(), 3),
    yieldExpect: Number(payload.yieldExpect || 0),
    rating: 5,
    tags: payload.tags || [],
    highlight: payload.highlight || '',
    publishedAt: todayStr()
  }
  farmSide.customPlots.push(item)
  persistFarmSide()
  return item
}

export function setPlotStatus(plotId, status) {
  const ov = farmSide.plots[plotId] || (farmSide.plots[plotId] = {})
  ov.status = status
  persistFarmSide()
}

export function isPaused(plotId) {
  const ov = farmSide.plots[plotId]
  return !!ov && ov.status === 'paused'
}

export function setPlotPrice(plotId, price) {
  const n = Number(price)
  if (!Number.isFinite(n) || n <= 0) return false
  const ov = farmSide.plots[plotId] || (farmSide.plots[plotId] = {})
  ov.price = Math.round(n)
  persistFarmSide()
  return true
}

export function setPlotCapacity(plotId, capacity) {
  const plot = rawPlot(plotId)
  const n = Number(capacity)
  if (!plot || !Number.isFinite(n) || n < 1) return false
  const booked = insOf(plotId).length
  if (n < booked) return false
  const ov = farmSide.plots[plotId] || (farmSide.plots[plotId] = {})
  ov.capacity = Math.round(n)
  persistFarmSide()
  return true
}

/* ---------------- 申请 ---------------- */

export function appStateOf(id) {
  return farmSide.apps[id] || 'pending'
}

/** 待处理申请（含本地已处理的，页面按 status 分） */
export function farmApps(plotId) {
  return IN_APPS.filter((a) => (plotId ? a.plotId === plotId : true)).map((a) => ({
    ...a,
    status: appStateOf(a.id),
    statusText: appStateOf(a.id) === 'accepted' ? '已通过' : appStateOf(a.id) === 'rejected' ? '已拒绝' : '待确认'
  }))
}

export function farmPending() {
  return farmApps().filter((a) => a.status === 'pending')
}

/**
 * 通过申请：同时生成一张在养订单，名额占用立刻生效
 *
 * 这里不做「拒绝超员」的拦截 —— 果树类常出现多人排一树，
 * 农户自己知道能不能接，系统只在页面上提示已超额，不替他做决定。
 */
export function acceptApp(app) {
  if (!app || !app.id) return null
  if (appStateOf(app.id) !== 'pending') return null
  farmSide.apps[app.id] = 'accepted'
  const order = {
    id: 'IN' + Date.now(),
    plotId: app.plotId,
    code: app.code,
    adopter: app.adopter,
    crops: app.crops || [],
    planKey: app.planKey || 'care',
    cycleKey: app.cycleKey || 'q1',
    startDate: app.wantStart || todayStr(),
    endDate: addMonths(app.wantStart || todayStr(), app.months || 3),
    amount: Number(app.amount || 0),
    status: 'active',
    freq: freqOfPlan(app.planKey),
    deliveriesTotal: freqOfPlan(app.planKey) ? Math.round((app.months || 3) * 4 * freqOfPlan(app.planKey)) : 0,
    deliveriesDone: 0,
    remark: app.message || '',
    createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    fromAppId: app.id
  }
  farmSide.newIns.unshift(order)
  persistFarmSide()
  return order
}

export function rejectApp(id, reason = '') {
  if (!id) return
  farmSide.apps[id] = 'rejected'
  if (reason) {
    const ov = farmSide.apps
    ov['reason:' + id] = reason
  }
  persistFarmSide()
}

export function appReasonOf(id) {
  return farmSide.apps['reason:' + id] || ''
}

/* ---------------- 被认养订单 ---------------- */

function monthlyOf(item) {
  const s = item.startDate
  const e = item.endDate
  const ms = (new Date(e) - new Date(s)) / 86400000
  const months = Math.max(1, Math.round(ms / 30))
  return Math.round(Number(item.amount || 0) / months)
}

/**
 * 全部被认养订单
 * @param {{status?:'all'|'active'|'ending'|'ended'}} filter
 */
export function farmIns(filter = {}) {
  const { status = 'all' } = filter
  const list = ADOPT_INS.concat(farmSide.newIns).map((i) => {
    const plot = rawPlot(i.plotId)
    const ov = farmSide.plots[i.plotId] || {}
    const price = ov.price != null && plot ? ov.price : plot ? plot.price : 0
    return {
      ...i,
      deliveriesDone: Number(i.deliveriesDone || 0) + (farmSide.delivered[i.id] || 0),
      plotName: plot ? plot.name : i.code + ' 号地',
      plotEmoji: plot ? plot.emoji : '🌱',
      statusText: inStatusText(i.status),
      statusTone: inStatusTone(i.status),
      planName: inPlanName(i.planKey),
      cycleName: inCycleName(i.cycleKey),
      cropsText: inCropsText(i),
      nextDelivery: nextDeliveryOf(i),
      monthly: monthlyOf(i),
      unitPrice: price
    }
  })
  const filtered = status === 'all' ? list : list.filter((i) => i.status === status)
  return filtered.sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)))
}

export function farmIn(id) {
  return farmIns().find((i) => i.id === id) || null
}

/**
 * 记一次配送
 *
 * 真实场景要传快递单号、拍照留证；这里只记次数，
 * 让「已送 8/12 次」这个数字能跟着动，不至于点了没反应。
 * @returns {{done:number,total:number}|null}
 */
export function markDelivery(inId) {
  const item = farmIn(inId)
  if (!item || !item.freq) return null
  farmSide.delivered[inId] = (farmSide.delivered[inId] || 0) + 1
  persistFarmSide()
  return {
    done: Number(item.deliveriesDone || 0) + 1,
    total: Number(item.deliveriesTotal || 0)
  }
}

/** 该单还剩几次配送 */
export function deliveriesLeft(item) {
  if (!item || !item.freq) return 0
  return Math.max(0, Number(item.deliveriesTotal || 0) - Number(item.deliveriesDone || 0))
}

/** 认养人总名单（跨地块去重） */
export function farmAdopters() {
  const map = {}
  const list = []
  farmIns()
    .filter((i) => i.status === 'active' || i.status === 'ending')
    .forEach((i) => {
      const key = i.adopter.name
      if (map[key]) {
        map[key].count++
        map[key].amount += i.amount
        map[key].plots.push(i.code)
        return
      }
      const item = {
        name: i.adopter.name,
        avatar: i.adopter.avatar,
        phone: i.adopter.phone,
        city: i.adopter.city,
        count: 1,
        amount: i.amount,
        plots: [i.code],
        status: i.status
      }
      map[key] = item
      list.push(item)
    })
  return list.sort((a, b) => b.amount - a.amount)
}

/* ---------------- 任务 ---------------- */

export function farmTasks() {
  return FARM_TASKS.map((t) => ({
    ...t,
    /**
     * 三态：显式勾选 true / 显式取消 false / 没动过则用种子值。
     * 之前取消勾选只是删掉标记，种子数据里 done:true 的任务会立刻回弹，
     * 用户点「撤销」看起来毫无反应。
     */
    done: t.id in farmSide.tasks ? farmSide.tasks[t.id] === true : !!t.done
  }))
}

export function todayTaskList() {
  return farmTasks().filter((t) => !t.done)
}

export function isTaskDone(id) {
  const t = FARM_TASKS.find((x) => x.id === id)
  if (!t) return false
  return id in farmSide.tasks ? farmSide.tasks[id] === true : !!t.done
}

export function toggleTask(id, done) {
  if (!id) return
  // 取消要落成显式 false，不能删标记，否则种子任务会假装没做完
  farmSide.tasks[id] = done === false ? false : true
  persistFarmSide()
}

/* ---------------- 长势推送 ---------------- */

export function farmPushes(plotId) {
  const mine = (farmSide.pushes[plotId] || []).slice()
  const seed = plotId ? GROWTH_PUSHES.filter((p) => p.plotId === plotId) : GROWTH_PUSHES.slice()
  return mine.concat(seed).sort((a, b) => String(b.date).localeCompare(String(a.date)))
}

/**
 * 发一条长势，推给这块地的认养人
 * @returns {object} 新动态
 */
export function pushGrowth(plotId, payload = {}) {
  const plot = farmPlot(plotId)
  if (!plot) return null
  const item = {
    id: 'gp' + Date.now(),
    plotId,
    date: payload.date || todayStr(),
    emoji: payload.emoji || plot.emoji,
    title: payload.title || '长势更新',
    text: payload.text || '',
    reach: plot.adopterTotal || 0
  }
  const list = farmSide.pushes[plotId] || (farmSide.pushes[plotId] = [])
  list.unshift(item)
  persistFarmSide()
  return item
}

/* ---------------- 农事记录 ---------------- */

export function plotLogs(plotId) {
  return (farmSide.logs[plotId] || []).slice()
}

export function addPlotLog(plotId, log = {}) {
  if (!plotId) return null
  const item = {
    date: log.date || todayStr(),
    emoji: log.emoji || '🌱',
    title: log.title || '农事记录',
    text: log.text || ''
  }
  const list = farmSide.logs[plotId] || (farmSide.logs[plotId] = [])
  list.unshift(item)
  persistFarmSide()
  return item
}

/* ---------------- 汇总 ---------------- */

/** 工作台 / 我的地 顶部数字，全部按本地状态实时算 */
export function farmStats() {
  const plots = farmPlots()
  const ins = farmIns()
  const live = ins.filter((i) => i.status === 'active' || i.status === 'ending')
  const adopters = farmAdopters()
  const seats = plots.reduce((s, p) => s + Number(p.capacity || 0), 0)
  const booked = plots.reduce((s, p) => s + p.booked, 0)
  return {
    plotCount: plots.length,
    recruiting: plots.filter((p) => p.status === 'recruiting').length,
    full: plots.filter((p) => p.status === 'full').length,
    paused: plots.filter((p) => p.status === 'paused').length,
    booked,
    seats,
    seatLeft: Math.max(0, seats - booked),
    activeIns: live.length,
    adopters: adopters.length,
    pendingApps: farmPending().length,
    pendingTasks: todayTaskList().length,
    monthIncome: ins
      .filter((i) => i.status === 'active' || i.status === 'ending')
      .reduce((s, i) => s + i.monthly, 0),
    totalIncome: ins.filter((i) => i.status !== 'refund').reduce((s, i) => s + Number(i.amount || 0), 0),
    endingSoon: live.filter((i) => i.status === 'ending').length
  }
}

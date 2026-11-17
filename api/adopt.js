/**
 * 数据访问层 · 认养一块地
 *
 * 与 catalog.js 同一套约定：页面只依赖本文件，不直接 import mock。
 * 后端就绪后把 listPlots / submitAdoption 换成 async 请求即可，字段不变。
 *
 * AdoptionVM：
 *   id, plotId, code, farmId, crops[], planKey, cycleKey,
 *   startDate, endDate, total, status(growing|ended|cancelled),
 *   freq, nextDelivery, deliveriesTotal, deliveriesDone,
 *   owner, phone, addressId, remark, createdAt
 */
import {
  ADOPT_PLOTS,
  ADOPT_CROPS,
  ADOPT_PLANS,
  ADOPT_CYCLES,
  ADOPT_LOGS,
  ADOPT_LOGS_DEFAULT,
  findFarm
} from '@/mock/index.js'
import { MY_PLOTS, ADOPT_INS } from './farm-side.js'

export { ADOPT_PLOTS, ADOPT_CROPS, ADOPT_PLANS, ADOPT_CYCLES }

/* ---------------- 基础查询 ---------------- */

/**
 * 农户自己发布的地块
 *
 * 这些地块原本只在农户端可见，认养大厅看不到，买家认了也查不到详情，
 * 闭环是断的。这里把它们接进同一套查询，让「农户发布 → 买家认养」成立。
 *
 * 读 storage 是为了拿到农户本次会话里新发布的地块（还没进 MY_PLOTS）。
 * 接后端后这段整体删掉，改成 GET /plots/:id。
 */
function farmSidePlots() {
  let custom = []
  try {
    const raw = uni.getStorageSync('nh_farmside_v1')
    if (raw && Array.isArray(raw.customPlots)) custom = raw.customPlots
  } catch (e) {}

  return MY_PLOTS.concat(custom).map((p) => {
    const booked = ADOPT_INS.filter(
      (i) => i.plotId === p.id && (i.status === 'active' || i.status === 'ending')
    ).length
    const capacity = Number(p.capacity || 0)
    return {
      ...p,
      mine: true,
      farmId: p.farmId || 'me',
      farmName: p.farmName || '湘西老周家庭农场',
      marketPrice: p.marketPrice || Math.round(Number(p.price || 0) * 1.32),
      adoptedCount: booked,
      leftCount: Math.max(0, capacity - booked),
      rating: p.rating || 4.9
    }
  })
}

export function findPlot(plotId) {
  return (
    ADOPT_PLOTS.find((p) => p.id === plotId) ||
    farmSidePlots().find((p) => p.id === plotId) ||
    null
  )
}

export function findCrop(cropId) {
  return ADOPT_CROPS.find((c) => c.id === cropId) || null
}

export function planOf(key) {
  return ADOPT_PLANS.find((p) => p.key === key) || ADOPT_PLANS[0]
}

export function cycleOf(key) {
  return ADOPT_CYCLES.find((c) => c.key === key) || ADOPT_CYCLES[0]
}

/** 给地块补上农场信息、可种作物对象、是否满员 */
export function plotView(plot) {
  if (!plot) return null
  const farm = plot.farmName
    ? { id: plot.farmId || 'me', name: plot.farmName, avatar: '🌾', bg: plot.bg, city: '湖南 · 湘西龙山' }
    : findFarm(plot.farmId) || {}
  return {
    ...plot,
    farm,
    cropList: plot.crops.map(findCrop).filter(Boolean),
    full: plot.leftCount <= 0,
    few: plot.leftCount > 0 && plot.leftCount <= 3
  }
}

/**
 * 认养大厅列表
 * @param {{farmId?:string, area?:number|string}} filter  farmId='all' 表示全部；area='all' 表示全部
 */
export function listPlots(filter = {}) {
  const { farmId = 'all', area = 'all' } = filter
  const platform = ADOPT_PLOTS.filter((p) => {
    if (farmId !== 'all' && p.farmId !== farmId) return false
    if (area !== 'all' && Number(p.area) !== Number(area)) return false
    return true
  })
  // 农户自己发布的、还在招募且有名额的地块，也进大厅
  const own = farmSidePlots().filter((p) => {
    if (p.status !== 'recruiting' || p.leftCount <= 0) return false
    if (area !== 'all' && Number(p.area) !== Number(area)) return false
    return true
  })
  return platform.concat(own).map(plotView)
}

/** 大厅筛选项：农场来自地块实际用到的农场，面积取去重升序 */
export function plotFilters() {
  const farmIds = []
  ADOPT_PLOTS.forEach((p) => {
    if (!farmIds.includes(p.farmId)) farmIds.push(p.farmId)
  })
  const farms = farmIds.map((id) => {
    const f = findFarm(id) || {}
    return { id, name: shortFarmName(f.name), count: ADOPT_PLOTS.filter((p) => p.farmId === id).length }
  })
  const areas = []
  ADOPT_PLOTS.forEach((p) => {
    if (!areas.includes(p.area)) areas.push(p.area)
  })
  areas.sort((a, b) => a - b)
  return { farms, areas }
}

function shortFarmName(name = '') {
  return String(name).replace(/(的.*)$/, '').replace(/园|社|坊|合作社/g, '') || name
}

/* ---------------- 价格 ---------------- */

/**
 * 认养价 = 地块单价 × 周期系数 + 服务费 + 种苗附加费
 * @returns {{base:number, serviceFee:number, seedFee:number, total:number, original:number, save:number}}
 */
export function calcAdoptPrice({ plot, planKey, cycleKey, cropIds = [] } = {}) {
  if (!plot) return { base: 0, serviceFee: 0, seedFee: 0, total: 0, original: 0, save: 0 }
  const plan = planOf(planKey)
  const cycle = cycleOf(cycleKey)
  const base = round2(plot.price * cycle.factor)
  const serviceFee = plan.fee
  const seedFee = cropIds.reduce((s, id) => s + (findCrop(id)?.extra || 0), 0)
  const total = round2(base + serviceFee + seedFee)
  const original = round2(plot.marketPrice * cycle.factor + serviceFee + seedFee)
  return { base, serviceFee, seedFee, total, original, save: round2(original - total) }
}

function round2(n) {
  return Math.round(Number(n || 0) * 100) / 100
}

/* ---------------- 日期与进度 ---------------- */

function parseDate(str) {
  const m = String(str || '').match(/(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

export function addMonths(dateStr, months) {
  const d = parseDate(dateStr) || new Date()
  const day = d.getDate()
  d.setMonth(d.getMonth() + Number(months || 0))
  // 处理 1/31 + 1 个月这种情况
  if (d.getDate() < day) d.setDate(0)
  return fmt(d)
}

export function fmt(d) {
  const p = (n) => (n < 10 ? '0' + n : '' + n)
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** 认养进度百分比 0~100 */
export function progressOf(a) {
  if (!a) return 0
  if (a.status === 'ended') return 100
  if (a.status === 'cancelled') return 0
  const s = parseDate(a.startDate)
  const e = parseDate(a.endDate)
  if (!s || !e) return 0
  const now = Date.now()
  if (now <= s.getTime()) return 0
  if (now >= e.getTime()) return 100
  return Math.round(((now - s.getTime()) / (e.getTime() - s.getTime())) * 100)
}

/** 已种天数 */
export function daysGone(a) {
  const s = parseDate(a?.startDate)
  if (!s) return 0
  return Math.max(0, Math.floor((Date.now() - s.getTime()) / 86400000))
}

/** 距结束还剩几天 */
export function daysLeft(a) {
  const e = parseDate(a?.endDate)
  if (!e) return 0
  return Math.max(0, Math.ceil((e.getTime() - Date.now()) / 86400000))
}

/* ---------------- 展示文案 ---------------- */

export function statusText(status) {
  const map = { growing: '生长中', ended: '已结束', cancelled: '已退养' }
  return map[status] || status
}

export function cropsText(a) {
  return (a?.crops || [])
    .map((id) => findCrop(id)?.name)
    .filter(Boolean)
    .join(' + ')
}

export function cropsEmoji(a) {
  const first = (a?.crops || []).map(findCrop).filter(Boolean)[0]
  return first ? first.emoji : '🌱'
}

/** 地块的农事日志，没有专属日志用默认池 */
export function logsOf(code) {
  return ADOPT_LOGS[code] || ADOPT_LOGS_DEFAULT
}

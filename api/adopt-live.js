/**
 * 数据访问层 · 云监工（认养地块实时监控）
 *
 * 演示版没有真实摄像头，所有读数用「认养单号 + 日期」做稳定哈希生成：
 * 同一条认养单每次进来看到的温湿度、抓拍、在线人数都一样，刷新不会跳变。
 * 稳定比随机重要——用户会截图发给家人，两次打开数字不一样就成了假数据。
 *
 * 后端就绪后按下面四个接口替换，页面字段不用改：
 *   GET  /adopt/plots/:code/cams        机位列表与在线状态
 *   GET  /adopt/plots/:code/env         环境读数（分钟级）
 *   GET  /adopt/plots/:code/snapshots   每日抓拍（含图片 url）
 *   POST /adopt/plots/:code/commands    远程派单（浇水 / 追肥 / 除虫 / 除草）
 */
import { findCrop, daysGone } from './adopt.js'
import { shiftDate, todayStr } from './adopt-plan.js'
import { nowHM } from '@/common/utils.js'

/** 机位：一块地挂 3 个摄像头，够看全景、叶片、水路 */
export const CAMS = [
  { key: 'cam1', name: '地头全景', pos: '2 号机位', tip: '看整块地的长势' },
  { key: 'cam2', name: '垄间特写', pos: '1 号机位', tip: '看叶片与挂果' },
  { key: 'cam3', name: '灌溉口', pos: '3 号机位', tip: '看水肥与墒情' }
]

/** 远程派单：农场主在手机上接单，处理完会补一条农事记录 */
export const REMOTE_ACTIONS = [
  { key: 'water', name: '浇水', sub: '山泉水滴灌 20 分钟', emoji: '💧', fee: 0 },
  { key: 'fertilize', name: '追肥', sub: '腐熟羊粪 5kg · 沟施', emoji: '🌾', fee: 30 },
  { key: 'pest', name: '除虫', sub: '黄板 + 生物制剂，不用化学药', emoji: '🐛', fee: 0 },
  { key: 'weed', name: '除草', sub: '人工拔一遍，不用除草剂', emoji: '🌿', fee: 0 }
]

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
const STAGES = ['出苗整齐', '间苗定株', '叶片舒展', '抽梢旺长', '开花坐果', '果实转色', '可以采收']

/* ---------------- 稳定伪随机 ---------------- */

function hash(str, seed = 0) {
  let h = (2166136261 ^ (seed >>> 0)) >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h >>> 0
}

function unit(str, salt = 0) {
  return hash(str, salt) / 4294967295
}

function between(str, salt, min, max) {
  return min + unit(str, salt) * (max - min)
}

function round1(n) {
  return Math.round(Number(n || 0) * 10) / 10
}

function keyOf(a) {
  return String((a && a.id) || '') + '|' + String((a && a.code) || '')
}

/* ---------------- 直播状态 ---------------- */

/** 直播间状态：在线人数、码流、更新时间 */
export function liveViewOf(a) {
  if (!a) return null
  const k = keyOf(a)
  return {
    online: a.status !== 'cancelled',
    viewers: Math.round(between(k, 41, 6, 43)),
    bitrate: '720P · 流畅',
    updatedAt: nowHM(),
    since: '06:00 起在线',
    cams: CAMS.length
  }
}

/* ---------------- 环境读数 ---------------- */

/**
 * 四项环境读数 + 与昨日对比
 * @returns {Array<{key,label,value,unit,trend,up,flat}>}
 */
export function envOf(a) {
  if (!a) return []
  const k = keyOf(a)
  const rows = [
    { key: 'temp', label: '空气温度', value: round1(between(k, 1, 17.6, 25.4)), unit: '℃', trend: between(k, 5, -1.2, 1.4) },
    { key: 'hum', label: '空气湿度', value: Math.round(between(k, 2, 52, 74)), unit: '%', trend: between(k, 6, -5, 5) },
    { key: 'soil', label: '土壤含水', value: Math.round(between(k, 3, 33, 49)), unit: '%', trend: between(k, 7, -3, 4) },
    { key: 'light', label: '光照强度', value: round1(between(k, 4, 2.4, 6.8)), unit: '万lux', trend: between(k, 8, -0.8, 0.9) }
  ]
  return rows.map((r) => {
    const trend = round1(r.trend)
    return {
      ...r,
      trend,
      flat: Math.abs(trend) < 0.1,
      up: trend > 0,
      trendText: (trend > 0 ? '+' : '') + trend + (r.unit === '万lux' ? '' : r.unit)
    }
  })
}

/** 地块档案里的一行土质（黄壤土 · pH 6.4），拆成土名与 pH 两段 */
export function soilOf(plot) {
  const text = String((plot && plot.soil) || '')
  const m = text.match(/pH\s*([\d.]+)/i)
  return {
    name: text.split('·')[0].trim() || '--',
    ph: m ? Number(m[1]) : 0
  }
}

/* ---------------- 每日抓拍 ---------------- */

/**
 * 近 n 天抓拍。演示版用渐变 + emoji 合成，接后端后换成真实图片 url。
 */
export function snapshotsOf(a, n = 8) {
  if (!a) return []
  const k = keyOf(a)
  const first = (a.crops || []).map(findCrop).filter(Boolean)[0]
  const emoji = first ? first.emoji : '🌱'
  const gone = daysGone(a)
  const times = ['07:40', '08:10', '08:30', '09:05']
  const list = []
  for (let i = 0; i < n; i++) {
    const date = shiftDate(todayStr(), -i)
    const stage = Math.max(0, Math.min(STAGES.length - 1, Math.floor((gone - i) / 7)))
    list.push({
      key: date,
      date,
      md: date.slice(5),
      week: WEEK[new Date(date.replace(/-/g, '/')).getDay()] || '',
      time: times[i % times.length],
      emoji,
      tag: STAGES[stage],
      temp: round1(between(k + date, 9 + i, 15.5, 24.5)),
      today: i === 0
    })
  }
  return list
}

/* ---------------- 7 日温度 ---------------- */

/** 近 7 天日均温，pct 为柱高百分比（14℃ 起算，30℃ 封顶） */
export function trendSeriesOf(a, n = 7) {
  if (!a) return []
  const k = keyOf(a)
  const rows = []
  for (let i = n - 1; i >= 0; i--) {
    const date = shiftDate(todayStr(), -i)
    const value = round1(between(k + date, 21 + i, 16.5, 26.2))
    rows.push({
      key: date,
      label: date.slice(5),
      value,
      pct: Math.max(18, Math.min(100, Math.round(((value - 14) / 16) * 100))),
      today: i === 0
    })
  }
  return rows
}

/* ---------------- 远程派单 ---------------- */

/**
 * 派单列表：把 store 里已派的时间戳合进动作定义
 * @param {object} a 认养单
 * @param {object} sent { [actionKey]: timestamp }
 */
export function commandsOf(a, sent = {}) {
  const map = sent || {}
  return REMOTE_ACTIONS.map((x) => {
    const ts = map[x.key] || 0
    return {
      ...x,
      queued: !!ts,
      sentAt: ts ? agoText(ts) : '',
      disabled: a ? a.status !== 'growing' : true
    }
  })
}

function agoText(ts) {
  const diff = Date.now() - Number(ts)
  if (!diff || diff < 0) return '刚刚派单'
  const min = Math.floor(diff / 60000)
  if (min < 1) return '刚刚派单'
  if (min < 60) return min + ' 分钟前派单'
  const hour = Math.floor(min / 60)
  if (hour < 24) return hour + ' 小时前派单'
  return Math.floor(hour / 24) + ' 天前派单'
}

/**
 * 认养扩展状态（本地）
 *
 * store/index.js 里的 adoptions 是「认养单」本身，这里放两类派生数据：
 *   1. logs  用户自己补录的农事记录，按地块编号索引
 *   2. marks 配送单的签收 / 跳过标记，按认养单 id 索引
 *
 * 独立 storage key，不去动主 store 的大对象，避免改动影响其它模块。
 * 后端就绪后：logs → POST /farm/log，marks → POST /adoption/:id/delivery/:no。
 */
import { reactive } from 'vue'

const KEY = 'nh_adopt_extra_v1'

function load() {
  try {
    const raw = uni.getStorageSync(KEY)
    if (raw && typeof raw === 'object') return raw
  } catch (e) {}
  return null
}

const saved = load()

export const adoptExtra = reactive({
  logs: saved && saved.logs ? saved.logs : {},
  marks: saved && saved.marks ? saved.marks : {}
})

export function persistAdoptExtra() {
  try {
    uni.setStorageSync(KEY, JSON.parse(JSON.stringify(adoptExtra)))
  } catch (e) {}
}

/* ---------------- 农事记录 ---------------- */

/**
 * 补一条农事记录
 * @param {string} code 地块编号
 * @param {{date:string, type:string, title:string, summary:string, emoji:string}} log
 */
export function addFarmLog(code, log) {
  if (!code) return null
  const list = adoptExtra.logs[code] || (adoptExtra.logs[code] = [])
  const item = {
    day: Number(log.day) || 0,
    date: log.date,
    type: log.type || 'care',
    title: log.title || '农事记录',
    summary: log.summary || '',
    emoji: log.emoji || '🌱'
  }
  list.unshift(item)
  persistAdoptExtra()
  return item
}

/** 某块地用户补录的记录，按日期倒序 */
export function userLogsOf(code) {
  const list = adoptExtra.logs[code] || []
  return list.slice().sort((a, b) => String(b.date).localeCompare(String(a.date)))
}

/* ---------------- 配送标记 ---------------- */

export function marksOf(adoptionId) {
  return adoptExtra.marks[adoptionId] || {}
}

/**
 * 标记某一次配送
 *
 * 三种状态都显式存下来（包括 waiting），这样「撤销签收 / 撤销跳过」能把
 * 默认推定的状态覆盖回去，而不是删除标记后又回落到原状态。
 *
 * @param {string} adoptionId
 * @param {number} no 第几次
 * @param {'received'|'skipped'|'waiting'} status
 */
export function markDelivery(adoptionId, no, status) {
  if (!adoptionId || !no) return
  const map = adoptExtra.marks[adoptionId] || (adoptExtra.marks[adoptionId] = {})
  map[no] = status
  persistAdoptExtra()
}

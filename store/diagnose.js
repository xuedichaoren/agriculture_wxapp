/**
 * 识图记录（本地）
 *
 * 存完整结果而不是只存摘要：从历史点进去要能重新看到成因、方案、用药，
 * 只存病名就成了一张废列表。限制 24 条，超出丢最旧的，避免 storage 膨胀。
 *
 * storage key: nh_diagnose_v1
 */
import { reactive } from 'vue'
import { toRecord } from '@/api/diagnose.js'

const KEY = 'nh_diagnose_v1'
const LIMIT = 24

function load() {
  try {
    const raw = uni.getStorageSync(KEY)
    if (raw && Array.isArray(raw.results)) return raw
  } catch (e) {}
  return null
}

const saved = load()

export const diagStore = reactive({
  results: saved ? saved.results : []
})

export function persistDiag() {
  try {
    uni.setStorageSync(KEY, JSON.parse(JSON.stringify({ results: diagStore.results })))
  } catch (e) {}
}

export function saveResult(r) {
  if (!r || !r.id) return
  const idx = diagStore.results.findIndex((x) => x.id === r.id)
  if (idx > -1) diagStore.results.splice(idx, 1)
  diagStore.results.unshift(r)
  if (diagStore.results.length > LIMIT) diagStore.results.length = LIMIT
  persistDiag()
}

export function findResult(id) {
  return diagStore.results.find((r) => r.id === id) || null
}

/** 最近 n 条摘要，列表页用 */
export function recentRecords(n = 3) {
  return diagStore.results.slice(0, n).map((r) => toRecord(r)).filter(Boolean)
}

export function allRecords() {
  return diagStore.results.map((r) => toRecord(r)).filter(Boolean)
}

export function removeResult(id) {
  const idx = diagStore.results.findIndex((r) => r.id === id)
  if (idx > -1) diagStore.results.splice(idx, 1)
  persistDiag()
}

export function clearResults() {
  diagStore.results = []
  persistDiag()
}

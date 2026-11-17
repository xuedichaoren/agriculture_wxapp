/**
 * 卖货（农户侧）· 商品上架状态
 *
 * 演示版商品还是 mock 的，这里只存「农户改过的部分」：上下架、价格、库存。
 * 不复制整份商品，避免 mock 一改就两份数据打架。
 *
 * storage key: nh_sell_v1
 */
import { reactive } from 'vue'
import { PRODUCTS } from '@/mock/index.js'

const KEY = 'nh_sell_v1'

function load() {
  try {
    const raw = uni.getStorageSync(KEY)
    if (raw && typeof raw === 'object') return raw
  } catch (e) {}
  return null
}

const saved = load()

export const sellStore = reactive({
  /** 下架的商品 id */
  off: Array.isArray(saved?.off) ? saved.off : [],
  /** 改过的价格 { productId: number } */
  price: saved?.price || {},
  /** 改过的库存 { productId: number } */
  stock: saved?.stock || {}
})

export function persistSell() {
  try {
    uni.setStorageSync(KEY, JSON.parse(JSON.stringify(sellStore)))
  } catch (e) {}
}

/** 我的商品：演示版把 f1 农场当作当前农户 */
export function myProducts() {
  return PRODUCTS.filter((p) => p.farmId === 'f1')
}

export function isOn(productId) {
  return sellStore.off.indexOf(productId) === -1
}

export function toggleOn(productId) {
  const i = sellStore.off.indexOf(productId)
  if (i > -1) sellStore.off.splice(i, 1)
  else sellStore.off.push(productId)
  persistSell()
  return i > -1
}

export function priceOf(p) {
  return sellStore.price[p.id] != null ? sellStore.price[p.id] : p.price
}

export function stockOf(p) {
  return sellStore.stock[p.id] != null ? sellStore.stock[p.id] : p.stockCount
}

export function setPrice(productId, v) {
  const n = Number(v)
  if (!(n > 0)) return false
  sellStore.price[productId] = Math.round(n * 100) / 100
  persistSell()
  return true
}

export function setStock(productId, v) {
  const n = Math.max(0, Math.floor(Number(v) || 0))
  sellStore.stock[productId] = n
  persistSell()
  return true
}

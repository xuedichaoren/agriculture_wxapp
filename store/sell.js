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
  stock: saved?.stock || {},
  /**
   * 农户自己新建的商品。mock 的 PRODUCTS 是静态常量，
   * 新建的放这里，列表时合并，不改 mock 本身。
   */
  extra: Array.isArray(saved?.extra) ? saved.extra : []
})

export function persistSell() {
  try {
    uni.setStorageSync(KEY, JSON.parse(JSON.stringify(sellStore)))
  } catch (e) {}
}

/** 我的商品：自己新建的排在前面，再接 mock 里 f1 农场的 */
export function myProducts() {
  return sellStore.extra.concat(PRODUCTS.filter((p) => p.farmId === 'f1'))
}

/** 按 id 找自己新建的商品，商品详情页用它兜底 */
export function findMyProduct(productId) {
  return sellStore.extra.find((p) => p.id === productId) || null
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

/**
 * 新建商品
 * @param {object} form { name, categoryId, price, originalPrice, spec, stock, summary, tags, emoji }
 * @returns {object|null} 新商品
 */
export function addProduct(form = {}) {
  const name = String(form.name || '').trim()
  const price = Number(form.price)
  if (!name) return null
  if (!(price > 0)) return null
  const stock = Math.max(0, Math.floor(Number(form.stock) || 0))
  const cat = form.categoryId || 'veg'
  const BG = {
    veg: ['#EAF9F1', '#CFF3E0'],
    fruit: ['#FFF0E6', '#FFE0CE'],
    tea: ['#E9F5EC', '#D8EBDD'],
    cured: ['#FDEFE9', '#FBE0D4'],
    pickle: ['#FFEDEA', '#FFD2CB'],
    grain: ['#FBF4E3', '#F5E7C8'],
    mushroom: ['#F5EDE5', '#EBDCCB'],
    help: ['#FFEFF2', '#FFD9E1']
  }
  const item = {
    id: 'sp' + Date.now(),
    coverUrl: '',
    name,
    spec: String(form.spec || '').trim() || '1 份',
    price: Math.round(price * 100) / 100,
    originalPrice: Number(form.originalPrice) > price ? Math.round(Number(form.originalPrice) * 100) / 100 : 0,
    emoji: form.emoji || '🥬',
    bg: BG[cat] || BG.veg,
    categoryId: cat,
    farmId: 'f1',
    unit: '份',
    salesCount: 0,
    stockCount: stock,
    tags: (form.tags || []).slice(0, 3),
    summary: String(form.summary || '').trim(),
    detailText: String(form.detailText || '').trim(),
    selfMade: true,
    createdAt: Date.now()
  }
  sellStore.extra.unshift(item)
  persistSell()
  return item
}

/** 删除自己新建的商品，mock 商品删不了 */
export function removeProduct(productId) {
  const i = sellStore.extra.findIndex((p) => p.id === productId)
  if (i < 0) return false
  sellStore.extra.splice(i, 1)
  persistSell()
  return true
}

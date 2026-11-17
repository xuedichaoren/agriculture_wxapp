import { reactive, computed } from 'vue'
import {
  PRODUCTS,
  DEFAULT_CART,
  DEFAULT_ORDERS,
  DEFAULT_ADDRESSES,
  COUPONS,
  DEFAULT_ADOPTIONS,
  findProduct
} from '@/mock/index.js'
import { fetchMe, fetchProfile } from '@/api/index.js'

const KEY = 'nh_state_v1'

function load() {
  try {
    const raw = uni.getStorageSync(KEY)
    if (raw && typeof raw === 'object') return raw
  } catch (e) {}
  return null
}

const saved = load()

export const store = reactive({
  token: saved?.token || '',
  user: saved?.user || {
    nickname: '陈晓',
    avatar: '🧑',
    phone: '138****6620',
    level: '农场会员 · Lv.2',
    points: 1280
  },
  cart: saved?.cart || DEFAULT_CART.map((i) => ({ ...i })),
  orders: saved?.orders || DEFAULT_ORDERS.map((o) => ({ ...o })),
  addresses: saved?.addresses || DEFAULT_ADDRESSES.map((a) => ({ ...a })),
  coupons: saved?.coupons || COUPONS.map((c) => ({ ...c })),
  adoptions: saved?.adoptions || DEFAULT_ADOPTIONS.map((a) => ({ ...a })),
  favorites: saved?.favorites || ['p4', 'p13'],
  footprint: saved?.footprint || ['p1', 'p4', 'p13', 'p18'],
  likedPosts: saved?.likedPosts || ['o2'],
  unread: saved?.unread ?? 3,
  // 结算临时数据
  checkout: { items: [], addressId: '', couponId: '', remark: '', from: 'cart' },
  // 认养下单草稿：地块页 → 确认页传递，不落盘
  adoptDraft: null
})

export function persist() {
  const { checkout, adoptDraft, ...rest } = store
  try {
    uni.setStorageSync(KEY, JSON.parse(JSON.stringify(rest)))
  } catch (e) {}
}

/* ---------------- 用户 ---------------- */
export function login(phone) {
  store.token = 'demo-token-' + Date.now()
  store.user.phone = phone ? phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : store.user.phone
  uni.setStorageSync('nh_token', store.token)
  uni.setStorageSync('nh_onboarded', true)
  persist()
}

/**
 * 写入登录态（微信登录 / 本地登录共用）
 *
 * login(phone) 是早期手机号登录用的，现在登录页只剩微信，
 * 这里不再假定有手机号，避免新账号显示成演示手机号。
 */
export function setLoginSession(profile = {}) {
  store.token = 'wx-token-' + Date.now()
  if (profile.nickname) store.user.nickname = profile.nickname
  if (profile.avatar) store.user.avatar = profile.avatar
  if (profile.phone) store.user.phone = profile.phone
  uni.setStorageSync('nh_token', store.token)
  uni.setStorageSync('nh_onboarded', true)
  persist()
}

export function logout() {
  store.token = ''
  uni.removeStorageSync('nh_token')
  persist()
}

export function isLogin() {
  return !!store.token
}

export function requireLogin() {
  if (store.token) return true
  uni.navigateTo({ url: '/pages/login/login' })
  return false
}

/* ---------------- 购物车 ---------------- */
export const cartList = computed(() =>
  store.cart
    .map((i) => {
      const p = findProduct(i.productId)
      return p ? { ...i, product: p } : null
    })
    .filter(Boolean)
)

export const cartCount = computed(() => store.cart.reduce((s, i) => s + i.qty, 0))

export const checkedItems = computed(() => cartList.value.filter((i) => i.isChecked))

export const cartTotal = computed(() =>
  checkedItems.value.reduce((s, i) => s + i.product.price * i.qty, 0)
)

export function addToCart(productId, qty = 1) {
  const item = store.cart.find((i) => i.productId === productId)
  if (item) item.qty += qty
  else store.cart.unshift({ productId, qty, isChecked: true })
  persist()
}

export function setQty(productId, qty) {
  const item = store.cart.find((i) => i.productId === productId)
  if (!item) return
  item.qty = Math.max(1, Math.min(99, qty))
  persist()
}

export function removeFromCart(productId) {
  const idx = store.cart.findIndex((i) => i.productId === productId)
  if (idx > -1) store.cart.splice(idx, 1)
  persist()
}

export function toggleCheck(productId) {
  const item = store.cart.find((i) => i.productId === productId)
  if (item) item.isChecked = !item.isChecked
  persist()
}

export function toggleAll(checked) {
  store.cart.forEach((i) => (i.isChecked = checked))
  persist()
}

/* ---------------- 地址 ---------------- */
export function addAddress(addr) {
  if (addr.isDefault) store.addresses.forEach((a) => (a.isDefault = false))
  store.addresses.unshift({ ...addr, id: 'a' + Date.now() })
  if (store.addresses.length === 1) store.addresses[0].isDefault = true
  persist()
}

export function updateAddress(addr) {
  if (addr.isDefault) store.addresses.forEach((a) => (a.isDefault = false))
  const idx = store.addresses.findIndex((a) => a.id === addr.id)
  if (idx > -1) store.addresses.splice(idx, 1, { ...addr })
  persist()
}

export function removeAddress(id) {
  const idx = store.addresses.findIndex((a) => a.id === id)
  if (idx > -1) store.addresses.splice(idx, 1)
  persist()
}

export function setDefaultAddress(id) {
  store.addresses.forEach((a) => (a.isDefault = a.id === id))
  persist()
}

export function defaultAddress() {
  return store.addresses.find((a) => a.isDefault) || store.addresses[0] || null
}

/* ---------------- 订单 ---------------- */
export function orderItems(order) {
  return order.items
    .map((it) => {
      const p = findProduct(it.productId)
      return p ? { ...it, product: p } : null
    })
    .filter(Boolean)
}

export function orderAmount(order) {
  const goods = orderItems(order).reduce((s, i) => s + i.product.price * i.qty, 0)
  return {
    goods: +goods.toFixed(2),
    freight: order.freight || 0,
    discount: order.discount || 0,
    total: +(goods + (order.freight || 0) - (order.discount || 0)).toFixed(2)
  }
}

export function createOrder(payload) {
  const id = 'NH' + Date.now().toString().slice(-11)
  const order = {
    id,
    status: 'unpaid',
    createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    items: payload.items.map((i) => ({ productId: i.productId, qty: i.qty })),
    addressId: payload.addressId,
    freight: payload.freight || 0,
    discount: payload.discount || 0,
    remark: payload.remark || '',
    payAt: '',
    express: null
  }
  store.orders.unshift(order)
  persist()
  return order
}

export function payOrder(id) {
  const o = store.orders.find((x) => x.id === id)
  if (!o) return
  o.status = 'unshipped'
  o.payAt = new Date().toISOString().slice(0, 16).replace('T', ' ')
  persist()
}

export function cancelOrder(id) {
  const idx = store.orders.findIndex((x) => x.id === id)
  if (idx > -1) store.orders.splice(idx, 1)
  persist()
}

export function confirmReceipt(id) {
  const o = store.orders.find((x) => x.id === id)
  if (!o) return
  o.status = 'done'
  persist()
}

/** 卖家发货：置为运输中，并生成一条模拟物流 */
export function shipOrder(id, express) {
  const o = store.orders.find((x) => x.id === id)
  if (!o) return false
  o.status = 'shipping'
  o.express = express || {
    company: '湘农汇冷链',
    no: 'XNH' + Date.now().toString().slice(-10),
    updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
  }
  persist()
  return true
}

export function countByStatus(status) {
  return store.orders.filter((o) => o.status === status).length
}

/* ---------------- 收藏 / 足迹 / 点赞 ---------------- */
export function toggleFavorite(productId) {
  const idx = store.favorites.indexOf(productId)
  if (idx > -1) store.favorites.splice(idx, 1)
  else store.favorites.unshift(productId)
  persist()
  return idx === -1
}

export function isFavorite(productId) {
  return store.favorites.includes(productId)
}

export function addFootprint(productId) {
  const idx = store.footprint.indexOf(productId)
  if (idx > -1) store.footprint.splice(idx, 1)
  store.footprint.unshift(productId)
  if (store.footprint.length > 20) store.footprint.pop()
  persist()
}

export function toggleLike(postId) {
  const idx = store.likedPosts.indexOf(postId)
  if (idx > -1) store.likedPosts.splice(idx, 1)
  else store.likedPosts.unshift(postId)
  persist()
  return idx === -1
}

export function clearUnread() {
  store.unread = 0
  persist()
}

export const PRODUCT_ALL = PRODUCTS


/* ---------------- 云端用户同步 ---------------- */
export async function syncCloudUser() {
  try {
    const me = await fetchMe()
    if (!me) return false
    let p = null
    try {
      p = await fetchProfile(me.userId)
    } catch (e) {}
    store.user.userId = me.userId
    store.user.nickname = (p && p.nickname) || me.nickname || store.user.nickname
    store.user.avatar = (p && p.avatar) || me.avatar || store.user.avatar
    if (p && p.city) store.user.city = p.city
    persist()
    return true
  } catch (e) {
    return false
  }
}

export async function isCloudLogin() {
  try {
    const me = await fetchMe()
    return !!me
  } catch (e) {
    return false
  }
}

/* ---------------- 认养一块地 ---------------- */

/** 地块页 → 确认页 的下单草稿 */
export function setAdoptDraft(draft) {
  store.adoptDraft = { ...draft }
}

export function clearAdoptDraft() {
  store.adoptDraft = null
}

export function findAdoption(id) {
  return store.adoptions.find((a) => a.id === id) || null
}

/** 进行中的认养单 */
export function growingAdoptions() {
  return store.adoptions.filter((a) => a.status === 'growing')
}

/** 某个农场正在认养的地块（农场详情页用） */
export function activeAdoptionOfFarm(farmId) {
  return store.adoptions.find((a) => a.status === 'growing' && a.farmId === farmId) || null
}

/** 提交认养：返回新建的认养单 */
export function createAdoption(payload) {
  const id = 'AD' + Date.now().toString().slice(-11)
  const adoption = {
    id,
    plotId: payload.plotId,
    code: payload.code,
    farmId: payload.farmId,
    crops: payload.crops ? payload.crops.slice() : [],
    planKey: payload.planKey,
    cycleKey: payload.cycleKey,
    startDate: payload.startDate,
    endDate: payload.endDate,
    total: payload.total,
    status: 'growing',
    freq: payload.freq || 0,
    nextDelivery: payload.nextDelivery || '',
    deliveriesTotal: payload.deliveriesTotal || 0,
    deliveriesDone: 0,
    owner: payload.owner || '',
    phone: payload.phone || '',
    addressId: payload.addressId || '',
    remark: payload.remark || '',
    createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
  }
  store.adoptions.unshift(adoption)
  persist()
  return adoption
}

/** 退养：状态置为 cancelled */
export function cancelAdoption(id) {
  const a = findAdoption(id)
  if (!a) return false
  a.status = 'cancelled'
  a.nextDelivery = ''
  persist()
  return true
}

/**
 * 身份状态（买家 / 农户 / 专家）
 *
 * 一个账号可以同时拥有多个身份，当前身份存在本地，切换只改这一处。
 * 为什么单独一个 store：`store/index.js` 里是业务数据（购物车、订单），
 * 这里是「我在这个 App 里是谁」，混在一起以后接后端会很难拆。
 *
 * storage key: nh_role_v1
 *   current   当前身份 key，空串表示还没选（登录后强制选）
 *   activated 已开通的身份 key 数组
 *   apps      申请记录 { farmer: { status, form, at, reviewAt }, expert: {...} }
 */
import { reactive } from 'vue'
import { ROLES, roleOf } from '@/common/roles.js'

const KEY = 'nh_role_v1'

function load() {
  try {
    const raw = uni.getStorageSync(KEY)
    if (raw && typeof raw === 'object') return raw
  } catch (e) {}
  return null
}

const saved = load()

export const roleStore = reactive({
  current: saved?.current || '',
  activated: Array.isArray(saved?.activated) ? saved.activated : [],
  apps: saved?.apps || {}
})

export function persistRole() {
  try {
    uni.setStorageSync(KEY, JSON.parse(JSON.stringify(roleStore)))
  } catch (e) {}
}

/* ---------------- 读 ---------------- */

/** 当前身份对象，未选返回 null */
export function currentRole() {
  return roleStore.current ? roleOf(roleStore.current) : null
}

/** 当前身份的首页 */
export function roleHome(key) {
  const r = roleOf(key || roleStore.current)
  return (r && r.home) || '/pages/tabbar/home/home'
}

/** 当前身份该显示的底部导航 */
export function roleTabs() {
  const r = currentRole()
  return (r && r.tabs) || ROLES.buyer.tabs
}

export function hasRole(key) {
  return roleStore.activated.includes(key)
}

/** 某身份的申请状态：none / pending / approved / rejected */
export function appStatusOf(key) {
  if (hasRole(key)) return 'approved'
  const app = roleStore.apps[key]
  return (app && app.status) || 'none'
}

export function appOf(key) {
  return roleStore.apps[key] || null
}

/** 已开通的身份列表（对象） */
export function activatedRoles() {
  return roleStore.activated.map((k) => roleOf(k)).filter(Boolean)
}

/* ---------------- 写 ---------------- */

/** 切换身份：必须已开通，返回是否成功 */
export function switchRole(key) {
  if (!hasRole(key)) return false
  roleStore.current = key
  persistRole()
  return true
}

/** 开通（审核通过）后直接切过去 */
export function activateRole(key) {
  if (!hasRole(key)) roleStore.activated.push(key)
  roleStore.current = key
  const app = roleStore.apps[key]
  if (app) {
    app.status = 'approved'
    app.reviewAt = Date.now()
  }
  persistRole()
  return true
}

/** 提交身份申请 → 进入待审核 */
export function applyRole(key, form) {
  if (hasRole(key)) return 'approved'
  roleStore.apps[key] = {
    status: 'pending',
    form: { ...form },
    at: Date.now()
  }
  persistRole()
  return 'pending'
}

/**
 * 模拟审核（演示用）
 *
 * 真实环境由后台运营在管理端审核，通过后写库、这里只负责拉取结果。
 * 演示版没有后台，所以在「身份切换」页给一个明确的模拟入口。
 */
export function reviewRole(key, pass) {
  const app = roleStore.apps[key]
  if (!app) return false
  app.status = pass ? 'approved' : 'rejected'
  app.reviewAt = Date.now()
  if (pass && !hasRole(key)) roleStore.activated.push(key)
  persistRole()
  return true
}

/** 清掉申请记录（驳回后重新提交时用），保留已填资料由页面自己回填 */
export function clearApplication(key) {
  if (roleStore.apps[key]) {
    roleStore.apps[key].status = 'none'
    persistRole()
  }
}

/* ---------------- 登录后跳转 ---------------- */

/**
 * 登录成功后去哪里
 * 没选过身份 → 身份选择页；选过 → 对应首页
 */
export function afterLoginUrl() {
  if (!roleStore.current) return '/pages/role/switch?first=1'
  return roleHome()
}

/** 退出登录时清空身份，避免串号 */
export function resetRole() {
  roleStore.current = ''
  roleStore.activated = []
  roleStore.apps = {}
  persistRole()
}

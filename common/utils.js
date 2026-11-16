import { orderStatusText } from './enums.js'

export function money(n) {
  const v = Number(n || 0)
  return v.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
}

export function maskPhone(p) {
  if (!p) return ''
  return String(p).replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
}

/** 大数字展示：19000 -> 1.9万，1200 -> 1200 */
export function formatCount(n) {
  const v = Number(n || 0)
  if (v >= 10000) return (v / 10000).toFixed(1).replace(/\.0$/, '') + '万'
  return String(v)
}

export function todayStr() {
  const d = new Date()
  const p = (n) => (n < 10 ? '0' + n : '' + n)
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export function nowHM() {
  const d = new Date()
  const p = (n) => (n < 10 ? '0' + n : '' + n)
  return `${p(d.getHours())}:${p(d.getMinutes())}`
}

export function toast(title, icon = 'none') {
  uni.showToast({ title, icon, duration: 1600 })
}

export function go(url) {
  uni.navigateTo({ url })
}

export function tab(url) {
  uni.reLaunch({ url })
}

export function back() {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack()
  else uni.reLaunch({ url: '/pages/tabbar/home/home' })
}

export function statusText(s) {
  // 订单状态文案已收敛到 @/common/enums.js，这里保留别名兼容旧引用
  return orderStatusText(s)
}

export function copyText(t) {
  uni.setClipboardData({ data: String(t), success: () => toast('已复制') })
}

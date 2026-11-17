/**
 * 设计变量（Design Tokens）
 *
 * 全项目颜色的唯一出处：页面不要再写死 #0FC97A 这类色值，统一从这里取。
 * 换主题只改这一个文件，组件库与页面一起变。
 *
 * 为什么用 JS 而不是纯 CSS 变量：
 *   rpx / 渐变 / 阴影以字符串形式塞进 :style 更直接，小程序里也更稳；
 *   CSS 变量仍然保留在 App.vue 的 page 选择器上，供纯样式场景使用。
 */

/** 主色板 */
export const C = {
  brand: '#0FC97A',
  brandDeep: '#06A96A',
  brandSoft: '#E9FAF2',
  brandLine: '#C9EFDB',

  ink: '#16201C',
  ink2: '#3D4A45',
  sub: '#7C8A84',
  muted: '#9AA7A1',
  faint: '#B3BFBA',

  line: '#EDF1EF',
  line2: '#F4F8F5',
  bg: '#F4F8F5',
  white: '#FFFFFF',

  price: '#FF4B3A',
  danger: '#FF5A4E',
  warn: '#FF8A3D',
  info: '#4A8CFF',
  purple: '#7A6BFF',
  gold: '#E0A83C'
}

/** 语义色：每个色调给「主色 / 浅底 / 描边」三件套 */
export const TONES = {
  brand: { color: C.brandDeep, soft: C.brandSoft, line: C.brandLine },
  danger: { color: C.danger, soft: '#FFECEA', line: '#FFD3CF' },
  warn: { color: C.warn, soft: '#FFF4E4', line: '#FFE2BC' },
  info: { color: C.info, soft: '#EAF3FF', line: '#D3E5FF' },
  purple: { color: C.purple, soft: '#F1EEFF', line: '#DED8FF' },
  gold: { color: '#B07A00', soft: '#FFF8E6', line: '#FFE9B8' },
  gray: { color: C.ink2, soft: '#F3F6F4', line: C.line }
}

export function tone(name) {
  return TONES[name] || TONES.brand
}

/** 渐变：同一套绿，深浅两档，避免页面各写各的 */
export const G = {
  brand: 'linear-gradient(135deg, #16D488 0%, #0BBD72 100%)',
  brandSoft: 'linear-gradient(150deg, #E9F9EF 0%, #C9EFD9 100%)',
  header: 'linear-gradient(160deg, #14D183 0%, #0BAD6D 70%, #089A60 100%)',
  sunset: 'linear-gradient(135deg, #FFB65C 0%, #FF7A45 100%)',
  sky: 'linear-gradient(135deg, #6FB4FF 0%, #3D7DFF 100%)',
  soil: 'linear-gradient(150deg, #F6E7D2 0%, #E4C69B 100%)',
  mask: 'linear-gradient(180deg, rgba(10,40,28,0) 0%, rgba(10,40,28,0.62) 100%)'
}

/** 圆角 */
export const R = {
  xs: '8rpx',
  sm: '14rpx',
  md: '20rpx',
  lg: '28rpx',
  xl: '36rpx',
  pill: '999rpx'
}

/** 阴影：只有两档——卡片与浮层 */
export const SH = {
  card: '0 8rpx 30rpx rgba(22, 60, 45, 0.05)',
  float: '0 16rpx 44rpx rgba(6, 120, 80, 0.18)',
  none: 'none'
}

/** 间距刻度（rpx 数值，拼样式时用 n(v) 转字符串） */
export const SP = [4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56]

/** 数字 → rpx 字符串 */
export function n(v) {
  if (typeof v === 'number') return v + 'rpx'
  return v || '0'
}

/** 正文字号 */
export const FS = {
  h1: '40rpx',
  h2: '34rpx',
  h3: '29rpx',
  body: '26rpx',
  sub: '24rpx',
  mini: '21rpx',
  tiny: '19rpx'
}

/** 常用内联样式片段，减少页面重复拼字符串 */
export const S = {
  row: 'display:flex;align-items:center',
  rowBetween: 'display:flex;align-items:center;justify-content:space-between',
  col: 'display:flex;flex-direction:column',
  flex1: 'flex:1;min-width:0',
  ellipsis: 'overflow:hidden;white-space:nowrap;text-overflow:ellipsis'
}

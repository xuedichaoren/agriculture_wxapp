/**
 * 全站枚举字典
 *
 * 原则：**取值只在后端与这里定义一次**，页面里不允许再写裸字符串。
 * 文案调整只改本文件，不用全站搜替换。
 */

/* ---------------- 订单状态 ---------------- */
export const ORDER_STATUS = {
  UNPAID: 'unpaid', // 待付款
  UNSHIPPED: 'unshipped', // 已付款，待农场发货
  SHIPPING: 'shipping', // 运输中
  UNRECEIPTED: 'unreceipted', // 已到自提点 / 派送中
  DONE: 'done', // 已完成
  REFUND: 'refund' // 退款 / 售后
}

export const ORDER_STATUS_TEXT = {
  [ORDER_STATUS.UNPAID]: '待付款',
  [ORDER_STATUS.UNSHIPPED]: '待发货',
  [ORDER_STATUS.SHIPPING]: '待收货',
  [ORDER_STATUS.UNRECEIPTED]: '待收货',
  [ORDER_STATUS.DONE]: '已完成',
  [ORDER_STATUS.REFUND]: '退款/售后'
}

/** 订单状态 → 中文；未知状态统一显示「进行中」 */
export function orderStatusText(code) {
  return ORDER_STATUS_TEXT[code] || '进行中'
}

/** 「待收货」包含运输中与待取件两个细粒度状态 */
export const RECEIVING_STATUS = [ORDER_STATUS.SHIPPING, ORDER_STATUS.UNRECEIPTED]

export const ORDER_TABS = [
  { key: 'all', name: '全部' },
  { key: ORDER_STATUS.UNPAID, name: '待付款' },
  { key: ORDER_STATUS.UNSHIPPED, name: '待发货' },
  { key: ORDER_STATUS.SHIPPING, name: '待收货', includes: RECEIVING_STATUS },
  { key: ORDER_STATUS.DONE, name: '已完成' }
]

/* ---------------- 用户身份 ---------------- */
export const USER_ROLE = {
  FARMER: '农场主',
  FRIEND: '农友',
  CUSTOMER: '老主顾'
}

export const USER_ROLE_OPTIONS = [USER_ROLE.FRIEND, USER_ROLE.CUSTOMER, USER_ROLE.FARMER]

/* ---------------- 农友圈 ---------------- */
export const POST_TOPICS = ['我的菜园日记', '今日收成', '阳台种菜', '助农在路上']

export const FEED_TAB = {
  RECOMMEND: 'recommend',
  FOLLOW: 'follow'
}

/* ---------------- 农事任务 ---------------- */
export const FARM_TASK_TYPE = {
  HARVEST: 'harvest',
  CARE: 'care',
  FERTILIZE: 'fertilize'
}

export const FARM_TASK_TYPE_TEXT = {
  [FARM_TASK_TYPE.HARVEST]: '采收',
  [FARM_TASK_TYPE.CARE]: '管护',
  [FARM_TASK_TYPE.FERTILIZE]: '施肥'
}

/* ---------------- 站内消息 ---------------- */
export const MESSAGE_TYPE = {
  FARM: 'farm', // 农场主会话
  SYSTEM: 'system', // 订单通知
  NOTICE: 'notice' // 互动通知
}

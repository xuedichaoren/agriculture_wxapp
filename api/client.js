/**
 * 数据访问层 · 基础设施
 *
 * 约定：
 * - 页面 / 组件只 import `@/api`，不直接 import 本文件、更不直接调 getCloud()。
 * - 所有对外函数：失败一律 throw ApiError（带 code + 中文 message），成功返回 VM。
 * - owner_id 由数据库 DEFAULT auth.uid() 填充，前端任何情况下都不上送。
 */
import { getCloud, CLOUD_OK, publicConfig } from '@/common/cloud.js'

export { getCloud, CLOUD_OK, publicConfig }

/** 统一错误对象：code 对应 PostgreSQL SQLSTATE 或 SDK 错误类型 */
export class ApiError extends Error {
  constructor(message, { code = 'unknown', cause = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.cause = cause
  }
}

/** 需要登录时统一抛这个 code，页面据此弹登录窗 */
export const CODE_UNAUTHENTICATED = 'unauthenticated'

const CODE_TEXT = {
  23505: '已经操作过了',
  23503: '关联数据不存在',
  42501: '没有权限执行该操作，请重新登录',
  [CODE_UNAUTHENTICATED]: '请先登录'
}

/** 把底层错误统一成 ApiError，避免页面各自判断 error.code */
export function toApiError(e, fallback = '操作失败，请重试') {
  if (e instanceof ApiError) return e
  const code = (e && (e.code || e.kind)) || 'unknown'
  const message = CODE_TEXT[code] || (e && e.message) || fallback
  return new ApiError(message, { code, cause: e })
}

/** 解包 SDK 的 { data, error }，有错就抛 */
export function unwrap(res, fallback) {
  if (!res) throw new ApiError(fallback || '网络异常，请稍后重试')
  if (res.error) throw toApiError(res.error, fallback)
  return res.data
}

export function requireLogin(me) {
  if (!me) throw new ApiError(CODE_TEXT[CODE_UNAUTHENTICATED], { code: CODE_UNAUTHENTICATED })
  return me
}

/** 数据库访问器（仅本层使用） */
export function db() {
  return getCloud().database
}

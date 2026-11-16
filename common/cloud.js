/**
 * 数据客户端入口（按平台分流）
 *
 * - H5：使用 workbuddy 云服务 SDK（浏览器 fetch）
 * - 小程序 / App：使用本地库（common/local-db.js），接口形状与云端一致
 *
 * 这样 api/*.js 完全不需要关心平台差异，页面也照常调用。
 */

// #ifdef H5
import { createWorkBuddyCloud } from '@tencent-ai/workbuddy-cloud-sdk'
// #endif

import { createLocalClient } from './local-db.js'

export const publicConfig = {
  endpoint: 'https://xiangnonghui.app.workbuddy.host',
  oauthRelayBaseUrl: 'https://www.workbuddy.cn/v2/as/genie-baas/oauth',
  publishableKey: 'wbpk_gc3kx8g7h4eOp0AGTDX6l5_9qOhCjPHMA0SioAPEDWdC1ESGbS1foOS'
}

/** 当前是否处于本地数据模式（小程序 / App） */
export const IS_LOCAL_MODE = (() => {
  let local = true
  // #ifdef H5
  local = false
  // #endif
  return local
})()

/** 是否支持微信网页授权登录（只有 H5 / 微信内浏览器支持） */
export const CLOUD_OK = (() => {
  let ok = false
  // #ifdef H5
  ok = true
  // #endif
  return ok
})()

let cloudClient = null
let localClient = null

export function getCloud() {
  // #ifdef H5
  if (!cloudClient) {
    cloudClient = createWorkBuddyCloud({
      endpoint: publicConfig.endpoint,
      oauthRelayBaseUrl: publicConfig.oauthRelayBaseUrl,
      publishableKey: publicConfig.publishableKey
    })
  }
  return cloudClient
  // #endif
  // #ifndef H5
  if (!localClient) localClient = createLocalClient()
  return localClient
  // #endif
}

/** 统一的错误提示文案 */
export function cloudError(e) {
  if (!e) return '操作失败，请重试'
  const code = e.code || e.kind
  if (code === '23505') return '已经操作过了'
  if (code === '42501') return '没有权限执行该操作，请重新登录'
  if (code === 'unauthenticated') return '请先登录'
  if (code === 'PGRST116') return '没有找到对应的记录'
  return e.message || '网络异常，请稍后重试'
}

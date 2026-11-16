/**
 * 数据访问层 · 登录鉴权
 *
 * 返回的 MeVM：{ userId, nickname, avatar }
 * 微信登录只在 H5（浏览器 / 微信内）可用；App 端走条件编译裁掉。
 */
import { getCloud, toApiError, unwrap, ApiError } from './client.js'

/** 当前会话（未登录返回 null） */
export async function fetchSession() {
  try {
    const res = await getCloud().auth.getSession()
    if (res && res.error) return null
    return (res && res.data) || null
  } catch (e) {
    return null
  }
}

/** 当前登录用户；未登录返回 null */
export async function fetchMe() {
  const s = await fetchSession()
  const u = s && s.user
  if (!u) return null
  return {
    userId: u.id || u.userId || '',
    nickname: u.name || u.nickname || '',
    avatar: u.avatarUrl || u.avatar || ''
  }
}

export async function signOut() {
  try {
    await getCloud().auth.signOut()
  } catch (e) {
    throw toApiError(e, '退出登录失败')
  }
}

/** 发起微信网页授权，返回需要跳转的 url */
export async function signInWithWechat(redirectTo) {
  try {
    const data = unwrap(
      await getCloud().auth.signInWithOAuth({ provider: 'wechat', redirectTo }),
      '微信登录发起失败'
    )
    if (!data || !data.url) throw new ApiError('微信登录发起失败')
    return data.url
  } catch (e) {
    throw toApiError(e, '微信登录失败')
  }
}

/** 发送短信验证码 → { verificationId, isExistingUser } */
export async function sendSmsCode(phone) {
  try {
    return unwrap(await getCloud().auth.sendOtp({ phone }), '验证码发送失败')
  } catch (e) {
    throw toApiError(e, '验证码发送失败')
  }
}

/** 校验短信验证码并建立会话 */
export async function verifySmsCode({ phone, verificationId, isExistingUser, code }) {
  try {
    return unwrap(
      await getCloud().auth.verifyOtp({ phone, verificationId, isExistingUser, token: code }),
      '验证码不正确'
    )
  } catch (e) {
    throw toApiError(e, '登录失败')
  }
}

/** 处理微信回调（App.vue onLaunch 调用，code 一次性） */
export async function handleWechatCallback() {
  const cloud = getCloud()
  if (typeof cloud.auth.handleWechatWebCallback !== 'function') return null
  const data = unwrap(await cloud.auth.handleWechatWebCallback(), '微信登录失败')
  return data || null
}

/**
 * 本地一键登录（小程序 / App 无后端时使用）
 *
 * 没有服务端就无法用 wx.login 的 code 换 openid，所以身份由本机标识生成，
 * 只在本机有效。返回 { user, access_token, mode }
 */
export async function signInLocally(profile = {}) {
  const cloud = getCloud()
  if (!cloud.auth || typeof cloud.auth.signInLocal !== 'function') {
    throw new ApiError('当前环境不支持本地登录')
  }
  const data = unwrap(await cloud.auth.signInLocal(profile), '登录失败')
  return data
}

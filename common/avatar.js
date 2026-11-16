/**
 * 头像兜底：没有头像时按 id 稳定地取一个农夫 emoji，
 * 保证同一个人每次显示一致，且不产生随机跳变。
 */
const AVATAR_POOL = ['🧑‍🌾', '👩‍🌾', '👨‍🌾', '🧑‍🍳', '👩', '🧑', '👵', '🧓']

export function fallbackAvatar(seed = '') {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 997
  return AVATAR_POOL[h % AVATAR_POOL.length]
}

/** 默认昵称：湘农汇用户 + id 后四位 */
export function fallbackNickname(userId = '') {
  return '湘农汇用户' + String(userId).slice(-4).toUpperCase()
}

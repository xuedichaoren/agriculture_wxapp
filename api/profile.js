/**
 * 数据访问层 · 用户资料（user_profiles 表）
 *
 * UserVM：{ userId, nickname, avatar, city, userRole, bio }
 * 资料是全站唯一的「人」信息来源；动态/评论里的 author_* 只是发布时快照。
 */
import { db, unwrap, toApiError, requireLogin, ApiError } from './client.js'
import { fetchMe } from './auth.js'
import { fallbackAvatar, fallbackNickname } from '@/common/avatar.js'

const TABLE = 'user_profiles'
const FIELDS = 'owner_id, nickname, avatar, city, user_role, bio, created_at, updated_at'

/** DB 行 → UserVM */
export function toUserVM(row) {
  if (!row) return null
  return {
    userId: row.owner_id,
    nickname: row.nickname || fallbackNickname(row.owner_id),
    avatar: row.avatar || fallbackAvatar(row.owner_id || ''),
    city: row.city || '',
    userRole: row.user_role || '农友',
    bio: row.bio || ''
  }
}

/** VM 补丁 → DB 列（只允许白名单字段，防止误传 owner_id） */
function toUserRow(patch = {}) {
  const row = {}
  if (patch.nickname !== undefined) row.nickname = patch.nickname
  if (patch.avatar !== undefined) row.avatar = patch.avatar
  if (patch.city !== undefined) row.city = patch.city
  if (patch.userRole !== undefined) row.user_role = patch.userRole
  if (patch.bio !== undefined) row.bio = patch.bio
  return row
}

export async function fetchProfile(userId) {
  try {
    const row = unwrap(
      await db().from(TABLE).select(FIELDS).eq('owner_id', userId).maybeSingle(),
      '资料加载失败'
    )
    return toUserVM(row)
  } catch (e) {
    throw toApiError(e, '资料加载失败')
  }
}

/** 取当前用户资料；第一次登录时自动建档 */
export async function ensureProfile() {
  const me = requireLogin(await fetchMe())
  const exist = await fetchProfile(me.userId)
  if (exist) return exist

  const row = {
    nickname: me.nickname || fallbackNickname(me.userId),
    avatar: me.avatar || fallbackAvatar(me.userId),
    city: '湖南',
    user_role: '农友'
  }
  try {
    const data = unwrap(await db().from(TABLE).insert(row).select(FIELDS), '建档失败')
    return toUserVM((data && data[0]) || { owner_id: me.userId, ...row })
  } catch (e) {
    const err = toApiError(e, '建档失败')
    if (err.code === '23505') return fetchProfile(me.userId) // 并发重复建档
    throw err
  }
}

export async function updateProfile(patch) {
  const me = requireLogin(await fetchMe())
  const row = toUserRow(patch)
  if (!Object.keys(row).length) throw new ApiError('没有要修改的资料')
  try {
    const data = unwrap(
      await db().from(TABLE).update(row).eq('owner_id', me.userId).select(FIELDS),
      '保存失败'
    )
    return toUserVM((data && data[0]) || null)
  } catch (e) {
    throw toApiError(e, '保存失败')
  }
}

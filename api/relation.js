/**
 * 数据访问层 · 关注关系（user_follows 表）
 *
 * 关系表只存 follower_id / following_id，昵称头像统一从 user_profiles 取，
 * 避免用户改名后关注列表还显示旧名字。
 */
import { db, unwrap, toApiError, requireLogin, ApiError } from './client.js'
import { fetchMe } from './auth.js'
import { toUserVM } from './profile.js'
import { fallbackAvatar, fallbackNickname } from '@/common/avatar.js'

const TABLE = 'user_follows'
const PROFILE_FIELDS = 'owner_id, nickname, avatar, city, user_role, bio'

const FOLLOW_FIELDS = 'follower_id, following_id, created_at'

/** 用 profiles 补齐展示信息；profile 缺失时用兜底昵称头像 */
async function joinProfiles(ids) {
  const map = {}
  if (!ids.length) return map
  const rows =
    unwrap(await db().from('user_profiles').select(PROFILE_FIELDS).in('owner_id', ids), '加载失败') || []
  rows.forEach((r) => {
    map[r.owner_id] = toUserVM(r)
  })
  return map
}

/** 我关注的人 */
export async function fetchFollowing() {
  try {
    const me = requireLogin(await fetchMe())
    const rows =
      unwrap(
        await db()
          .from(TABLE)
          .select(FOLLOW_FIELDS)
          .eq('follower_id', me.userId)
          .order('created_at', { ascending: false }),
        '加载失败'
      ) || []
    const ids = rows.map((r) => r.following_id)
    const map = await joinProfiles(ids)
    return ids.map(
      (id) =>
        map[id] || {
          userId: id,
          nickname: fallbackNickname(id),
          avatar: fallbackAvatar(id),
          city: '',
          userRole: '农友',
          bio: ''
        }
    )
  } catch (e) {
    throw toApiError(e, '关注列表加载失败')
  }
}

/** 关注我的人 */
export async function fetchFollowers() {
  try {
    const me = requireLogin(await fetchMe())
    const rows =
      unwrap(
        await db()
          .from(TABLE)
          .select(FOLLOW_FIELDS)
          .eq('following_id', me.userId)
          .order('created_at', { ascending: false }),
        '加载失败'
      ) || []
    const ids = rows.map((r) => r.follower_id)
    const map = await joinProfiles(ids)
    return ids.map(
      (id) =>
        map[id] || {
          userId: id,
          nickname: fallbackNickname(id),
          avatar: fallbackAvatar(id),
          city: '',
          userRole: '农友',
          bio: ''
        }
    )
  } catch (e) {
    throw toApiError(e, '粉丝列表加载失败')
  }
}

/** 关注数 / 粉丝数 */
export async function fetchFollowStats(userId) {
  try {
    const d = db()
    const [a, b] = await Promise.all([
      d.from(TABLE).select('id', { count: 'exact', head: true }).eq('follower_id', userId),
      d.from(TABLE).select('id', { count: 'exact', head: true }).eq('following_id', userId)
    ])
    return { followingCount: a.count || 0, followerCount: b.count || 0 }
  } catch (e) {
    return { followingCount: 0, followerCount: 0 }
  }
}

export async function isFollowing(targetUserId) {
  try {
    const me = await fetchMe()
    if (!me || me.userId === targetUserId) return false
    const row = unwrap(
      await db()
        .from(TABLE)
        .select('id')
        .eq('follower_id', me.userId)
        .eq('following_id', targetUserId)
        .maybeSingle(),
      '加载失败'
    )
    return !!row
  } catch (e) {
    throw toApiError(e, '加载失败')
  }
}

/** 关注某人（幂等：已关注直接返回 true） */
export async function follow(target) {
  const targetUserId = typeof target === 'string' ? target : target && target.userId
  if (!targetUserId) throw new ApiError('关注对象不存在')

  try {
    const me = requireLogin(await fetchMe())
    if (me.userId === targetUserId) throw new ApiError('不能关注自己')
    const res = await db().from(TABLE).insert({ following_id: targetUserId })
    if (res.error) {
      if (res.error.code === '23505') return true
      throw toApiError(res.error, '关注失败')
    }
    return true
  } catch (e) {
    throw toApiError(e, '关注失败')
  }
}

export async function unfollow(targetUserId) {
  try {
    const me = requireLogin(await fetchMe())
    unwrap(
      await db().from(TABLE).delete().eq('follower_id', me.userId).eq('following_id', targetUserId),
      '取消关注失败'
    )
    return false
  } catch (e) {
    throw toApiError(e, '取消关注失败')
  }
}

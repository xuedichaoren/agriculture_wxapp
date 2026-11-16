/**
 * 数据访问层 · 农友圈（community_posts / community_comments / community_likes）
 *
 * PostVM：{
 *   id, authorId, authorName, authorAvatar, authorRole,
 *   content, productId, images, topic,
 *   createdAt, updatedAt,
 *   likeCount, commentCount, isLiked, isMine
 * }
 * CommentVM：{ id, postId, authorId, authorName, authorAvatar, content, createdAt, isMine }
 *
 * 说明：author_* 是发布时的快照，owner_id 才是权限归属（RLS 判定用）。
 */
import { db, unwrap, toApiError, requireLogin, ApiError } from './client.js'
import { fetchMe } from './auth.js'
import { ensureProfile } from './profile.js'
import { fallbackAvatar, fallbackNickname } from '@/common/avatar.js'

const POSTS = 'community_posts'
const COMMENTS = 'community_comments'
const LIKES = 'community_likes'

const POST_FIELDS =
  'id, owner_id, author_name, author_avatar, author_role, content, product_id, images, topic, created_at, updated_at'
const COMMENT_FIELDS = 'id, post_id, owner_id, author_name, author_avatar, content, created_at'

function toPostVM(row, stat = {}, me = null) {
  return {
    id: row.id,
    authorId: row.owner_id,
    authorName: row.author_name || fallbackNickname(row.owner_id),
    authorAvatar: row.author_avatar || fallbackAvatar(row.owner_id || ''),
    authorRole: row.author_role || '农友',
    content: row.content || '',
    productId: row.product_id || '',
    images: Array.isArray(row.images) ? row.images : [],
    topic: row.topic || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    likeCount: stat.likeCount || 0,
    commentCount: stat.commentCount || 0,
    isLiked: !!stat.isLiked,
    isMine: !!me && row.owner_id === me.userId
  }
}

function countBy(rows, key) {
  const map = {}
  for (const r of rows) map[r[key]] = (map[r[key]] || 0) + 1
  return map
}

/** 批量补齐点赞数 / 评论数 / 我是否点过赞，避免 N+1 */
async function decorate(rows, me) {
  if (!rows.length) return []
  const ids = rows.map((r) => r.id)
  const d = db()
  const jobs = [
    d.from(LIKES).select('post_id').in('post_id', ids),
    d.from(COMMENTS).select('post_id').in('post_id', ids)
  ]
  if (me) jobs.push(d.from(LIKES).select('post_id').in('post_id', ids).eq('owner_id', me.userId))

  const [likeRes, cmtRes, mineRes] = await Promise.all(jobs)
  const likeRows = unwrap(likeRes, '加载失败') || []
  const cmtRows = unwrap(cmtRes, '加载失败') || []
  const myRows = (mineRes && mineRes.data) || []

  const likeMap = countBy(likeRows, 'post_id')
  const cmtMap = countBy(cmtRows, 'post_id')
  const likedSet = new Set(myRows.map((r) => r.post_id))

  return rows.map((r) =>
    toPostVM(r, { likeCount: likeMap[r.id], commentCount: cmtMap[r.id], isLiked: likedSet.has(r.id) }, me)
  )
}

async function queryPosts(build, me) {
  const rows = unwrap(await build(db().from(POSTS).select(POST_FIELDS)), '加载失败') || []
  return decorate(rows, me)
}

/** 推荐流：全站最新 */
export async function fetchFeed({ page = 0, size = 10 } = {}) {
  try {
    const me = await fetchMe()
    const from = page * size
    return await queryPosts(
      (q) => q.order('created_at', { ascending: false }).range(from, from + size - 1),
      me
    )
  } catch (e) {
    throw toApiError(e, '农友圈加载失败')
  }
}

/** 关注流：只看已关注的人 */
export async function fetchFollowFeed({ page = 0, size = 10 } = {}) {
  try {
    const me = requireLogin(await fetchMe())
    const follows =
      unwrap(await db().from('user_follows').select('following_id').eq('follower_id', me.userId), '加载失败') ||
      []
    const ids = follows.map((f) => f.following_id)
    if (!ids.length) return []

    const from = page * size
    return await queryPosts(
      (q) => q.in('owner_id', ids).order('created_at', { ascending: false }).range(from, from + size - 1),
      me
    )
  } catch (e) {
    throw toApiError(e, '关注动态加载失败')
  }
}

/** 某个人的动态 */
export async function fetchPostsByUser(userId, { size = 20 } = {}) {
  try {
    const me = await fetchMe()
    return await queryPosts(
      (q) => q.eq('owner_id', userId).order('created_at', { ascending: false }).limit(size),
      me
    )
  } catch (e) {
    throw toApiError(e, '动态加载失败')
  }
}

/** 单条动态详情（不存在返回 null） */
export async function fetchPost(postId) {
  try {
    const me = await fetchMe()
    const row = unwrap(
      await db().from(POSTS).select(POST_FIELDS).eq('id', postId).maybeSingle(),
      '动态加载失败'
    )
    if (!row) return null
    const list = await decorate([row], me)
    return list[0]
  } catch (e) {
    throw toApiError(e, '动态加载失败')
  }
}

/** 发布动态 */
export async function createPost({ content, productId = '', images = [], topic = '' }) {
  const text = (content || '').trim()
  if (!text) throw new ApiError('说点什么再发布吧')

  try {
    const me = requireLogin(await fetchMe())
    const profile = await ensureProfile()
    const row = {
      author_name: profile.nickname,
      author_avatar: profile.avatar,
      author_role: profile.userRole,
      content: text,
      product_id: productId || null,
      images,
      topic: topic || null
    }
    const data = unwrap(await db().from(POSTS).insert(row).select(POST_FIELDS), '发布失败')
    return toPostVM((data && data[0]) || { ...row, owner_id: me.userId }, {}, me)
  } catch (e) {
    throw toApiError(e, '发布失败')
  }
}

export async function deletePost(postId) {
  try {
    requireLogin(await fetchMe())
    const data = unwrap(await db().from(POSTS).delete().eq('id', postId).select('id'), '删除失败')
    if (!data || !data.length) throw new ApiError('这条动态不属于你，无法删除')
  } catch (e) {
    throw toApiError(e, '删除失败')
  }
}

/** 动态下的评论（时间正序） */
export async function fetchComments(postId) {
  try {
    const me = await fetchMe()
    const rows =
      unwrap(
        await db()
          .from(COMMENTS)
          .select(COMMENT_FIELDS)
          .eq('post_id', postId)
          .order('created_at', { ascending: true }),
        '评论加载失败'
      ) || []
    return rows.map((c) => ({
      id: c.id,
      postId: c.post_id,
      authorId: c.owner_id,
      authorName: c.author_name || fallbackNickname(c.owner_id),
      authorAvatar: c.author_avatar || fallbackAvatar(c.owner_id || ''),
      content: c.content || '',
      createdAt: c.created_at,
      isMine: !!me && c.owner_id === me.userId
    }))
  } catch (e) {
    throw toApiError(e, '评论加载失败')
  }
}

export async function createComment(postId, content) {
  const text = (content || '').trim()
  if (!text) throw new ApiError('评论不能为空')

  try {
    requireLogin(await fetchMe())
    const profile = await ensureProfile()
    const data = unwrap(
      await db()
        .from(COMMENTS)
        .insert({
          post_id: postId,
          author_name: profile.nickname,
          author_avatar: profile.avatar,
          content: text
        })
        .select(COMMENT_FIELDS),
      '评论失败'
    )
    const row = (data && data[0]) || null
    if (!row) throw new ApiError('评论失败')
    return {
      id: row.id,
      postId: row.post_id,
      authorId: row.owner_id,
      authorName: row.author_name || profile.nickname,
      authorAvatar: row.author_avatar || profile.avatar,
      content: row.content,
      createdAt: row.created_at,
      isMine: true
    }
  } catch (e) {
    throw toApiError(e, '评论失败')
  }
}

/**
 * 点赞 / 取消点赞
 * @param {boolean} isLiked 当前是否已点赞
 * @returns {Promise<boolean>} 操作后的点赞状态
 */
export async function toggleLike(postId, isLiked) {
  try {
    const me = requireLogin(await fetchMe())
    const d = db()
    if (isLiked) {
      unwrap(await d.from(LIKES).delete().eq('post_id', postId).eq('owner_id', me.userId), '操作失败')
      return false
    }
    const res = await d.from(LIKES).insert({ post_id: postId })
    if (res.error) {
      if (res.error.code === '23505') return true // 并发重复点赞
      throw toApiError(res.error, '操作失败')
    }
    return true
  } catch (e) {
    throw toApiError(e, '操作失败')
  }
}

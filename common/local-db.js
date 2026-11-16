/**
 * 本地数据库（小程序 / App 端使用）
 *
 * 背景：云端 BaaS 已下线（REST 返回 404），小程序端没有后端可用。
 * 本文件用 uni storage 复刻云端 SDK 的查询接口，让 api/*.js 一行不改就能跑：
 *
 *   from(table).select(fields, opts).eq().in().order().range().limit()
 *   .single().maybeSingle().insert().update().delete()
 *
 * 返回值形状与云端一致：{ data, count, error }，且是 thenable（可直接 await）。
 *
 * 数据只存在本机，卸载小程序即丢失。
 */

const SESSION_KEY = 'nh_session'
const DB_PREFIX = 'nh_db_'
const DEVICE_KEY = 'nh_device_id'

/** 插入时自动补 owner_id 的表（权限归属字段） */
const AUTO_OWNER_TABLES = [
  'community_posts',
  'community_comments',
  'community_likes',
  'user_profiles',
  'user_follows'
]

/* ---------------------------------- 存储 --------------------------------- */

function readSession() {
  try {
    return uni.getStorageSync(SESSION_KEY) || null
  } catch (e) {
    return null
  }
}

function writeSession(session) {
  try {
    uni.setStorageSync(SESSION_KEY, session)
  } catch (e) {}
}

function clearSession() {
  try {
    uni.removeStorageSync(SESSION_KEY)
  } catch (e) {}
}

/** 当前登录用户 id（未登录为空串） */
function currentUserId() {
  const s = readSession()
  return (s && s.user && s.user.id) || ''
}

/** 本机唯一标识：首次调用生成并持久化，用于本地一键登录 */
function deviceId() {
  let id = ''
  try {
    id = uni.getStorageSync(DEVICE_KEY) || ''
  } catch (e) {}
  if (!id) {
    id = 'dev_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    try {
      uni.setStorageSync(DEVICE_KEY, id)
    } catch (e) {}
  }
  return id
}

function readTable(table) {
  try {
    const rows = uni.getStorageSync(DB_PREFIX + table)
    return Array.isArray(rows) ? rows : []
  } catch (e) {
    return []
  }
}

function writeTable(table, rows) {
  try {
    uni.setStorageSync(DB_PREFIX + table, rows)
  } catch (e) {}
}

function nowIso() {
  return new Date().toISOString()
}

/** 插入前的补字段：id / 归属 / 时间戳 */
function normalizeRow(table, input) {
  const row = { ...input }
  if (row.id === undefined) {
    row.id = 'loc_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
  }
  // user_follows 用 follower_id 表示归属，没有 owner_id 字段
  if (table === 'user_follows') {
    if (row.follower_id === undefined) row.follower_id = currentUserId()
  } else if (row.owner_id === undefined && AUTO_OWNER_TABLES.includes(table)) {
    row.owner_id = currentUserId()
  }
  if (row.created_at === undefined) row.created_at = nowIso()
  if (row.updated_at === undefined) row.updated_at = nowIso()
  return row
}

/* --------------------------------- 查询构造器 ------------------------------- */

class LocalQuery {
  constructor(table) {
    this.table = table
    this.filters = []
    this._order = null
    this._range = null
    this._limit = null
    this._mode = 'select'
    this._payload = null
    this._single = null
    this._countOpt = null
    this._head = false
    this._total = 0
  }

  select(fields, options) {
    this._countOpt = options && options.count ? options.count : null
    this._head = !!(options && options.head)
    return this
  }

  insert(payload) {
    this._mode = 'insert'
    this._payload = payload
    return this
  }

  update(payload) {
    this._mode = 'update'
    this._payload = payload
    return this
  }

  delete() {
    this._mode = 'delete'
    return this
  }

  eq(col, val) {
    this.filters.push({ t: 'eq', col, val })
    return this
  }

  in(col, val) {
    this.filters.push({ t: 'in', col, val: Array.isArray(val) ? val : [] })
    return this
  }

  order(col, opts) {
    this._order = { col, asc: !(opts && opts.ascending === false) }
    return this
  }

  range(from, to) {
    this._range = [from, to]
    return this
  }

  limit(n) {
    this._limit = n
    return this
  }

  single() {
    this._single = 'one'
    return this
  }

  maybeSingle() {
    this._single = 'maybe'
    return this
  }

  _match(row) {
    return this.filters.every((f) => {
      if (f.t === 'eq') return row[f.col] === f.val
      if (f.t === 'in') return f.val.includes(row[f.col])
      return true
    })
  }

  _run() {
    const table = this.table

    if (this._mode === 'insert') {
      const rows = readTable(table)
      const list = (Array.isArray(this._payload) ? this._payload : [this._payload]).map((r) =>
        normalizeRow(table, r || {})
      )
      writeTable(table, rows.concat(list))
      return list
    }

    if (this._mode === 'update') {
      const rows = readTable(table)
      const changed = []
      const next = rows.map((row) => {
        if (!this._match(row)) return row
        const merged = { ...row, ...(this._payload || {}), updated_at: nowIso() }
        changed.push(merged)
        return merged
      })
      writeTable(table, next)
      return changed
    }

    if (this._mode === 'delete') {
      const rows = readTable(table)
      const removed = rows.filter((row) => this._match(row))
      writeTable(
        table,
        rows.filter((row) => !this._match(row))
      )
      return removed
    }

    let rows = readTable(table).filter((row) => this._match(row))
    this._total = rows.length

    if (this._order) {
      const { col, asc } = this._order
      rows = rows.slice().sort((a, b) => {
        const x = a[col]
        const y = b[col]
        if (x === y) return 0
        if (x === null || x === undefined) return 1
        if (y === null || y === undefined) return -1
        return (x > y ? 1 : -1) * (asc ? 1 : -1)
      })
    }

    if (this._range) {
      const [from, to] = this._range
      rows = rows.slice(from, to + 1)
    }

    if (this._limit) rows = rows.slice(0, this._limit)

    return rows
  }

  _resolve() {
    try {
      const rows = this._run()
      if (this._single === 'one') {
        return rows.length
          ? { data: rows[0], error: null }
          : { data: null, error: { code: 'PGRST116', message: '没有找到对应的记录' } }
      }
      if (this._single === 'maybe') {
        return { data: rows.length ? rows[0] : null, error: null }
      }
      if (this._head) {
        return { data: [], count: this._total || 0, error: null }
      }
      return { data: rows, error: null, count: this._total || 0 }
    } catch (e) {
      return { data: null, error: { code: 'local', message: (e && e.message) || '本地数据读取失败' } }
    }
  }

  then(resolve, reject) {
    return Promise.resolve(this._resolve()).then(resolve, reject)
  }

  catch(reject) {
    return Promise.resolve(this._resolve()).catch(reject)
  }
}

/* ---------------------------------- 出口 ---------------------------------- */

export function createLocalClient() {
  return {
    database: {
      from: (table) => new LocalQuery(table)
    },

    auth: {
      getSession: async () => ({ data: readSession(), error: null }),

      signOut: async () => {
        clearSession()
        return { data: null, error: null }
      },

      /** H5 微信网页授权：小程序端不支持 */
      signInWithOAuth: async () => ({
        data: null,
        error: { code: 'unsupported', message: '小程序端请使用按钮直接登录' }
      }),

      handleWechatWebCallback: async () => ({
        data: null,
        error: { code: 'unsupported', message: '小程序端无需回调处理' }
      }),

      /**
       * 本地一键登录：用本机标识建号，不依赖后端。
       * 没有后端就无法用 code 换 openid，所以身份只在本机有效。
       */
      async signInLocal({ nickname, avatar } = {}) {
        const id = 'u_' + deviceId().slice(-10)
        const session = {
          user: {
            id,
            name: nickname || '农友' + id.slice(-4),
            avatarUrl: avatar || ''
          },
          access_token: 'local_token',
          mode: 'local'
        }
        writeSession(session)
        return { data: session, error: null }
      },

      /** 本地演示：不真正发短信，只返回一个占位 verificationId */
      sendOtp: async ({ phone } = {}) => ({
        data: { verificationId: 'local_' + (phone || ''), isExistingUser: false },
        error: null
      }),

      /** 本地演示：只要手机号和验证码都填了就通过（码的校验在页面侧做） */
      async verifyOtp({ phone, token } = {}) {
        if (!phone) {
          return { data: null, error: { code: 'invalid', message: '请输入手机号' } }
        }
        if (!token) {
          return { data: null, error: { code: 'invalid', message: '请输入验证码' } }
        }
        const session = {
          user: {
            id: 'u_' + phone,
            name: '农友' + phone.slice(-4),
            avatarUrl: ''
          },
          access_token: 'local_token',
          mode: 'local'
        }
        writeSession(session)
        return { data: session, error: null }
      },

      setSession: (session) => {
        writeSession(session)
        return { data: session, error: null }
      }
    }
  }
}

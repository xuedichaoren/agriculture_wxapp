/**
 * 数据访问层统一出口
 *
 * 页面只依赖本文件：
 *   import * as api from '@/api/index.js'
 *
 * 分层约定（详见 docs/01-命名规范.md）：
 *   页面 / 组件  →  api/*.js  →  cloud SDK  →  PostgreSQL(RLS)
 * 页面不允许出现 snake_case 字段、不允许直接 new 查询。
 */
export * from './client.js'
export * from './auth.js'
export * from './profile.js'
export * from './community.js'
export * from './relation.js'
export * from './catalog.js'
export * from './adopt.js'
export * from './adopt-plan.js'
export * from './adopt-cert.js'
export * from './adopt-live.js'
export * from './adopt-harvest.js'
export * from './expert.js'
export * from './diagnose.js'
export * from './plant-id.js'

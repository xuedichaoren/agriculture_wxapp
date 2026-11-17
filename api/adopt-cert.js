/**
 * 数据访问层 · 认养证书
 *
 * 证书不单独落库：除「证书编号 / 验真码」需要稳定可复现外，其余字段全部由认养单派生。
 *
 * 编号规则：XNH + 起始年月(YYYYMM) + 认养单号后 6 位，例 XNH202609-200001
 * 验真码：认养单号 + 起始日期 哈希出 8 位（字符集去掉了 0/O/1/I，便于口头报读），
 *         分两段展示，例 7K3Q-92MF。前端演示版的哈希只用于展示，后端接入后由服务端签发。
 */
import { adoptionView } from './adopt-plan.js'

/** 去掉 0 O 1 I 的 base32 字符集，避免抄错 */
const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'

/** 三种认养状态在证书上的表现 */
export const CERT_STATUS = {
  growing: { text: '生效中', seal: '认养有效', tone: 'live', valid: true },
  ended: { text: '已完结', seal: '已完结', tone: 'done', valid: true },
  cancelled: { text: '已作废', seal: '已作废', tone: 'void', valid: false }
}

function hash(str, seed) {
  let h = (2166136261 ^ (seed >>> 0)) >>> 0
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619) >>> 0
  }
  return h >>> 0
}

/** 证书编号（打印在证书右上角，也用于客服查询） */
export function certNoOf(a) {
  const id = String((a && a.id) || '')
  const ym = String((a && a.startDate) || '').replace(/-/g, '').slice(0, 6) || '000000'
  return 'XNH' + ym + '-' + (id.slice(-6) || '000000')
}

/** 验真码：4-4 分段，固定可复现 */
export function verifyCodeOf(a) {
  const src = String((a && a.id) || '') + '|' + String((a && a.startDate) || '')
  let out = ''
  for (let i = 0; i < 8; i++) {
    out += ALPHABET[hash(src, i * 7919 + 17) % ALPHABET.length]
  }
  return out.slice(0, 4) + '-' + out.slice(4)
}

/**
 * 认养单 → 证书视图
 * @returns {null | object}
 */
export function certificateOf(a) {
  if (!a) return null
  const v = adoptionView(a)
  const st = CERT_STATUS[a.status] || CERT_STATUS.growing
  const crops = (v.cropList || []).map((c) => c.name).filter(Boolean)

  return {
    id: a.id,
    no: certNoOf(a),
    verify: verifyCodeOf(a),

    status: a.status,
    statusText: st.text,
    sealText: st.seal,
    tone: st.tone,
    valid: st.valid,

    owner: a.owner || '认养人',
    farmName: (v.farm && v.farm.name) || '湘农汇合作农场',
    plotLabel: (a.code || '') + ' 号地',
    area: (v.plot && v.plot.area) || '',
    crops: crops.length ? crops.join('、') : '未选作物',
    emojis: (v.cropList || []).map((c) => c.emoji).join(''),
    planName: (v.plan && v.plan.name) || '',
    cycleName: (v.cycle && v.cycle.name) || '',

    startDate: a.startDate,
    endDate: a.endDate,
    term: a.startDate + ' 至 ' + a.endDate,
    issueDate: a.startDate,
    total: a.total,

    days: v.totalDays,
    progress: v.progress
  }
}

/** 证书页顶部的一句话说明 */
export function certSummaryOf(cert) {
  if (!cert) return ''
  if (cert.status === 'cancelled') return '该认养已退养，证书仅作历史记录'
  if (cert.status === 'ended') return '认养期已结束，证书长期有效可随时查看'
  return '认养期内该地块产出归你所有，证书可保存或分享'
}

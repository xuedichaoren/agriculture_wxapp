/**
 * 作物（物种）识别 · 第一层判断
 *
 * 为什么要单独一层：
 *   原来把「认作物」和「判病害」塞进同一个 HSV 颜色向量里猜，两者互相拖累。
 *   健康叶片的颜色向量几乎都一样（绿色为主、黄褐白黑接近 0），
 *   用颜色向量比距离去区分茄子/番茄/辣椒在数学上就是无解的——
 *   这正是「茄子识别成草莓」的根本原因，调参数救不回来。
 *
 * 现在的做法：
 *   物种识别交给专门做这件事的服务（Pl@ntNet / 百度），
 *   本文件只负责「把 8 万物种收敛到本小程序的 10 种作物 + 给出候选让用户确认」。
 *
 * 三种模式（identifyConfig.provider）：
 *   endpoint  自建代理（推荐上线用）。key 放服务端，小程序只带图片。
 *   plantnet  直连 Pl@ntNet，仅本地调试用（key 在包里会被扒）
 *   baidu     直连百度，仅本地调试用
 *   local     不联网。不猜物种，只返回「候选让你点」——诚实但不装懂
 *
 * 服务选型依据（2026-11 实测资料）：
 *   Pl@ntNet  87000+ 物种，支持 organs（叶/花/果/整株/树皮），非营利机构，
 *             免费额度 500 次/天且允许商用，对「带花带果」的图最准
 *   百度智能云 植物识别  个人实名赠 1 万次/年，0.003 元/次，返回中文俗名，
 *             国内网络直连、备案容易，适合做国内兜底
 *   ※ 两者在「只有叶片」时对茄科（番茄/茄子/辣椒）都容易混，
 *     这是物种本身的视觉相似性决定的，不是模型不好。所以必须配合 organs 用。
 */

import { PLANTS } from '@/common/disease-kb.js'

/* ---------------- 配置 ---------------- */

export const identifyConfig = {
  /** endpoint | plantnet | baidu | local */
  provider: 'local',
  /** 自建代理地址，POST multipart 字段名 file，返回 { candidates: [...] } */
  endpoint: '',
  /** Pl@ntNet 项目：all（全部）| crops（作物，推荐）| weurope | ... */
  plantnetProject: 'crops',
  plantnetKey: '',
  baiduKey: '',
  baiduSecret: '',
  /** 走代理换百度 token 的地址，避免 secret 落到前端 */
  baiduTokenEndpoint: '',
  /** 低于此置信度不硬给结论，转「请你确认」 */
  minConfidence: 0.35,
  /** Top1 与 Top2 差值小于此值，判为「分不清」，同样转确认 */
  minGap: 0.12
}

export function setIdentifyConfig(patch) {
  Object.assign(identifyConfig, patch || {})
}

/* ---------------- 拍摄部位 ---------------- */

/**
 * Pl@ntNet 的 organs 参数。
 * 这一层是准确率的关键：拍花/果时准确率远高于只拍叶。
 */
export const ORGAN_TYPES = [
  { key: 'auto', label: '自动', organ: 'auto', tip: '整株入镜，带花或带果最准' },
  { key: 'leaf', label: '叶片', organ: 'leaf', tip: '叶片占画面 70%，避开强反光' },
  { key: 'flower', label: '花', organ: 'flower', tip: '花是最好认的部位，一朵就够' },
  { key: 'fruit', label: '果实', organ: 'fruit', tip: '带果柄一起拍，能区分近缘种' },
  { key: 'habit', label: '整株', organ: 'habit', tip: '退后拍到全株形态，含生长方式' },
  { key: 'bark', label: '茎/枝', organ: 'bark', tip: '木本拍枝干皮孔与纹理' }
]

export function organOf(key) {
  return ORGAN_TYPES.find((o) => o.key === key) || ORGAN_TYPES[0]
}

/* ---------------- 物种名 → 本地作物 ---------------- */

/**
 * 各家返回的名字写法差异极大：
 *   Pl@ntNet → 学名 Solanum melongena L.
 *   百度     → 中文俗名「茄子」
 * 统一在这里收敛，命中不了就返回空，落回「未收录」分支，不瞎猜。
 */
export const SPECIES_MAP = [
  { key: 'tomato', names: ['solanum lycopersicum', 'lycopersicon esculentum', '番茄', '西红柿', 'tomato'] },
  { key: 'pepper', names: ['capsicum annuum', 'capsicum frutescens', '辣椒', '甜椒', '青椒', 'pepper', 'chilli', 'chili'] },
  { key: 'cucumber', names: ['cucumis sativus', '黄瓜', '青瓜', 'cucumber'] },
  { key: 'eggplant', names: ['solanum melongena', 'solanum melongena l.', '茄子', 'eggplant', 'aubergine', 'brinjal'] },
  { key: 'cabbage', names: ['brassica oleracea', 'brassica pekinensis', 'brassica rapa', '白菜', '大白菜', '甘蓝', 'cabbage', 'chinese cabbage'] },
  { key: 'rice', names: ['oryza sativa', '水稻', '稻', 'rice', 'paddy'] },
  { key: 'citrus', names: ['citrus reticulata', 'citrus sinensis', 'citrus', '柑橘', '橘子', '橙', '脐橙', 'citrus fruit', 'orange', 'mandarin'] },
  { key: 'strawberry', names: ['fragaria', 'fragaria ananassa', 'fragaria × ananassa', '草莓', 'strawberry'] },
  { key: 'corn', names: ['zea mays', '玉米', 'corn', 'maize'] },
  { key: 'bean', names: ['phaseolus vulgaris', 'vigna', 'glycine max', '豆角', '菜豆', '豇豆', '大豆', 'bean', 'cowpea'] }
]

/** 归一化：小写、去作者名、去标点、压空格 */
function normName(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/×/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\b(l|var|subsp|ssp|f|auct|mill|gaertn)\.?\b/g, '')
    .replace(/[^\w\u4e00-\u9fa5]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

/**
 * 把一堆可能的名字（学名/俗名/中文名）映射成作物 key
 * 优先精确，其次包含匹配（「番茄果实」→ 番茄）
 */
export function speciesToPlant(...names) {
  const pool = names.filter(Boolean).map(normName)
  if (!pool.length) return ''

  for (const row of SPECIES_MAP) {
    for (const n of row.names) {
      const target = normName(n)
      if (pool.some((p) => p === target)) return row.key
    }
  }
  for (const row of SPECIES_MAP) {
    for (const n of row.names) {
      const target = normName(n)
      if (target.length < 2) continue
      if (pool.some((p) => p.indexOf(target) >= 0 || target.indexOf(p) >= 0)) return row.key
    }
  }
  return ''
}

/** key → 本地作物对象 */
export function plantByKey(key) {
  return PLANTS.find((p) => p.key === key) || null
}

/* ---------------- 辨识要点（给拍摄页与确认弹层用） ---------------- */

export const PLANT_HINT = {
  tomato: { shoot: '拍展开的复叶 + 一簇花或挂果', confuse: '和茄子苗、辣椒苗在幼苗期很像，有花就拍花' },
  pepper: { shoot: '拍果实与花，单叶难分', confuse: '甜椒/辣椒/观赏椒容易混，果实形状最可靠' },
  cucumber: { shoot: '拍带卷须的藤蔓与花', confuse: '丝瓜、苦瓜同为藤本，看果刺与叶裂' },
  eggplant: { shoot: '拍叶背绒毛 + 花（紫色星形）', confuse: '最易和番茄混，茄子叶更宽、有绒毛、叶脉带紫' },
  cabbage: { shoot: '拍整株抱合形态', confuse: '小白菜/芥菜/甘蓝同属，看是否结球' },
  rice: { shoot: '拍全株与穗', confuse: '和稗草、麦类混，看叶舌与穗型' },
  citrus: { shoot: '拍叶（有翼叶）+ 果', confuse: '橙/橘/柚看果形与叶柄翼叶大小' },
  strawberry: { shoot: '拍三出复叶 + 花或果', confuse: '和蛇莓极像，草莓叶更厚、锯齿更粗' },
  corn: { shoot: '拍全株与雄穗', confuse: '和高粱、薏苡混，看雄穗与叶宽' },
  bean: { shoot: '拍三出复叶 + 荚', confuse: '豇豆/菜豆/大豆看荚形与缠绕方式' }
}

/* ---------------- 图片转 base64（百度要用） ---------------- */

function readBase64(filePath) {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    const fs = uni.getFileSystemManager()
    fs.readFile({
      filePath,
      encoding: 'base64',
      success: (r) => resolve(r.data),
      fail: (e) => reject(new Error('读取图片失败'))
    })
    // #endif
    // #ifndef MP-WEIXIN
    reject(new Error('当前平台不支持'))
    // #endif
  })
}

/* ---------------- Pl@ntNet ---------------- */

async function callPlantNet(filePath, organKey) {
  const organ = organOf(organKey).organ
  const url =
    'https://my-api.plantnet.org/v2/identify/' +
    encodeURIComponent(identifyConfig.plantnetProject || 'crops') +
    '?api-key=' +
    encodeURIComponent(identifyConfig.plantnetKey) +
    '&lang=zh'

  const res = await new Promise((resolve) => {
    uni.uploadFile({
      url,
      filePath,
      name: 'images',
      formData: { organs: organ === 'auto' ? 'auto' : organ },
      success: (r) => resolve(r),
      fail: () => resolve(null)
    })
  })
  if (!res || res.statusCode !== 200) return []

  let body = null
  try {
    body = JSON.parse(res.data)
  } catch (e) {
    return []
  }
  const list = (body && body.results) || []
  return list.slice(0, 5).map((it) => {
    const sp = it.species || {}
    const sci = sp.scientificNameWithoutAuthor || sp.scientificName || ''
    const cn = (sp.commonNames || []).find((x) => /[\u4e00-\u9fa5]/.test(x)) || ''
    return {
      raw: sci,
      cn,
      key: speciesToPlant(sci, cn, sp.genus),
      confidence: Math.round((it.score || 0) * 100)
    }
  })
}

/* ---------------- 百度植物识别 ---------------- */

let baiduToken = { value: '', expire: 0 }

async function getBaiduToken() {
  if (baiduToken.value && Date.now() < baiduToken.expire) return baiduToken.value

  // 优先走代理换 token，secret 不落前端
  if (identifyConfig.baiduTokenEndpoint) {
    const r = await new Promise((resolve) => {
      uni.request({
        url: identifyConfig.baiduTokenEndpoint,
        method: 'POST',
        success: (x) => resolve(x),
        fail: () => resolve(null)
      })
    })
    const tk = r && r.data && (r.data.access_token || (r.data.data && r.data.data.access_token))
    if (tk) {
      baiduToken = { value: tk, expire: Date.now() + 25 * 24 * 3600 * 1000 }
      return tk
    }
    return ''
  }

  if (!identifyConfig.baiduKey || !identifyConfig.baiduSecret) return ''
  const r = await new Promise((resolve) => {
    uni.request({
      url: 'https://aip.baidubce.com/oauth/2.0/token',
      method: 'POST',
      header: { 'content-type': 'application/x-www-form-urlencoded' },
      data:
        'grant_type=client_credentials&client_id=' +
        encodeURIComponent(identifyConfig.baiduKey) +
        '&client_secret=' +
        encodeURIComponent(identifyConfig.baiduSecret),
      success: (x) => resolve(x),
      fail: () => resolve(null)
    })
  })
  const tk = r && r.data && r.data.access_token
  if (!tk) return ''
  baiduToken = { value: tk, expire: Date.now() + 25 * 24 * 3600 * 1000 }
  return tk
}

async function callBaidu(filePath) {
  const token = await getBaiduToken()
  if (!token) return []
  let b64 = ''
  try {
    b64 = await readBase64(filePath)
  } catch (e) {
    return []
  }
  const r = await new Promise((resolve) => {
    uni.request({
      url: 'https://aip.baidubce.com/rest/2.0/image-classify/v1/plant?access_token=' + token,
      method: 'POST',
      header: { 'content-type': 'application/x-www-form-urlencoded' },
      data: 'image=' + encodeURIComponent(b64),
      success: (x) => resolve(x),
      fail: () => resolve(null)
    })
  })
  const list = (r && r.data && r.data.result) || []
  return list.slice(0, 5).map((it) => ({
    raw: it.name || '',
    cn: it.name || '',
    key: speciesToPlant(it.name),
    confidence: Math.round((it.score || 0) * 100)
  }))
}

/* ---------------- 自建代理 ---------------- */

async function callEndpoint(filePath, organKey) {
  const res = await new Promise((resolve) => {
    uni.uploadFile({
      url: identifyConfig.endpoint,
      filePath,
      name: 'file',
      formData: { organ: organOf(organKey).organ },
      success: (r) => resolve(r),
      fail: () => resolve(null)
    })
  })
  if (!res || res.statusCode !== 200) return []
  let body = null
  try {
    body = JSON.parse(res.data)
  } catch (e) {
    return []
  }
  const list = (body && (body.candidates || body.results)) || []
  return list.slice(0, 5).map((it) => ({
    raw: it.scientific_name || it.name || '',
    cn: it.cn_name || it.name || '',
    key: it.key || speciesToPlant(it.scientific_name, it.cn_name, it.name),
    confidence: Math.round((it.confidence != null ? it.confidence : it.score || 0) * 100)
  }))
}

/* ---------------- 本机模式 ---------------- */

/**
 * 本机不联网时，绝不猜物种。
 * 返回「可能的作物」按常见度排序，全部标为待确认，让用户点一下。
 */
function localCandidates() {
  const order = ['tomato', 'pepper', 'cucumber', 'eggplant', 'cabbage', 'citrus', 'strawberry', 'corn', 'bean', 'rice']
  return order
    .map((k) => plantByKey(k))
    .filter(Boolean)
    .map((p) => ({ raw: '', cn: p.name, key: p.key, confidence: 0 }))
}

/* ---------------- 主流程 ---------------- */

function dedupe(list) {
  const seen = {}
  const out = []
  for (const it of list) {
    const k = it.key || 'unknown:' + (it.raw || it.cn)
    if (seen[k]) {
      if (it.confidence > seen[k].confidence) seen[k].confidence = it.confidence
      continue
    }
    seen[k] = it
    out.push(it)
  }
  return out
}

function toCandidate(it) {
  const p = it.key ? plantByKey(it.key) : null
  return {
    key: it.key || '',
    name: p ? p.name : it.cn || it.raw || '未收录',
    emoji: p ? p.emoji : '🌿',
    latin: it.raw || '',
    confidence: it.confidence,
    known: !!p
  }
}

/**
 * 识别作物
 * @param {Object} opts
 * @param {String} opts.filePath  本地图片路径（demo:// 会直接走本机模式）
 * @param {String} opts.organ     ORGAN_TYPES.key
 * @returns {Promise<{
 *   provider: String,
 *   candidates: Array<{key,name,emoji,latin,confidence,known}>,
 *   top: Object|null,
 *   needConfirm: Boolean,
 *   reason: String,
 *   note: String
 * }>}
 */
export async function identifyPlant(opts = {}) {
  const filePath = opts.filePath || ''
  const organKey = opts.organ || 'auto'
  const provider = identifyConfig.provider || 'local'
  const isDemo = !filePath || filePath.indexOf('demo://') === 0

  // 1) 选服务
  let providerName = 'local'
  let raw = []

  if (!isDemo && provider !== 'local') {
    try {
      if (provider === 'plantnet' && identifyConfig.plantnetKey) {
        raw = await callPlantNet(filePath, organKey)
        providerName = 'plantnet'
      } else if (provider === 'baidu' && (identifyConfig.baiduKey || identifyConfig.baiduTokenEndpoint)) {
        raw = await callBaidu(filePath)
        providerName = 'baidu'
      } else if (provider === 'endpoint' && identifyConfig.endpoint) {
        raw = await callEndpoint(filePath, organKey)
        providerName = 'endpoint'
      }
    } catch (e) {
      raw = []
    }
  }

  // 2) 服务没结果 → 本机候选确认
  if (!raw.length) {
    const cands = localCandidates().slice(0, 6).map(toCandidate)
    return {
      provider: 'local',
      candidates: cands,
      top: null,
      needConfirm: true,
      reason: 'no-service',
      note: isDemo
        ? '演示样张没有真实图像，请手动确认作物'
        : '未配置识别服务，或服务没返回结果，请手动确认作物'
    }
  }

  // 3) 归一 + 去重 + 排序
  const mapped = dedupe(raw).map(toCandidate)
  const known = mapped.filter((c) => c.known)
  const list = (known.length ? known : mapped).sort((a, b) => b.confidence - a.confidence)

  const top = list[0] || null
  const second = list[1] || null

  // 4) 置信度不足 / 前两名太近 → 必须让用户确认
  let needConfirm = false
  let reason = ''
  if (!top) {
    needConfirm = true
    reason = 'empty'
  } else if (top.confidence < Math.round(identifyConfig.minConfidence * 100)) {
    needConfirm = true
    reason = 'low'
  } else if (second && top.confidence - second.confidence < Math.round(identifyConfig.minGap * 100)) {
    needConfirm = true
    reason = 'close'
  }

  // 5) 不在本库 10 种里
  if (top && !top.known) {
    needConfirm = true
    reason = 'unknown'
  }

  const organLabel = organOf(organKey).label
  let note = ''
  if (reason === 'close') {
    note = '「' + top.name + '」和「' + second.name + '」分数很接近，请确认'
  } else if (reason === 'low') {
    note = '把握不大，请确认是哪种作物'
  } else if (reason === 'unknown') {
    note = '识别结果是「' + top.name + '」，不在当前支持的 10 种作物里'
  } else if (reason === 'empty') {
    note = '没认出来，请手动选作物'
  } else {
    note = '按' + organLabel + '识别，可点开核对'
  }

  return {
    provider: providerName,
    candidates: list.slice(0, 5),
    top,
    needConfirm,
    reason,
    note
  }
}

/** 结果转一句话，给结果页与问诊预填用 */
export function identifySummary(r) {
  if (!r || !r.top) return '作物：未确认'
  const pct = r.top.confidence ? '（' + r.top.confidence + '%）' : ''
  return '作物：' + r.top.name + pct + (r.needConfirm ? ' · 待确认' : '')
}

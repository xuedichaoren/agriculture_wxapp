/**
 * 识图诊断（两步：先认作物，再判病害 / 长势）
 *
 * 判断层分两档，页面完全不用感知：
 *   1) 服务端模型（推荐）：配了 endpoint 就把图片传上去，用 PlantVillage 38 类模型出结果
 *   2) 端侧特征（默认）：用 common/image-feature.js 的像素统计匹配知识库
 *
 * 为什么要分两档：
 *   微信小程序跑不了 TFLite，真模型只能放服务端；但演示环境没有服务端，
 *   端侧方案保证「打开就能用、结果稳定可解释」，接入模型时只换 provider，不改页面。
 *
 * 服务端模型参考（都是 MIT / 开源，可直接部署）：
 *   - AbdelhamidKHELLADI/plants_disease_detection_lite  MobileNetV3-Small + TFLite INT8，1MB，38 类
 *   - Moztafaa/plant-diseases-model                        TFLite + Flask，/predict 返回 {predicted_class, confidence}
 *   - Pranav-Dwivedi/plant-disease-classifier              MobileNetV2 + Temperature Scaling（置信度更可信，带背景类）
 * 部署成 FastAPI/Flask 后，把地址填到 setDiagnoseConfig({ endpoint }) 即可。
 */
import { analyseImage, describeFeatures } from '@/common/image-feature.js'
import { DISEASES, GROW, PLANTS, diseasesOfPlant, plantOf } from '@/common/disease-kb.js'

/* ---------------- 配置 ---------------- */

export const diagnoseConfig = {
  /** 形如 https://your-host/predict，留空则走端侧特征 */
  endpoint: '',
  /** 需要鉴权时填 Bearer token */
  token: '',
  /** 模型置信度低于此值时不采用模型结果，退回端侧判断 */
  minModelConfidence: 0.5
}

export function setDiagnoseConfig(patch) {
  Object.assign(diagnoseConfig, patch || {})
}

/* ---------------- 模型类别映射 ---------------- */

/**
 * PlantVillage 38 类 → 本库病名
 * 键统一小写、空格与连字符都转下划线，兼容不同仓库的标签写法
 */
export const CLASS_MAP = {
  'apple___apple_scab': 'apple-scab',
  'apple___black_rot': 'apple-black-rot',
  'apple___cedar_apple_rust': 'apple-rust',
  'apple___healthy': 'healthy',
  'blueberry___healthy': 'healthy',
  'cherry___powdery_mildew': 'cherry-powdery-mildew',
  'cherry___healthy': 'healthy',
  'corn___cercospora_leaf_spot_gray_leaf_spot': 'corn-leaf-blight',
  'corn___common_rust': 'corn-rust',
  'corn___northern_leaf_blight': 'corn-leaf-blight',
  'corn___healthy': 'healthy',
  'grape___black_rot': 'grape-black-rot',
  'grape___esca_black_measles': 'grape-esca',
  'grape___leaf_blight_isariopsis_leaf_spot': 'grape-leaf-blight',
  'grape___healthy': 'healthy',
  'orange___haunglongbing_citrus_greening': 'citrus-hlb',
  'peach___bacterial_spot': 'peach-bacterial-spot',
  'peach___healthy': 'healthy',
  'pepper_bell___bacterial_spot': 'pepper-bacterial-spot',
  'pepper_bell___healthy': 'healthy',
  'potato___early_blight': 'potato-early-blight',
  'potato___late_blight': 'potato-late-blight',
  'potato___healthy': 'healthy',
  'raspberry___healthy': 'healthy',
  'soybean___healthy': 'healthy',
  'squash___powdery_mildew': 'squash-powdery-mildew',
  'strawberry___leaf_scorch': 'strawberry-leaf-scorch',
  'strawberry___healthy': 'healthy',
  'tomato___bacterial_spot': 'tomato-bacterial-spot',
  'tomato___early_blight': 'tomato-early-blight',
  'tomato___late_blight': 'tomato-late-blight',
  'tomato___leaf_mold': 'tomato-leaf-mold',
  'tomato___septoria_leaf_spot': 'tomato-septoria',
  'tomato___spider_mites_two_spotted_spider_mite': 'citrus-red-mite',
  'tomato___target_spot': 'tomato-target-spot',
  'tomato___tomato_yellow_leaf_curl_virus': 'tomato-yellow-leaf-curl',
  'tomato___tomato_mosaic_virus': 'pepper-virus',
  'tomato___healthy': 'healthy'
}

function normaliseClass(raw) {
  return String(raw || '')
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
}

/* ---------------- 打分工具 ---------------- */

function vec5(s) {
  return [
    Number(s.yellow || 0),
    Number(s.brown || 0),
    Number(s.white || 0),
    Number(s.dark || 0),
    Number(s.spot || 0)
  ]
}

/**
 * 皮尔逊相关系数
 * 为什么不直接用余弦：像素占比都是正数，余弦普遍 0.9 以上，分不出病；
 * 去掉均值后看的是「形状」——黄化为主还是褐斑为主，区分度才够。
 */
function pearson(a, b) {
  const n = Math.min(a.length, b.length)
  let ma = 0
  let mb = 0
  for (let i = 0; i < n; i++) {
    ma += a[i]
    mb += b[i]
  }
  ma /= n
  mb /= n
  let num = 0
  let da = 0
  let db = 0
  for (let i = 0; i < n; i++) {
    const x = a[i] - ma
    const y = b[i] - mb
    num += x * y
    da += x * x
    db += y * y
  }
  if (da === 0 || db === 0) return 0
  return num / Math.sqrt(da * db)
}

function confOf(sim) {
  // 相关系数 -1~1 映射到 46~93，低于 46 没有参考价值，直接不展示
  const v = Math.round(46 + Math.max(0, sim) * 47)
  return Math.max(46, Math.min(93, v))
}

/** 病害/长势负载：越大说明叶面越"脏" */
function loadOf(f) {
  return (f.brown || 0) * 1.0 + (f.dark || 0) * 1.1 + (f.white || 0) * 0.75 + (f.yellow || 0) * 0.45
}

function scoreList(list, observed, dim) {
  const out = []
  for (const item of list) {
    const e = dim === 5 ? vec5(item.sign) : [item.sign.yellow || 0, item.sign.brown || 0, item.sign.white || 0, item.sign.dark || 0]
    const o = dim === 5 ? observed : observed.slice(0, 4)
    const sim = pearson(o, e)
    out.push({ item, sim, confidence: confOf(sim) })
  }
  return out.sort((a, b) => b.sim - a.sim)
}

/* ---------------- 严重度 ---------------- */

export function severityOf(load, disease) {
  const base = disease ? disease.severity : 2
  let level = Math.round(base)
  if (load > 0.34) level = Math.min(5, level + 1)
  if (load < 0.08) level = Math.max(1, level - 1)
  const map = {
    1: { text: '轻微', tone: 'brand', advice: '先按农业措施处理，暂不用药' },
    2: { text: '偏轻', tone: 'brand', advice: '可先用生物制剂，观察 3 天' },
    3: { text: '中等', tone: 'warn', advice: '建议尽快用药，同时改善环境' },
    4: { text: '偏重', tone: 'danger', advice: '立即处理，避免扩散到全田' },
    5: { text: '严重', tone: 'danger', advice: '紧急处置，必要时请专家复核' }
  }
  return Object.assign({ level }, map[level] || map[3])
}

/* ---------------- 模型调用 ---------------- */

async function callModel(filePath) {
  if (!diagnoseConfig.endpoint) return null
  try {
    const res = await new Promise((resolve, reject) => {
      uni.uploadFile({
        url: diagnoseConfig.endpoint,
        filePath,
        name: 'file',
        header: diagnoseConfig.token ? { Authorization: 'Bearer ' + diagnoseConfig.token } : {},
        success: resolve,
        fail: reject
      })
    })
    const body = typeof res.data === 'string' ? JSON.parse(res.data || '{}') : res.data || {}
    const raw = body.predicted_class || body.class || body.label || ''
    const conf = Number(body.confidence || body.score || 0) / (body.confidence > 1 ? 100 : 1)
    return { raw, cls: normaliseClass(raw), confidence: conf, body }
  } catch (e) {
    return null
  }
}

/* ---------------- 主流程 ---------------- */

let seq = 0

/**
 * 诊断一张图片
 * @param {object} opts
 * @param {string} opts.filePath 本地图片路径
 * @param {string} [opts.plantKey] 用户指定的作物（提高准确率，可空）
 * @param {'auto'|'disease'|'growth'} [opts.mode] 关注方向
 * @returns {Promise<object>} 结果对象
 */
export async function diagnose(opts = {}) {
  const filePath = opts.filePath
  if (!filePath) throw new Error('缺少图片')

  const features = await analyseImage(filePath)
  const observed = vec5(features)
  const load = loadOf(features)
  const mode = opts.mode || 'auto'

  // 1) 作物：由上一层作物识别（api/plant-id.js 的 identifyPlant）或用户确认后传入。
  //    这里【不再】用颜色向量猜物种——健康叶片的颜色向量几乎相同，
  //    比距离必然把茄子判成草莓，这是方法问题不是参数问题，所以直接去掉。
  const plant = opts.plantKey ? plantOf(opts.plantKey) : null
  const plantConfidence = opts.plantKey ? 96 : 0

  // 2) 服务端模型（如果配了）
  const model = await callModel(filePath)
  const useModel = !!(model && model.confidence >= diagnoseConfig.minModelConfidence && CLASS_MAP[model.cls])
  const modelDiseaseId = useModel ? CLASS_MAP[model.cls] : ''
  const modelHealthy = useModel && modelDiseaseId === 'healthy'

  // 3) 端侧匹配
  const pool = plant ? diseasesOfPlant(plant.key) : DISEASES
  const ranked = scoreList(pool.length ? pool : DISEASES, observed, 5)
  const growRanked = scoreList(GROW, observed, 4)

  let primary = null
  let alternatives = []
  let healthy = false

  if (modelHealthy) {
    healthy = true
  } else if (useModel) {
    const hit = DISEASES.find((d) => d.id === modelDiseaseId)
    if (hit) {
      primary = Object.assign({}, hit, {
        confidence: Math.round(Math.min(96, model.confidence * 100)),
        fromModel: true
      })
      alternatives = ranked.filter((r) => r.item.id !== hit.id).slice(0, 2).map((r) => ({
        id: r.item.id,
        name: r.item.name,
        confidence: r.confidence
      }))
    }
  }

  if (!primary && !healthy) {
    if (load < 0.07 && mode !== 'growth') {
      // 叶面很干净：不硬凑病名
      healthy = true
    } else {
      const top = ranked[0]
      primary = Object.assign({}, top.item, { confidence: top.confidence, fromModel: false })
      alternatives = ranked.slice(1, 3).map((r) => ({
        id: r.item.id,
        name: r.item.name,
        confidence: r.confidence
      }))
    }
  }

  // 4) 长势问题：无论有没有病，都顺带给 1~2 条最贴近的
  const growth = growRanked.slice(0, 2).map((r) => ({
    id: r.item.id,
    name: r.item.name,
    type: r.item.type,
    severity: r.item.severity,
    confidence: r.confidence,
    symptoms: r.item.symptoms,
    causes: r.item.causes,
    plan: r.item.plan,
    medicine: r.item.medicine,
    prevent: r.item.prevent,
    tip: r.item.tip
  }))

  const severity = severityOf(load, primary)
  const provider = useModel ? 'model' : features.ok ? 'device' : 'demo'

  const result = {
    id: 'DX' + Date.now().toString(36).toUpperCase() + (++seq),
    at: Date.now(),
    mode,
    provider,
    plant: plant
      ? { key: plant.key, name: plant.name, emoji: plant.emoji, family: plant.family, confidence: plantConfidence }
      : null,
    plantFromUser: !!opts.plantKey,
    plantNeedConfirm: !plant,
    healthy,
    disease: primary,
    alternatives,
    growth,
    severity,
    features,
    featureText: describeFeatures(features),
    headline: healthy
      ? '未发现明显病斑'
      : primary
        ? primary.name
        : '疑似长势问题',
    needExpert: !healthy && (severity.level >= 4 || (primary && primary.confidence < 60)),
    advice: buildAdvice(primary, growth[0], healthy),
    tip: primary ? primary.tip : growth[0] ? growth[0].tip : '叶片正面、背面各拍一张',
    filePath
  }

  return result
}

function buildAdvice(disease, grow, healthy) {
  if (healthy) {
    return [
      '叶面没有明显病斑，保持当前管理即可',
      grow ? '注意排查：' + grow.name.replace('疑似', '') + '（' + grow.symptoms[0] + '）' : '每周巡田一次，重点看下部老叶',
      '发现零星病叶先摘除带出田外，不要留在地里'
    ]
  }
  if (!disease) {
    return (grow ? grow.plan.agri.slice(0, 3) : ['补充一张更清晰的叶片照片']).slice(0, 3)
  }
  const acts = []
  acts.push(disease.plan.agri[0])
  if (disease.plan.bio && disease.plan.bio.length) acts.push('绿色防控：' + disease.plan.bio[0])
  if (disease.plan.chem && disease.plan.chem.length) acts.push('用药参考：' + disease.plan.chem[0])
  return acts
}

/** 结果 → 历史记录（只存展示需要的字段，避免本地存储爆掉） */
export function toRecord(r) {
  if (!r) return null
  return {
    id: r.id,
    at: r.at,
    mode: r.mode,
    provider: r.provider,
    plantKey: r.plant ? r.plant.key : '',
    plantName: r.plant ? r.plant.name : '未识别',
    plantEmoji: r.plant ? r.plant.emoji : '🌿',
    diseaseId: r.disease ? r.disease.id : '',
    diseaseName: r.healthy ? '未见明显病斑' : r.disease ? r.disease.name : '',
    confidence: r.disease ? r.disease.confidence : 0,
    severity: r.severity ? r.severity.text : '',
    severityLevel: r.severity ? r.severity.level : 0,
    filePath: r.filePath || ''
  }
}

/** 问诊时把诊断结果压成一段话，预填到提问框 */
export function resultToQuestion(r) {
  if (!r) return ''
  const lines = []
  if (r.plant) lines.push('作物：' + r.plant.name)
  if (r.healthy) lines.push('识图结果：未见明显病斑')
  else if (r.disease) lines.push('识图结果：' + r.disease.name + '（置信度 ' + r.disease.confidence + '%）')
  if (r.severity) lines.push('严重度：' + r.severity.text)
  if (r.featureText) lines.push('图像特征：' + r.featureText)
  lines.push('请帮我确认一下诊断，并给个用药方案。')
  return lines.join('\n')
}

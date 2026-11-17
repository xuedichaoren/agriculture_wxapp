/**
 * 数据访问层 · 农户侧「被认养」
 *
 * 买家看到的是「认养一块地」，农户看到的是完全相反的一面：
 * 这块地有几个名额、被谁认养了、还有谁在排队、这个月收了多少。
 *
 * 所以这里刻意不复用 adopt.js 的 ADOPT_PLOTS（那是平台视角的招募池），
 * 而是单独建一份「我的地块」，字段按卖方经营需要来定：
 *   名额（capacity）、已认养（由 ADOPT_INS 推出）、单价、招募状态。
 *
 * 后端就绪后：
 *   GET  /farm/plots                  → MY_PLOTS
 *   GET  /farm/plots/:id/adoptions    → ADOPT_INS
 *   POST /farm/applications/:id/accept|reject
 * 字段结构不变，页面不用改。
 *
 * 命名注意：本文件与 adopt.js 都在 api/index.js 里 export *，
 * 所以不能出现 statusText / plotOf... 这类会被认养模块撞名的导出。
 */
import { ADOPT_CROPS, ADOPT_PLANS, ADOPT_CYCLES } from '@/mock/index.js'

/**
 * 这里刻意不从 adopt.js 借这几个查询函数。
 * 因为 adopt.js 要反向引用本文件的 MY_PLOTS（让农户发布的地块能进认养大厅），
 * 两个文件互相 import 会形成环，const 数组在模块求值期可能是 undefined。
 * 依赖方向固定为：adopt.js → farm-side.js → mock，单向不成环。
 */
function findCrop(id) {
  return ADOPT_CROPS.find((c) => c.id === id) || null
}

function planOf(key) {
  return ADOPT_PLANS.find((p) => p.key === key) || ADOPT_PLANS[0]
}

function cycleOf(key) {
  return ADOPT_CYCLES.find((c) => c.key === key) || ADOPT_CYCLES[0]
}

/* ---------------- 我的地块 ---------------- */

/**
 * status
 *   recruiting 招募中（还有名额）
 *   full       已满员
 *   paused     已下架（暂停招募，已有认养继续履约）
 *   draft      草稿（还没发布）
 */
export const MY_PLOTS = [
  {
    id: 'mp1',
    code: 'A-03',
    name: '阳坡辣椒地',
    emoji: '🌶️',
    bg: ['#FFE2CF', '#FFB48A'],
    area: 20,
    rows: 4,
    crops: ['c1', 'c3'],
    price: 299,
    marketPrice: 399,
    capacity: 6,
    status: 'recruiting',
    soil: '黄壤土 · pH 6.4',
    sun: '南向坡地 · 日照 8h',
    water: '山泉水滴灌',
    altitude: 620,
    plantDate: '2026-09-20',
    harvestDate: '2026-12-20',
    yieldExpect: 1200,
    rating: 4.9,
    tags: ['武陵山区', '农家肥', '当日采摘'],
    highlight: '最好的一块向阳地，辣椒皮薄肉厚，炒腊肉最香',
    publishedAt: '2026-08-28'
  },
  {
    id: 'mp2',
    code: 'A-07',
    name: '平地叶菜块',
    emoji: '🥬',
    bg: ['#EAF9EF', '#CBEFD9'],
    area: 20,
    rows: 4,
    crops: ['c2', 'c4'],
    price: 279,
    marketPrice: 369,
    capacity: 4,
    status: 'full',
    soil: '黄壤土 · pH 6.2',
    sun: '东南向 · 日照 7h',
    water: '山泉水滴灌',
    altitude: 615,
    plantDate: '2026-10-02',
    harvestDate: '2026-12-02',
    yieldExpect: 900,
    rating: 4.9,
    tags: ['叶菜专块', '不打农药', '取水最近'],
    highlight: '地块平整、取水最近，新手第一次种也不容易种坏',
    publishedAt: '2026-09-10'
  },
  {
    id: 'mp3',
    code: 'B-01',
    name: '试验小垄',
    emoji: '🥗',
    bg: ['#F0FBF3', '#D6F0DF'],
    area: 10,
    rows: 2,
    crops: ['c2', 'c4', 'c6'],
    price: 179,
    marketPrice: 239,
    capacity: 3,
    status: 'recruiting',
    soil: '砂壤土 · pH 6.6',
    sun: '南向 · 日照 8h',
    water: '山泉水滴灌',
    altitude: 618,
    plantDate: '2026-10-18',
    harvestDate: '2027-01-18',
    yieldExpect: 420,
    rating: 4.8,
    tags: ['小份尝鲜', '半垄就够', '适合上班族'],
    highlight: '10㎡ 小地块，一周一箱菜刚好够两口之家',
    publishedAt: '2026-10-01'
  },
  {
    id: 'mp4',
    code: 'C-02',
    name: '高山黄桃树',
    emoji: '🍑',
    bg: ['#FFEFD6', '#FFCB7D'],
    area: 20,
    rows: 1,
    crops: ['c7'],
    price: 399,
    marketPrice: 499,
    capacity: 4,
    status: 'recruiting',
    soil: '高山黄壤 · pH 5.8',
    sun: '全天 · 昼夜温差 12℃',
    water: '山涧自流灌溉',
    altitude: 800,
    plantDate: '2026-08-01',
    harvestDate: '2027-02-01',
    yieldExpect: 420,
    rating: 4.9,
    tags: ['高山果园', '一树一主', '可挂牌'],
    highlight: '认养一整棵黄桃树，树上挂认养人的名字牌，熟了整树寄出',
    publishedAt: '2026-07-15'
  },
  {
    id: 'mp5',
    code: 'D-01',
    name: '江边橙园',
    emoji: '🍊',
    bg: ['#FFE9C4', '#FFC46B'],
    area: 15,
    rows: 1,
    crops: ['c8'],
    price: 359,
    marketPrice: 459,
    capacity: 4,
    status: 'paused',
    soil: '红壤 · pH 5.6',
    sun: '江边开阔 · 日照 9h',
    water: '便江提灌',
    altitude: 210,
    plantDate: '2026-06-01',
    harvestDate: '2026-12-01',
    yieldExpect: 320,
    rating: 4.9,
    tags: ['老树', '霜降采摘', '坏果包赔'],
    highlight: '18 年老树，糖度稳定在 14 以上',
    publishedAt: '2026-05-20'
  }
]

/* ---------------- 被认养订单 ---------------- */

/**
 * 别人认养我的地产生的单子。
 *
 * status
 *   active   在养
 *   ending   即将到期（7 天内）
 *   ended    已结束
 *   refund   已退养
 */
export const ADOPT_INS = [
  {
    id: 'IN20260920001', plotId: 'mp1', code: 'A-03',
    adopter: { name: '王雅', avatar: '👩', phone: '137****2143', city: '长沙 · 岳麓区' },
    crops: ['c1'], planKey: 'care', cycleKey: 'q1',
    startDate: '2026-09-20', endDate: '2026-12-20',
    amount: 379, status: 'active', freq: 1,
    deliveriesTotal: 12, deliveriesDone: 8,
    remark: '不要辣度太高的，家里有小孩',
    createdAt: '2026-09-18 14:22'
  },
  {
    id: 'IN20260815002', plotId: 'mp1', code: 'A-03',
    adopter: { name: '李梦', avatar: '🧑‍🍳', phone: '139****8890', city: '广州 · 天河区' },
    crops: ['c1', 'c3'], planKey: 'full', cycleKey: 'q1',
    startDate: '2026-08-15', endDate: '2026-11-15',
    amount: 537, status: 'ending', freq: 2,
    deliveriesTotal: 24, deliveriesDone: 22,
    remark: '每次多给两斤小番茄',
    createdAt: '2026-08-12 09:05'
  },
  {
    id: 'IN20261003003', plotId: 'mp1', code: 'A-03',
    adopter: { name: '赵一凡', avatar: '🧑', phone: '135****6612', city: '长沙 · 雨花区' },
    crops: ['c1'], planKey: 'self', cycleKey: 'q2',
    startDate: '2026-10-03', endDate: '2027-04-03',
    amount: 299, status: 'active', freq: 0,
    deliveriesTotal: 0, deliveriesDone: 0,
    remark: '周末自己来，帮忙留一套农具',
    createdAt: '2026-10-01 18:40'
  },
  {
    id: 'IN20261020004', plotId: 'mp1', code: 'A-03',
    adopter: { name: '周敏', avatar: '👩‍🌾', phone: '186****3320', city: '湘潭 · 岳塘区' },
    crops: ['c3'], planKey: 'care', cycleKey: 'q1',
    startDate: '2026-10-20', endDate: '2027-01-20',
    amount: 419, status: 'active', freq: 1,
    deliveriesTotal: 12, deliveriesDone: 3,
    remark: '',
    createdAt: '2026-10-18 11:12'
  },
  {
    id: 'IN20260912005', plotId: 'mp2', code: 'A-07',
    adopter: { name: '孙倩', avatar: '👩‍💼', phone: '138****7712', city: '长沙 · 开福区' },
    crops: ['c2'], planKey: 'care', cycleKey: 'q1',
    startDate: '2026-09-12', endDate: '2026-12-12',
    amount: 359, status: 'active', freq: 1,
    deliveriesTotal: 12, deliveriesDone: 9,
    remark: '只要嫩一点的',
    createdAt: '2026-09-10 16:30'
  },
  {
    id: 'IN20260928006', plotId: 'mp2', code: 'A-07',
    adopter: { name: '郑昊', avatar: '🧔', phone: '150****9987', city: '株洲 · 天元区' },
    crops: ['c2', 'c4'], planKey: 'full', cycleKey: 'q1',
    startDate: '2026-09-28', endDate: '2026-12-28',
    amount: 437, status: 'active', freq: 2,
    deliveriesTotal: 24, deliveriesDone: 14,
    remark: '',
    createdAt: '2026-09-26 10:02'
  },
  {
    id: 'IN20261005007', plotId: 'mp2', code: 'A-07',
    adopter: { name: '何雨', avatar: '👧', phone: '133****4456', city: '长沙 · 芙蓉区' },
    crops: ['c4'], planKey: 'care', cycleKey: 'q1',
    startDate: '2026-10-05', endDate: '2027-01-05',
    amount: 369, status: 'active', freq: 1,
    deliveriesTotal: 12, deliveriesDone: 4,
    remark: '喜欢紫叶生菜，做沙拉',
    createdAt: '2026-10-03 20:18'
  },
  {
    id: 'IN20261021008', plotId: 'mp2', code: 'A-07',
    adopter: { name: '吴桐', avatar: '🧑‍🎓', phone: '158****2201', city: '长沙 · 岳麓区' },
    crops: ['c2'], planKey: 'self', cycleKey: 'q1',
    startDate: '2026-10-21', endDate: '2027-01-21',
    amount: 279, status: 'active', freq: 0,
    deliveriesTotal: 0, deliveriesDone: 0,
    remark: '学校社团活动用，会带学生来',
    createdAt: '2026-10-19 08:44'
  },
  {
    id: 'IN20261026009', plotId: 'mp3', code: 'B-01',
    adopter: { name: '林岚', avatar: '👩‍🎨', phone: '131****6678', city: '长沙 · 天心区' },
    crops: ['c4', 'c6'], planKey: 'care', cycleKey: 'q1',
    startDate: '2026-10-26', endDate: '2027-01-26',
    amount: 264, status: 'active', freq: 1,
    deliveriesTotal: 12, deliveriesDone: 2,
    remark: '蒜苗多给点，家里爱吃',
    createdAt: '2026-10-24 15:20'
  },
  {
    id: 'IN20260801010', plotId: 'mp4', code: 'C-02',
    adopter: { name: '陈可', avatar: '👩‍🔬', phone: '189****1102', city: '武汉 · 洪山区' },
    crops: ['c7'], planKey: 'full', cycleKey: 'q3',
    startDate: '2026-08-01', endDate: '2027-02-01',
    amount: 819, status: 'active', freq: 2,
    deliveriesTotal: 48, deliveriesDone: 15,
    remark: '熟了整树寄，分三批发',
    createdAt: '2026-07-28 10:11'
  },
  {
    id: 'IN20260908011', plotId: 'mp4', code: 'C-02',
    adopter: { name: '马骁', avatar: '🧑‍💻', phone: '176****5533', city: '深圳 · 南山区' },
    crops: ['c7'], planKey: 'care', cycleKey: 'q3',
    startDate: '2026-09-08', endDate: '2027-03-08',
    amount: 739, status: 'active', freq: 1,
    deliveriesTotal: 24, deliveriesDone: 6,
    remark: '',
    createdAt: '2026-09-05 21:30'
  },
  {
    id: 'IN20260601012', plotId: 'mp5', code: 'D-01',
    adopter: { name: '黄蕾', avatar: '👩‍⚕️', phone: '159****8120', city: '长沙 · 望城区' },
    crops: ['c8'], planKey: 'care', cycleKey: 'q2',
    startDate: '2026-06-01', endDate: '2026-12-01',
    amount: 419, status: 'active', freq: 1,
    deliveriesTotal: 24, deliveriesDone: 20,
    remark: '霜降后再采',
    createdAt: '2026-05-28 09:00'
  },
  {
    id: 'IN20260720013', plotId: 'mp5', code: 'D-01',
    adopter: { name: '罗宇', avatar: '🧑‍🚀', phone: '187****4409', city: '长沙 · 岳麓区' },
    crops: ['c8'], planKey: 'full', cycleKey: 'q2',
    startDate: '2026-07-20', endDate: '2027-01-20',
    amount: 509, status: 'active', freq: 2,
    deliveriesTotal: 24, deliveriesDone: 12,
    remark: '',
    createdAt: '2026-07-18 13:26'
  },
  {
    id: 'IN20260420014', plotId: 'mp1', code: 'A-03',
    adopter: { name: '徐倩', avatar: '👩', phone: '135****1278', city: '长沙 · 岳麓区' },
    crops: ['c1'], planKey: 'care', cycleKey: 'q1',
    startDate: '2026-04-20', endDate: '2026-07-20',
    amount: 379, status: 'ended', freq: 1,
    deliveriesTotal: 12, deliveriesDone: 12,
    remark: '',
    createdAt: '2026-04-18 10:00'
  },
  {
    id: 'IN20260510015', plotId: 'mp5', code: 'D-01',
    adopter: { name: '邓超', avatar: '🧑‍🏫', phone: '188****6621', city: '衡阳 · 蒸湘区' },
    crops: ['c8'], planKey: 'self', cycleKey: 'q1',
    startDate: '2026-05-10', endDate: '2026-08-10',
    amount: 359, status: 'ended', freq: 0,
    deliveriesTotal: 0, deliveriesDone: 0,
    remark: '',
    createdAt: '2026-05-08 15:33'
  }
]

/* ---------------- 待确认的认养申请 ---------------- */

/**
 * 认养申请：买家在大厅点了「申请认养」，但地块在农户手上，需要农户确认才成单。
 *
 * 这一步不是多余的流程 —— 农户要按自己的排产决定接不接，
 * 尤其是果树类，一棵树只能挂一个人。
 */
export const IN_APPS = [
  {
    id: 'AP20261117001', plotId: 'mp1', code: 'A-03',
    adopter: { name: '孙倩', avatar: '👩‍💼', phone: '138****7712', city: '长沙 · 开福区' },
    crops: ['c1', 'c3'], planKey: 'care', cycleKey: 'q1',
    wantStart: '2026-11-20', months: 3, amount: 519,
    message: '想从下周一算起，能先看一下这块地现在的长势吗？',
    createdAt: '2026-11-17 10:12', status: 'pending'
  },
  {
    id: 'AP20261116002', plotId: 'mp3', code: 'B-01',
    adopter: { name: '吴桐', avatar: '🧑‍🎓', phone: '158****2201', city: '长沙 · 岳麓区' },
    crops: ['c2'], planKey: 'full', cycleKey: 'q2',
    wantStart: '2026-11-22', months: 6, amount: 417,
    message: '学校社团要带学生来体验，能不能安排一次现场教学？',
    createdAt: '2026-11-16 19:40', status: 'pending'
  },
  {
    id: 'AP20261116003', plotId: 'mp2', code: 'A-07',
    adopter: { name: '郑昊', avatar: '🧔', phone: '150****9987', city: '株洲 · 天元区' },
    crops: ['c2'], planKey: 'care', cycleKey: 'q1',
    wantStart: '2026-12-13', months: 3, amount: 359,
    message: '这块满了，我排下一季的队。',
    createdAt: '2026-11-16 08:20', status: 'pending'
  },
  {
    id: 'AP20261115004', plotId: 'mp4', code: 'C-02',
    adopter: { name: '何雨', avatar: '👧', phone: '133****4456', city: '长沙 · 芙蓉区' },
    crops: ['c7'], planKey: 'full', cycleKey: 'q3',
    wantStart: '2026-12-01', months: 6, amount: 819,
    message: '去年认过一次，树上想挂我女儿的名字。',
    createdAt: '2026-11-15 21:05', status: 'pending'
  }
]

/* ---------------- 今日托管任务 ---------------- */

export const FARM_TASKS = [
  {
    id: 'ft1', plotId: 'mp1', code: 'A-03', type: 'fert', emoji: '🧪',
    title: '给 A-03 追一次钾肥', desc: '辣椒进入转色期，每亩 8 斤硫酸钾，兑水冲施',
    adopters: ['王雅', '周敏'], date: '2026-11-17', done: false
  },
  {
    id: 'ft2', plotId: 'mp2', code: 'A-07', type: 'harvest', emoji: '🧺',
    title: '采收上海青 40 斤', desc: '明天配送日，孙倩 20 斤、郑昊 20 斤，早上露水干后采',
    adopters: ['孙倩', '郑昊'], date: '2026-11-17', done: false
  },
  {
    id: 'ft3', plotId: 'mp4', code: 'C-02', type: 'care', emoji: '🌳',
    title: '黄桃套袋收尾', desc: '还剩 60 个袋，套完这批可以拍长势发给陈可和马骁',
    adopters: ['陈可', '马骁'], date: '2026-11-17', done: false
  },
  {
    id: 'ft4', plotId: 'mp1', code: 'A-03', type: 'spray', emoji: '🧴',
    title: '雨前打一次保护性杀菌剂', desc: '代森锰锌 600 倍，避开中午高温，重点喷叶背',
    adopters: ['王雅', '李梦', '赵一凡', '周敏'], date: '2026-11-17', done: false
  },
  {
    id: 'ft5', plotId: 'mp3', code: 'B-01', type: 'care', emoji: '🌱',
    title: 'B-01 间苗', desc: '上海青出苗太密，间到 8cm 株距，间下来的苗可以送给林岚',
    adopters: ['林岚'], date: '2026-11-17', done: true
  }
]

/* ---------------- 长势推送 ---------------- */

/** 农户发给认养人的动态，其实和对外的农事记录同源，但这里只记「已推送」的 */
export const GROWTH_PUSHES = [
  {
    id: 'gp1', plotId: 'mp1', date: '2026-11-15', emoji: '🌶️',
    title: '辣椒开始转红，第一批可以摘了',
    text: '这周温差大，转色比去年早五天。下周给王雅和周敏各寄两斤，先尝个鲜。',
    reach: 4
  },
  {
    id: 'gp2', plotId: 'mp4', date: '2026-11-13', emoji: '🍑',
    title: '落叶后修剪完成',
    text: '两棵树都剪完了，留了三个主枝。开春发芽的时候再拍一次给大家看。',
    reach: 2
  },
  {
    id: 'gp3', plotId: 'mp2', date: '2026-11-11', emoji: '🥬',
    title: '上海青第二茬出苗整齐',
    text: '这次盖了防虫网，蚜虫少很多，叶片比上一茬干净。',
    reach: 4
  }
]

/* ---------------- 查询与计算 ---------------- */

/** 地块上的在养单（active + ending） */
export function insOfPlot(plotId) {
  return ADOPT_INS.filter((i) => i.plotId === plotId && (i.status === 'active' || i.status === 'ending'))
}

/** 全部在养单 */
export function activeIns() {
  return ADOPT_INS.filter((i) => i.status === 'active' || i.status === 'ending')
}

/** 已结束 / 已退养 */
export function endedIns() {
  return ADOPT_INS.filter((i) => i.status === 'ended' || i.status === 'refund')
}

/** 地块已认养份数 */
export function bookedOf(plot) {
  if (!plot) return 0
  return insOfPlot(plot.id).length
}

export function capacityOf(plot) {
  return plot ? Number(plot.capacity || 0) : 0
}

/** 剩余名额 */
export function seatsLeft(plot) {
  return Math.max(0, capacityOf(plot) - bookedOf(plot))
}

/** 招募进度 0~100 */
export function ratioOf(plot) {
  const cap = capacityOf(plot)
  if (!cap) return 0
  return Math.min(100, Math.round((bookedOf(plot) / cap) * 100))
}

/** 地块的认养人（按人聚合，一个人可能认了两块/两份） */
export function adoptersOf(plotId) {
  const seen = {}
  const out = []
  ADOPT_INS.filter((i) => i.plotId === plotId).forEach((i) => {
    const key = i.adopter.name
    if (seen[key]) {
      seen[key].count++
      seen[key].amount += i.amount
      return
    }
    const item = {
      name: i.adopter.name,
      avatar: i.adopter.avatar,
      phone: i.adopter.phone,
      city: i.adopter.city,
      count: 1,
      amount: i.amount,
      status: i.status
    }
    seen[key] = item
    out.push(item)
  })
  return out
}

/** 头像堆叠，最多取 n 个，剩余用 +N */
export function avatarStack(plotId, n = 4) {
  const list = adoptersOf(plotId)
  return {
    list: list.slice(0, n),
    more: Math.max(0, list.length - n),
    total: list.length
  }
}

export function plotOf(id) {
  return MY_PLOTS.find((p) => p.id === id) || null
}

export function plotCropsText(plot) {
  if (!plot) return ''
  return (plot.crops || [])
    .map((id) => findCrop(id)?.name)
    .filter(Boolean)
    .join(' + ')
}

export function plotCropsEmoji(plot) {
  if (!plot) return '🌱'
  const first = (plot.crops || []).map(findCrop).filter(Boolean)[0]
  return first ? first.emoji : plot.emoji
}

export const PLOT_STATUS = {
  recruiting: { text: '招募中', tone: 'brand' },
  full: { text: '已满员', tone: 'info' },
  paused: { text: '已下架', tone: 'gray' },
  draft: { text: '草稿', tone: 'gray' }
}

export function plotStatusText(s) {
  return (PLOT_STATUS[s] || PLOT_STATUS.draft).text
}

export function plotStatusTone(s) {
  return (PLOT_STATUS[s] || PLOT_STATUS.draft).tone
}

/** 我的地块列表，可按状态筛 */
export function myPlots(filter = {}) {
  const { status = 'all' } = filter
  const list = MY_PLOTS.filter((p) => (status === 'all' ? true : p.status === status))
  return list.map((p) => {
    const stack = avatarStack(p.id)
    return {
      ...p,
      booked: bookedOf(p),
      capacity: capacityOf(p),
      left: seatsLeft(p),
      ratio: ratioOf(p),
      statusText: plotStatusText(p.status),
      statusTone: plotStatusTone(p.status),
      cropsText: plotCropsText(p),
      adopters: stack.list,
      moreAdopters: stack.more,
      adopterTotal: stack.total,
      ins: insOfPlot(p.id),
      monthlyIncome: incomeOfPlot(p.id)
    }
  })
}

/* ---------------- 订单状态 ---------------- */

export const IN_STATUS = {
  active: { text: '在养', tone: 'brand' },
  ending: { text: '即将到期', tone: 'warn' },
  ended: { text: '已结束', tone: 'gray' },
  refund: { text: '已退养', tone: 'danger' }
}

export function inStatusText(s) {
  return (IN_STATUS[s] || IN_STATUS.active).text
}

export function inStatusTone(s) {
  return (IN_STATUS[s] || IN_STATUS.active).tone
}

export function inPlanName(key) {
  return planOf(key).name
}

export function inCycleName(key) {
  return cycleOf(key).name
}

export function inCropsText(item) {
  return (item.crops || [])
    .map((id) => findCrop(id)?.name)
    .filter(Boolean)
    .join(' + ')
}

export function inCropsEmoji(item) {
  const first = (item.crops || []).map(findCrop).filter(Boolean)[0]
  return item.adopter?.avatar || (first ? first.emoji : '🌱')
}

/* ---------------- 收入 ---------------- */

function parseDate(str) {
  const m = String(str || '').match(/(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

function monthsBetween(a, b) {
  const s = parseDate(a)
  const e = parseDate(b)
  if (!s || !e) return 1
  return Math.max(1, Math.round((e.getTime() - s.getTime()) / (30 * 86400000)))
}

/**
 * 某单在本月的分摊收入
 *
 * 认养是一季度/半年一次性收的钱，摊到月才看得懂经营情况。
 * 后端有账期后换成真实流水。
 */
function monthlyOf(item) {
  return Math.round(Number(item.amount || 0) / monthsBetween(item.startDate, item.endDate))
}

export function incomeOfPlot(plotId) {
  return activeIns()
    .filter((i) => i.plotId === plotId)
    .reduce((s, i) => s + monthlyOf(i), 0)
}

export function incomeOfMonth() {
  return activeIns().reduce((s, i) => s + monthlyOf(i), 0)
}

/** 累计认养总额（在养 + 已结束，不含退养） */
export function incomeTotal() {
  return ADOPT_INS.filter((i) => i.status !== 'refund').reduce((s, i) => s + Number(i.amount || 0), 0)
}

/* ---------------- 申请 ---------------- */

export function pendingApps() {
  return IN_APPS.filter((a) => a.status === 'pending')
}

export function appsOfPlot(plotId) {
  return IN_APPS.filter((a) => a.plotId === plotId)
}

/* ---------------- 任务与推送 ---------------- */

export function tasksOf(plotId) {
  return FARM_TASKS.filter((t) => t.plotId === plotId)
}

export function todayTasks() {
  return FARM_TASKS.slice()
}

export function pushesOf(plotId) {
  return GROWTH_PUSHES.filter((p) => p.plotId === plotId)
}

/* ---------------- 汇总 ---------------- */

/**
 * 工作台顶部四个数字 + 提醒
 * @returns {{plotCount,recruiting,full,booked,seats,adopters,pendingApps,pendingTasks,monthIncome,totalIncome,toShip}}
 */
export function farmOverview() {
  const live = MY_PLOTS
  const booked = live.reduce((s, p) => s + bookedOf(p), 0)
  const seats = live.reduce((s, p) => s + capacityOf(p), 0)
  const names = {}
  activeIns().forEach((i) => {
    names[i.adopter.name] = true
  })
  return {
    plotCount: live.length,
    recruiting: live.filter((p) => p.status === 'recruiting').length,
    full: live.filter((p) => p.status === 'full').length,
    paused: live.filter((p) => p.status === 'paused').length,
    booked,
    seats,
    seatLeft: Math.max(0, seats - booked),
    adopters: Object.keys(names).length,
    pendingApps: pendingApps().length,
    pendingTasks: FARM_TASKS.filter((t) => !t.done).length,
    monthIncome: incomeOfMonth(),
    totalIncome: incomeTotal()
  }
}

/** 下次配送日：按 freq 周次从开始日往后推，取第一个 >= 今天的 */
export function nextDeliveryOf(item) {
  if (!item || !item.freq) return ''
  const s = parseDate(item.startDate)
  const e = parseDate(item.endDate)
  if (!s || !e) return ''
  const step = Math.max(1, Math.round(7 / Number(item.freq)))
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  for (let d = new Date(s.getTime()); d.getTime() <= e.getTime(); d = new Date(d.getTime() + step * 86400000)) {
    if (d.getTime() >= today.getTime()) {
      const p = (n) => (n < 10 ? '0' + n : '' + n)
      return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
    }
  }
  return ''
}

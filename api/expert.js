/**
 * 专家问诊 · 数据层
 *
 * 演示版没有后台，专家是静态数据，问诊单存在本地 store/expert.js。
 * 接入后端时按下面的接口形状替换即可（字段名保持一致，页面不用改）：
 *   GET  /experts?crop=&keyword=&online=   专家列表
 *   GET  /experts/:id                      专家详情 + 评价
 *   POST /questions                        发起问诊（含图片）
 *   GET  /questions?role=asker|expert      问诊单列表
 *   POST /questions/:id/messages           追问 / 回答
 *   POST /questions/:id/rate               评价
 */

export const CROPS = ['辣椒', '番茄', '黄瓜', '茄子', '白菜', '水稻', '柑橘', '草莓', '玉米', '豆角']

export const EXPERTS = [
  {
    id: 'e1',
    name: '周立群',
    title: '高级农艺师',
    org: '湖南省农科院 植保所',
    emoji: '👨‍🌾',
    years: 23,
    crops: ['辣椒', '番茄', '茄子'],
    tags: ['病虫害诊断', '科学用药'],
    rating: 4.9,
    answered: 1268,
    replyMin: 15,
    online: true,
    price: 0,
    intro:
      '从事蔬菜病虫害防治 23 年，长期在湘西、湘南的辣椒主产区做田间诊断。擅长从叶片症状反推病原，尤其熟悉炭疽病、疫病与病毒病的区分，以及用药安全间隔期的把控。',
    cert: '植保员高级技师 · HN-ZB-2003-017',
    service: ['图文问诊（免费）', '用药方案复核', '连作障碍排查']
  },
  {
    id: 'e2',
    name: '唐晓梅',
    title: '研究员',
    org: '湖南农业大学 园艺学院',
    emoji: '👩‍🔬',
    years: 16,
    crops: ['柑橘', '草莓'],
    tags: ['果树管理', '缺素诊断'],
    rating: 4.8,
    answered: 892,
    replyMin: 25,
    online: true,
    price: 0,
    intro:
      '研究方向为柑橘品质与营养诊断，常年跑湘南脐橙、冰糖橙产区。擅长通过叶色与果实表现判断缺素，也做黄龙病的田间初筛与防控方案。',
    cert: '果树学博士 · 推广研究员',
    service: ['图文问诊（免费）', '缺素诊断', '果园周年管理']
  },
  {
    id: 'e3',
    name: '刘建国',
    title: '推广研究员',
    org: '长沙市农业技术推广中心',
    emoji: '🧑‍🌾',
    years: 28,
    crops: ['水稻', '玉米'],
    tags: ['稻瘟病', '田间管理'],
    rating: 4.9,
    answered: 1543,
    replyMin: 20,
    online: false,
    price: 0,
    intro:
      '水稻栽培与病虫害防治 28 年，参与过多次稻瘟病、稻飞虱的统防统治。擅长把防治关键期讲清楚，让农户少打药、打对药。',
    cert: '农业技术推广研究员 · 湘职改 2011-88',
    service: ['图文问诊（免费）', '防治关键期提醒', '统防统治方案']
  },
  {
    id: 'e4',
    name: '陈芳',
    title: '农艺师',
    org: '湘西州农业农村局',
    emoji: '👩‍🌾',
    years: 11,
    crops: ['白菜', '豆角', '黄瓜'],
    tags: ['叶菜管理', '土传病害'],
    rating: 4.7,
    answered: 536,
    replyMin: 12,
    online: true,
    price: 0,
    intro:
      '负责叶菜与豆类技术指导，熟悉软腐病、霜霉病、枯萎病的田间识别。擅长用轮作、嫁接、土壤消毒这类"不打药"的办法解决土传病害。',
    cert: '农艺师 · 湘西职 2019-042',
    service: ['图文问诊（免费）', '轮作方案', '土壤改良']
  },
  {
    id: 'e5',
    name: '黄志远',
    title: '高级农艺师',
    org: '湖南省植保植检站',
    emoji: '🧑‍🔬',
    years: 19,
    crops: ['水稻', '辣椒', '柑橘'],
    tags: ['检疫性病害', '绿色防控'],
    rating: 4.9,
    answered: 1102,
    replyMin: 30,
    online: false,
    price: 20,
    intro:
      '主要负责检疫性有害生物的监测与处置，参与过黄龙病、稻水象甲的防控。对"这病到底要不要拔"这类问题给的建议比较直接。',
    cert: '高级农艺师 · 植检 2007-233',
    service: ['图文问诊（¥20/次）', '检疫性病害判定', '绿色防控方案']
  },
  {
    id: 'e6',
    name: '罗小军',
    title: '助理研究员',
    org: '湖南省农科院 蔬菜所',
    emoji: '👨‍🎓',
    years: 7,
    crops: ['番茄', '黄瓜', '草莓'],
    tags: ['设施栽培', '生理病害'],
    rating: 4.6,
    answered: 318,
    replyMin: 18,
    online: true,
    price: 0,
    intro:
      '做大棚蔬菜栽培与生理病害研究，擅长区分"真病害"和"缺素 / 肥害 / 药害"这类看起来像病的问题，避免农户白打药。',
    cert: '蔬菜学硕士 · 研究实习员',
    service: ['图文问诊（免费）', '生理病害判定', '大棚环境调控']
  }
]

const REVIEW_POOL = [
  { user: '种辣椒的老李', crop: '辣椒', text: '按老师说的先把病果摘了再打药，三天就没再扩散，比我自己瞎打管用。', stars: 5 },
  { user: '湘西小陈', crop: '番茄', text: '照片发过去半小时就回了，说不是病是缺钾，让我喷磷酸二氢钾，果然缓过来了。', stars: 5 },
  { user: '橙园阿海', crop: '柑橘', text: '很耐心，帮我把缺锌和黄龙病区分开了，还提醒我防木虱。', stars: 5 },
  { user: '合作社张姐', crop: '白菜', text: '回复挺快，就是用药那部分讲得比较保守，不过安全第一也能理解。', stars: 4 },
  { user: '大棚小王', crop: '黄瓜', text: '直接告诉我棚里湿度太高，让我上午放风，比买药省钱。', stars: 5 },
  { user: '新农人阿彪', crop: '水稻', text: '破口期打药这个时间点以前一直搞错，这次讲明白了。', stars: 5 }
]

/** 专家评价：按 id 稳定生成，同一专家每次进来一致 */
export function reviewsOf(expertId) {
  const e = expertOf(expertId)
  if (!e) return []
  let seed = 0
  for (let i = 0; i < expertId.length; i++) seed += expertId.charCodeAt(i)
  const out = []
  for (let i = 0; i < 3; i++) {
    const r = REVIEW_POOL[(seed + i * 2) % REVIEW_POOL.length]
    out.push({
      id: expertId + '-r' + i,
      user: r.user,
      crop: e.crops.includes(r.crop) ? r.crop : e.crops[0],
      text: r.text,
      stars: r.stars,
      days: 2 + ((seed + i * 7) % 20)
    })
  }
  return out
}

export function expertOf(id) {
  return EXPERTS.find((e) => e.id === id) || null
}

/**
 * 专家筛选
 * @param {{keyword?:string, crop?:string, onlineOnly?:boolean}} q
 */
export function filterExperts(q = {}) {
  const kw = (q.keyword || '').trim()
  return EXPERTS.filter((e) => {
    if (q.crop && !e.crops.includes(q.crop)) return false
    if (q.onlineOnly && !e.online) return false
    if (kw) {
      const hay = [e.name, e.title, e.org, e.tags.join(''), e.crops.join('')].join(' ')
      if (hay.indexOf(kw) === -1) return false
    }
    return true
  })
}

export function onlineExperts() {
  return EXPERTS.filter((e) => e.online)
}

/** 常见问题，列表页底部用 */
export const FAQ = [
  {
    q: '问诊要收费吗？',
    a: '大部分专家图文问诊免费，标了价格的按次收费（演示版不产生真实支付）。公开提问免费，但会展示在农友圈。'
  },
  {
    q: '照片要怎么拍？',
    a: '病变叶片占画面 70%，顺光、不开美颜；正面背面各一张，能带上茎基部或果实更好。'
  },
  {
    q: '多久能收到回复？',
    a: '在线专家一般 15~30 分钟，非在线专家 24 小时内。急症建议直接找带「在线」标记的专家。'
  },
  {
    q: '专家给的用药方案能直接用吗？',
    a: '可以作为方向，但具体产品、浓度要以标签登记作物和安全间隔期为准；大面积用药前先小面积试喷。'
  }
]

/** 提问快捷模板 */
export const ASK_TEMPLATES = [
  { key: 'yellow', label: '叶片发黄', text: '叶片发黄，从下部老叶开始，叶脉还是绿的。' },
  { key: 'spot', label: '叶子长斑', text: '叶片上出现褐色斑点，有的带轮纹，边缘有黄圈。' },
  { key: 'wilt', label: '整株萎蔫', text: '白天萎蔫、早晚又恢复，反复几天了，挖出来根是褐色的。' },
  { key: 'fruit', label: '果实烂', text: '果实表面出现水渍状斑，慢慢软腐，上面长了一层霉。' },
  { key: 'bug', label: '叶背有虫', text: '叶子背面有很多小虫，叶片卷曲，还有黏黏的东西。' }
]

export const Q_STATUS = {
  pending: { text: '待回复', tone: 'warn' },
  answered: { text: '已回复', tone: 'brand' },
  closed: { text: '已关闭', tone: 'gray' }
}

/** 问诊单状态文案（注意与 api/adopt.js 的 statusText 区分，故加 q 前缀） */
export function qStatusText(s) {
  return (Q_STATUS[s] && Q_STATUS[s].text) || '待回复'
}

export function statusTone(s) {
  return (Q_STATUS[s] && Q_STATUS[s].tone) || 'warn'
}

/** 专家工作台的统计 */
export function expertStats(questions, expertId) {
  const mine = questions.filter((q) => !expertId || q.expertId === expertId)
  const pending = mine.filter((q) => q.status === 'pending').length
  const answered = mine.filter((q) => q.status === 'answered').length
  const rated = mine.filter((q) => q.rating > 0)
  const avg = rated.length ? rated.reduce((s, q) => s + q.rating, 0) / rated.length : 0
  return {
    pending,
    answered,
    total: mine.length,
    rating: avg ? Number(avg.toFixed(1)) : 0,
    ratedCount: rated.length
  }
}

/** 一条问诊的摘要文案 */
export function questionSummary(q) {
  if (!q) return ''
  const last = q.messages && q.messages.length ? q.messages[q.messages.length - 1] : null
  if (!last) return q.desc || ''
  return String(last.text || '').slice(0, 60)
}

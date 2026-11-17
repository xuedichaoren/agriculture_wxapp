/**
 * 问诊单（本地）
 *
 * 一个账号既能提问也能接诊：买家身份下看到「我的问诊」，专家身份下看到「待接诊」。
 * 数据结构刻意做成会话（messages），因为真实的问诊一定是来回追问的，
 * 只存一条「回答」字段，后面接后端就得推倒重来。
 *
 * storage key: nh_expert_v1
 */
import { reactive } from 'vue'
import { EXPERTS, expertOf } from '@/api/expert.js'

const KEY = 'nh_expert_v1'
const HOUR = 3600 * 1000

function load() {
  try {
    const raw = uni.getStorageSync(KEY)
    if (raw && Array.isArray(raw.questions)) return raw
  } catch (e) {}
  return null
}

function seedQuestions() {
  const now = Date.now()
  return [
    {
      id: 'Q20261115001',
      expertId: 'e1',
      expertName: '周立群',
      expertEmoji: '👨‍🌾',
      crop: '辣椒',
      title: '辣椒果实烂尖，上面有黑点',
      desc: '种了 3 亩线椒，最近下雨后发现果实尖端开始烂，斑上有黑色小点，有的连成片。',
      images: [],
      visibility: 'expert',
      status: 'answered',
      createdAt: now - 52 * HOUR,
      answeredAt: now - 50 * HOUR,
      rating: 5,
      rated: true,
      rateTags: ['判断准确', '回复快'],
      messages: [
        {
          id: 'm1',
          role: 'user',
          text: '种了 3 亩线椒，最近下雨后发现果实尖端开始烂，斑上有黑色小点，有的连成片。',
          images: [],
          at: now - 52 * HOUR
        },
        {
          id: 'm2',
          role: 'expert',
          text:
            '看描述是炭疽病，不是日灼。判断点：病斑下陷、有同心轮纹、上面密生黑色小点，潮湿时还会有粉红色黏液。\n\n先做三件事：\n1. 把病果全部摘掉装袋带出田外，不要丢在地里；\n2. 别再中午大水漫灌，改成小水勤浇，减少日灼和伤口；\n3. 雨停后抢喷一次咪鲜胺 25% 乳油 1000 倍，7 天后再补一次，采前 7 天停药。\n\n另外查一下蚜虫和螨，虫伤是炭疽病的重要入口。',
          images: [],
          at: now - 50 * HOUR
        }
      ]
    },
    {
      id: 'Q20261116002',
      expertId: 'e1',
      expertName: '周立群',
      expertEmoji: '👨‍🌾',
      crop: '番茄',
      title: '番茄下部叶片发黄，叶背有灰霉',
      desc: '大棚番茄，下部老叶正面有黄斑，翻过来叶背有一层灰褐色的霉，越来越往上蔓延。',
      images: [],
      visibility: 'expert',
      status: 'pending',
      createdAt: now - 5 * HOUR,
      answeredAt: 0,
      rating: 0,
      rated: false,
      rateTags: [],
      messages: [
        {
          id: 'm3',
          role: 'user',
          text: '大棚番茄，下部老叶正面有黄斑，翻过来叶背有一层灰褐色的霉，越来越往上蔓延。',
          images: [],
          at: now - 5 * HOUR
        }
      ]
    },
    {
      id: 'Q20261112003',
      expertId: 'e2',
      expertName: '唐晓梅',
      expertEmoji: '👩‍🔬',
      crop: '柑橘',
      title: '冰糖橙新叶发黄，叶脉还是绿的',
      desc: '新抽的梢叶片发黄，但叶脉是绿的，果子个头比往年小。',
      images: [],
      visibility: 'public',
      status: 'answered',
      createdAt: now - 120 * HOUR,
      answeredAt: now - 116 * HOUR,
      rating: 4,
      rated: true,
      rateTags: ['讲得清楚'],
      messages: [
        {
          id: 'm4',
          role: 'user',
          text: '新抽的梢叶片发黄，但叶脉是绿的，果子个头比往年小。',
          images: [],
          at: now - 120 * HOUR
        },
        {
          id: 'm5',
          role: 'expert',
          text:
            '脉间黄化、叶脉仍绿，是典型的缺素表现。新叶先黄多为缺铁/缺锌，老叶先黄多为缺镁。\n\n你这情况新叶为主，先在转绿期叶面喷 0.2% 硫酸亚铁 + 0.1% 柠檬酸（7 天一次，连喷 2 次），同时查一下土壤 pH，湘南红壤偏酸，铁的有效性一般没问题，要留意是否根系受涝。\n\n果子偏小还要看钾，转色前补一次硫酸钾。',
          images: [],
          at: now - 116 * HOUR
        }
      ]
    }
  ]
}

const saved = load()

export const expertStore = reactive({
  questions: saved ? saved.questions : seedQuestions(),
  /** 当前登录的专家身份对应哪个专家（演示版固定为周立群） */
  myExpertId: saved?.myExpertId || 'e1'
})

export function persistExpert() {
  try {
    uni.setStorageSync(KEY, JSON.parse(JSON.stringify(expertStore)))
  } catch (e) {}
}
if (!saved) persistExpert()

/* ---------------- 读 ---------------- */

export function allQuestions() {
  return expertStore.questions.slice().sort((a, b) => b.createdAt - a.createdAt)
}

export function questionOf(id) {
  return expertStore.questions.find((q) => q.id === id) || null
}

/** 我提的问（买家视角） */
export function myQuestions() {
  return allQuestions()
}

/** 待我接诊（专家视角） */
export function inboxQuestions() {
  return allQuestions().filter((q) => !q.expertId || q.expertId === expertStore.myExpertId)
}

export function pendingCount() {
  return inboxQuestions().filter((q) => q.status === 'pending').length
}

export function myExpert() {
  return expertOf(expertStore.myExpertId) || EXPERTS[0]
}

/* ---------------- 写 ---------------- */

let seq = 0

export function addQuestion(payload) {
  const id = 'Q' + Date.now().toString().slice(-10) + (++seq)
  const at = Date.now()
  const q = {
    id,
    expertId: payload.expertId || '',
    expertName: payload.expertName || (payload.expertId ? (expertOf(payload.expertId) || {}).name : '公开提问'),
    expertEmoji: payload.expertId ? (expertOf(payload.expertId) || {}).emoji : '💬',
    crop: payload.crop || '',
    title: payload.title || '未命名问诊',
    desc: payload.desc || '',
    images: payload.images ? payload.images.slice(0, 3) : [],
    visibility: payload.visibility || 'expert',
    status: 'pending',
    createdAt: at,
    answeredAt: 0,
    rating: 0,
    rated: false,
    rateTags: [],
    messages: [
      {
        id: 'm' + at,
        role: 'user',
        text: payload.desc || payload.title || '',
        images: payload.images ? payload.images.slice(0, 3) : [],
        at
      }
    ]
  }
  expertStore.questions.unshift(q)
  persistExpert()
  return q
}

export function addMessage(id, msg) {
  const q = questionOf(id)
  if (!q) return null
  const at = Date.now()
  const item = {
    id: 'm' + at + Math.floor(Math.random() * 1000),
    role: msg.role || 'user',
    text: msg.text || '',
    images: msg.images || [],
    at
  }
  q.messages.push(item)
  if (item.role === 'expert') {
    q.status = 'answered'
    q.answeredAt = at
  }
  persistExpert()
  return item
}

export function rateQuestion(id, stars, tags, text) {
  const q = questionOf(id)
  if (!q) return false
  q.rating = Math.max(1, Math.min(5, stars || 5))
  q.rated = true
  q.rateTags = tags || []
  if (text) q.rateText = text
  persistExpert()
  return true
}

export function closeQuestion(id) {
  const q = questionOf(id)
  if (!q) return false
  q.status = 'closed'
  persistExpert()
  return true
}

export function setMyExpert(expertId) {
  expertStore.myExpertId = expertId || 'e1'
  persistExpert()
}

/** 演示：清空问诊回到初始三条 */
export function resetQuestions() {
  expertStore.questions = seedQuestions()
  persistExpert()
}

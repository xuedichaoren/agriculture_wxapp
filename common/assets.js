/**
 * 插图槽清单（Image Slots）
 *
 * 目的：把「哪里要放图、放多大的图、放什么内容的图」写死成一张表，
 * 设计/你自己出图后，按 `file` 字段把文件丢进 `static/images/` 即可生效，
 * 不需要改任何页面代码。
 *
 * 用法：
 *   <ui-image slot="home.banner.farm" />
 *   <ui-image slot="role.farmer" h="160" round />
 *
 * 未放图时组件自动渲染「渐变 + 表情 + 提示」，不会出现裂图或空白块。
 * 放图后若比例不对，组件按 mode="aspectFill" 裁切，不会拉变形。
 *
 * 字段说明：
 *   file   目标文件（相对 static/images/）
 *   w/h    建议像素尺寸（750 设计稿宽度下）
 *   ratio  建议宽高比，组件默认按它占位，避免图片到位后页面跳动
 *   tip    这张图该画什么（给设计看）
 *   emoji  占位时显示的表情
 *   bg     占位时的渐变底色
 */
export const IMAGES = {
  /* ---------- 首页 ---------- */
  'home.banner.farm': {
    file: 'home/banner-farm.jpg',
    w: 750,
    h: 400,
    ratio: 15 / 8,
    tip: '首页轮播主图：清晨梯田 / 采摘特写，右下角留白给文案',
    emoji: '🌄',
    bg: ['#DFF6E8', '#B7EBCE']
  },
  'home.banner.season': {
    file: 'home/banner-season.jpg',
    w: 750,
    h: 400,
    ratio: 15 / 8,
    tip: '首页轮播第二张：当季时令合集（辣椒 / 冰糖橙 / 菌菇）',
    emoji: '🧺',
    bg: ['#FFF1DC', '#FFD9A8']
  },
  'home.entry.scan': {
    file: 'home/entry-scan.png',
    w: 96,
    h: 96,
    ratio: 1,
    tip: '「拍照识病」入口图标：叶片 + 扫描框',
    emoji: '🔍',
    bg: ['#EAF9F1', '#CFF3E0']
  },
  'home.entry.expert': {
    file: 'home/entry-expert.png',
    w: 96,
    h: 96,
    ratio: 1,
    tip: '「专家问诊」入口图标：戴草帽的农艺师头像',
    emoji: '👨‍🌾',
    bg: ['#EAF3FF', '#D3E5FF']
  },

  /* ---------- 认养 / 农场 ---------- */
  'farm.hero': {
    file: 'farm/hero.jpg',
    w: 750,
    h: 360,
    ratio: 25 / 12,
    tip: '认养大厅头图：一块块菜地的俯拍，或农场主在垄间',
    emoji: '🌱',
    bg: ['#E4F7EC', '#BFEDD3']
  },
  'farm.plot': {
    file: 'farm/plot.jpg',
    w: 400,
    h: 300,
    ratio: 4 / 3,
    tip: '地块默认图：20㎡ 小菜地全景（番茄/辣椒挂果）',
    emoji: '🍅',
    bg: ['#F0FBE9', '#DAF2C9']
  },
  'farm.workbench': {
    file: 'farm/workbench.png',
    w: 750,
    h: 320,
    ratio: 75 / 32,
    tip: '农户工作台顶部：田间日出 / 农机作业',
    emoji: '🚜',
    bg: ['#FDF0DE', '#F5D5A8']
  },

  /* ---------- 专家问诊 ---------- */
  'expert.hero': {
    file: 'expert/hero.jpg',
    w: 750,
    h: 360,
    ratio: 25 / 12,
    tip: '问诊页头图：农艺师蹲在田里看叶片（有信任感）',
    emoji: '🧑‍🔬',
    bg: ['#E8F3FF', '#C9E2FF']
  },
  'expert.avatar': {
    file: 'expert/avatar-default.jpg',
    w: 200,
    h: 200,
    ratio: 1,
    tip: '专家默认头像（没有真实头像时兜底）',
    emoji: '👨‍🌾',
    bg: ['#EAF9F1', '#CFF3E0']
  },

  /* ---------- 识图 ---------- */
  'scan.guide': {
    file: 'scan/guide.jpg',
    w: 600,
    h: 600,
    ratio: 1,
    tip: '拍照指引示意图：一片叶子占画面 70%，病斑在中间',
    emoji: '🍃',
    bg: ['#EDF9F2', '#CFEFDD']
  },
  'scan.empty': {
    file: 'scan/empty.png',
    w: 480,
    h: 480,
    ratio: 1,
    tip: '识别记录空状态插图：相机 + 叶子',
    emoji: '📷',
    bg: ['#F0F5FF', '#D9E6FF']
  },

  /* ---------- 身份 ---------- */
  'role.buyer': {
    file: 'role/buyer.png',
    w: 240,
    h: 240,
    ratio: 1,
    tip: '买家身份卡插图：拎着菜篮子的城市用户',
    emoji: '🛒',
    bg: ['#E9FAF2', '#C9EFDB']
  },
  'role.farmer': {
    file: 'role/farmer.png',
    w: 240,
    h: 240,
    ratio: 1,
    tip: '农户身份卡插图：草帽 + 锄头，田埂背景',
    emoji: '🌾',
    bg: ['#FFF3E2', '#FFDDB4']
  },
  'role.expert': {
    file: 'role/expert.png',
    w: 240,
    h: 240,
    ratio: 1,
    tip: '专家身份卡插图：白大褂 + 放大镜看叶片',
    emoji: '🔬',
    bg: ['#EAF3FF', '#D3E5FF']
  },

  /* ---------- 其他 ---------- */
  'profile.header': {
    file: 'profile/header.jpg',
    w: 750,
    h: 400,
    ratio: 15 / 8,
    tip: '个人中心顶部背景：远山 + 稻田的浅色插画（压暗后叠白字）',
    emoji: '⛰️',
    bg: ['#14D183', '#089A60']
  },
  'community.banner': {
    file: 'community/banner.jpg',
    w: 750,
    h: 280,
    ratio: 75 / 28,
    tip: '农友圈顶部：一群农户在田头交流',
    emoji: '💬',
    bg: ['#EAF7FF', '#CDE9FF']
  }
}

/** 取单个槽位，缺失时给一个安全默认值 */
export function imgOf(slot) {
  return (
    IMAGES[slot] || {
      file: '',
      w: 750,
      h: 400,
      ratio: 15 / 8,
      tip: '未登记的插图槽',
      emoji: '🖼️',
      bg: ['#EEF3F0', '#DCE7E1']
    }
  )
}

/** 槽位对应的运行时路径（小程序 image 用绝对路径） */
export function srcOf(slot) {
  const it = IMAGES[slot]
  return it && it.file ? '/static/images/' + it.file : ''
}

/** 全部槽位列表，供「UI 与插图」页展示 */
export function allSlots() {
  return Object.keys(IMAGES).map((key) => ({ key, ...IMAGES[key], src: srcOf(key) }))
}

/** 按分组归类，key 的第一段即分组 */
export function groupedSlots() {
  const map = {}
  for (const it of allSlots()) {
    const g = it.key.split('.')[0]
    if (!map[g]) map[g] = []
    map[g].push(it)
  }
  return map
}

export const GROUP_NAME = {
  home: '首页',
  farm: '认养与农场',
  expert: '专家问诊',
  scan: '拍照识图',
  role: '身份',
  profile: '个人中心',
  community: '农友圈'
}

/**
 * 三种身份
 *
 * 这个小程序同时服务三类人，用同一个账号切换身份，不需要注册三个 App：
 *   buyer  买家     —— 逛产地、下单、认养一块地
 *   farmer 农户卖家 —— 种地、卖货、带货、管认养
 *   expert 农业专家 —— 接诊、答疑、出方案
 *
 * 每个身份 = 一套底部导航 + 一个首页 + 一组专属功能。
 * 导航全部是自绘 tab-bar，所以换身份就是换这份 tabs 配置，不涉及原生 tabBar。
 */

export const ROLES = {
  buyer: {
    key: 'buyer',
    name: '买家',
    sub: '买好菜 · 认养一块地',
    emoji: '🛒',
    img: 'role.buyer',
    color: '#0FC97A',
    soft: '#E9FAF2',
    home: '/pages/tabbar/home/home',
    desc: '逛产地直采、下单买菜、认养一块地，随时看长势',
    tagline: '我想买点放心的菜',
    tabs: [
      { key: 'home', name: '首页', icon: 'home', path: '/pages/tabbar/home/home' },
      { key: 'cate', name: '分类', icon: 'grid', path: '/pages/tabbar/category/category' },
      { key: 'cart', name: '菜篮子', icon: 'cart', path: '/pages/tabbar/cart/cart' },
      { key: 'community', name: '农友圈', icon: 'chat', path: '/pages/tabbar/community/community' },
      { key: 'mine', name: '我的', icon: 'user', path: '/pages/tabbar/profile/profile' }
    ],
    features: ['产地直采', '认养菜地', '云监工', '专家问诊']
  },

  farmer: {
    key: 'farmer',
    name: '农户',
    sub: '种地 · 卖货',
    emoji: '🌾',
    img: 'role.farmer',
    color: '#E08A2B',
    soft: '#FFF3E2',
    home: '/pages/farm/workbench',
    desc: '把地块放出来给人认养、管认养人和托管进度，顺便上架卖货',
    tagline: '我有地，想把菜卖出去',
    tabs: [
      { key: 'work', name: '工作台', icon: 'sprout', path: '/pages/farm/workbench' },
      { key: 'plots', name: '我的地', icon: 'leaf', path: '/pages/farm/plots' },
      { key: 'sell', name: '卖货', icon: 'shop', path: '/pages/farm/sell' },
      { key: 'community', name: '农友圈', icon: 'chat', path: '/pages/tabbar/community/community' },
      { key: 'mine', name: '我的', icon: 'user', path: '/pages/tabbar/profile/profile' }
    ],
    features: ['地块被认养', '认养人管理', '商品上架', '订单处理']
  },

  expert: {
    key: 'expert',
    name: '农业专家',
    sub: '问诊 · 出方案',
    emoji: '🔬',
    img: 'role.expert',
    color: '#4A8CFF',
    soft: '#EAF3FF',
    home: '/pages/expert/workbench',
    desc: '接农户的问诊单，看照片判病害，给用药和防治方案',
    tagline: '我懂技术，想帮农户看问题',
    tabs: [
      { key: 'work', name: '接诊台', icon: 'sprout', path: '/pages/expert/workbench' },
      { key: 'qa', name: '问诊单', icon: 'comment', path: '/pages/expert/qa' },
      { key: 'scan', name: '识图', icon: 'camera', path: '/pages/scan/scan' },
      { key: 'community', name: '农友圈', icon: 'chat', path: '/pages/tabbar/community/community' },
      { key: 'mine', name: '我的', icon: 'user', path: '/pages/tabbar/profile/profile' }
    ],
    features: ['接诊答疑', '识图复核', '方案库', '收入结算']
  }
}

export const ROLE_LIST = [ROLES.buyer, ROLES.farmer, ROLES.expert]

export function roleOf(key) {
  return ROLES[key] || null
}

/** 申请身份需要填的字段，页面按这份配置渲染表单，新增字段不用改页面 */
export const APPLY_FORMS = {
  farmer: {
    title: '申请成为农户',
    tip: '审核通过后可上架农产品、管理地块与订单。资料只用于核验，不对外展示。',
    fields: [
      { key: 'name', label: '真实姓名', type: 'text', required: true, ph: '请填写身份证姓名' },
      { key: 'phone', label: '联系电话', type: 'number', required: true, ph: '用于审核联系' },
      { key: 'farmName', label: '农场 / 合作社名称', type: 'text', required: true, ph: '如：湘西老周家庭农场' },
      { key: 'region', label: '所在地区', type: 'text', required: true, ph: '如：湖南省 湘西州 花垣县' },
      { key: 'crops', label: '主要作物', type: 'text', required: true, ph: '如：辣椒、番茄、冰糖橙' },
      { key: 'area', label: '种植面积（亩）', type: 'digit', required: false, ph: '如：12' },
      { key: 'cert', label: '资质说明', type: 'textarea', required: false, ph: '有无绿色食品认证、合作社资质等' }
    ]
  },
  expert: {
    title: '申请成为农业专家',
    tip: '需具备农技推广、植保、园艺等相关背景。审核通过后可接诊。',
    fields: [
      { key: 'name', label: '真实姓名', type: 'text', required: true, ph: '请填写真实姓名' },
      { key: 'phone', label: '联系电话', type: 'number', required: true, ph: '用于审核联系' },
      { key: 'title', label: '职称 / 头衔', type: 'text', required: true, ph: '如：高级农艺师' },
      { key: 'org', label: '所在单位', type: 'text', required: true, ph: '如：湖南省农科院 植保所' },
      { key: 'crops', label: '擅长作物', type: 'text', required: true, ph: '如：辣椒、番茄、柑橘' },
      { key: 'years', label: '从业年限', type: 'digit', required: true, ph: '如：8' },
      { key: 'certNo', label: '资质证书编号', type: 'text', required: false, ph: '如：HN-ZB-2019-0321' }
    ]
  }
}

export const APP_STATUS = {
  none: { text: '未申请', tone: 'gray' },
  pending: { text: '审核中', tone: 'warn' },
  approved: { text: '已通过', tone: 'brand' },
  rejected: { text: '未通过', tone: 'danger' }
}

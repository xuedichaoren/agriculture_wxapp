/**
 * 湘农汇 · 演示数据（Mock）
 *
 * 这是「未来后端接口的本地替身」：字段名与 docs/02-数据字典.md 中
 * shop_* / farm_* 表一一对应。后端就绪后只需替换 src/api/catalog.js 的实现，
 * 页面与数据形状都不用改。
 *
 * 字段约定：
 *   id          主键
 *   xxxId       关联外键（categoryId / farmId / productId）
 *   xxxCount    数量（salesCount / stockCount / followerCount / productCount）
 *   isXxx       布尔（isChecked / isDefault / isDone / isUsed）
 *   summary     一句话卖点；detailText 详情正文
 *   coverUrl    商品图；缺省时回落 emoji + bg 渐变占位
 */


export const CATEGORIES = [
  { id: 'veg', name: '时令蔬菜', emoji: '🥬', bg: ['#E7F8EE', '#D3F1E1'] },
  { id: 'fruit', name: '应季水果', emoji: '🍊', bg: ['#FFF0E6', '#FFE0CE'] },
  { id: 'tea', name: '湘茶茶叶', emoji: '🍵', bg: ['#E9F5EC', '#D8EBDD'] },
  { id: 'cured', name: '腊味山货', emoji: '🥓', bg: ['#FDEFE9', '#FBE0D4'] },
  { id: 'pickle', name: '坛子剁椒', emoji: '🌶️', bg: ['#FFEDEA', '#FFD2CB'] },
  { id: 'grain', name: '粮油米面', emoji: '🌾', bg: ['#FBF4E3', '#F5E7C8'] },
  { id: 'mushroom', name: '菌菇干货', emoji: '🍄', bg: ['#F5EDE5', '#EBDCCB'] },
  { id: 'help', name: '助农专区', emoji: '❤️', bg: ['#FFEFF2', '#FFD9E1'] }
]

export const FARMS = [
  {
    id: 'f1',
    name: '张婶的辣椒地',
    avatar: '🧑‍🌾',
    bg: ['#FFE2CF', '#FFB48A'],
    city: '湖南 · 湘西龙山',
    summary: '武陵山区坡地种植，山泉水灌溉。张婶种了 26 年辣椒，只施农家肥，辣椒晒足 7 个太阳。',
    tags: ['武陵山区', '农家肥', '当日采摘'],
    followerCount: 19000,
    productCount: 12,
    rating: 4.9,
    farmYears: 26
  },
  {
    id: 'f2',
    name: '永兴橙园老李',
    avatar: '👨‍🌾',
    bg: ['#FFE9C4', '#FFC46B'],
    city: '湖南 · 郴州永兴',
    summary: '便江两岸的冰糖橙老园，树龄 18 年。霜降后采摘，糖度稳定在 14 以上，坏果包赔。',
    tags: ['冰糖橙之乡', '坏果包赔', '霜降采摘'],
    followerCount: 32000,
    productCount: 6,
    rating: 4.9,
    farmYears: 18
  },
  {
    id: 'f3',
    name: '安化黑茶社',
    avatar: '🍵',
    bg: ['#DDE9DA', '#A9C7A4'],
    city: '湖南 · 益阳安化',
    summary: '资江边的老茶号，坚持七星灶烘焙、千两茶手工踩制。每一饼都有溯源码，可查山头与年份。',
    tags: ['七星灶', '手工踩制', '可溯源'],
    followerCount: 26000,
    productCount: 9,
    rating: 4.8,
    farmYears: 15
  },
  {
    id: 'f4',
    name: '湘西腊味坊',
    avatar: '👩‍🍳',
    bg: ['#F6DCD2', '#D9A08C'],
    city: '湖南 · 湘西凤凰',
    summary: '苗家吊脚楼下的老灶房，柴火慢熏 40 天。只用本地黑猪后腿，无亚硝酸盐。',
    tags: ['柴火慢熏', '本地黑猪', '无添加'],
    followerCount: 21000,
    productCount: 7,
    rating: 4.9,
    farmYears: 22
  },
  {
    id: 'f5',
    name: '炎陵黄桃合作社',
    avatar: '🧑‍🌾',
    bg: ['#FFEFD6', '#FFCB7D'],
    city: '湖南 · 株洲炎陵',
    summary: '海拔 800 米高山黄桃，昼夜温差 12℃。合作社 43 户果农，统一分级、统一发货。',
    tags: ['高山果园', '合作社直发', '一件代发'],
    followerCount: 45000,
    productCount: 11,
    rating: 4.8,
    farmYears: 9
  }
]

export const PRODUCTS = [
  {
    id: 'p1', coverUrl: '/static/products/p1.jpg', name: '湘研早熟辣椒', spec: '500g／份', price: 5.8, originalPrice: 6.9,
    emoji: '🌶️', bg: ['#FFEDEA', '#FFD2CB'], categoryId: 'veg', farmId: 'f1',
    unit: '份', salesCount: 2831, stockCount: 120, tags: ['当日采摘', '不打农药'],
    summary: '武陵山坡地种的早熟辣椒，皮薄肉厚，炒腊肉最下饭，微辣带香。',
    detailText: '产地：湘西龙山 · 海拔 600 米坡地\n采摘时间：下单当日清晨\n保质期：冷藏 7 天\n规格：500g／份（约 18～22 个）'
  },
  {
    id: 'p2', coverUrl: '/static/products/p2.jpg', name: '汉寿螺丝椒', spec: '500g／份', price: 6.9, originalPrice: 8.8,
    emoji: '🌶️', bg: ['#FFEFE4', '#FFD8BC'], categoryId: 'veg', farmId: 'f1',
    unit: '份', salesCount: 1642, stockCount: 88, tags: ['香辣', '洞庭湖区'],
    summary: '洞庭湖区的螺丝椒，皱皮微卷，辣度适中，做农家小炒肉是本地人的首选。',
    detailText: '产地：常德汉寿\n采摘时间：下单当日\n保质期：冷藏 7 天\n规格：500g／份'
  },
  {
    id: 'p3', coverUrl: '/static/products/p3.jpg', name: '醴陵红菜苔', spec: '400g／把', price: 7.8, originalPrice: 9.8,
    emoji: '🥬', bg: ['#EAF7EE', '#CFEAD8'], categoryId: 'veg', farmId: 'f1',
    unit: '把', salesCount: 1204, stockCount: 60, tags: ['霜打更甜', '湖南名菜'],
    summary: '经霜后的红菜苔紫红发亮，掐断脆响。清炒或配腊肉，是湖南冬天的味道。',
    detailText: '产地：株洲醴陵\n采摘时间：下单当日清晨\n保质期：冷藏 5 天\n规格：400g／把'
  },
  {
    id: 'p4', coverUrl: '/static/products/p4.jpg', name: '江永香芋', spec: '1kg／份', price: 12.8, originalPrice: 15.8,
    emoji: '🍠', bg: ['#F4EDF7', '#DCCBE7'], categoryId: 'veg', farmId: 'f5',
    unit: '份', salesCount: 986, stockCount: 45, tags: ['粉糯', '地理标志'],
    summary: '江永香芋切开有紫色槟榔纹，蒸熟粉糯回甘，做扣肉或糖水都合适。',
    detailText: '产地：永州江永\n采挖时间：下单前 3 天\n保质期：阴凉通风 15 天\n规格：1kg／份（2～3 个）'
  },
  {
    id: 'p5', coverUrl: '/static/products/p5.jpg', name: '湘西藠头', spec: '500g／份', price: 8.9, originalPrice: 11.0,
    emoji: '🧄', bg: ['#F3F7EC', '#DCE9CF'], categoryId: 'veg', farmId: 'f1',
    unit: '份', salesCount: 733, stockCount: 52, tags: ['脆爽', '可腌制'],
    summary: '湘西人餐桌上的老味道，鲜食微辛回甜，腌成酸甜藠头更下饭。',
    detailText: '产地：湘西龙山\n采摘时间：下单当日\n保质期：冷藏 10 天\n规格：500g／份'
  },
  {
    id: 'p6', coverUrl: '/static/products/p6.jpg', name: '冬苋菜', spec: '400g／把', price: 4.9, originalPrice: 6.5,
    emoji: '🥬', bg: ['#EAF9F1', '#D2EDDF'], categoryId: 'veg', farmId: 'f1',
    unit: '把', salesCount: 612, stockCount: 70, tags: ['滑嫩', '当季'],
    summary: '湖南冬天必吃的冬苋菜，煮汤滑嫩带一点黏，配一勺猪油最香。',
    detailText: '产地：长沙宁乡\n采摘时间：下单当日清晨\n保质期：冷藏 3 天\n规格：400g／把'
  },
  {
    id: 'p7', coverUrl: '/static/products/p7.jpg', name: '永兴冰糖橙', spec: '2.5kg／箱', price: 24.9, originalPrice: 32.9,
    emoji: '🍊', bg: ['#FFF1E0', '#FFD3A6'], categoryId: 'fruit', farmId: 'f2',
    unit: '箱', salesCount: 5210, stockCount: 200, tags: ['糖度 14+', '坏果包赔'],
    summary: '霜降后采摘的老树冰糖橙，皮薄易剥，果肉化渣，甜得很干净。',
    detailText: '产地：郴州永兴 · 便江两岸\n采摘时间：霜降后 15 天内\n保质期：阴凉处 20 天\n规格：2.5kg／箱（约 14～18 个）'
  },
  {
    id: 'p8', coverUrl: '/static/products/p8.jpg', name: '炎陵高山黄桃', spec: '3kg／箱', price: 59.0, originalPrice: 78.0,
    emoji: '🍑', bg: ['#FFF0E6', '#FFDCC2'], categoryId: 'fruit', farmId: 'f5',
    unit: '箱', salesCount: 3180, stockCount: 80, tags: ['海拔 800 米', '脆甜'],
    summary: '罗霄山脉高山黄桃，昼夜温差大，果肉紧实，脆的时候甜，软了更香。',
    detailText: '产地：株洲炎陵 · 海拔 800 米\n采摘时间：成熟度 8 成采摘\n保质期：冷藏 7 天\n规格：3kg／箱（12 个装）'
  },
  {
    id: 'p9', coverUrl: '/static/products/p9.jpg', name: '靖州杨梅', spec: '1.5kg／筐', price: 45.0, originalPrice: 58.0,
    emoji: '🍒', bg: ['#FFE9EC', '#FFC3CC'], categoryId: 'fruit', farmId: 'f2',
    unit: '筐', salesCount: 890, stockCount: 30, tags: ['荸荠种', '冷链直发'],
    summary: '靖州杨梅荸荠种，果大核小、汁水足。凌晨采摘预冷后冷链发出，到手仍新鲜。',
    detailText: '产地：怀化靖州\n采摘时间：下单当日凌晨\n保质期：冷藏 3 天\n规格：1.5kg／筐'
  },
  {
    id: 'p10', coverUrl: '/static/products/p10.jpg', name: '石门柑橘', spec: '5kg／箱', price: 29.9, originalPrice: 39.9,
    emoji: '🍊', bg: ['#FFF3E2', '#FFD9AE'], categoryId: 'fruit', farmId: 'f2',
    unit: '箱', salesCount: 2760, stockCount: 150, tags: ['酸甜适中', '产地直发'],
    summary: '壶瓶山下的柑橘，酸甜平衡，皮薄多汁，办公室常备果。',
    detailText: '产地：常德石门\n采摘时间：11 月上旬\n保质期：阴凉处 15 天\n规格：5kg／箱'
  },
  {
    id: 'p11', coverUrl: '/static/products/p11.jpg', name: '江永香柚', spec: '2 个装', price: 19.9, originalPrice: 26.0,
    emoji: '🍐', bg: ['#F6F7DC', '#E0E3AE'], categoryId: 'fruit', farmId: 'f5',
    unit: '份', salesCount: 1120, stockCount: 90, tags: ['清香', '耐存放'],
    summary: '江永香柚果肉淡黄，入口清甜带一点柚香，放半个月反而更好吃。',
    detailText: '产地：永州江永\n采摘时间：11 月中下旬\n保质期：阴凉处 45 天\n规格：2 个装（约 2kg）'
  },
  {
    id: 'p12', coverUrl: '/static/products/p12.jpg', name: '麻阳猕猴桃', spec: '2kg／箱', price: 26.8, originalPrice: 35.0,
    emoji: '🥝', bg: ['#EFF7E4', '#D3E9BE'], categoryId: 'fruit', farmId: 'f2',
    unit: '箱', salesCount: 1543, stockCount: 60, tags: ['红心', '自然熟'],
    summary: '麻阳红心猕猴桃，果心红亮，甜度高。收到后放 2～3 天软了再吃最佳。',
    detailText: '产地：怀化麻阳\n采摘时间：糖度 7 以上采收\n保质期：冷藏 15 天\n规格：2kg／箱（约 20 个）'
  },
  {
    id: 'p13', coverUrl: '/static/products/p13.jpg', name: '安化黑茶·千两饼', spec: '360g／饼', price: 128.0, originalPrice: 168.0,
    emoji: '🍵', bg: ['#EDF1E8', '#CFD8C4'], categoryId: 'tea', farmId: 'f3',
    unit: '饼', salesCount: 640, stockCount: 40, tags: ['七星灶', '可溯源'],
    summary: '资江边老茶号手工踩制的千两茶饼，汤色橙红明亮，菌花香明显，越陈越醇。',
    detailText: '产地：益阳安化\n工艺：七星灶烘焙 · 手工踩制\n保质期：干燥通风可长期存放\n规格：360g／饼'
  },
  {
    id: 'p14', coverUrl: '/static/products/p14.jpg', name: '古丈毛尖', spec: '100g／罐', price: 88.0, originalPrice: 108.0,
    emoji: '🍃', bg: ['#EAF6EC', '#CBE8D2'], categoryId: 'tea', farmId: 'f3',
    unit: '罐', salesCount: 970, stockCount: 55, tags: ['明前', '手工炒制'],
    summary: '古丈毛尖明前嫩芽，条索紧细显毫，栗香高扬，三泡仍有余味。',
    detailText: '产地：湘西古丈\n采摘：明前单芽\n保质期：冷藏 18 个月\n规格：100g／罐'
  },
  {
    id: 'p15', coverUrl: '/static/products/p15.jpg', name: '保靖黄金茶', spec: '100g／罐', price: 96.0, originalPrice: 118.0,
    emoji: '🍵', bg: ['#F0F6E8', '#D6E7BF'], categoryId: 'tea', farmId: 'f3',
    unit: '罐', salesCount: 512, stockCount: 38, tags: ['氨基酸高', '黄金芽'],
    summary: '保靖黄金茶氨基酸含量高，几乎没有苦涩感，汤色嫩黄清亮，回甘快。',
    detailText: '产地：湘西保靖\n采摘：春季一芽一叶\n保质期：冷藏 18 个月\n规格：100g／罐'
  },
  {
    id: 'p16', coverUrl: '/static/products/p16.jpg', name: '湘西柴火腊肉', spec: '500g／份', price: 42.0, originalPrice: 52.0,
    emoji: '🥓', bg: ['#FBEDE7', '#EFD0C2'], categoryId: 'cured', farmId: 'f4',
    unit: '份', salesCount: 1980, stockCount: 70, tags: ['柴火慢熏', '本地黑猪'],
    summary: '苗家灶房柴火慢熏 40 天，肥瘦相间，切薄片蒸或炒辣椒都是硬菜。',
    detailText: '产地：湘西凤凰\n工艺：柏枝柴火熏制 40 天\n保质期：冷藏 6 个月\n规格：500g／份'
  },
  {
    id: 'p17', coverUrl: '/static/products/p17.jpg', name: '苗家手工腊肠', spec: '400g／份', price: 38.0, originalPrice: 46.0,
    emoji: '🌭', bg: ['#FBEAE4', '#F2CDBF'], categoryId: 'cured', farmId: 'f4',
    unit: '份', salesCount: 1360, stockCount: 55, tags: ['手工灌制', '无亚硝酸盐'],
    summary: '本地黑猪后腿手工灌制，只用盐、花椒和米酒，蒸熟切片油亮弹牙。',
    detailText: '产地：湘西凤凰\n工艺：手工灌制 · 柴火熏 20 天\n保质期：冷藏 3 个月\n规格：400g／份'
  },
  {
    id: 'p18', coverUrl: '/static/products/p18.jpg', name: '攸县香干', spec: '500g／份', price: 15.8, originalPrice: 19.8,
    emoji: '🧈', bg: ['#FAF3E6', '#EBD9BC'], categoryId: 'cured', farmId: 'f4',
    unit: '份', salesCount: 2210, stockCount: 85, tags: ['手工石磨', '地理标志'],
    summary: '攸县香干手工石磨点浆，豆香浓，切丝炒辣椒炒肉都很入味。',
    detailText: '产地：株洲攸县\n工艺：石磨点浆 · 手工压制\n保质期：冷藏 15 天\n规格：500g／份'
  },
  {
    id: 'p19', coverUrl: '/static/products/p19.jpg', name: '坛香剁辣椒', spec: '450g／罐', price: 16.8, originalPrice: 21.8,
    emoji: '🌶️', bg: ['#FFEDE8', '#FFC9BE'], categoryId: 'pickle', farmId: 'f1',
    unit: '罐', salesCount: 3420, stockCount: 160, tags: ['老坛发酵', '蒸菜神器'],
    summary: '老坛发酵的剁辣椒，咸鲜带酸，蒸鱼头、蒸腊肉放两勺就够味。',
    detailText: '产地：湘西龙山\n工艺：老坛发酵 30 天\n保质期：开盖冷藏 6 个月\n规格：450g／罐'
  },
  {
    id: 'p20', coverUrl: '/static/products/p20.jpg', name: '常德香米', spec: '5kg／袋', price: 39.9, originalPrice: 49.9,
    emoji: '🌾', bg: ['#FBF6E9', '#EDDFBB'], categoryId: 'grain', farmId: 'f5',
    unit: '袋', salesCount: 1830, stockCount: 120, tags: ['当季新米', '软糯'],
    summary: '洞庭湖区当季新米，米粒细长，煮饭软糯带甜，冷了也不硬。',
    detailText: '产地：常德鼎城\n加工：当季稻谷现碾\n保质期：常温 12 个月\n规格：5kg／袋'
  }
]

export const BANNERS = [
  { id: 'b1', title: '湘西现摘 · 当日发出', subtitle: '从武陵山到餐桌只要 24 小时', emoji: '🌶️', bg: ['#22C98A', '#0AA868'], linkUrl: '' },
  { id: 'b2', title: '永兴冰糖橙尝鲜季', subtitle: '霜降后采摘，糖度 14 以上', emoji: '🍊', bg: ['#FFB65C', '#F58A3C'], linkUrl: '' },
  { id: 'b3', title: '助农专场 · 坏果包赔', subtitle: '炎陵黄桃 3kg 只要 59', emoji: '🍑', bg: ['#FF8A6A', '#F2543F'], linkUrl: '' }
]

export const QUICK_ENTRIES = [
  { id: 'q1', name: '今日特价', emoji: '🏷️', bg: ['#E9FBF1', '#CFF4E1'] },
  { id: 'q2', name: '产地直采', emoji: '🚚', bg: ['#FFF4E4', '#FFE2BC'] },
  { id: 'q3', name: '农事日历', emoji: '🗓️', bg: ['#EAF3FF', '#D3E5FF'], path: '/pages/farm/calendar' },
  { id: 'q4', name: '认养菜地', emoji: '🌱', bg: ['#F0FBE9', '#DAF2C9'], path: '/pages/farm/adopt' }
]

export const DEFAULT_ADDRESSES = [
  {
    id: 'a1', name: '陈晓', phone: '138****6620', region: '湖南省 长沙市 岳麓区',
    detailAddress: '麓山南路 932 号 湖南大学 天马公寓 3 栋 502', tag: '学校', isDefault: true
  },
  {
    id: 'a2', name: '陈晓', phone: '138****6620', region: '湖南省 长沙市 芙蓉区',
    detailAddress: '五一大道 389 号 湘域中央 2 栋 1804', tag: '家', isDefault: false
  }
]

export const DEFAULT_CART = [
  { productId: 'p1', qty: 2, isChecked: true },
  { productId: 'p7', qty: 1, isChecked: true },
  { productId: 'p13', qty: 1, isChecked: false }
]

export const DEFAULT_ORDERS = [
  {
    id: 'XNH20261111001', status: 'unpaid', createdAt: '2026-11-11 09:24',
    items: [{ productId: 'p7', qty: 1 }, { productId: 'p19', qty: 1 }],
    addressId: 'a1', freight: 0, discount: 5, remark: '',
    payAt: '', express: null
  },
  {
    id: 'XNH20261109008', status: 'shipping', createdAt: '2026-11-09 18:02',
    items: [{ productId: 'p13', qty: 1 }, { productId: 'p16', qty: 1 }],
    addressId: 'a2', freight: 0, discount: 0, remark: '麻烦放门口',
    payAt: '2026-11-09 18:05', express: { company: '顺丰冷链', trackingNo: 'SF7234981220', nodeIndex: 2 }
  },
  {
    id: 'XNH20261102013', status: 'unreceipted', createdAt: '2026-11-02 11:40',
    items: [{ productId: 'p20', qty: 1 }],
    addressId: 'a1', freight: 0, discount: 10, remark: '',
    payAt: '2026-11-02 11:42', express: { company: '邮政快递', trackingNo: 'YZ0091823761', nodeIndex: 3 }
  },
  {
    id: 'XNH20261028021', status: 'done', createdAt: '2026-10-28 20:11',
    items: [{ productId: 'p17', qty: 1 }, { productId: 'p18', qty: 1 }],
    addressId: 'a1', freight: 0, discount: 0, remark: '',
    payAt: '2026-10-28 20:13', express: { company: '中通快递', trackingNo: 'ZT88120934', nodeIndex: 4 }, isReviewed: false
  }
]

export const EXPRESS_NODES = [
  { timeText: '11-10 09:12', text: '包裹已到达【长沙岳麓集散中心】' },
  { timeText: '11-09 21:30', text: '包裹已从【郴州转运中心】发出' },
  { timeText: '11-09 18:40', text: '顺丰速运已揽收，冷链运输中' },
  { timeText: '11-09 18:05', text: '商家已发货，正在打包' }
]

export const MESSAGES = [
  { id: 'm1', type: 'farm', name: '张婶的辣椒地', avatar: '🧑‍🌾', previewText: '今天的辣椒刚摘好，放心下单～', timeText: '09:24', unreadCount: 2 },
  { id: 'm2', type: 'system', name: '订单通知', avatar: '📦', previewText: '您的订单 XNH20261109008 已发货', timeText: '昨天', unreadCount: 1 },
  { id: 'm3', type: 'farm', name: '永兴橙园老李', avatar: '👨‍🌾', previewText: '冰糖橙还剩最后 30 箱啦', timeText: '昨天', unreadCount: 0 },
  { id: 'm4', type: 'system', name: '活动通知', avatar: '🎁', previewText: '助农专场：满 59 减 10，仅限今天', timeText: '11-09', unreadCount: 0 },
  { id: 'm5', type: 'notice', name: '农友圈', avatar: '💬', previewText: '阿杏 评论了你的动态：看着就新鲜', timeText: '11-08', unreadCount: 0 }
]

export const CHAT_SEED = [
  { id: 's1', sender: 'farm', text: '您好，今天的辣椒是凌晨刚摘的，很嫩～', timeText: '09:20' },
  { id: 's2', sender: 'me', text: '能今天下午送到长沙岳麓区吗？', timeText: '09:22' },
  { id: 's3', sender: 'farm', text: '可以的，下午 3 点前下单，晚上 7 点前送到。', timeText: '09:23' },
  { id: 's4', sender: 'farm', text: '给您留了两把带露水的，放心～', timeText: '09:24' }
]

export const COUPONS = [
  { id: 'cp1', discountAmount: 10, minAmount: 59, name: '助农专享券', scopeText: '全场通用', expireAt: '2026-11-30', isUsed: false },
  { id: 'cp2', discountAmount: 5, minAmount: 29, name: '新客立减券', scopeText: '时令蔬菜', expireAt: '2026-11-20', isUsed: false },
  { id: 'cp3', discountAmount: 20, minAmount: 129, name: '满减券', scopeText: '全场通用', expireAt: '2026-12-31', isUsed: false },
  { id: 'cp4', discountAmount: 8, minAmount: 39, name: '果园直供券', scopeText: '应季水果', expireAt: '2026-10-01', isUsed: true }
]

/* 农事日历：以 2026 年 11 月为例 */
export const FARM_TASKS = {
  '2026-11-11': [
    { id: 't1', title: '辣椒采收', farmName: '张婶的辣椒地', type: 'harvest', isDone: false, timeText: '05:00' },
    { id: 't2', title: '大棚通风降湿', farmName: '张婶的辣椒地', type: 'care', isDone: true, timeText: '08:30' }
  ],
  '2026-11-13': [{ id: 't3', title: '红菜苔追肥', farmName: '张婶的辣椒地', type: 'fertilize', isDone: false, timeText: '07:00' }],
  '2026-11-15': [{ id: 't4', title: '冰糖橙分级装箱', farmName: '永兴橙园老李', type: 'harvest', isDone: false, timeText: '09:00' }],
  '2026-11-18': [{ id: 't5', title: '茶园冬肥', farmName: '安化黑茶社', type: 'fertilize', isDone: false, timeText: '06:30' }],
  '2026-11-22': [{ id: 't6', title: '腊肉翻挂', farmName: '湘西腊味坊', type: 'care', isDone: false, timeText: '10:00' }]
}

export const GROW_RECORDS = [
  { day: 46, date: '11-11', title: '第 46 天 · 采收', summary: '辣椒挂果饱满，单株约 28 个，今日采收 120 份。', emoji: '🌶️' },
  { day: 38, date: '11-03', title: '第 38 天 · 追肥', summary: '施农家腐熟肥一次，山泉水浇透。', emoji: '🌱' },
  { day: 25, date: '10-21', title: '第 25 天 · 培土', summary: '坡地培土保墒，株距保持 35cm。', emoji: '🌿' },
  { day: 12, date: '10-08', title: '第 12 天 · 出苗', summary: '出苗率约 94%，棚内温度 24℃。', emoji: '🌾' }
]

export function findProduct(productId) {
  return PRODUCTS.find((p) => p.id === productId)
}

export function findFarm(farmId) {
  return FARMS.find((f) => f.id === farmId)
}

export function findCategory(categoryId) {
  return CATEGORIES.find((c) => c.id === categoryId)
}

/* ================= 认养一块地 ================= */

/**
 * 作物库
 *   days      从播种到可采收天数
 *   yieldText 一季预计收成
 *   extra     种苗附加费（元）
 */
export const ADOPT_CROPS = [
  { id: 'c1', name: '樟树港辣椒', emoji: '🌶️', season: '秋冬', days: 45, yieldText: '约 12 斤', extra: 0, bg: ['#FFEDEA', '#FFD2CB'] },
  { id: 'c2', name: '上海青', emoji: '🥬', season: '四季', days: 30, yieldText: '约 8 斤', extra: 0, bg: ['#EAF7EE', '#CFEAD8'] },
  { id: 'c3', name: '樱桃番茄', emoji: '🍅', season: '秋冬', days: 60, yieldText: '约 15 斤', extra: 20, bg: ['#FFECEC', '#FFC9C4'] },
  { id: 'c4', name: '紫叶生菜', emoji: '🥗', season: '四季', days: 35, yieldText: '约 7 斤', extra: 10, bg: ['#F0EDFB', '#D9D0F5'] },
  { id: 'c5', name: '秋冬白萝卜', emoji: '🥕', season: '冬季', days: 70, yieldText: '约 20 斤', extra: 0, bg: ['#EFF6FF', '#D5E6FB'] },
  { id: 'c6', name: '香蒜苗', emoji: '🧄', season: '冬季', days: 50, yieldText: '约 6 斤', extra: 5, bg: ['#F7F4EA', '#E8E0C8'] },
  { id: 'c7', name: '炎陵黄桃树', emoji: '🍑', season: '果树', days: 180, yieldText: '约 60 斤', extra: 120, bg: ['#FFEFD6', '#FFCB7D'] },
  { id: 'c8', name: '永兴冰糖橙树', emoji: '🍊', season: '果树', days: 210, yieldText: '约 80 斤', extra: 150, bg: ['#FFE9C4', '#FFC46B'] }
]

/** 认养方式（服务套餐），fee 为一次性服务费 */
export const ADOPT_PLANS = [
  {
    key: 'self', name: '自耕体验', fee: 0, emoji: '🧑‍🌾',
    desc: '自己来种，农场出工具和老师傅',
    points: ['提供全套农具与种苗', '老师傅现场指导', '收成全归你，自采自提']
  },
  {
    key: 'care', name: '代耕代管', fee: 80, emoji: '🌿',
    desc: '农场替你种，随时视频看长势',
    points: ['播种、浇水、施肥全包', '每周一条长势视频', '收成可自提或代寄']
  },
  {
    key: 'full', name: '全程托管 + 配送到家', fee: 158, emoji: '🚚', hot: true,
    desc: '种、管、收、每周送上门',
    points: ['从播种到采收全程托管', '每周 1～2 次冷链配送', '坏果包赔，可随时退养']
  }
]

/** 认养周期，factor 为价格系数 */
export const ADOPT_CYCLES = [
  { key: 'q1', name: '1 季', months: 3, factor: 1, tip: '先试试' },
  { key: 'q2', name: '2 季', months: 6, factor: 1.85, tip: '省 15%' },
  { key: 'y1', name: '1 年', months: 12, factor: 3.4, tip: '含换季轮作' }
]

/** 可认养地块 */
export const ADOPT_PLOTS = [
  {
    id: 'ap1', code: 'A-03', farmId: 'f1',
    emoji: '🌶️', bg: ['#FFE2CF', '#FFB48A'],
    area: 20, rows: 4, price: 299, marketPrice: 399,
    leftCount: 3, adoptedCount: 128, rating: 4.9,
    soil: '黄壤土 · pH 6.4', sun: '南向坡地 · 日照 8h', water: '山泉水滴灌', altitude: 620,
    crops: ['c1', 'c2', 'c3', 'c4'],
    tags: ['武陵山区', '农家肥', '当日采摘'],
    highlight: '张婶家最好的一块向阳地，辣椒皮薄肉厚，炒腊肉最香'
  },
  {
    id: 'ap2', code: 'A-07', farmId: 'f1',
    emoji: '🥬', bg: ['#EAF9EF', '#CBEFD9'],
    area: 20, rows: 4, price: 299, marketPrice: 399,
    leftCount: 0, adoptedCount: 156, rating: 4.9,
    soil: '黄壤土 · pH 6.2', sun: '东南向 · 日照 7h', water: '山泉水滴灌', altitude: 615,
    crops: ['c1', 'c2', 'c4'],
    tags: ['武陵山区', '叶菜专块', '不打农药'],
    highlight: '地块平整、取水最近，新手第一次种也不容易种坏'
  },
  {
    id: 'ap3', code: 'B-01', farmId: 'f1',
    emoji: '🥗', bg: ['#F0FBF3', '#D6F0DF'],
    area: 10, rows: 2, price: 179, marketPrice: 239,
    leftCount: 7, adoptedCount: 92, rating: 4.8,
    soil: '砂壤土 · pH 6.6', sun: '南向 · 日照 8h', water: '山泉水滴灌', altitude: 618,
    crops: ['c2', 'c4', 'c6'],
    tags: ['小份尝鲜', '半垄就够', '适合上班族'],
    highlight: '10㎡ 小地块，一周一箱菜刚好够两口之家'
  },
  {
    id: 'ap4', code: 'B-05', farmId: 'f1',
    emoji: '🍅', bg: ['#FFECEC', '#FFC9C4'],
    area: 40, rows: 8, price: 549, marketPrice: 699,
    leftCount: 2, adoptedCount: 64, rating: 4.9,
    soil: '黄壤土 · pH 6.3', sun: '南向坡地 · 日照 9h', water: '山泉水滴灌 + 蓄水池', altitude: 630,
    crops: ['c1', 'c2', 'c3', 'c5'],
    tags: ['大面积', '可搭棚', '适合家庭'],
    highlight: '40㎡ 两块垄，够一家四口吃一季，还能送亲戚'
  },
  {
    id: 'ap5', code: 'C-02', farmId: 'f5',
    emoji: '🍑', bg: ['#FFEFD6', '#FFCB7D'],
    area: 20, rows: 1, price: 399, marketPrice: 499,
    leftCount: 5, adoptedCount: 210, rating: 4.9,
    soil: '高山黄壤 · pH 5.8', sun: '全天 · 昼夜温差 12℃', water: '山涧自流灌溉', altitude: 800,
    crops: ['c7'],
    tags: ['高山果园', '一树一主', '可挂牌'],
    highlight: '认养一整棵黄桃树，树上挂你的名字牌，熟了整树寄给你'
  },
  {
    id: 'ap6', code: 'C-08', farmId: 'f5',
    emoji: '🍑', bg: ['#FFF2DC', '#FFD79B'],
    area: 20, rows: 1, price: 399, marketPrice: 499,
    leftCount: 1, adoptedCount: 188, rating: 4.8,
    soil: '高山黄壤 · pH 5.9', sun: '全天 · 昼夜温差 12℃', water: '山涧自流灌溉', altitude: 810,
    crops: ['c7'],
    tags: ['高山果园', '12 年老树', '糖度高'],
    highlight: '12 年老树，果个偏大，去年糖度 15.2'
  },
  {
    id: 'ap7', code: 'D-01', farmId: 'f2',
    emoji: '🍊', bg: ['#FFE9C4', '#FFC46B'],
    area: 15, rows: 1, price: 359, marketPrice: 459,
    leftCount: 4, adoptedCount: 143, rating: 4.9,
    soil: '红壤 · pH 5.6', sun: '江边开阔 · 日照 9h', water: '便江提灌', altitude: 210,
    crops: ['c8'],
    tags: ['冰糖橙之乡', '18 年老树', '霜降后采'],
    highlight: '便江边的老橙树，霜降后采摘，糖度稳定 14 以上'
  },
  {
    id: 'ap8', code: 'D-04', farmId: 'f2',
    emoji: '🍊', bg: ['#FFEFD2', '#FFD08A'],
    area: 15, rows: 1, price: 359, marketPrice: 459,
    leftCount: 0, adoptedCount: 167, rating: 4.9,
    soil: '红壤 · pH 5.5', sun: '江边开阔 · 日照 9h', water: '便江提灌', altitude: 205,
    crops: ['c8'],
    tags: ['冰糖橙之乡', '坏果包赔', '可代寄'],
    highlight: '离分拣仓最近，采下来当天就能发货'
  }
]

/** 农事日志（按地块编号索引） */
export const ADOPT_LOGS = {
  'A-03': [
    { day: 57, date: '11-16', title: '第 57 天 · 二茬采收', summary: '辣椒第二茬挂果，单株 21 个，今日为你采摘 4.2 斤，明早冷链发出。', emoji: '🌶️' },
    { day: 50, date: '11-09', title: '第 50 天 · 培土固根', summary: '坡地培土保墒，株距保持 35cm，顺手拔了一遍杂草。', emoji: '🌿' },
    { day: 38, date: '10-28', title: '第 38 天 · 追农家肥', summary: '腐熟羊粪一次，山泉水浇透，棚内温度 22℃。', emoji: '💧' },
    { day: 25, date: '10-15', title: '第 25 天 · 病虫害巡查', summary: '挂了 6 张黄板，未发现蚜虫，暂不用药。', emoji: '🐛' },
    { day: 12, date: '10-02', title: '第 12 天 · 出苗', summary: '出苗率约 94%，间苗一次，留壮去弱。', emoji: '🌱' }
  ],
  'B-01': [
    { day: 22, date: '11-14', title: '第 22 天 · 生菜定植', summary: '紫叶生菜定植 40 株，浇了定根水。', emoji: '🥗' },
    { day: 9, date: '11-01', title: '第 9 天 · 间苗', summary: '苗太密，间掉三分之一，留出长叶的空间。', emoji: '🌱' }
  ],
  'C-02': [
    { day: 168, date: '11-12', title: '第 168 天 · 摘果后修剪', summary: '黄桃摘完，剪掉徒长枝，为明年挂果储能。', emoji: '🌾' },
    { day: 120, date: '09-25', title: '第 120 天 · 套袋', summary: '每颗果套上双层袋，防虫防鸟。', emoji: '🍑' }
  ],
  'D-01': [
    { day: 96, date: '09-04', title: '第 96 天 · 采收完成', summary: '全树采 82 斤，已按你留的地址寄出。', emoji: '🍊' },
    { day: 60, date: '07-30', title: '第 60 天 · 疏果', summary: '疏掉小果病果，保证留下的果子个头均匀。', emoji: '🌿' }
  ]
}

/** 没有专属日志的地块用这份 */
export const ADOPT_LOGS_DEFAULT = [
  { day: 30, date: '11-10', title: '第 30 天 · 日常管护', summary: '浇水、除草、巡查一遍，长势正常。', emoji: '🌿' },
  { day: 15, date: '10-26', title: '第 15 天 · 追肥', summary: '施了一次腐熟农家肥，浇透水。', emoji: '💧' },
  { day: 6, date: '10-17', title: '第 6 天 · 出苗', summary: '出苗整齐，间苗一次。', emoji: '🌱' }
]

/** 我的认养单（首次进入时的演示数据） */
export const DEFAULT_ADOPTIONS = [
  {
    id: 'AD20260920001', plotId: 'ap1', code: 'A-03', farmId: 'f1',
    crops: ['c1', 'c3'], planKey: 'full', cycleKey: 'q1',
    startDate: '2026-09-20', endDate: '2026-12-20',
    total: 477, status: 'growing', freq: 2,
    nextDelivery: '2026-11-18',
    deliveriesTotal: 12, deliveriesDone: 8,
    owner: '陈晓', phone: '138****6620', addressId: 'a1',
    remark: '', createdAt: '2026-09-20 10:12'
  },
  {
    id: 'AD20260601002', plotId: 'ap7', code: 'D-01', farmId: 'f2',
    crops: ['c8'], planKey: 'care', cycleKey: 'q1',
    startDate: '2026-06-01', endDate: '2026-09-01',
    total: 589, status: 'ended', freq: 0,
    nextDelivery: '',
    deliveriesTotal: 0, deliveriesDone: 0,
    owner: '陈晓', phone: '138****6620', addressId: 'a1',
    remark: '', createdAt: '2026-06-01 09:30'
  }
]

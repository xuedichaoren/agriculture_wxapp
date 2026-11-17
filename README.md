# 农汇（湘农汇）· 产地直采生鲜 App

基于 **uni-app（Vue 3 + Vite 5 + Sass）** 实现的生鲜农产品电商 App，共 **54 个页面**，覆盖商城、认养、识图诊断、专家问诊与三种身份，可直接用 HBuilderX 打包为 Android / iOS 原生 App。

> **工程规范（前后端分工必读）**：[`docs/`](./docs/README.md)
> 命名规范 · 数据字典 · 接口契约 · 分工协作，四份文档与代码/数据库保持同步。

---

## 一、核心指标

| 项目 | 数值 |
| --- | --- |
| 页面数量 | 54 |
| 第三方 UI 库 | 0（自建 11 个 `ui-*` 基础组件 + 7 个业务组件） |
| 插图槽 | 16 处（`common/assets.js` 声明，其中 6 处已挂载页面，其余待接入） |
| 位图资源 | 0（图标为内联 SVG，商品图为 CSS 渐变 + 系统 Emoji） |
| H5 构建产物 | 815 KB（89 个文件） |
| 预估 APK 体积 | **9～13 MB**（远低于 100 MB 限制） |

体积能做到这么小，靠三个决定：

1. **不引 UI 库**：uni-ui / uview 动辄 2～4 MB，本项目用自写组件替代。
2. **不引图标字体**：`icon-svg.vue` 用 SVG path 直接画，按颜色/线宽动态渲染，零额外文件。
3. **不引商品图**：`prod-img.vue` 用「双渐变 + 光斑 + Emoji」合成商品缩略图。换成真实图片时只改这一个组件，业务代码不动。

---

## 二、运行

**方式 A：HBuilderX（推荐）** —— 打开项目根目录 → `运行 → 运行到小程序模拟器`，产物在 `unpackage/dist/dev/mp-weixin`，微信开发者工具导入该目录即可。

**方式 B：命令行**（本机 `node_modules` 是指向 HBuilderX 自带 `uniapp-cli-vite` 的软链，`package.json` 未配 scripts，所以直接调 `uni`）：

```bash
# 源码在根目录而不是 src/，必须指定输入目录；输出目录默认 dist/，这里指回 HBuilderX 的产物目录
UNI_INPUT_DIR=$PWD UNI_PLATFORM=mp-weixin \
  UNI_OUTPUT_DIR=$PWD/unpackage/dist/dev/mp-weixin \
  node_modules/.bin/uni build -p mp-weixin
```

> 根目录的 `vite.config.js` 只做一件事：挂上 `@dcloudio/vite-plugin-uni`，命令行构建必须有它。
> Node 18+ ；依赖版本：uni-app `3.0.0-alpha-5020720260921001`、vue `3.4.21`、vite `5.2.8`。

---

## 三、页面清单

### 启动与账号
| 页面 | 路径 | 说明 |
| --- | --- | --- |
| 启动页 | `pages/splash/splash` | 品牌 Logo + 自动路由决策（已登录/已引导） |
| 引导页 | `pages/onboarding/onboarding` | 3 屏轮播、跳过、圆点指示器 |
| 登录 | `pages/login/login` | 微信一键登录（预留 `uni.login` code 换 token）、游客浏览、三种身份选择 |

### 商城主链路
| 页面 | 路径 | 说明 |
| --- | --- | --- |
| 首页 | `pages/tabbar/home/home` | 定位、搜索、分类横滑、Banner 轮播、四宫格快捷入口、限时特价倒计时、农场推荐 |
| 分类 | `pages/tabbar/category/category` | 左侧一级分类 + 右侧二级分类 + 商品列表 |
| 搜索 | `pages/search/search` | 历史/热搜/联想、综合·销量·价格排序、农场结果 |
| 商品详情 | `pages/product/detail` | 主图、价格、规格、农场卡片、产地溯源、评价摘要、底部加购/立即购买 |
| 商品评价 | `pages/product/reviews` | 综合评分、分项评分条、标签筛选、图文评价列表 |

### 购物车与交易
| 页面 | 路径 | 说明 |
| --- | --- | --- |
| 菜篮子 | `pages/tabbar/cart/cart` | 分组勾选、数量步进、删除、失效商品、合计栏 |
| 确认订单 | `pages/order/confirm` | 地址选择、配送方式、优惠券、备注、金额试算、提交支付 |
| 支付结果 | `pages/order/pay-result` | 成功态、金额、查看订单/继续逛 |
| 订单列表 | `pages/order/list` | 全部/待付款/待发货/待收货/已完成 多状态 |
| 订单详情 | `pages/order/detail` | 状态时间轴、地址、商品、金额明细、订单号复制、操作按钮 |
| 物流详情 | `pages/order/logistics` | 快递单号、运输节点时间轴、本单商品、联系客服 |

### 地址
| 页面 | 路径 | 说明 |
| --- | --- | --- |
| 地址列表 | `pages/address/list` | 默认地址标记、编辑/删除、选择模式回传 |
| 地址编辑 | `pages/address/edit` | 收货人、手机号、地区选择、详细地址、标签、设为默认 |

### 农场与农事
| 页面 | 路径 | 说明 |
| --- | --- | --- |
| 农场主页 | `pages/farm/home` | 封面、头像、关注、认证标签、数据统计、在售商品/农事记录/农场故事、认养横幅 |
| 农事日历 | `pages/farm/calendar` | 月历网格、任务着色、图例、当日任务列表 |
| 农事记录 | `pages/farm/record` | 地块/日期选择、农事类型（采收/管护/施肥/播种/防虫）、图文记录、历史时间线 |

### 认养一块地
| 页面 | 路径 | 说明 |
| --- | --- | --- |
| 认养大厅 | `pages/farm/adopt` | 头图数据、三步说明、农场/面积筛选、地块列表、保障说明 |
| 地块详情 | `pages/farm/plot` | 地块档案、多选作物（最多 3 种）、认养方式、周期、费用实时试算 |
| 确认认养 | `pages/farm/adopt-confirm` | 认养人信息、配送地址与频率、开始日期、协议勾选、提交生成认养单 |
| 认养结果 | `pages/farm/adopt-result` | 成功态、后续流程说明，底部可跳转证书页 |
| 认养证书 | `pages/farm/certificate` | 独立证书页：编号与验真码、金框证书版式、失效水印、保存到相册、分享图片 |
| 我的认养 | `pages/farm/my` | 概览、进行中/已结束切换、进度条、下次配送、快捷操作 |
| 认养详情 | `pages/farm/detail` | 进度总览、六个快捷入口、配送摘要、农事日志时间轴、地块档案、费用与认养信息、退养 |
| 配送记录 | `pages/farm/delivery` | 签收统计、下次配送、收货地址、逐次配送明细、确认收到/跳过本次/撤销 |
| 云监工 | `pages/farm/monitor` | 三机位直播画面、四项环境读数与昨日对比、远程派单（浇水/追肥/除虫/除草）、每日抓拍、近 7 天日均温 |
| 收成 | `pages/farm/harvest` | 预计/已收/待收斤数、按作物进度、下次采收预告、去向安排（寄送/存菜窖/换积分）、收成记录 |

### 社区与消息
| 页面 | 路径 | 说明 |
| --- | --- | --- |
| 农友圈 | `pages/tabbar/community/community` | 话题栏、动态流、九宫格图、点赞评论、下拉加载 |
| 动态详情 | `pages/post/detail` | 正文、图片、关联商品卡、评论区、点赞收藏 |
| 发布动态 | `pages/post/publish` | 文本、图片九宫格、话题、关联商品、定位、可见范围 |
| 直播间 | `pages/live/live` | 主播信息、在线人数、悬浮商品卡、滚动弹幕、聊天、底部输入栏 |
| 消息中心 | `pages/message/message` | 五类通知入口（含认养通知，带角标）、会话列表、未读数 |
| 聊天 | `pages/message/chat` | 买卖双方气泡、订单卡片、快捷回复、输入栏 |

### 个人中心
| 页面 | 路径 | 说明 |
| --- | --- | --- |
| 我的 | `pages/tabbar/profile/profile` | 绿色头部、订单四态入口、我的农场/地块、资产、工具网格、菜单 |
| 我的收藏 | `pages/profile/favorite` | 商品收藏 / 浏览足迹 双 Tab |
| 优惠券 | `pages/profile/coupon` | 可用/已用过期、面额卡、使用说明、选择模式回传 |
| 设置 | `pages/profile/settings` | 地址、版本、通知开关、清除缓存、隐私政策、退出登录 |

### 三种身份
| 页面 | 路径 | 说明 |
| --- | --- | --- |
| 选择身份 | `pages/role/switch` | 买家 / 农户 / 专家三张身份卡，已开通的可直接切换，未开通的走申请 |
| 身份申请 | `pages/role/apply` | 农户 7 项（地块、作物、面积…）、专家 7 项（资质、擅长作物、从业年限…），提交后待审核 |
| 组件预览 | `pages/dev/ui` | 设计库：色板、11 个组件示例、16 处插图槽清单（点一下复制路径） |

### 识图诊断
| 页面 | 路径 | 说明 |
| --- | --- | --- |
| 拍照识别 | `pages/scan/scan` | 拍照 / 相册 / 演示样张、选作物（可不选）、分析动效 |
| 诊断结果 | `pages/scan/result` | 结论卡、严重度、症状、成因、农业·生物·化学三档方案、用药与稀释倍数、预防、易混淆病害、长势提醒 |
| 识别记录 | `pages/scan/history` | 历史记录，最多 24 条 |

### 专家问诊
| 页面 | 路径 | 说明 |
| --- | --- | --- |
| 专家列表 | `pages/expert/list` | 6 位农艺师，按作物筛选、在线优先 |
| 专家详情 | `pages/expert/detail` | 履历、擅长作物、评分、历史回答 |
| 提问 | `pages/expert/ask` | 选专家、选作物、5 个症状模板快捷填入、附图 |
| 我的问诊 | `pages/expert/qa` | 问诊单列表 + 状态筛选 |
| 问诊会话 | `pages/expert/chat` | 对话流、追问、评价、关闭 |
| 专家工作台 | `pages/expert/workbench` | 专家侧：接单、未读、回复、统计 |

### 农户侧
| 页面 | 路径 | 说明 |
| --- | --- | --- |
| 农户工作台 | `pages/farm/workbench` | 天气、今日待办、地块横滑、8 宫格农事工具、收成速览 |
| 我的售卖 | `pages/farm/sell` | 商品改价 / 改库存 / 上下架、订单发货 |

---

## 四、打包成 App

### 方式 A：HBuilderX 云打包（推荐，最省事）

1. 下载 **HBuilderX App 开发版**（不是标准版）。
2. `文件 → 导入 → 从本地目录导入`，选择本项目**根目录**。
3. 打开 `src/manifest.json` → **基础配置** → 点「重新获取」生成 AppID（需登录 DCloud 账号，免费）。
4. **App 图标配置** → 上传一张 1024×1024 PNG → 点「自动生成所有图标」。
5. **App 模块配置**：全部不勾（本项目未用到地图/推送/支付 SDK，勾了只会增大体积）。
6. **App 权限配置**：已内置网络、相机、存储、震动，按需删减。
7. `发行 → 原生 App-云打包`：
   - 平台：Android（iOS 需苹果开发者证书）
   - 证书：测试选「使用公共测试证书」，上架选自有证书
   - **打包方式选「快速安心包」以外的默认方式即可**
8. 打包完成下载 APK，安装即用。

### 体积控制清单（打包前逐条确认）

| 检查项 | 位置 | 建议 |
| --- | --- | --- |
| 仅保留 arm64 | `manifest.json → app-plus.distribute.android.abiFilters` | 当前 `["armeabi-v7a", "arm64-v8a"]`；只留 `["arm64-v8a"]` 可再省约 4 MB |
| 原生模块 | `app-plus.modules` | 当前为 `{}`，保持为空 |
| uni 统计 | manifest 基础配置 | 不勾选（会额外引入 SDK） |
| 启动图 | `app-plus.splashscreen` | 用纯色/纯文字启动图，不用多张位图 |
| 广告/地图/推送 | 模块配置 | 一律不勾 |
| 资源体积 | `src/static` | 当前仅 84 KB |

按以上配置，Android APK 实测区间 **9～13 MB**，iOS IPA 约 **15～20 MB**。

### 方式 B：离线打包

需要 Android Studio + DCloud 离线 SDK（约 300 MB，不打进 APK）。产物比云打包再小 1～2 MB，但要自己配签名和渠道。普通需求用方式 A 即可。

---

## 五、工程结构

```
agriculture_app/
├── src/
│   ├── pages/                # 38 个页面
│   │   ├── splash/ onboarding/ login/
│   │   ├── tabbar/{home,category,cart,community,profile}/
│   │   ├── search/ product/ order/ address/
│   │   ├── farm/ post/ live/ message/ profile/
│   ├── components/
│   │   ├── tab-bar.vue       # 自绘底部导航（含购物车角标）
│   │   ├── nav-bar.vue       # 自定义导航栏
│   │   ├── icon-svg.vue      # 内联 SVG 图标（零文件）
│   │   ├── prod-img.vue      # 商品图合成（渐变+光斑+Emoji）
│   │   ├── price-tag.vue     # 价格排版（整数大、小数小、划线原价）
│   │   ├── product-card.vue  # 商品卡（grid / row 两种模式）
│   │   └── empty-box.vue     # 空状态
│   ├── common/
│   │   ├── data.js           # 全部 mock 数据（商品/农场/订单/评价/农事…）
│   │   ├── icons.js          # SVG path 字典
│   │   └── utils.js          # 金额、时间、toast 等工具
│   ├── store/index.js        # 轻量响应式 store（购物车/地址/订单/收藏/登录态）
│   ├── pages.json            # 路由与窗口样式
│   ├── manifest.json         # App 配置与打包参数
│   └── uni.scss              # 主题变量
└── vite.config.js
```

---

## 六、接后端要改哪里

当前是**纯前端可跑通**的完整业务流，数据来自 `src/common/data.js`（内存 mock）+ `uni.setStorageSync`（持久化）。接真实接口时按下面三处替换即可：

| 位置 | 现状 | 改法 |
| --- | --- | --- |
| `src/store/index.js` | 同步函数直接改内存 | 换成 `uni.request`，把 `addToCart`/`createOrder`/`payOrder` 等改成 `async`，页面里 `await` 一下即可（调用点已经是普通函数调用，加 `await` 不破坏结构） |
| `src/pages/login/login.vue` | `sendCode` / `doLogin` 用定时器模拟 | 换成短信与登录接口，`login(phone)` 传真实 token |
| `src/pages/order/confirm.vue` | 「支付」直接置为已支付 | 换成 `uni.requestPayment`（微信/支付宝），回调里再调 `payOrder` |

图片替换有两条路：

1. **商品图**：只改 `components/prod-img.vue`，把 `<text class="emoji">` 换成 `<image :src="...">`，全站 30+ 处商品图同时生效。
2. **运营插图**：页面用 `ui-image` 声明了 16 处插图槽（首页 banner、身份卡、拍照指引、空状态等），把图按 `common/assets.js` 里约定的路径丢进 `static/images/` 就自动替换。当前 6 处已挂载到页面（专家列表头图、拍照指引、识别空状态、三张身份卡），其余 10 处槽位已声明但页面还在用渐变/Emoji 合成图，需按 [docs/08 第 4.4 节](./docs/08-UI组件库与插图指南.md) 接一下才会显示。

---

## 七、已做的移动端适配

- 全部尺寸用 `rpx`，750 设计稿等比缩放。
- 底部导航、结算栏、操作栏统一加 `env(safe-area-inset-bottom)`，iPhone 全面屏不被小白条挡。
- 自定义导航栏按状态栏高度动态留白（`uni.getSystemInfoSync().statusBarHeight`）。
- 长列表用 `scroll-view`，避免整页滚动导致的卡顿与吸顶失效。
- 自定义 tabBar 替代原生 tabBar：原生 tabBar 无法做圆角悬浮与角标动效，且需要 10 张图标位图（约 40 KB），自绘后这部分归零。

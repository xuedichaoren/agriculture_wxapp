<template>
  <view class="page wb">
    <view class="top">
      <view class="status" :style="{ height: statusBar + 'px' }" />
      <view class="t-row">
        <view>
          <text class="t-hi">农户工作台</text>
          <text class="t-sub">{{ today }} · {{ greeting }}</text>
        </view>
        <view class="t-actions">
          <view class="t-ico" @tap="to('/pages/message/message')">
            <icon-svg name="bell" :size="32" color="#FFFFFF" :stroke="1.8" />
            <view v-if="todoCount" class="dot" />
          </view>
          <view class="t-ico" @tap="to('/pages/role/switch')">
            <icon-svg name="users" :size="30" color="#FFFFFF" :stroke="1.8" />
          </view>
        </view>
      </view>

      <view class="farm">
        <view class="f-av">
          <text class="f-emoji">🌾</text>
        </view>
        <view class="flex1">
          <text class="f-name">湘西老周家庭农场</text>
          <text class="f-sub">{{ plotsText }}</text>
        </view>
        <view class="f-tag">已认证</view>
      </view>

      <view class="stats">
        <view class="st">
          <text class="st-n">{{ stats.recruiting }}</text>
          <text class="st-l">招募中地块</text>
        </view>
        <view class="st-div" />
        <view class="st">
          <text class="st-n" :class="{ hl: stats.pendingApps }">{{ stats.pendingApps }}</text>
          <text class="st-l">待确认申请</text>
        </view>
        <view class="st-div" />
        <view class="st">
          <text class="st-n">{{ stats.monthIncome }}</text>
          <text class="st-l">本月认养收入</text>
        </view>
        <view class="st-div" />
        <view class="st">
          <text class="st-n">{{ toShip.length }}</text>
          <text class="st-l">待发货</text>
        </view>
      </view>
    </view>

    <view class="body">
      <!-- 天气 -->
      <view class="weather" @tap="to('/pages/farm/weather')">
        <text class="w-e">{{ weather.now.emoji || '⛅' }}</text>
        <view class="flex1">
          <view class="w-line">
            <text class="w-t">{{ weather.place || '定位中' }} · {{ weather.now.text || '加载中' }}</text>
            <text v-if="weather.now.temp !== undefined" class="w-temp">{{ weather.now.temp }}℃</text>
          </view>
          <text class="w-s">{{ weatherLine }}</text>
        </view>
        <icon-svg name="right" :size="22" color="#C3CCC8" />
      </view>

      <!-- 天气下的农事指数 -->
      <view v-if="indexes.length" class="idx-row">
        <view v-for="i in indexes" :key="i.key" class="idx">
          <text class="ix-e">{{ i.emoji }}</text>
          <text class="ix-n">{{ i.name }}</text>
          <text class="ix-s" :style="{ color: colorOf(i.score) }">{{ levelOf(i.score) }}</text>
        </view>
      </view>

      <!-- 待办 -->
      <view class="row between sec-head">
        <view class="row">
          <text class="sec-t">今天要做</text>
          <text v-if="todoList.length" class="sec-badge">{{ todoList.length }}</text>
        </view>
        <text class="sec-more" @tap="to('/pages/farm/tasks')">全部农事 ›</text>
      </view>

      <view v-if="!todoList.length" class="empty-card">
        <text class="ec-e">✅</text>
        <text class="ec-t">今天的活都干完了</text>
        <text class="ec-s">可以去农友圈看看别人地里的情况，或者拍张叶子查查长势</text>
      </view>

      <view v-for="t in todoList" :key="t.key" class="todo" @tap="to(t.path)">
        <view class="td-ico" :style="{ background: t.bg }">
          <text class="td-e">{{ t.emoji }}</text>
        </view>
        <view class="flex1">
          <text class="td-t">{{ t.title }}</text>
          <text class="td-s">{{ t.desc }}</text>
        </view>
        <view class="td-btn">{{ t.btn }}</view>
      </view>

      <!-- 被认养的地块 -->
      <view class="row between sec-head mt">
        <text class="sec-t">被认养的地块</text>
        <text class="sec-more" @tap="to('/pages/farm/plots')">全部 {{ plots.length }} 块 ›</text>
      </view>
      <scroll-view v-if="plots.length" scroll-x class="plots no-scrollbar" :show-scrollbar="false">
        <view class="plots-in">
          <view v-for="p in plots.slice(0, 5)" :key="p.id" class="plot" @tap="to('/pages/farm/plot-manage?id=' + p.id)">
            <view class="p-top">
              <text class="p-code">{{ p.code }} 号</text>
              <text class="p-st" :class="p.status">{{ p.statusText }}</text>
            </view>
            <text class="p-emoji">{{ p.emoji }}</text>
            <text class="p-crop">{{ p.cropsText }}</text>
            <view class="p-bar">
              <view class="p-fill" :style="{ width: p.ratio + '%' }" />
            </view>
            <text class="p-tip">已认养 {{ p.booked }}/{{ p.capacity }} 份</text>
            <view class="p-avs">
              <view v-for="a in p.adopters.slice(0, 3)" :key="a.name" class="p-av">
                <text class="p-av-e">{{ a.avatar }}</text>
              </view>
              <text v-if="!p.adopterTotal" class="p-none">待认养</text>
            </view>
          </view>
          <view class="plot add" @tap="to('/pages/farm/plot-new')">
            <text class="add-e">＋</text>
            <text class="add-t">发布新地块</text>
          </view>
        </view>
      </scroll-view>
      <view v-else class="empty-card">
        <text class="ec-e">🌱</text>
        <text class="ec-t">还没有发布地块</text>
        <text class="ec-s">把地的情况写清楚放出去，认养人才找得到你</text>
        <ui-btn type="ghost" size="sm" text="发布第一块地" @click="to('/pages/farm/plot-new')" />
      </view>

      <!-- 常用功能 -->
      <view class="tools card">
        <view v-for="t in tools" :key="t.name" class="tool" @tap="onTool(t)">
          <view class="tl-ico" :style="{ background: t.bg }">
            <icon-svg :name="t.icon" :size="36" :color="t.color" :stroke="1.7" />
            <view v-if="t.badge" class="tl-badge">{{ t.badge }}</view>
          </view>
          <text class="tl-name">{{ t.name }}</text>
        </view>
      </view>

      <!-- 本月经营 -->
      <view class="biz card">
        <view class="row between">
          <text class="hs-t">本月经营</text>
          <text class="hs-more" @tap="to('/pages/farm/adopt-in')">订单明细 ›</text>
        </view>
        <view class="hs-row">
          <view class="hs">
            <text class="hs-n">{{ stats.monthIncome }}</text>
            <text class="hs-l">认养收入(元)</text>
          </view>
          <view class="hs">
            <text class="hs-n hl">{{ monthSell }}</text>
            <text class="hs-l">卖货收入(元)</text>
          </view>
          <view class="hs">
            <text class="hs-n">{{ stats.adopters }}</text>
            <text class="hs-l">认养人</text>
          </view>
        </view>
        <view class="biz-tip">
          <text class="bt-t">{{ bizTip }}</text>
        </view>
      </view>

      <view style="height: 160rpx" />
    </view>

    <tab-bar active="work" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { orderItems, store } from '@/store/index.js'
import * as api from '@/api/index.js'
import { farmPlots, farmStats, farmSide, todayTaskList } from '@/store/farm-side.js'
import { pendingCount } from '@/store/expert.js'

const statusBar = ref(20)
try {
  const info = uni.getStorageSync('sys_info')
  if (info && info.statusBarHeight) statusBar.value = info.statusBarHeight
} catch (e) {}

const tick = ref(0)
const weather = ref({ now: {}, days: [], indexes: [], tips: [], place: '' })

const plots = computed(() => {
  void tick.value
  void farmSide.plots
  void farmSide.newIns
  return farmPlots()
})

const stats = computed(() => {
  void tick.value
  void farmSide.plots
  void farmSide.newIns
  void farmSide.apps
  void farmSide.tasks
  return farmStats()
})

const plotsText = computed(() => {
  const names = []
  plots.value.forEach((p) => {
    if (names.indexOf(p.cropsText) === -1 && p.cropsText) names.push(p.cropsText)
  })
  const head = names.length ? names.slice(0, 3).join(' · ') : '还没有地块'
  return `${head} · ${stats.value.booked} 份被认养 · ${stats.value.adopters} 位认养人`
})

const toShip = computed(() => store.orders.filter((o) => o.status === 'unshipped'))

const monthSell = computed(() => {
  const total = store.orders
    .filter((o) => o.status !== 'unpaid')
    .reduce((s, o) => {
      const items = orderItems(o)
      return s + items.reduce((x, i) => x + (i.product ? i.product.price * i.qty : 0), 0)
    }, 0)
  return Math.round(total)
})

const indexes = computed(() => weather.value.indexes || [])

const weatherLine = computed(() => {
  const w = weather.value
  if (!w.days || !w.days.length) return '正在获取天气…'
  const t = w.days[0]
  const tip = (w.tips || [])[0]
  return `${t.min}~${t.max}℃ · ${tip ? tip.title : '按计划干活'}`
})

const bizTip = computed(() => {
  const s = stats.value
  if (s.pendingApps) return `有 ${s.pendingApps} 条申请压着，认养人一般在等 24 小时以上就会退单`
  if (s.seatLeft > 0) return `还有 ${s.seatLeft} 个名额没卖出去，发一条长势比降价更管用`
  if (s.endingSoon) return `有 ${s.endingSoon} 单即将到期，提前问一句续不续，续约率能高不少`
  return '名额都满了，考虑把隔壁那块也整理出来发布'
})

const todoList = computed(() => {
  const list = []
  const s = stats.value

  if (s.pendingApps) {
    list.push({
      key: 'apps',
      title: `有 ${s.pendingApps} 条认养申请待确认`,
      desc: '确认后名额立即占用，买家最迟等 24 小时',
      btn: '去处理',
      emoji: '📩',
      bg: '#FFF4E4',
      path: '/pages/farm/adopt-in?type=app'
    })
  }

  const tasks = todayTaskList()
  if (tasks.length) {
    const t = tasks[0]
    list.push({
      key: 'task',
      title: t.title,
      desc: t.desc,
      btn: '去做',
      emoji: t.emoji,
      bg: '#EAF9F1',
      path: '/pages/farm/tasks'
    })
  }

  if (toShip.value.length) {
    list.push({
      key: 'ship',
      title: `有 ${toShip.value.length} 笔订单待发货`,
      desc: '买家已付款，48 小时内发出，超时会影响店铺评分',
      btn: '去发货',
      emoji: '🚚',
      bg: '#EAF3FF',
      path: '/pages/farm/sell?tab=order'
    })
  }

  const ending = plots.value.find((p) => p.booked && p.ins.some((i) => i.status === 'ending'))
  if (ending) {
    list.push({
      key: 'ending',
      title: `${ending.code} 号地有认养单即将到期`,
      desc: '提前问一句续不续，比到期后再联系有效得多',
      btn: '看订单',
      emoji: '⏳',
      bg: '#F1EEFF',
      path: '/pages/farm/adopt-in?type=active'
    })
  }

  if (!list.length && pendingCount() > 0) {
    list.push({
      key: 'qa',
      title: `有 ${pendingCount()} 条问诊待回复`,
      desc: '农户在等你的判断，超过 24 小时会影响响应评分',
      btn: '去回复',
      emoji: '💬',
      bg: '#EAF3FF',
      path: '/pages/expert/qa'
    })
  }

  return list.slice(0, 4)
})

const todoCount = computed(() => todoList.value.length)

const tools = computed(() => [
  {
    name: '认养申请',
    icon: 'comment',
    bg: '#FFF4E4',
    color: '#E08A2B',
    path: '/pages/farm/adopt-in?type=app',
    badge: stats.value.pendingApps || ''
  },
  { name: '被认养订单', icon: 'order', bg: '#FFF4E4', color: '#E08A2B', path: '/pages/farm/adopt-in' },
  { name: '发布地块', icon: 'sprout', bg: '#F0FBE9', color: '#5CA83A', path: '/pages/farm/plot-new' },
  { name: '上架卖货', icon: 'shop', bg: '#FFF4E4', color: '#E08A2B', path: '/pages/farm/sell' },
  { name: '农事天气', icon: 'leaf', bg: '#EAF9F1', color: '#06A96A', path: '/pages/farm/weather' },
  { name: '拍照识病', icon: 'camera', bg: '#EAF9F1', color: '#06A96A', path: '/pages/scan/scan' },
  {
    name: '农事任务',
    icon: 'checkCircle',
    bg: '#EAF3FF',
    color: '#4A8CFF',
    path: '/pages/farm/tasks',
    badge: todoCount.value || ''
  },
  { name: '专家问诊', icon: 'users', bg: '#EAF7FF', color: '#2FA0D8', path: '/pages/expert/list' }
])

const today = computed(() => {
  const d = new Date()
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日`
})

const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '天还没亮，注意别太累'
  if (h < 11) return '上午好，趁凉快先把药打了'
  if (h < 14) return '中午日头毒，避开高温用药'
  if (h < 18) return '下午好，记得看一遍棚内温度'
  return '晚上好，把今天的农事记一笔'
})

function levelOf(score) {
  return api.indexLevel(score).text
}

function colorOf(score) {
  return api.indexLevel(score).tone === 'brand'
    ? '#0A8F5C'
    : api.indexLevel(score).tone === 'info'
      ? '#4A8CFF'
      : api.indexLevel(score).tone === 'warn'
        ? '#E08A2B'
        : '#FF5A4E'
}

function to(url) {
  if (!url) return
  if (url.startsWith('/pages/tabbar')) return uni.reLaunch({ url })
  uni.navigateTo({ url })
}

function onTool(t) {
  to(t.path)
}

async function loadWeather() {
  try {
    const w = await api.fetchWeather()
    weather.value = w
  } catch (e) {}
}

onShow(() => {
  tick.value++
  loadWeather()
})
</script>

<style scoped>
.wb {
  min-height: 100vh;
  background: #f4f8f5;
  padding-bottom: 20rpx;
}
.top {
  background: linear-gradient(160deg, #f0a04b 0%, #e08a2b 68%, #c97615 100%);
  padding: 0 28rpx 30rpx;
  border-radius: 0 0 40rpx 40rpx;
}
.t-row {
  height: 84rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.t-hi {
  font-size: 36rpx;
  font-weight: 800;
  color: #fff;
}
.t-sub {
  display: block;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.78);
  margin-top: 4rpx;
}
.t-actions {
  display: flex;
  gap: 12rpx;
}
.t-ico {
  width: 62rpx;
  height: 62rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.dot {
  position: absolute;
  top: 12rpx;
  right: 14rpx;
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #ff5a4e;
}
.farm {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 8rpx;
}
.f-av {
  width: 86rpx;
  height: 86rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}
.f-emoji {
  font-size: 44rpx;
}
.f-name {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #fff;
}
.f-sub {
  display: block;
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.78);
  margin-top: 5rpx;
  line-height: 1.5;
}
.f-tag {
  padding: 6rpx 14rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.2);
  font-size: 17rpx;
  color: #fff;
}
.stats {
  display: flex;
  align-items: center;
  margin-top: 22rpx;
  background: rgba(255, 255, 255, 0.14);
  border-radius: 20rpx;
  padding: 16rpx 0;
}
.st {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}
.st-n {
  font-size: 30rpx;
  font-weight: 800;
  color: #fff;
}
.st-n.hl {
  color: #fff3c4;
}
.st-l {
  font-size: 16rpx;
  color: rgba(255, 255, 255, 0.8);
}
.st-div {
  width: 2rpx;
  height: 38rpx;
  background: rgba(255, 255, 255, 0.24);
}

.body {
  padding: 22rpx 28rpx 0;
}

/* 天气 */
.weather {
  display: flex;
  align-items: center;
  gap: 14rpx;
  background: #fff;
  border-radius: 22rpx;
  padding: 18rpx 20rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}
.w-e {
  font-size: 40rpx;
}
.w-line {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.w-t {
  font-size: 23rpx;
  font-weight: 700;
  color: #16201c;
}
.w-temp {
  font-size: 26rpx;
  font-weight: 800;
  color: #d97e1c;
}
.w-s {
  display: block;
  margin-top: 4rpx;
  font-size: 19rpx;
  color: #9aa7a1;
  line-height: 1.5;
}

.idx-row {
  display: flex;
  gap: 10rpx;
  margin-top: 12rpx;
}
.idx {
  flex: 1;
  background: #fff;
  border-radius: 18rpx;
  padding: 12rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rpx;
  box-shadow: 0 6rpx 18rpx rgba(22, 60, 45, 0.04);
}
.ix-e {
  font-size: 22rpx;
}
.ix-n {
  font-size: 18rpx;
  color: #7c8a84;
}
.ix-s {
  font-size: 17rpx;
  font-weight: 700;
}

.sec-head {
  margin: 24rpx 0 12rpx;
}
.sec-t {
  font-size: 30rpx;
  font-weight: 700;
  color: #16201c;
}
.sec-badge {
  margin-left: 10rpx;
  min-width: 32rpx;
  height: 32rpx;
  border-radius: 32rpx;
  background: #ff5a4e;
  color: #fff;
  font-size: 18rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
}
.sec-more {
  font-size: 21rpx;
  color: #9aa7a1;
}
.mt {
  margin-top: 8rpx;
}
.empty-card {
  background: #fff;
  border-radius: 22rpx;
  padding: 34rpx 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}
.ec-e {
  font-size: 48rpx;
}
.ec-t {
  font-size: 24rpx;
  font-weight: 700;
  color: #16201c;
}
.ec-s {
  font-size: 19rpx;
  color: #9aa7a1;
  text-align: center;
  line-height: 1.6;
  margin-bottom: 8rpx;
}
.todo {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: #fff;
  border-radius: 22rpx;
  padding: 20rpx;
  margin-bottom: 14rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}
.td-ico {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.td-e {
  font-size: 34rpx;
}
.td-t {
  display: block;
  font-size: 24rpx;
  font-weight: 700;
  color: #16201c;
}
.td-s {
  display: block;
  margin-top: 4rpx;
  font-size: 19rpx;
  color: #9aa7a1;
  line-height: 1.45;
}
.td-btn {
  padding: 10rpx 20rpx;
  border-radius: 30rpx;
  background: #fff3e2;
  color: #d97e1c;
  font-size: 20rpx;
  font-weight: 600;
  flex-shrink: 0;
}

/* 地块横滑 */
.plots {
  width: 100%;
}
.plots-in {
  display: flex;
  gap: 14rpx;
}
.plot {
  width: 236rpx;
  flex-shrink: 0;
  background: #fff;
  border-radius: 22rpx;
  padding: 18rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}
.p-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.p-code {
  font-size: 19rpx;
  font-weight: 700;
  color: #3d4a45;
}
.p-st {
  font-size: 16rpx;
  color: #06a96a;
  background: #eaf9f1;
  padding: 2rpx 8rpx;
  border-radius: 6rpx;
}
.p-st.full {
  color: #4a8cff;
  background: #eaf3ff;
}
.p-st.paused {
  color: #9aa7a1;
  background: #f3f6f4;
}
.p-emoji {
  display: block;
  font-size: 46rpx;
  margin: 10rpx 0 4rpx;
}
.p-crop {
  display: block;
  font-size: 19rpx;
  color: #5c6a64;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.p-bar {
  height: 8rpx;
  border-radius: 8rpx;
  background: #eef2ef;
  margin-top: 12rpx;
  overflow: hidden;
}
.p-fill {
  height: 8rpx;
  border-radius: 8rpx;
  background: linear-gradient(90deg, #f7b45c, #e08a2b);
}
.p-tip {
  display: block;
  font-size: 17rpx;
  color: #9aa7a1;
  margin-top: 8rpx;
}
.p-avs {
  display: flex;
  align-items: center;
  margin-top: 8rpx;
  height: 38rpx;
}
.p-av {
  width: 38rpx;
  height: 38rpx;
  border-radius: 50%;
  background: #f4f8f5;
  border: 2rpx solid #fff;
  margin-left: -8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.p-av:first-child {
  margin-left: 0;
}
.p-av-e {
  font-size: 18rpx;
}
.p-none {
  font-size: 17rpx;
  color: #c3ccc8;
}
.plot.add {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  background: #fffdf9;
  border: 2rpx dashed #f7d9b0;
}
.add-e {
  font-size: 40rpx;
  color: #e08a2b;
}
.add-t {
  font-size: 19rpx;
  color: #d97e1c;
}

/* 工具 */
.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 22rpx 18rpx;
  margin-top: 20rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}
.tools {
  display: flex;
  flex-wrap: wrap;
}
.tool {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 10rpx 0;
}
.tl-ico {
  width: 82rpx;
  height: 82rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.tl-badge {
  position: absolute;
  top: -6rpx;
  right: -6rpx;
  min-width: 30rpx;
  height: 30rpx;
  border-radius: 30rpx;
  background: #ff5a4e;
  color: #fff;
  font-size: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6rpx;
}
.tl-name {
  font-size: 20rpx;
  color: #3d4a45;
}

/* 经营 */
.biz {
  padding: 22rpx;
}
.hs-t {
  font-size: 27rpx;
  font-weight: 700;
  color: #16201c;
}
.hs-more {
  font-size: 20rpx;
  color: #9aa7a1;
}
.hs-row {
  display: flex;
  margin-top: 16rpx;
}
.hs {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}
.hs-n {
  font-size: 32rpx;
  font-weight: 800;
  color: #16201c;
}
.hs-n.hl {
  color: #d97e1c;
}
.hs-l {
  font-size: 16rpx;
  color: #b3bfba;
}
.biz-tip {
  margin-top: 16rpx;
  background: #fffbf4;
  border-radius: 14rpx;
  padding: 12rpx 14rpx;
}
.bt-t {
  font-size: 18rpx;
  color: #a08a6a;
  line-height: 1.6;
}
</style>

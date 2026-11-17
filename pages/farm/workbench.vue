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
          <text class="f-name">{{ farmName }}</text>
          <text class="f-sub">{{ cropsText }}</text>
        </view>
        <view class="f-tag">已认证</view>
      </view>

      <view class="stats">
        <view class="st">
          <text class="st-n">{{ growing.length }}</text>
          <text class="st-l">在种地块</text>
        </view>
        <view class="st-div" />
        <view class="st">
          <text class="st-n">{{ todoCount }}</text>
          <text class="st-l">今日待办</text>
        </view>
        <view class="st-div" />
        <view class="st">
          <text class="st-n">{{ monthIncome }}</text>
          <text class="st-l">本月销售额</text>
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
      <view class="weather">
        <text class="w-e">⛅</text>
        <view class="flex1">
          <text class="w-t">长沙 · 多云 18~24℃</text>
          <text class="w-s">近三天无雨，适合打药与整枝；夜间湿度偏高，棚内注意放风</text>
        </view>
      </view>

      <!-- 待办 -->
      <view class="row between sec-head">
        <view class="row">
          <text class="sec-t">今天要做</text>
          <text v-if="todoList.length" class="sec-badge">{{ todoList.length }}</text>
        </view>
      </view>

      <view v-if="!todoList.length" class="empty-card">
        <text class="ec-e">✅</text>
        <text class="ec-t">今天的活都干完了</text>
        <text class="ec-s">可以去农友圈看看别人地里的情况，或者拍张叶子查查长势</text>
      </view>

      <view v-for="t in todoList" :key="t.key" class="todo" @tap="to(t.path)">
        <view class="td-ico" :style="{ background: t.bg }">
          <icon-svg :name="t.icon" :size="32" :color="t.color" :stroke="1.8" />
        </view>
        <view class="flex1">
          <text class="td-t">{{ t.title }}</text>
          <text class="td-s">{{ t.desc }}</text>
        </view>
        <view class="td-btn">{{ t.btn }}</view>
      </view>

      <!-- 我的地块 -->
      <view class="row between sec-head mt">
        <text class="sec-t">我的地块</text>
        <text class="sec-more" @tap="to('/pages/farm/my')">全部 {{ allAdoptions.length }} 块 ›</text>
      </view>
      <scroll-view v-if="allAdoptions.length" scroll-x class="plots no-scrollbar" :show-scrollbar="false">
        <view class="plots-in">
          <view v-for="a in allAdoptions.slice(0, 4)" :key="a.id" class="plot" @tap="to('/pages/farm/detail?id=' + a.id)">
            <view class="p-top">
              <text class="p-code">{{ a.code }} 号地</text>
              <text class="p-st" :class="a.status">{{ a.status === 'growing' ? '在种' : a.status === 'done' ? '已结束' : '已退养' }}</text>
            </view>
            <text class="p-emoji">{{ api.cropsEmoji(a) }}</text>
            <text class="p-crop">{{ api.cropsText(a) }}</text>
            <view class="p-bar">
              <view class="p-fill" :style="{ width: progressOf(a) + '%' }" />
            </view>
            <text class="p-tip">第 {{ daysGone(a) }} 天 · {{ a.status === 'growing' ? '还剩 ' + daysLeft(a) + ' 天' : '已结束' }}</text>
          </view>
          <view class="plot add" @tap="to('/pages/farm/adopt')">
            <text class="add-e">＋</text>
            <text class="add-t">认养新地块</text>
          </view>
        </view>
      </scroll-view>
      <view v-else class="empty-card">
        <text class="ec-e">🌱</text>
        <text class="ec-t">还没有地块</text>
        <text class="ec-s">先去认养一块，或者把自己的地录进来</text>
        <ui-btn type="ghost" size="sm" text="去认养" @click="to('/pages/farm/adopt')" />
      </view>

      <!-- 常用功能 -->
      <view class="tools card">
        <view v-for="t in tools" :key="t.name" class="tool" @tap="onTool(t)">
          <view class="tl-ico" :style="{ background: t.bg }">
            <icon-svg :name="t.icon" :size="36" :color="t.color" :stroke="1.7" />
          </view>
          <text class="tl-name">{{ t.name }}</text>
        </view>
      </view>

      <!-- 收成速览 -->
      <view v-if="harvest" class="harvest card" @tap="to('/pages/farm/harvest?id=' + harvest.id)">
        <view class="row between">
          <text class="hs-t">本季收成</text>
          <text class="hs-more">看明细 ›</text>
        </view>
        <view class="hs-row">
          <view class="hs">
            <text class="hs-n">{{ harvest.expect }}</text>
            <text class="hs-l">预计(斤)</text>
          </view>
          <view class="hs">
            <text class="hs-n hl">{{ harvest.picked }}</text>
            <text class="hs-l">已收(斤)</text>
          </view>
          <view class="hs">
            <text class="hs-n">{{ harvest.left }}</text>
            <text class="hs-l">待收(斤)</text>
          </view>
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
import { growingAdoptions, orderItems, store } from '@/store/index.js'
import * as api from '@/api/index.js'
import { pendingCount } from '@/store/expert.js'

const statusBar = ref(20)
try {
  const info = uni.getStorageSync('sys_info')
  if (info && info.statusBarHeight) statusBar.value = info.statusBarHeight
} catch (e) {}

const tick = ref(0)

const allAdoptions = computed(() => {
  void tick.value
  return store.adoptions
})
const growing = computed(() => growingAdoptions())
const toShip = computed(() => store.orders.filter((o) => o.status === 'unshipped'))

const farmName = computed(() => {
  const a = growing.value[0] || allAdoptions.value[0]
  if (!a) return '湘农汇示范农场'
  const p = api.findPlot(a.plotId)
  const v = p ? api.plotView(p) : null
  return (v && v.farm && v.farm.name) || '湘西老周家庭农场'
})

const cropsText = computed(() => {
  const names = []
  for (const a of growing.value) {
    const t = api.cropsText(a)
    if (t && names.indexOf(t) === -1) names.push(t)
  }
  return names.length ? names.join(' · ') + ' · ' + growing.value.length + ' 块地在种' : '还没有在种的地块'
})

const monthIncome = computed(() => {
  const total = store.orders
    .filter((o) => o.status !== 'unpaid')
    .reduce((s, o) => {
      const items = orderItems(o)
      return s + items.reduce((x, i) => x + (i.product ? i.product.price * i.qty : 0), 0)
    }, 0)
  return Math.round(total)
})

const todoList = computed(() => {
  const list = []
  if (toShip.value.length) {
    list.push({
      key: 'ship',
      title: '有 ' + toShip.value.length + ' 笔订单待发货',
      desc: '买家已付款，48 小时内发出，超时会影响店铺评分',
      btn: '去发货',
      icon: 'truck',
      bg: '#FFF4E4',
      color: '#E08A2B',
      path: '/pages/farm/sell?tab=order'
    })
  }
  const a = growing.value[0]
  if (a) {
    const dl = api.daysLeft(a)
    if (dl <= 7) {
      list.push({
        key: 'deliver',
        title: a.code + ' 号地即将到期（剩 ' + dl + ' 天）',
        desc: '提前确认是否续养，或安排最后一次采收',
        btn: '看地块',
        icon: 'clock',
        bg: '#EAF3FF',
        color: '#4A8CFF',
        path: '/pages/farm/detail?id=' + a.id
      })
    }
    if (a.nextDelivery) {
      list.push({
        key: 'pick',
        title: '下次配送：' + a.nextDelivery,
        desc: '按约定时间采摘打包，冷链发出后记得回填单号',
        btn: '看配送',
        icon: 'gift',
        bg: '#EAF9F1',
        color: '#06A96A',
        path: '/pages/farm/delivery?id=' + a.id
      })
    }
  }
  if (!list.length && pendingCount() > 0) {
    list.push({
      key: 'qa',
      title: '有 ' + pendingCount() + ' 条问诊待回复',
      desc: '农户在等你的判断，超过 24 小时会影响响应评分',
      btn: '去回复',
      icon: 'comment',
      bg: '#EAF3FF',
      color: '#4A8CFF',
      path: '/pages/expert/qa'
    })
  }
  return list
})

const todoCount = computed(() => todoList.value.length)

const harvest = computed(() => {
  const a = growing.value[0]
  if (!a) return null
  try {
    return api.harvestViewOf(a, [])
  } catch (e) {
    return null
  }
})

const tools = [
  { name: '上架卖货', icon: 'shop', bg: '#FFF4E4', color: '#E08A2B', path: '/pages/farm/sell' },
  { name: '订单管理', icon: 'order', bg: '#EAF3FF', color: '#4A8CFF', path: '/pages/farm/sell?tab=order' },
  { name: '拍照识病', icon: 'camera', bg: '#EAF9F1', color: '#06A96A', path: '/pages/scan/scan' },
  { name: '农事记录', icon: 'edit', bg: '#F1EEFF', color: '#7A6BFF', path: '/pages/farm/record' },
  { name: '农事日历', icon: 'calendar', bg: '#EAF3FF', color: '#4A8CFF', path: '/pages/farm/calendar' },
  { name: '专家问诊', icon: 'users', bg: '#EAF7FF', color: '#2FA0D8', path: '/pages/expert/list' },
  { name: '云监工', icon: 'video', bg: '#E9FAF2', color: '#06A96A', path: '/pages/farm/monitor?id=' + (growing.value[0] ? growing.value[0].id : '') },
  { name: '认养大厅', icon: 'sprout', bg: '#F0FBE9', color: '#5CA83A', path: '/pages/farm/adopt' }
]

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

function progressOf(a) {
  try {
    return api.progressOf ? api.progressOf(a) : 0
  } catch (e) {
    return 0
  }
}
function daysGone(a) {
  try {
    return api.daysGone(a)
  } catch (e) {
    return 0
  }
}
function daysLeft(a) {
  try {
    return api.daysLeft(a)
  } catch (e) {
    return 0
  }
}

function to(url) {
  if (!url || url.endsWith('id=')) return uni.showToast({ title: '还没有在种的地块', icon: 'none' })
  if (url.startsWith('/pages/tabbar')) return uni.reLaunch({ url })
  uni.navigateTo({ url })
}

function onTool(t) {
  to(t.path)
}

onShow(() => {
  tick.value++
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
  margin-top: 2rpx;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.8);
}
.t-actions {
  display: flex;
  gap: 10rpx;
}
.t-ico {
  width: 62rpx;
  height: 62rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.dot {
  position: absolute;
  top: 10rpx;
  right: 12rpx;
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: #fff36b;
}
.farm {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-top: 10rpx;
}
.f-av {
  width: 96rpx;
  height: 96rpx;
  border-radius: 28rpx;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
}
.f-emoji {
  font-size: 50rpx;
}
.f-name {
  font-size: 32rpx;
  font-weight: 800;
  color: #fff;
}
.f-sub {
  display: block;
  margin-top: 6rpx;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.82);
}
.f-tag {
  font-size: 18rpx;
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20rpx;
  padding: 4rpx 14rpx;
}
.stats {
  margin-top: 24rpx;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  padding: 18rpx 0;
}
.st {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rpx;
}
.st-n {
  font-size: 32rpx;
  font-weight: 800;
  color: #fff;
}
.st-l {
  font-size: 17rpx;
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
.w-t {
  display: block;
  font-size: 23rpx;
  font-weight: 700;
  color: #16201c;
}
.w-s {
  display: block;
  margin-top: 4rpx;
  font-size: 19rpx;
  color: #9aa7a1;
  line-height: 1.5;
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
  height: 54rpx;
  padding: 0 20rpx;
  border-radius: 54rpx;
  background: #fff4e4;
  color: #b07a00;
  font-size: 20rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.empty-card {
  background: #fff;
  border-radius: 22rpx;
  padding: 36rpx 28rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}
.ec-e {
  font-size: 48rpx;
}
.ec-t {
  font-size: 24rpx;
  font-weight: 700;
  color: #3d4a45;
}
.ec-s {
  font-size: 19rpx;
  color: #9aa7a1;
  text-align: center;
  line-height: 1.55;
  margin-bottom: 10rpx;
}
.plots {
  width: 100%;
  white-space: nowrap;
}
.plots-in {
  display: inline-flex;
  gap: 14rpx;
  padding: 2rpx 0 6rpx;
}
.plot {
  width: 280rpx;
  background: #fff;
  border-radius: 22rpx;
  padding: 18rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
  display: flex;
  flex-direction: column;
}
.p-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.p-code {
  font-size: 21rpx;
  font-weight: 700;
  color: #16201c;
}
.p-st {
  font-size: 17rpx;
  color: #06a96a;
  background: #e9faf2;
  border-radius: 6rpx;
  padding: 2rpx 8rpx;
}
.p-st.done,
.p-st.cancelled {
  color: #9aa7a1;
  background: #f3f6f4;
}
.p-emoji {
  font-size: 56rpx;
  margin: 14rpx 0 8rpx;
}
.p-crop {
  font-size: 22rpx;
  color: #3d4a45;
  font-weight: 600;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.p-bar {
  height: 8rpx;
  border-radius: 8rpx;
  background: #eef4f0;
  margin-top: 12rpx;
  overflow: hidden;
}
.p-fill {
  height: 100%;
  border-radius: 8rpx;
  background: linear-gradient(90deg, #ffc46b, #e08a2b);
}
.p-tip {
  font-size: 18rpx;
  color: #9aa7a1;
  margin-top: 8rpx;
}
.plot.add {
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  border: 2rpx dashed #e2ddd4;
  box-shadow: none;
  background: #fffdfa;
}
.add-e {
  font-size: 46rpx;
  color: #d9b98c;
}
.add-t {
  font-size: 20rpx;
  color: #b99a52;
}
.card {
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 30rpx rgba(22, 60, 45, 0.05);
}
.tools {
  display: flex;
  flex-wrap: wrap;
  padding: 22rpx 0 6rpx;
  margin-top: 22rpx;
}
.tool {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 22rpx;
}
.tl-ico {
  width: 82rpx;
  height: 82rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tl-name {
  font-size: 20rpx;
  color: #3d4a45;
}
.harvest {
  margin-top: 22rpx;
  padding: 22rpx;
}
.hs-t {
  font-size: 26rpx;
  font-weight: 700;
  color: #16201c;
}
.hs-more {
  font-size: 20rpx;
  color: #e08a2b;
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
  gap: 2rpx;
}
.hs-n {
  font-size: 32rpx;
  font-weight: 800;
  color: #16201c;
}
.hs-n.hl {
  color: #e08a2b;
}
.hs-l {
  font-size: 18rpx;
  color: #9aa7a1;
}
</style>

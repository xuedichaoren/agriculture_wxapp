<template>
  <view class="page cal-page">
    <view class="head">
      <view class="status" :style="{ height: statusBar + 'px' }" />
      <view class="nav-row">
        <view class="n-btn" @tap="back">
          <icon-svg name="back" :size="32" color="#16201C" :stroke="2" />
        </view>
        <text class="n-title">{{ codeFilter ? codeFilter + ' 号地 · 农事日历' : '农事日历' }}</text>
        <view class="n-btn" @tap="toRecord">
          <icon-svg name="plus" :size="30" color="#16201C" :stroke="2.2" />
        </view>
      </view>

      <view class="month-bar">
        <view class="mb-btn" @tap="changeMonth(-1)">
          <icon-svg name="back" :size="26" color="#3D4A45" :stroke="2" />
        </view>
        <text class="month">{{ year }} 年 {{ month }} 月</text>
        <view class="mb-btn" @tap="changeMonth(1)">
          <icon-svg name="right" :size="26" color="#3D4A45" :stroke="2" />
        </view>
        <view class="today-btn" @tap="toToday">回到今天</view>
      </view>

      <view class="week-row">
        <text v-for="w in weekNames" :key="w" class="week">{{ w }}</text>
      </view>

      <view class="grid">
        <view
          v-for="(d, i) in days"
          :key="i"
          class="cell"
          :class="{ empty: !d.day, sel: d.date === selected, today: d.date === todayKey }"
          @tap="d.day && (selected = d.date)"
        >
          <template v-if="d.day">
            <text class="d-num">{{ d.day }}</text>
            <view v-if="d.hasItem" class="dots">
              <view v-for="k in d.kinds" :key="k" class="dot" :class="k" />
            </view>
          </template>
        </view>
      </view>

      <view class="legend">
        <view class="lg"><view class="lg-dot log" /><text class="lg-txt">农事</text></view>
        <view class="lg"><view class="lg-dot delivery" /><text class="lg-txt">配送</text></view>
      </view>
    </view>

    <scroll-view scroll-y class="body no-scrollbar">
      <view class="day-head">
        <text class="dh-title">{{ selectedLabel }}</text>
        <text class="dh-count">{{ dayItems.length }} 项安排</text>
      </view>

      <view v-if="dayItems.length" class="tasks">
        <view v-for="(t, i) in dayItems" :key="i" class="task card" @tap="openItem(t)">
          <view class="t-ico" :class="t.kind">
            <text class="t-emoji">{{ t.emoji }}</text>
          </view>
          <view class="flex1">
            <view class="row">
              <text class="t-title">{{ t.title }}</text>
              <view class="t-type" :class="t.kind">{{ t.kindName }}</view>
            </view>
            <text class="t-sub">{{ t.code }} 号地 · {{ t.farmName }}</text>
            <text v-if="t.summary" class="t-desc">{{ t.summary }}</text>
          </view>
          <icon-svg name="right" :size="22" color="#C3CCC8" />
        </view>
      </view>

      <view v-else class="no-task">
        <text class="nt-emoji">🍃</text>
        <text class="nt-title">这一天没有安排</text>
        <text class="nt-sub">让土地也休息一下，或补一条农事记录</text>
        <view class="btn btn-ghost btn-sm nt-btn" @tap="toRecord">添加农事记录</view>
      </view>

      <view class="section">
        <text class="sec-title">本月概览</text>
        <view class="overview">
          <view class="ov-item">
            <text class="ov-num">{{ monthLogs }}</text>
            <text class="ov-label">农事</text>
          </view>
          <view class="ov-item">
            <text class="ov-num">{{ monthDeliveries }}</text>
            <text class="ov-label">配送</text>
          </view>
          <view class="ov-item">
            <text class="ov-num">{{ monthDays }}</text>
            <text class="ov-label">有安排天数</text>
          </view>
          <view class="ov-item">
            <text class="ov-num">{{ growing.length }}</text>
            <text class="ov-label">在种地块</text>
          </view>
        </view>
      </view>

      <view class="section">
        <text class="sec-title">我的地块</text>
        <view class="plots">
          <view v-for="p in plots" :key="p.id" class="plot card" @tap="toDetail(p)">
            <view class="p-emoji" :style="{ background: p.bg }">{{ p.emoji }}</view>
            <view class="flex1">
              <text class="p-name">{{ p.code }} 号地 · {{ p.cropsText }}</text>
              <text class="p-sub">{{ p.farm.name }} · 第 {{ p.daysGone }} 天</text>
            </view>
            <view class="p-status" :class="{ warn: p.soon }">
              {{ p.soon ? p.daysLeft + ' 天后结束' : '生长中' }}
            </view>
          </view>
          <empty-box
            v-if="!plots.length"
            emoji="🌱"
            text="还没有在种的认养"
            sub="认养一块地后，农事与配送会排进日历"
            btn-text="去认养"
            @action="toAdopt"
          />
        </view>
      </view>
      <view style="height: 60rpx" />
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { adoptionView, deliveryPlanOf, timelineOf } from '@/api/adopt-plan.js'
import { store } from '@/store/index.js'
import { userLogsOf, marksOf } from '@/store/adopt-extra.js'

const statusBar = ref(20)
try {
  const info = uni.getStorageSync('sys_info')
  if (info && info.statusBarHeight) statusBar.value = info.statusBarHeight
} catch (e) {}

const codeFilter = ref('')
try {
  const pages = getCurrentPages()
  const cur = pages[pages.length - 1]
  if (cur && cur.options && cur.options.code) codeFilter.value = cur.options.code
} catch (e) {}

const now = new Date()
const todayKey = fmtDate(now)
const year = ref(now.getFullYear())
const month = ref(now.getMonth() + 1)
const selected = ref(todayKey)
const weekNames = ['一', '二', '三', '四', '五', '六', '日']

function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

function fmtDate(d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

/** 参与日历的认养单 */
const scope = computed(() =>
  store.adoptions
    .map(adoptionView)
    .filter((a) => a && (!codeFilter.value || a.code === codeFilter.value))
)

const growing = computed(() => scope.value.filter((a) => a.growing))

const plots = computed(() =>
  growing.value.map((a) => ({
    id: a.id,
    code: a.code,
    farm: a.farm,
    cropsText: a.cropsText,
    daysGone: a.daysGone,
    daysLeft: a.daysLeft,
    soon: a.daysLeft <= 7,
    emoji: a.emoji,
    bg: a.plot ? 'linear-gradient(150deg, ' + a.plot.bg[0] + ', ' + a.plot.bg[1] + ')' : '#eef4f0'
  }))
)

/** date → 当天事项 */
const map = computed(() => {
  const out = {}
  const push = (date, item) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) return
    if (!out[date]) out[date] = []
    out[date].push(item)
  }

  scope.value.forEach((a) => {
    const y = String(a.startDate || '').slice(0, 4)
    timelineOf(a.code, userLogsOf(a.code), y).forEach((l) => {
      push(l.date, {
        kind: 'log',
        kindName: l.from === 'me' ? '我记录' : '农事',
        emoji: l.emoji || '🌱',
        title: l.title,
        summary: l.summary,
        code: a.code,
        farmName: a.farm.name,
        adoptionId: a.id
      })
    })
    deliveryPlanOf(a, marksOf(a.id)).forEach((d) => {
      if (d.status !== 'waiting') return
      push(d.date, {
        kind: 'delivery',
        kindName: '配送',
        emoji: '🚚',
        title: '第 ' + d.no + ' 次配送',
        summary: a.cropsText + ' · 冷链到家',
        code: a.code,
        farmName: a.farm.name,
        adoptionId: a.id
      })
    })
  })

  Object.keys(out).forEach((k) => {
    out[k].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === 'log' ? -1 : 1))
  })
  return out
})

const days = computed(() => {
  const first = new Date(year.value, month.value - 1, 1)
  const firstWeekday = (first.getDay() + 6) % 7
  const total = new Date(year.value, month.value, 0).getDate()
  const arr = []
  for (let i = 0; i < firstWeekday; i++) arr.push({ day: 0 })
  for (let d = 1; d <= total; d++) {
    const date = year.value + '-' + pad(month.value) + '-' + pad(d)
    const list = map.value[date] || []
    const kinds = []
    list.forEach((it) => {
      if (!kinds.includes(it.kind)) kinds.push(it.kind)
    })
    arr.push({ day: d, date, hasItem: list.length > 0, kinds })
  }
  return arr
})

const dayItems = computed(() => map.value[selected.value] || [])

const selectedLabel = computed(() => {
  const parts = String(selected.value).split('-')
  return +parts[1] + ' 月 ' + +parts[2] + ' 日 · 安排'
})

const monthPrefix = computed(() => year.value + '-' + pad(month.value))

const monthList = computed(() =>
  Object.keys(map.value)
    .filter((k) => k.indexOf(monthPrefix.value) === 0)
    .reduce((s, k) => s.concat(map.value[k]), [])
)
const monthLogs = computed(() => monthList.value.filter((i) => i.kind === 'log').length)
const monthDeliveries = computed(() => monthList.value.filter((i) => i.kind === 'delivery').length)
const monthDays = computed(
  () => Object.keys(map.value).filter((k) => k.indexOf(monthPrefix.value) === 0).length
)

function changeMonth(n) {
  let m = month.value + n
  let y = year.value
  if (m < 1) {
    m = 12
    y -= 1
  }
  if (m > 12) {
    m = 1
    y += 1
  }
  month.value = m
  year.value = y
}

function toToday() {
  const d = new Date()
  year.value = d.getFullYear()
  month.value = d.getMonth() + 1
  selected.value = fmtDate(d)
}

function back() {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack()
  else uni.navigateTo({ url: '/pages/farm/my' })
}

function toRecord() {
  const code = codeFilter.value || (growing.value[0] ? growing.value[0].code : '')
  uni.navigateTo({ url: '/pages/farm/record?code=' + code })
}

function toDetail(p) {
  uni.navigateTo({ url: '/pages/farm/detail?id=' + p.id })
}

function toAdopt() {
  uni.navigateTo({ url: '/pages/farm/adopt' })
}

function openItem(t) {
  if (t.adoptionId) uni.navigateTo({ url: '/pages/farm/detail?id=' + t.adoptionId })
}
</script>

<style scoped>
.cal-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}
.head {
  background: #fff;
  padding: 0 24rpx 18rpx;
  border-radius: 0 0 30rpx 30rpx;
}
.nav-row {
  height: 88rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.n-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: #f4f8f5;
  display: flex;
  align-items: center;
  justify-content: center;
}
.n-title {
  flex: 1;
  text-align: center;
  font-size: 30rpx;
  font-weight: 700;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.month-bar {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 6rpx 0 18rpx;
}
.mb-btn {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #f4f8f5;
  display: flex;
  align-items: center;
  justify-content: center;
}
.month {
  font-size: 30rpx;
  font-weight: 800;
  margin: 0 6rpx;
}
.today-btn {
  margin-left: auto;
  font-size: 21rpx;
  color: #06a96a;
  background: #e9faf2;
  padding: 8rpx 20rpx;
  border-radius: 30rpx;
}
.week-row {
  display: flex;
  padding: 6rpx 0;
}
.week {
  flex: 1;
  text-align: center;
  font-size: 20rpx;
  color: #9aa7a1;
}
.grid {
  display: flex;
  flex-wrap: wrap;
}
.cell {
  width: 14.28%;
  height: 92rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: 18rpx;
}
.cell.empty {
  opacity: 0;
}
.d-num {
  font-size: 26rpx;
  color: #263330;
  font-weight: 500;
}
.cell.today .d-num {
  color: #06a96a;
  font-weight: 800;
}
.cell.sel {
  background: #0fc97a;
}
.cell.sel .d-num {
  color: #fff;
  font-weight: 800;
}
.dots {
  display: flex;
  gap: 6rpx;
  margin-top: 6rpx;
}
.dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
}
.dot.log {
  background: #0fc97a;
}
.dot.delivery {
  background: #4a8cff;
}
.cell.sel .dot {
  background: rgba(255, 255, 255, 0.9);
}
.legend {
  display: flex;
  gap: 30rpx;
  justify-content: center;
  padding-top: 14rpx;
}
.lg {
  display: flex;
  align-items: center;
  gap: 6rpx;
}
.lg-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
}
.lg-dot.log {
  background: #0fc97a;
}
.lg-dot.delivery {
  background: #4a8cff;
}
.lg-txt {
  font-size: 19rpx;
  color: #9aa7a1;
}
.body {
  flex: 1;
  height: 0;
  padding: 20rpx 24rpx 0;
}
.day-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 16rpx;
}
.dh-title {
  font-size: 28rpx;
  font-weight: 700;
}
.dh-count {
  font-size: 21rpx;
  color: #9aa7a1;
}
.tasks {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}
.task {
  padding: 20rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.t-ico {
  width: 76rpx;
  height: 76rpx;
  border-radius: 22rpx;
  background: #f2fbf6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.t-ico.delivery {
  background: #eaf3ff;
}
.t-emoji {
  font-size: 38rpx;
}
.t-title {
  font-size: 25rpx;
  font-weight: 600;
  margin-right: 10rpx;
}
.t-type {
  font-size: 17rpx;
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
  background: #e9faf2;
  color: #06a96a;
}
.t-type.delivery {
  background: #eaf3ff;
  color: #4a8cff;
}
.t-sub {
  display: block;
  font-size: 19rpx;
  color: #9aa7a1;
  margin-top: 6rpx;
}
.t-desc {
  display: block;
  font-size: 20rpx;
  color: #7c8a84;
  margin-top: 6rpx;
  line-height: 1.5;
}
.no-task {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
}
.nt-emoji {
  font-size: 80rpx;
}
.nt-title {
  font-size: 26rpx;
  color: #3d4a45;
  font-weight: 600;
  margin-top: 16rpx;
}
.nt-sub {
  font-size: 21rpx;
  color: #9aa7a1;
  margin-top: 8rpx;
}
.nt-btn {
  margin-top: 24rpx;
  padding: 0 36rpx;
}
.section {
  margin-top: 34rpx;
}
.sec-title {
  font-size: 28rpx;
  font-weight: 700;
  display: block;
  margin-bottom: 16rpx;
}
.overview {
  display: flex;
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx 0;
}
.ov-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}
.ov-num {
  font-size: 32rpx;
  font-weight: 800;
  color: #0a8f5c;
}
.ov-label {
  font-size: 19rpx;
  color: #9aa7a1;
}
.plots {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}
.plot {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 20rpx;
}
.p-emoji {
  width: 80rpx;
  height: 80rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
}
.p-name {
  font-size: 25rpx;
  font-weight: 600;
}
.p-sub {
  display: block;
  font-size: 20rpx;
  color: #9aa7a1;
  margin-top: 6rpx;
}
.p-status {
  font-size: 20rpx;
  color: #06a96a;
  background: #e9faf2;
  padding: 6rpx 16rpx;
  border-radius: 30rpx;
}
.p-status.warn {
  color: #ff8a3d;
  background: #fff4e4;
}
</style>

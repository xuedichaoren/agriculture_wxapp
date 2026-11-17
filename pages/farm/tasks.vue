<template>
  <view class="page ts">
    <view class="top">
      <view class="status" :style="{ height: statusBar + 'px' }" />
      <view class="t-row">
        <view class="t-back" @tap="back">
          <icon-svg name="back" :size="32" color="#FFFFFF" :stroke="2.2" />
        </view>
        <text class="t-title">今日农事</text>
        <view class="t-back ghost" />
      </view>

      <view class="prog">
        <view class="p-left">
          <text class="p-num">{{ doneCount }}</text>
          <text class="p-of">/ {{ tasks.length }} 件</text>
        </view>
        <view class="p-right">
          <text class="p-date">{{ today }}</text>
          <text class="p-hint">{{ progressText }}</text>
        </view>
      </view>
      <view class="p-bar">
        <view class="p-fill" :style="{ width: pct + '%' }" />
      </view>
    </view>

    <view class="body">
      <!-- 天气对今天农活的影响 -->
      <view v-if="weatherTip" class="wtip" :class="weatherTip.tone" @tap="to('/pages/farm/weather')">
        <text class="wt-e">{{ weatherTip.emoji }}</text>
        <view class="flex1">
          <text class="wt-t">{{ weatherTip.title }}</text>
          <text class="wt-s">{{ weatherTip.text }}</text>
        </view>
        <icon-svg name="right" :size="22" color="#C3CCC8" />
      </view>

      <!-- 待办 -->
      <view class="sec">
        <text class="sec-t">还没做</text>
        <text v-if="todoTasks.length" class="sec-n">{{ todoTasks.length }}</text>
      </view>

      <view v-if="!todoTasks.length" class="empty-card">
        <text class="ec-e">🌤️</text>
        <text class="ec-t">今天的活都干完了</text>
        <text class="ec-s">可以拍张照片发长势，认养人就爱看这个</text>
      </view>

      <view v-for="t in todoTasks" :key="t.id" class="task">
        <view class="tk-head" @tap="toggleOpen(t.id)">
          <view class="tk-ico" :style="{ background: typeBg(t.type) }">
            <text class="tk-e">{{ t.emoji }}</text>
          </view>
          <view class="flex1">
            <text class="tk-t">{{ t.title }}</text>
            <text class="tk-s">{{ t.desc }}</text>
            <view class="tk-meta">
              <text class="tk-chip">{{ t.code }} 号地</text>
              <text class="tk-chip type">{{ typeName(t.type) }}</text>
              <view v-if="t.adopters && t.adopters.length" class="tk-avs">
                <text class="tk-av" v-for="n in t.adopters.slice(0, 3)" :key="n">{{ n.slice(-1) }}</text>
                <text class="tk-av-n">{{ t.adopters.length }} 人挂名</text>
              </view>
            </view>
          </view>
          <view class="tk-done" @tap.stop="finish(t)">
            <icon-svg name="check" :size="30" color="#FFFFFF" :stroke="2.4" />
          </view>
        </view>

        <view v-if="openId === t.id" class="tk-more">
          <text class="tm-l">怎么做</text>
          <text class="tm-t">{{ howTo(t) }}</text>
          <view class="tm-btns">
            <view class="tm-btn" @tap.stop="to('/pages/farm/plot-manage?id=' + t.plotId)">
              <icon-svg name="leaf" :size="24" color="#D97E1C" :stroke="1.8" />
              <text>看这块地</text>
            </view>
            <view class="tm-btn" @tap.stop="to('/pages/farm/plot-manage?id=' + t.plotId + '&act=push')">
              <icon-svg name="camera" :size="24" color="#D97E1C" :stroke="1.8" />
              <text>发长势</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 已完成 -->
      <view v-if="doneTasks.length" class="sec mt">
        <text class="sec-t">今天做完了</text>
        <text class="sec-n gray">{{ doneTasks.length }}</text>
      </view>

      <view v-for="t in doneTasks" :key="t.id" class="task done">
        <view class="tk-head" @tap.stop="undo(t)">
          <view class="tk-ico gray">
            <text class="tk-e">{{ t.emoji }}</text>
          </view>
          <view class="flex1">
            <text class="tk-t done">{{ t.title }}</text>
            <text class="tk-s">{{ t.code }} 号地 · {{ typeName(t.type) }}</text>
          </view>
          <view class="tk-undo">
            <icon-svg name="checkCircle" :size="30" color="#06A96A" :stroke="1.8" />
          </view>
        </view>
      </view>

      <!-- 收尾 -->
      <view v-if="doneCount" class="tail card">
        <text class="tail-t">干完了，说一声</text>
        <text class="tail-s">认养人看不到你在地里忙什么，一条长势比十句解释都管用</text>
        <ui-btn type="primary" size="md" text="给认养人发条长势" @click="pushByPlot" />
      </view>

      <view style="height: 40rpx" />
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import * as api from '@/api/index.js'
import { farmTasks, toggleTask, farmSide } from '@/store/farm-side.js'
import { toast } from '@/common/utils.js'

const statusBar = ref(20)
try {
  const info = uni.getStorageSync('sys_info')
  if (info && info.statusBarHeight) statusBar.value = info.statusBarHeight
} catch (e) {}

const tick = ref(0)
const openId = ref('')
const weather = ref(null)

const tasks = computed(() => {
  void tick.value
  void farmSide.tasks
  return farmTasks()
})

const todoTasks = computed(() => tasks.value.filter((t) => !t.done))
const doneTasks = computed(() => tasks.value.filter((t) => t.done))
const doneCount = computed(() => doneTasks.value.length)

const pct = computed(() => {
  if (!tasks.value.length) return 0
  return Math.round((doneCount.value / tasks.value.length) * 100)
})

const progressText = computed(() => {
  if (!tasks.value.length) return '今天还没有安排'
  if (!doneCount.value) return '一件都还没动，挑最急的先干'
  if (doneCount.value === tasks.value.length) return '全部干完了，早点收工'
  return `还剩 ${todoTasks.value.length} 件，天黑前能收工`
})

const today = computed(() => {
  const d = new Date()
  const w = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日 周${w}`
})

/** 天气对今天农活的影响：只看打药这一项，别的都能自己掌握 */
const weatherTip = computed(() => {
  const w = weather.value
  if (!w || !w.indexes) return null
  const spray = w.indexes.find((i) => i.key === 'spray')
  const hasSpray = todoTasks.value.some((t) => t.type === 'spray')
  if (spray && hasSpray && spray.score < 55) {
    return {
      tone: 'warn',
      emoji: '🌧️',
      title: `今天不建议打药（${spray.score} 分）`,
      text: w.tips && w.tips.length ? w.tips[0].text : '有雨或风大，药液容易被冲掉，改到明天更划算'
    }
  }
  if (spray && spray.score >= 80 && hasSpray) {
    return {
      tone: 'good',
      emoji: '✅',
      title: `今天适合打药（${spray.score} 分）`,
      text: '风小雨少，上午露水干后到 10 点前最好'
    }
  }
  return null
})

const TYPE = {
  spray: { name: '打药', bg: '#FFF4E4' },
  fert: { name: '施肥', bg: '#EAF9F1' },
  harvest: { name: '采收', bg: '#EAF3FF' },
  care: { name: '管护', bg: '#F0FBE9' }
}

const HOW = {
  spray: '上午露水干后到 10 点前打，避开中午高温和盛花期。叶背要打到，打完 6 小时内下雨需要补喷。口罩和手套别省。',
  fert: '先把土浇湿再下肥，别在中午施。冲施比撒施均匀，施完记一笔用量，下季才有参照。',
  harvest: '露水干了再采，采后挑掉碰伤的，2 小时内预冷或发出。挂名的认养人按份分好，别混在一起。',
  care: '按描述逐项做，做完拍张照。这类活最容易被忘，做一半记一半也行。'
}

function typeName(t) {
  return (TYPE[t] || TYPE.care).name
}

function typeBg(t) {
  return (TYPE[t] || TYPE.care).bg
}

function howTo(t) {
  return HOW[t.type] || HOW.care
}

function toggleOpen(id) {
  openId.value = openId.value === id ? '' : id
}

function finish(t) {
  toggleTask(t.id, true)
  tick.value++
  if (openId.value === t.id) openId.value = ''
  const left = todoTasks.value.length
  toast(left ? `已勾掉，还剩 ${left} 件` : '今天的活都干完了')
}

function undo(t) {
  toggleTask(t.id, false)
  tick.value++
  toast('已放回待办')
}

/** 收尾按钮：优先发最近完成的那块地 */
function pushByPlot() {
  const list = doneTasks.value
  const t = list.length ? list[0] : null
  if (!t) return
  to('/pages/farm/plot-manage?id=' + t.plotId + '&act=push')
}

function back() {
  const pages = getCurrentPages()
  if (pages && pages.length > 1) return uni.navigateBack()
  uni.reLaunch({ url: '/pages/farm/workbench' })
}

function to(url) {
  if (!url) return
  if (url.indexOf('/pages/tabbar') === 0) return uni.reLaunch({ url })
  uni.navigateTo({ url })
}

async function loadWeather() {
  try {
    weather.value = await api.fetchWeather()
  } catch (e) {}
}

onShow(() => {
  tick.value++
  loadWeather()
})
</script>

<style scoped>
.ts {
  min-height: 100vh;
  background: #f4f8f5;
}
.top {
  background: linear-gradient(160deg, #f0a04b 0%, #e08a2b 68%, #c97615 100%);
  padding: 0 28rpx 26rpx;
  border-radius: 0 0 36rpx 36rpx;
}
.t-row {
  height: 84rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.t-back {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.t-back.ghost {
  opacity: 0;
}
.t-title {
  font-size: 32rpx;
  font-weight: 800;
  color: #fff;
}
.prog {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: 6rpx;
}
.p-left {
  display: flex;
  align-items: baseline;
  gap: 6rpx;
}
.p-num {
  font-size: 56rpx;
  font-weight: 800;
  color: #fff;
  line-height: 1;
}
.p-of {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.82);
}
.p-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4rpx;
}
.p-date {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
}
.p-hint {
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.72);
}
.p-bar {
  height: 10rpx;
  border-radius: 10rpx;
  background: rgba(255, 255, 255, 0.24);
  margin-top: 16rpx;
  overflow: hidden;
}
.p-fill {
  height: 10rpx;
  border-radius: 10rpx;
  background: #fff3c4;
  transition: width 0.3s;
}

.body {
  padding: 22rpx 28rpx 0;
}

/* 天气提示 */
.wtip {
  display: flex;
  align-items: center;
  gap: 14rpx;
  border-radius: 22rpx;
  padding: 18rpx 20rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}
.wtip.warn {
  background: #fff8ec;
  border: 2rpx solid #ffe3bc;
}
.wtip.good {
  background: #eefaf3;
  border: 2rpx solid #cdf0dd;
}
.wt-e {
  font-size: 34rpx;
}
.wt-t {
  display: block;
  font-size: 23rpx;
  font-weight: 700;
  color: #16201c;
}
.wt-s {
  display: block;
  margin-top: 4rpx;
  font-size: 19rpx;
  color: #9aa7a1;
  line-height: 1.5;
}

.sec {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin: 26rpx 0 14rpx;
}
.sec.mt {
  margin-top: 34rpx;
}
.sec-t {
  font-size: 30rpx;
  font-weight: 700;
  color: #16201c;
}
.sec-n {
  min-width: 34rpx;
  height: 34rpx;
  border-radius: 34rpx;
  background: #ff5a4e;
  color: #fff;
  font-size: 18rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
}
.sec-n.gray {
  background: #dfe7e3;
  color: #7c8a84;
}

.task {
  background: #fff;
  border-radius: 22rpx;
  margin-bottom: 14rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
  overflow: hidden;
}
.task.done {
  background: #fbfdfc;
}
.tk-head {
  display: flex;
  align-items: flex-start;
  gap: 16rpx;
  padding: 20rpx;
}
.tk-ico {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.tk-ico.gray {
  background: #f2f6f3;
}
.tk-e {
  font-size: 34rpx;
}
.tk-t {
  display: block;
  font-size: 25rpx;
  font-weight: 700;
  color: #16201c;
  line-height: 1.4;
}
.tk-t.done {
  color: #9aa7a1;
  text-decoration: line-through;
}
.tk-s {
  display: block;
  margin-top: 4rpx;
  font-size: 19rpx;
  color: #9aa7a1;
  line-height: 1.5;
}
.tk-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 10rpx;
}
.tk-chip {
  font-size: 17rpx;
  color: #7c8a84;
  background: #f3f6f4;
  padding: 4rpx 10rpx;
  border-radius: 8rpx;
}
.tk-chip.type {
  color: #d97e1c;
  background: #fff4e4;
}
.tk-avs {
  display: flex;
  align-items: center;
}
.tk-av {
  width: 30rpx;
  height: 30rpx;
  border-radius: 50%;
  background: #eaf9f1;
  color: #06a96a;
  font-size: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: -6rpx;
  border: 2rpx solid #fff;
}
.tk-av:first-child {
  margin-left: 0;
}
.tk-av-n {
  font-size: 16rpx;
  color: #b3bfba;
  margin-left: 8rpx;
}
.tk-done {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #ffc46b;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.tk-undo {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.tk-more {
  background: #fffdf8;
  border-top: 2rpx solid #fff4e4;
  padding: 16rpx 20rpx 18rpx;
}
.tm-l {
  display: block;
  font-size: 17rpx;
  color: #c0a781;
  font-weight: 600;
}
.tm-t {
  display: block;
  margin-top: 6rpx;
  font-size: 20rpx;
  color: #6a5a44;
  line-height: 1.65;
}
.tm-btns {
  display: flex;
  gap: 12rpx;
  margin-top: 14rpx;
}
.tm-btn {
  flex: 1;
  height: 60rpx;
  border-radius: 30rpx;
  background: #fff3e2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  font-size: 20rpx;
  color: #d97e1c;
  font-weight: 600;
}

.empty-card {
  background: #fff;
  border-radius: 22rpx;
  padding: 40rpx 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}
.ec-e {
  font-size: 50rpx;
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
}

.tail {
  margin-top: 26rpx;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.tail-t {
  font-size: 25rpx;
  font-weight: 700;
  color: #16201c;
}
.tail-s {
  font-size: 19rpx;
  color: #9aa7a1;
  line-height: 1.6;
  margin-bottom: 8rpx;
}
.card {
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}
</style>

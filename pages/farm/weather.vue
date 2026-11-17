<template>
  <view class="page wt">
    <nav-bar title="农事天气" light :bg="headBg">
      <template #right>
        <view class="nav-btn" @tap="reload">
          <icon-svg name="refresh" :size="30" color="#FFFFFF" :stroke="2" />
        </view>
      </template>
    </nav-bar>

    <!-- 当前天气 -->
    <view class="hero" :style="{ background: headBg }">
      <view class="h-place">
        <icon-svg name="location" :size="24" color="rgba(255,255,255,.85)" :stroke="1.8" />
        <text class="h-place-t">{{ w.place || '定位中' }}</text>
        <text v-if="w.mock" class="h-badge">演示数据</text>
      </view>

      <view class="h-main">
        <text class="h-emoji">{{ w.now.emoji || '⛅' }}</text>
        <view class="h-temp-box">
          <text class="h-temp">{{ w.now.temp }}</text>
          <text class="h-deg">℃</text>
        </view>
        <view class="h-side">
          <text class="h-text">{{ w.now.text }}</text>
          <text class="h-range">{{ today.min }}~{{ today.max }}℃</text>
        </view>
      </view>

      <view class="h-meta">
        <view class="hm">
          <text class="hm-n">{{ w.now.feels }}℃</text>
          <text class="hm-l">体感</text>
        </view>
        <view class="hm-div" />
        <view class="hm">
          <text class="hm-n">{{ w.now.humidity }}%</text>
          <text class="hm-l">湿度</text>
        </view>
        <view class="hm-div" />
        <view class="hm">
          <text class="hm-n">{{ w.now.wind }}m/s</text>
          <text class="hm-l">{{ w.now.windDir || '风速' }}</text>
        </view>
        <view class="hm-div" />
        <view class="hm">
          <text class="hm-n">{{ today.rainProb }}%</text>
          <text class="hm-l">降水概率</text>
        </view>
      </view>

      <view class="h-sun">
        <text class="hs">🌅 日出 {{ today.sunrise || '—' }}</text>
        <text class="hs">🌇 日落 {{ today.sunset || '—' }}</text>
        <text v-if="today.uv" class="hs">☀️ 紫外线 {{ today.uv }}</text>
      </view>
    </view>

    <view class="body">
      <!-- 农事指数 -->
      <view class="card idx">
        <view class="row between">
          <text class="c-t">今明两天能干什么</text>
          <text class="c-s">综合温度/风/雨算的，仅供参考</text>
        </view>
        <view class="idx-grid">
          <view v-for="i in indexes" :key="i.key" class="idx-item">
            <view class="ix-top">
              <text class="ix-emoji">{{ i.emoji }}</text>
              <text class="ix-name">{{ i.name }}</text>
            </view>
            <text class="ix-score" :style="{ color: toneOf(i.score).color }">{{ i.score }}</text>
            <view class="ix-bar">
              <view class="ix-fill" :style="{ width: i.score + '%', background: toneOf(i.score).color }" />
            </view>
            <text class="ix-lv" :style="{ color: toneOf(i.score).color }">{{ levelOf(i.score) }}</text>
          </view>
        </view>
      </view>

      <!-- 7 日 -->
      <view class="card">
        <view class="row between mb">
          <text class="c-t">未来 {{ w.days.length || 0 }} 天</text>
          <text class="c-s">点某天看建议</text>
        </view>
        <scroll-view scroll-x class="days no-scrollbar" :show-scrollbar="false">
          <view class="days-in" :class="{ short: (w.days || []).length <= 4 }">
            <view
              v-for="(d, di) in w.days"
              :key="d.date"
              class="day"
              :class="{ on: di === activeDay }"
              @tap="activeDay = di"
            >
              <text class="d-week">{{ d.week }}</text>
              <text class="d-emoji">{{ d.emoji }}</text>
              <text class="d-temp">{{ d.min }}~{{ d.max }}°</text>
              <text class="d-rain" :class="{ wet: d.rainProb >= 50 }">{{ d.rainProb }}%</text>
            </view>
          </view>
        </scroll-view>

        <!-- 选中日的细化 -->
        <view v-if="active" class="day-detail">
          <view class="dd-row">
            <text class="dd-k">白天</text>
            <text class="dd-v">{{ active.text }}</text>
          </view>
          <view v-if="active.night" class="dd-row">
            <text class="dd-k">夜间</text>
            <text class="dd-v">{{ active.night }}</text>
          </view>
          <view class="dd-row">
            <text class="dd-k">温度</text>
            <text class="dd-v">{{ active.min }}~{{ active.max }}℃ · 温差 {{ active.max - active.min }}℃</text>
          </view>
          <view class="dd-row">
            <text class="dd-k">降水</text>
            <text class="dd-v">{{ active.rainProb }}% · 约 {{ active.rainMm }}mm</text>
          </view>
          <view class="dd-row">
            <text class="dd-k">风</text>
            <text class="dd-v">最大 {{ active.windMax }}m/s</text>
          </view>
          <view class="dd-row">
            <text class="dd-k">湿度</text>
            <text class="dd-v">{{ active.humidity }}%</text>
          </view>
        </view>
      </view>

      <!-- 农事建议 -->
      <view class="card">
        <view class="row between mb">
          <text class="c-t">这几天的农活怎么安排</text>
        </view>
        <view v-for="t in tips" :key="t.key" class="tip" :class="t.level">
          <view class="tip-ico">
            <text class="tip-emoji">{{ t.emoji }}</text>
          </view>
          <view class="flex1">
            <text class="tip-t">{{ t.title }}</text>
            <text class="tip-d">{{ t.desc }}</text>
          </view>
        </view>
      </view>

      <!-- 说明 -->
      <view class="src">
        <text class="src-t">
          数据来源：{{ w.source }}<text v-if="w.mock">（未取到实时数据，当前为演示值）</text>
        </text>
        <text class="src-t">更新时间 {{ updatedText }} · 每 20 分钟自动缓存</text>
        <text v-if="w.provider === 'seniverse'" class="src-t">天气数据由心知天气（Seniverse）提供</text>
        <text v-if="dayNote" class="src-t">{{ dayNote }}</text>
        <text v-if="w.degraded && w.error" class="src-t warn-t">
          主数据源没连上（{{ w.error }}），已自动切到 {{ w.source }}
        </text>
        <text v-if="w.mock && w.error" class="src-t warn-t">未取到实时数据的原因：{{ w.error }}</text>
        <text class="src-t">{{ placeTip }}</text>
      </view>

      <view class="foot-btns">
        <ui-btn type="ghost" size="md" text="刷新天气" @click="reload" />
        <ui-btn type="ghost" size="md" text="改用定位" @click="useGps" />
      </view>

      <view style="height: 40rpx" />
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import * as api from '@/api/index.js'
import { toast } from '@/common/utils.js'

const w = ref({
  place: '',
  now: {},
  days: [],
  tips: [],
  indexes: [],
  mock: false,
  source: ''
})
const activeDay = ref(0)
const loading = ref(false)

const today = computed(() => w.value.days[0] || { min: 0, max: 0, rainProb: 0, sunrise: '', sunset: '', uv: 0 })
const active = computed(() => w.value.days[activeDay.value] || null)
const indexes = computed(() => w.value.indexes || [])
const tips = computed(() => w.value.tips || [])

const updatedText = computed(() => {
  if (!w.value.updatedAt) return '—'
  const d = new Date(w.value.updatedAt)
  const p = (n) => (n < 10 ? '0' + n : '' + n)
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
})

const placeTip = computed(() => {
  if (w.value.precise) return '已使用当前位置'
  return '未获取到定位，按农场所在地（湘西龙山）显示；可点「改用定位」重试'
})

// 预报天数不满 7 天时说清楚为什么，别让人以为是加载失败
const dayNote = computed(() => {
  const n = (w.value.days || []).length
  if (!n || n >= 7) return ''
  if (w.value.provider === 'seniverse') return `心知免费版提供 ${n} 天预报，更长时效需开通付费版`
  return `当前数据源提供 ${n} 天预报`
})

const TONE_BG = {
  gold: 'linear-gradient(160deg, #FFB75E 0%, #E98604 100%)',
  info: 'linear-gradient(160deg, #6FB1FC 0%, #3B62D6 100%)',
  warn: 'linear-gradient(160deg, #5B8FB9 0%, #2F5168 100%)',
  gray: 'linear-gradient(160deg, #8E9EAB 0%, #55636F 100%)',
  danger: 'linear-gradient(160deg, #4B5866 0%, #232B33 100%)'
}

const headBg = computed(() => {
  const tone = (w.value.now && w.value.now.tone) || 'gold'
  return TONE_BG[tone] || TONE_BG.gold
})

const TONE_COLOR = { brand: '#0A8F5C', info: '#4A8CFF', warn: '#E08A2B', danger: '#FF5A4E', gold: '#B07A00' }

function toneOf(score) {
  const lv = api.indexLevel(score)
  return { color: TONE_COLOR[lv.tone] || TONE_COLOR.info, text: lv.text }
}

function levelOf(score) {
  return api.indexLevel(score).text
}

async function load(force = false) {
  if (loading.value) return
  loading.value = true
  try {
    const data = await api.fetchWeather({ force })
    w.value = data
    activeDay.value = 0
    if (data.mock && force) toast('当前用演示数据，检查网络或后台域名白名单')
  } catch (e) {
    toast('天气加载失败')
  } finally {
    loading.value = false
  }
}

function reload() {
  load(true)
}

async function useGps() {
  api.setWeatherConfig({ useLocation: true })
  await load(true)
}

onLoad(() => {
  load()
})
</script>

<style scoped>
.wt {
  min-height: 100vh;
  background: #f4f8f5;
}
.nav-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
}
.hero {
  padding: 6rpx 32rpx 30rpx;
  border-radius: 0 0 36rpx 36rpx;
}
.h-place {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.h-place-t {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.9);
}
.h-badge {
  margin-left: 8rpx;
  font-size: 17rpx;
  color: #fff;
  background: rgba(255, 255, 255, 0.24);
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
}
.h-main {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-top: 18rpx;
}
.h-emoji {
  font-size: 80rpx;
  line-height: 1;
}
.h-temp-box {
  display: flex;
  align-items: flex-start;
}
.h-temp {
  font-size: 92rpx;
  font-weight: 800;
  color: #fff;
  line-height: 1;
  letter-spacing: -2rpx;
}
.h-deg {
  font-size: 30rpx;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 10rpx;
}
.h-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.h-text {
  font-size: 27rpx;
  font-weight: 700;
  color: #fff;
}
.h-range {
  font-size: 21rpx;
  color: rgba(255, 255, 255, 0.78);
  margin-top: 6rpx;
}
.h-meta {
  display: flex;
  align-items: center;
  margin-top: 26rpx;
  background: rgba(255, 255, 255, 0.14);
  border-radius: 20rpx;
  padding: 16rpx 0;
}
.hm {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}
.hm-n {
  font-size: 24rpx;
  font-weight: 700;
  color: #fff;
}
.hm-l {
  font-size: 17rpx;
  color: rgba(255, 255, 255, 0.7);
}
.hm-div {
  width: 2rpx;
  height: 30rpx;
  background: rgba(255, 255, 255, 0.22);
}
.h-sun {
  display: flex;
  gap: 20rpx;
  margin-top: 16rpx;
  flex-wrap: wrap;
}
.hs {
  font-size: 19rpx;
  color: rgba(255, 255, 255, 0.8);
}

.body {
  padding: 22rpx 24rpx 0;
}
.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 22rpx;
  margin-bottom: 18rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}
.c-t {
  font-size: 27rpx;
  font-weight: 700;
  color: #16201c;
}
.c-s {
  font-size: 18rpx;
  color: #b3bfba;
}
.mb {
  margin-bottom: 18rpx;
}

/* 指数 */
.idx-grid {
  display: flex;
  gap: 12rpx;
  margin-top: 6rpx;
}
.idx-item {
  flex: 1;
  background: #f7faf8;
  border-radius: 18rpx;
  padding: 14rpx 10rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.ix-top {
  display: flex;
  align-items: center;
  gap: 4rpx;
}
.ix-emoji {
  font-size: 22rpx;
}
.ix-name {
  font-size: 20rpx;
  color: #5c6a64;
}
.ix-score {
  font-size: 32rpx;
  font-weight: 800;
  margin-top: 6rpx;
}
.ix-bar {
  width: 100%;
  height: 8rpx;
  border-radius: 8rpx;
  background: #e6ede9;
  margin-top: 8rpx;
  overflow: hidden;
}
.ix-fill {
  height: 8rpx;
  border-radius: 8rpx;
}
.ix-lv {
  font-size: 17rpx;
  margin-top: 6rpx;
}

/* 7 日 */
.days {
  width: 100%;
}
.days-in {
  display: flex;
  gap: 10rpx;
}
/* 心知只有 3 天，卡片少了就铺满整行，别留一半空白 */
.days-in.short {
  width: 100%;
}
.days-in.short .day {
  width: auto;
  flex: 1;
}
.day {
  width: 108rpx;
  flex-shrink: 0;
  background: #f7faf8;
  border-radius: 18rpx;
  padding: 14rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
  border: 2rpx solid transparent;
}
.day.on {
  background: #fff8ee;
  border-color: #ffd9a8;
}
.d-week {
  font-size: 19rpx;
  color: #5c6a64;
}
.d-emoji {
  font-size: 32rpx;
  margin: 2rpx 0;
}
.d-temp {
  font-size: 19rpx;
  color: #16201c;
  font-weight: 600;
}
.d-rain {
  font-size: 17rpx;
  color: #b3bfba;
}
.d-rain.wet {
  color: #4a8cff;
}
.day-detail {
  margin-top: 18rpx;
  padding-top: 16rpx;
  border-top: 2rpx solid #f2f5f3;
}
.dd-row {
  display: flex;
  justify-content: space-between;
  padding: 7rpx 0;
}
.dd-k {
  font-size: 21rpx;
  color: #9aa7a1;
}
.dd-v {
  font-size: 21rpx;
  color: #3d4a45;
  font-weight: 600;
}

/* 建议 */
.tip {
  display: flex;
  gap: 14rpx;
  padding: 16rpx 0;
  border-top: 2rpx solid #f6f8f7;
}
.tip:first-of-type {
  border-top: none;
  padding-top: 4rpx;
}
.tip-ico {
  width: 56rpx;
  height: 56rpx;
  border-radius: 16rpx;
  background: #f2f7f4;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.tip.danger .tip-ico {
  background: #fff0ee;
}
.tip.warn .tip-ico {
  background: #fff6e9;
}
.tip.info .tip-ico {
  background: #edf4ff;
}
.tip-emoji {
  font-size: 28rpx;
}
.tip-t {
  display: block;
  font-size: 23rpx;
  font-weight: 700;
  color: #16201c;
}
.tip-d {
  display: block;
  font-size: 20rpx;
  color: #6d7a74;
  line-height: 1.6;
  margin-top: 4rpx;
}

.src {
  padding: 6rpx 8rpx 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.src-t {
  font-size: 18rpx;
  color: #b3bfba;
  line-height: 1.6;
}
.src-t.warn-t {
  color: #e08a2b;
}
.foot-btns {
  display: flex;
  gap: 16rpx;
  margin-top: 22rpx;
}
</style>

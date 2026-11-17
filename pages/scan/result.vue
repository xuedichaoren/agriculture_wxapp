<template>
  <view class="page res">
    <nav-bar title="诊断结果" bg="#F4F8F5" />

    <view v-if="!r" class="miss">
      <text class="miss-e">🔍</text>
      <text class="miss-t">这条记录已经不在了</text>
      <ui-btn type="ghost" size="sm" text="重新拍一张" @click="again" />
    </view>

    <view v-else class="body">
      <!-- 结论 -->
      <view class="hero" :style="{ background: heroBg }">
        <view class="hero-top">
          <view class="h-left">
            <view class="h-plant">
              <text class="h-emoji">{{ r.plant ? r.plant.emoji : '🌿' }}</text>
              <text class="h-plant-t">{{ r.plant ? r.plant.name : '作物未识别' }}</text>
              <text v-if="r.plant && !r.plantFromUser" class="h-conf">{{ r.plant.confidence }}%</text>
            </view>
            <text class="h-name">{{ r.headline }}</text>
            <view class="h-tags">
              <text v-if="r.disease" class="h-tag">置信度 {{ r.disease.confidence }}%</text>
              <text v-if="r.disease" class="h-tag">{{ r.disease.type }}</text>
              <text class="h-tag" :class="'sev-' + r.severity.level">{{ r.severity.text }}</text>
            </view>
          </view>
          <view v-if="r.filePath" class="h-thumb" @tap="preview">
            <image :src="r.filePath" mode="aspectFill" class="h-img" />
          </view>
        </view>

        <view class="hero-foot">
          <text class="hf-t">{{ providerText }}</text>
          <text class="hf-t">{{ fmt(r.at) }}</text>
        </view>
      </view>

      <!-- 专家复核提示 -->
      <view v-if="r.needExpert" class="warn-bar" @tap="toAsk">
        <text class="wb-e">⚠️</text>
        <view class="flex1">
          <text class="wb-t">这株情况偏重 / 把握不大，建议找专家复核</text>
          <text class="wb-s">把照片和这份结果一起发过去，专家能直接看</text>
        </view>
        <text class="wb-go">去问诊</text>
      </view>

      <!-- 严重度 -->
      <view class="card sec">
        <view class="row between sec-head">
          <text class="st-title">严重程度</text>
          <text class="st-val" :style="{ color: sevColor }">{{ r.severity.text }}</text>
        </view>
        <view class="sev">
          <view v-for="i in 5" :key="i" class="sev-cell" :style="{ background: i <= r.severity.level ? sevColor : '#EEF4F0' }" />
        </view>
        <text class="sev-advice">{{ r.severity.advice }}</text>
        <text class="feat">{{ r.featureText }}</text>
      </view>

      <!-- 健康 -->
      <view v-if="r.healthy" class="card ok">
        <text class="ok-e">✅</text>
        <view class="flex1">
          <text class="ok-t">叶面没有明显病斑</text>
          <text class="ok-s">继续按当前管理，重点看下部老叶和叶背，发现零星病叶先摘除带出田外。</text>
        </view>
      </view>

      <!-- 症状 -->
      <view v-if="r.disease" class="card sec">
        <text class="sec-title">对照症状</text>
        <view v-for="(s, i) in r.disease.symptoms" :key="i" class="row-line">
          <view class="dot" />
          <text class="line-t">{{ s }}</text>
        </view>
      </view>

      <!-- 成因 -->
      <view v-if="r.disease" class="card sec">
        <text class="sec-title">可能成因</text>
        <view v-for="(c, i) in r.disease.causes" :key="i" class="cause">
          <text class="cause-n">{{ i + 1 }}</text>
          <text class="line-t">{{ c }}</text>
        </view>
      </view>

      <!-- 方案 -->
      <view v-if="r.disease" class="card sec">
        <view class="row between sec-head">
          <text class="sec-title">处理方案</text>
          <text class="sec-sub">按顺序做</text>
        </view>
        <ui-segment :options="planTabs" :value="planTab" size="sm" @change="onPlan" />
        <view class="plan">
          <view v-for="(p, i) in planList" :key="i" class="plan-row">
            <view class="plan-n">{{ i + 1 }}</view>
            <text class="plan-t">{{ p }}</text>
          </view>
          <text v-if="planTab === 'chem'" class="plan-warn">
            用药按标签登记作物与浓度，采收前注意安全间隔期；不确定时先小面积试喷。
          </text>
          <text v-if="planTab === 'bio'" class="plan-warn">
            生物制剂见效慢（3~5 天），要提前用、连续用，不能等病害重了再上。
          </text>
        </view>
      </view>

      <!-- 用药 -->
      <view v-if="r.disease" class="card sec">
        <text class="sec-title">用药参考</text>
        <view class="meds">
          <text v-for="m in medList" :key="m" class="med">{{ m }}</text>
        </view>
        <text class="med-tip">
          以上为常见药剂方向，具体产品、浓度以标签为准。同一药剂一季不超过 3 次，注意轮换避免抗性。
        </text>
      </view>

      <!-- 预防 -->
      <view v-if="r.disease" class="card sec">
        <text class="sec-title">下次怎么防</text>
        <view v-for="(p, i) in r.disease.prevent" :key="i" class="row-line">
          <text class="chk">✓</text>
          <text class="line-t">{{ p }}</text>
        </view>
      </view>

      <!-- 易混淆 -->
      <view v-if="r.disease && r.disease.confuse && r.disease.confuse.length" class="card sec">
        <text class="sec-title">容易混淆</text>
        <view v-for="(c, i) in r.disease.confuse" :key="i" class="row-line">
          <text class="q">?</text>
          <text class="line-t">{{ c }}</text>
        </view>
      </view>

      <!-- 备选 -->
      <view v-if="r.alternatives && r.alternatives.length" class="card sec">
        <text class="sec-title">也有一点像</text>
        <view v-for="a in r.alternatives" :key="a.id" class="row between alt">
          <text class="alt-n">{{ a.name }}</text>
          <text class="alt-c">{{ a.confidence }}%</text>
        </view>
      </view>

      <!-- 长势 -->
      <view v-if="r.growth && r.growth.length" class="card sec">
        <text class="sec-title">长势排查</text>
        <view v-for="g in r.growth" :key="g.id" class="grow">
          <view class="row between">
            <text class="grow-n">{{ g.name }}</text>
            <ui-tag :tone="g.severity >= 4 ? 'danger' : g.severity === 3 ? 'warn' : 'brand'" size="sm" :text="g.type" />
          </view>
          <text class="grow-s">{{ g.symptoms[0] }}</text>
          <text class="grow-a">先这样做：{{ g.plan.agri[0] }}</text>
        </view>
      </view>

      <!-- 提示 -->
      <view class="disc">
        <text class="disc-t">识别说明</text>
        <text class="disc-s">
          {{ providerText }}。结果只作田间参考，不能替代专家现场诊断；涉及大面积用药、检疫性病害（如黄龙病）请先联系当地植保站。
        </text>
        <text class="disc-s">拍摄建议：{{ r.tip }}</text>
      </view>

      <view style="height: 130rpx" />
    </view>

    <!-- 底部操作 -->
    <view v-if="r" class="bar">
      <view class="bar-btn"><ui-btn type="line" block text="再拍一张" @click="again" /></view>
      <view class="bar-btn"><ui-btn type="primary" block text="找专家复核" @click="toAsk" /></view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { findResult } from '@/store/diagnose.js'
import { tone } from '@/common/theme.js'
import { toast } from '@/common/utils.js'

const id = ref('')
const r = ref(null)
const planTab = ref('agri')

const planTabs = [
  { key: 'agri', label: '农业防治' },
  { key: 'bio', label: '绿色防控' },
  { key: 'chem', label: '药剂防治' }
]

onLoad((q) => {
  id.value = (q && q.id) || ''
  r.value = findResult(id.value)
})

const providerText = computed(() => {
  if (!r.value) return ''
  const p = r.value.provider
  if (p === 'model') return '服务端模型识别'
  if (p === 'device') return '端侧图像特征 + 知识库匹配'
  return '演示模式（未读取到图像，按指纹生成）'
})

const heroBg = computed(() => {
  if (!r.value) return 'linear-gradient(150deg,#16D488,#0BBD72)'
  if (r.value.healthy) return 'linear-gradient(150deg,#16D488,#0AA868)'
  if (r.value.severity.level >= 4) return 'linear-gradient(150deg,#FF8B6B,#E4573B)'
  if (r.value.severity.level === 3) return 'linear-gradient(150deg,#FFB65C,#F08A2C)'
  return 'linear-gradient(150deg,#2AC98A,#0E9F6E)'
})

const sevColor = computed(() => (r.value ? tone(r.value.severity.tone).color : '#06A96A'))

const planList = computed(() => {
  if (!r.value || !r.value.disease) return []
  const p = r.value.disease.plan || {}
  return p[planTab.value] || []
})

const medList = computed(() => {
  if (!r.value || !r.value.disease) return []
  const m = r.value.disease.medicine || ''
  return String(m)
    .split(/[·、,，/]/)
    .map((x) => x.trim())
    .filter(Boolean)
})

function onPlan(v) {
  planTab.value = v
}

function fmt(ts) {
  const d = new Date(ts)
  const p = (n) => (n < 10 ? '0' + n : '' + n)
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function preview() {
  if (!r.value || !r.value.filePath) return
  uni.previewImage({ urls: [r.value.filePath], current: 0 })
}

function again() {
  uni.redirectTo({ url: '/pages/scan/scan' })
}

function toAsk() {
  if (!r.value) return
  const crop = r.value.plant ? r.value.plant.key : ''
  uni.navigateTo({ url: '/pages/expert/ask?crop=' + crop + '&from=scan&r=' + r.value.id })
}
</script>

<style scoped>
.res {
  min-height: 100vh;
}
.body {
  padding: 6rpx 28rpx 0;
}
.hero {
  border-radius: 28rpx;
  padding: 26rpx 24rpx 18rpx;
  color: #fff;
}
.hero-top {
  display: flex;
  gap: 18rpx;
}
.h-left {
  flex: 1;
  min-width: 0;
}
.h-plant {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 40rpx;
  padding: 5rpx 16rpx;
}
.h-emoji {
  font-size: 24rpx;
}
.h-plant-t {
  font-size: 20rpx;
  color: #fff;
  font-weight: 600;
}
.h-conf {
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.72);
}
.h-name {
  display: block;
  margin-top: 16rpx;
  font-size: 42rpx;
  font-weight: 800;
  letter-spacing: -0.8rpx;
  line-height: 1.25;
}
.h-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 14rpx;
}
.h-tag {
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.92);
  background: rgba(255, 255, 255, 0.18);
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
}
.sev-4,
.sev-5 {
  background: rgba(255, 255, 255, 0.28);
  font-weight: 700;
}
.h-thumb {
  width: 150rpx;
  height: 150rpx;
  border-radius: 20rpx;
  overflow: hidden;
  flex-shrink: 0;
  border: 3rpx solid rgba(255, 255, 255, 0.35);
}
.h-img {
  width: 100%;
  height: 100%;
  display: block;
}
.hero-foot {
  display: flex;
  justify-content: space-between;
  margin-top: 22rpx;
  padding-top: 14rpx;
  border-top: 2rpx solid rgba(255, 255, 255, 0.16);
}
.hf-t {
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.72);
}
.warn-bar {
  display: flex;
  align-items: center;
  gap: 14rpx;
  background: #fff4e4;
  border-radius: 22rpx;
  padding: 20rpx 20rpx;
  margin-top: 18rpx;
  border: 2rpx solid #ffe2bc;
}
.wb-e {
  font-size: 32rpx;
}
.wb-t {
  display: block;
  font-size: 23rpx;
  color: #b07a00;
  font-weight: 700;
}
.wb-s {
  display: block;
  margin-top: 4rpx;
  font-size: 19rpx;
  color: #b99a52;
}
.wb-go {
  font-size: 21rpx;
  color: #b07a00;
  font-weight: 700;
  flex-shrink: 0;
}
.card {
  background: #fff;
  border-radius: 26rpx;
  box-shadow: 0 8rpx 30rpx rgba(22, 60, 45, 0.05);
}
.sec {
  margin-top: 18rpx;
  padding: 24rpx;
}
.sec-head {
  margin-bottom: 14rpx;
}
.sec-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #16201c;
}
.sec-sub {
  font-size: 19rpx;
  color: #b3bfba;
}
.st-title {
  font-size: 26rpx;
  font-weight: 700;
}
.st-val {
  font-size: 24rpx;
  font-weight: 800;
}
.sev {
  display: flex;
  gap: 8rpx;
  margin: 6rpx 0 16rpx;
}
.sev-cell {
  flex: 1;
  height: 14rpx;
  border-radius: 14rpx;
}
.sev-advice {
  display: block;
  font-size: 23rpx;
  color: #3d4a45;
  line-height: 1.6;
}
.feat {
  display: block;
  margin-top: 10rpx;
  font-size: 19rpx;
  color: #b3bfba;
  line-height: 1.55;
}
.ok {
  display: flex;
  gap: 16rpx;
  margin-top: 18rpx;
  padding: 24rpx;
  background: #e9faf2;
  align-items: flex-start;
}
.ok-e {
  font-size: 36rpx;
}
.ok-t {
  display: block;
  font-size: 26rpx;
  font-weight: 700;
  color: #06a96a;
}
.ok-s {
  display: block;
  margin-top: 6rpx;
  font-size: 21rpx;
  color: #3d8a6b;
  line-height: 1.6;
}
.row-line {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  padding: 10rpx 0;
}
.dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: #0fc97a;
  margin-top: 14rpx;
  flex-shrink: 0;
}
.line-t {
  flex: 1;
  font-size: 23rpx;
  color: #3d4a45;
  line-height: 1.65;
}
.cause {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  padding: 10rpx 0;
}
.cause-n {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background: #fff4e4;
  color: #b07a00;
  font-size: 18rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2rpx;
}
.plan {
  margin-top: 16rpx;
}
.plan-row {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  padding: 10rpx 0;
}
.plan-n {
  width: 36rpx;
  height: 36rpx;
  border-radius: 10rpx;
  background: #e9faf2;
  color: #06a96a;
  font-size: 19rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2rpx;
}
.plan-t {
  flex: 1;
  font-size: 23rpx;
  color: #3d4a45;
  line-height: 1.65;
}
.plan-warn {
  display: block;
  margin-top: 10rpx;
  padding: 14rpx 16rpx;
  background: #fff8e6;
  border-radius: 14rpx;
  font-size: 20rpx;
  color: #b07a00;
  line-height: 1.6;
}
.meds {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin: 4rpx 0 12rpx;
}
.med {
  font-size: 21rpx;
  color: #06a96a;
  background: #e9faf2;
  border-radius: 8rpx;
  padding: 6rpx 14rpx;
}
.med-tip {
  display: block;
  font-size: 19rpx;
  color: #9aa7a1;
  line-height: 1.6;
}
.chk {
  font-size: 22rpx;
  color: #0fc97a;
  font-weight: 700;
  margin-top: 2rpx;
}
.q {
  font-size: 22rpx;
  color: #b3bfba;
  font-weight: 700;
  margin-top: 2rpx;
}
.alt {
  padding: 12rpx 0;
  border-bottom: 2rpx solid #f4f8f5;
}
.alt:last-child {
  border-bottom: none;
}
.alt-n {
  font-size: 23rpx;
  color: #3d4a45;
}
.alt-c {
  font-size: 21rpx;
  color: #b3bfba;
}
.grow {
  padding: 14rpx 0;
  border-bottom: 2rpx solid #f4f8f5;
}
.grow:last-child {
  border-bottom: none;
}
.grow-n {
  font-size: 24rpx;
  font-weight: 700;
  color: #16201c;
}
.grow-s {
  display: block;
  margin-top: 6rpx;
  font-size: 21rpx;
  color: #7c8a84;
  line-height: 1.55;
}
.grow-a {
  display: block;
  margin-top: 6rpx;
  font-size: 21rpx;
  color: #06a96a;
  line-height: 1.55;
}
.disc {
  margin-top: 24rpx;
  padding: 20rpx 22rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.disc-t {
  font-size: 21rpx;
  font-weight: 700;
  color: #3d4a45;
}
.disc-s {
  font-size: 19rpx;
  color: #9aa7a1;
  line-height: 1.6;
}
.bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  padding: 16rpx 28rpx calc(16rpx + env(safe-area-inset-bottom));
  display: flex;
  gap: 16rpx;
  box-shadow: 0 -6rpx 26rpx rgba(22, 60, 45, 0.06);
  z-index: 60;
}
.bar-btn {
  flex: 1;
}
.miss {
  padding: 160rpx 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}
.miss-e {
  font-size: 88rpx;
}
.miss-t {
  font-size: 26rpx;
  color: #9aa7a1;
}
</style>

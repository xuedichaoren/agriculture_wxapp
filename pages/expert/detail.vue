<template>
  <view class="page dt">
    <nav-bar title="专家主页" bg="#0E9F6E" light />

    <view v-if="!e" class="miss">
      <text class="miss-t">这位专家不见了</text>
    </view>

    <view v-else class="body">
      <!-- 头部 -->
      <view class="head">
        <view class="h-deco d1" />
        <view class="h-deco d2" />
        <view class="h-row">
          <ui-avatar :size="140" :emoji="e.emoji" ring :online="e.online" />
          <view class="flex1">
            <view class="h-name-row">
              <text class="h-name">{{ e.name }}</text>
              <text class="h-title">{{ e.title }}</text>
            </view>
            <text class="h-org">{{ e.org }}</text>
            <view class="h-tags">
              <text v-for="t in e.tags" :key="t" class="h-tag">{{ t }}</text>
            </view>
          </view>
        </view>

        <view class="h-stats">
          <view class="hs">
            <text class="hs-n">{{ e.rating }}</text>
            <text class="hs-l">评分</text>
          </view>
          <view class="hs-div" />
          <view class="hs">
            <text class="hs-n">{{ e.answered }}</text>
            <text class="hs-l">已解答</text>
          </view>
          <view class="hs-div" />
          <view class="hs">
            <text class="hs-n">{{ e.replyMin }}<text class="hs-u">分</text></text>
            <text class="hs-l">平均回复</text>
          </view>
          <view class="hs-div" />
          <view class="hs">
            <text class="hs-n">{{ e.years }}<text class="hs-u">年</text></text>
            <text class="hs-l">从业</text>
          </view>
        </view>
      </view>

      <view class="content">
        <!-- 简介 -->
        <view class="card sec">
          <text class="sec-t">专家简介</text>
          <text class="intro">{{ e.intro }}</text>
          <view class="cert">
            <icon-svg name="checkCircle" :size="26" color="#06A96A" :stroke="1.8" />
            <text class="cert-t">{{ e.cert }}</text>
          </view>
        </view>

        <!-- 擅长 -->
        <view class="card sec">
          <text class="sec-t">擅长作物</text>
          <view class="crops">
            <view v-for="c in e.crops" :key="c" class="crop">
              <text class="crop-t">{{ c }}</text>
            </view>
          </view>
          <text class="sec-t mt">服务内容</text>
          <view v-for="(s, i) in e.service" :key="i" class="srv">
            <text class="srv-dot">✓</text>
            <text class="srv-t">{{ s }}</text>
          </view>
        </view>

        <!-- 回答 -->
        <view v-if="answers.length" class="card sec">
          <view class="row between">
            <text class="sec-t">TA 的公开回答</text>
            <text class="sec-more" @tap="toQa">全部</text>
          </view>
          <view v-for="a in answers" :key="a.id" class="ans">
            <view class="ans-head">
              <text class="ans-crop">{{ a.crop }}</text>
              <text class="ans-q">{{ a.title }}</text>
            </view>
            <text class="ans-a">{{ lastText(a) }}</text>
          </view>
        </view>

        <!-- 评价 -->
        <view class="card sec">
          <view class="row between">
            <text class="sec-t">农友评价</text>
            <text class="sec-more">{{ reviews.length }} 条</text>
          </view>
          <view v-for="r in reviews" :key="r.id" class="rev">
            <view class="rev-head">
              <text class="rev-user">{{ r.user }}</text>
              <view class="stars">
                <text v-for="i in 5" :key="i" class="star" :class="{ on: i <= r.stars }">★</text>
              </view>
              <text class="rev-days">{{ r.days }} 天前</text>
            </view>
            <text class="rev-t">{{ r.text }}</text>
            <text class="rev-crop">咨询作物：{{ r.crop }}</text>
          </view>
        </view>

        <view class="note">
          <text class="note-t">问诊说明</text>
          <text class="note-s">· 图文问诊按次计费（{{ e.price ? '¥' + e.price : '免费' }}），演示版不产生真实支付</text>
          <text class="note-s">· 拍清楚病叶正反面，说明作物、面积、已用药情况，回复会快很多</text>
          <text class="note-s">· 专家建议仅供参考，大面积用药前请先小面积试喷</text>
        </view>

        <view style="height: 140rpx" />
      </view>
    </view>

    <view v-if="e" class="bar">
      <view class="bar-btn">
        <ui-btn type="line" block text="公开提问" @click="toAsk('public')" />
      </view>
      <view class="bar-btn">
        <ui-btn type="primary" block :text="e.price ? '图文问诊 ¥' + e.price : '免费图文问诊'" @click="toAsk('expert')" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { expertOf, reviewsOf } from '@/api/expert.js'
import { allQuestions } from '@/store/expert.js'

const id = ref('')
const e = computed(() => expertOf(id.value))
const reviews = computed(() => reviewsOf(id.value))
const answers = computed(() =>
  allQuestions()
    .filter((q) => q.expertId === id.value && q.status === 'answered')
    .slice(0, 2)
)

onLoad((q) => {
  id.value = (q && q.id) || ''
})

function lastText(q) {
  const msgs = (q.messages || []).filter((m) => m.role === 'expert')
  const t = msgs.length ? msgs[msgs.length - 1].text : ''
  return String(t).replace(/\n/g, ' ').slice(0, 90) + (String(t).length > 90 ? '…' : '')
}

function toAsk(mode) {
  uni.navigateTo({ url: '/pages/expert/ask?expert=' + id.value + '&mode=' + mode })
}

function toQa() {
  uni.navigateTo({ url: '/pages/expert/qa' })
}
</script>

<style scoped>
.dt {
  min-height: 100vh;
}
.head {
  position: relative;
  background: linear-gradient(160deg, #14d183 0%, #0bad6d 68%, #089a60 100%);
  padding: 10rpx 32rpx 34rpx;
  border-radius: 0 0 40rpx 40rpx;
  overflow: hidden;
}
.h-deco {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
}
.d1 {
  width: 380rpx;
  height: 380rpx;
  top: -180rpx;
  right: -120rpx;
}
.d2 {
  width: 220rpx;
  height: 220rpx;
  bottom: -110rpx;
  left: -60rpx;
  opacity: 0.7;
}
.h-row {
  position: relative;
  display: flex;
  gap: 20rpx;
  align-items: center;
}
.h-name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.h-name {
  font-size: 40rpx;
  font-weight: 800;
  color: #fff;
}
.h-title {
  font-size: 19rpx;
  color: #fff;
  background: rgba(255, 255, 255, 0.22);
  border-radius: 8rpx;
  padding: 3rpx 10rpx;
}
.h-org {
  display: block;
  margin-top: 8rpx;
  font-size: 21rpx;
  color: rgba(255, 255, 255, 0.8);
}
.h-tags {
  display: flex;
  gap: 8rpx;
  margin-top: 12rpx;
}
.h-tag {
  font-size: 18rpx;
  color: #fff;
  background: rgba(255, 255, 255, 0.18);
  border-radius: 6rpx;
  padding: 3rpx 10rpx;
}
.h-stats {
  position: relative;
  margin-top: 26rpx;
  background: rgba(255, 255, 255, 0.16);
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  padding: 16rpx 0;
}
.hs {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rpx;
}
.hs-n {
  font-size: 30rpx;
  font-weight: 800;
  color: #fff;
}
.hs-u {
  font-size: 17rpx;
  font-weight: 600;
}
.hs-l {
  font-size: 17rpx;
  color: rgba(255, 255, 255, 0.76);
}
.hs-div {
  width: 2rpx;
  height: 34rpx;
  background: rgba(255, 255, 255, 0.22);
}
.content {
  padding: 20rpx 28rpx 0;
}
.card {
  background: #fff;
  border-radius: 26rpx;
  box-shadow: 0 8rpx 30rpx rgba(22, 60, 45, 0.05);
}
.sec {
  padding: 24rpx;
  margin-bottom: 18rpx;
}
.sec-t {
  font-size: 28rpx;
  font-weight: 700;
  color: #16201c;
}
.sec-more {
  font-size: 21rpx;
  color: #9aa7a1;
}
.intro {
  display: block;
  margin-top: 12rpx;
  font-size: 23rpx;
  color: #3d4a45;
  line-height: 1.75;
}
.cert {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 16rpx;
  padding-top: 14rpx;
  border-top: 2rpx solid #f4f8f5;
}
.cert-t {
  font-size: 20rpx;
  color: #7c8a84;
}
.crops {
  display: flex;
  gap: 12rpx;
  margin-top: 14rpx;
}
.crop {
  flex: 1;
  height: 78rpx;
  border-radius: 18rpx;
  background: #e9faf2;
  display: flex;
  align-items: center;
  justify-content: center;
}
.crop-t {
  font-size: 24rpx;
  color: #06a96a;
  font-weight: 700;
}
.mt {
  display: block;
  margin-top: 24rpx;
}
.srv {
  display: flex;
  align-items: flex-start;
  gap: 10rpx;
  padding: 8rpx 0;
}
.srv-dot {
  font-size: 20rpx;
  color: #0fc97a;
  font-weight: 700;
  margin-top: 2rpx;
}
.srv-t {
  flex: 1;
  font-size: 23rpx;
  color: #3d4a45;
  line-height: 1.6;
}
.ans {
  padding: 16rpx 0;
  border-bottom: 2rpx solid #f4f8f5;
}
.ans:last-child {
  border-bottom: none;
}
.ans-head {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.ans-crop {
  font-size: 18rpx;
  color: #06a96a;
  background: #e9faf2;
  border-radius: 6rpx;
  padding: 2rpx 8rpx;
  flex-shrink: 0;
}
.ans-q {
  font-size: 23rpx;
  font-weight: 600;
  color: #16201c;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ans-a {
  display: block;
  margin-top: 8rpx;
  font-size: 21rpx;
  color: #7c8a84;
  line-height: 1.6;
}
.rev {
  padding: 16rpx 0;
  border-bottom: 2rpx solid #f4f8f5;
}
.rev:last-child {
  border-bottom: none;
}
.rev-head {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.rev-user {
  font-size: 22rpx;
  font-weight: 600;
  color: #3d4a45;
}
.stars {
  display: flex;
  gap: 2rpx;
}
.star {
  font-size: 18rpx;
  color: #e6ece9;
}
.star.on {
  color: #ffb021;
}
.rev-days {
  margin-left: auto;
  font-size: 18rpx;
  color: #b3bfba;
}
.rev-t {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #3d4a45;
  line-height: 1.65;
}
.rev-crop {
  display: block;
  margin-top: 6rpx;
  font-size: 18rpx;
  color: #b3bfba;
}
.note {
  padding: 20rpx 22rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.note-t {
  font-size: 21rpx;
  font-weight: 700;
  color: #3d4a45;
  margin-bottom: 4rpx;
}
.note-s {
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
  padding: 200rpx 60rpx;
  text-align: center;
}
.miss-t {
  font-size: 26rpx;
  color: #9aa7a1;
}
</style>

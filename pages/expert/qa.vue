<template>
  <view class="page qa">
    <nav-bar title="问诊单" bg="#F4F8F5">
      <template #right>
        <view class="nav-act" @tap="toAsk">提问</view>
      </template>
    </nav-bar>

    <view class="body">
      <view class="filters">
        <ui-segment :options="tabs" :value="tab" @change="onTab" />
      </view>

      <!-- 专家视角提示 -->
      <view v-if="isExpert && pending" class="banner" @tap="tab = 'pending'">
        <text class="b-e">📮</text>
        <view class="flex1">
          <text class="b-t">有 {{ pending }} 条问诊在等你</text>
          <text class="b-s">农户发了照片和描述，回复后对方会收到通知</text>
        </view>
        <text class="b-go">去接诊</text>
      </view>

      <view v-if="!list.length" class="empty">
        <text class="e-e">💬</text>
        <text class="e-t">{{ tab === 'pending' ? '没有待回复的问诊' : '还没有问诊单' }}</text>
        <text class="e-s">叶子发黄、长斑、烂果，拍张照片问一下，比猜着打药靠谱</text>
        <ui-btn type="primary" size="md" text="去提问" @click="toAsk" />
      </view>

      <view v-for="q in list" :key="q.id" class="item" @tap="open(q.id)">
        <view class="it-head">
          <view class="it-av">
            <text class="it-emoji">{{ q.expertEmoji || '💬' }}</text>
          </view>
          <view class="flex1">
            <view class="it-top">
              <text class="it-name">{{ q.expertName }}</text>
              <ui-tag :tone="statusTone(q.status)" size="sm" round :text="qStatusText(q.status)" />
              <text v-if="q.visibility === 'public'" class="it-pub">公开</text>
            </view>
            <text class="it-crop">{{ q.crop }} · {{ fmt(q.createdAt) }}</text>
          </view>
        </view>

        <text class="it-title">{{ q.title }}</text>
        <text class="it-last">{{ summaryOf(q) }}</text>

        <view class="it-foot">
          <text class="it-count">{{ q.messages.length }} 条对话</text>
          <text v-if="q.rated" class="it-rated">已评价 {{ q.rating }} 星</text>
          <text v-else-if="q.status === 'answered'" class="it-wait">待评价</text>
          <text class="it-go">查看 ›</text>
        </view>
      </view>

      <view style="height: 150rpx" />
    </view>

    <tab-bar active="qa" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { questionSummary, qStatusText, statusTone } from '@/api/expert.js'
import { allQuestions, inboxQuestions, pendingCount } from '@/store/expert.js'
import { currentRole } from '@/store/role.js'

const tab = ref('all')
const tick = ref(0)

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待回复' },
  { key: 'answered', label: '已回复' }
]

const isExpert = computed(() => {
  const r = currentRole()
  return !!r && r.key === 'expert'
})

const pending = computed(() => {
  void tick.value
  return isExpert.value ? pendingCount() : 0
})

const list = computed(() => {
  void tick.value
  const src = isExpert.value ? inboxQuestions() : allQuestions()
  if (tab.value === 'pending') return src.filter((q) => q.status === 'pending')
  if (tab.value === 'answered') return src.filter((q) => q.status === 'answered')
  return src
})

onShow(() => {
  tick.value++
})

function onTab(v) {
  tab.value = v
}

function fmt(ts) {
  const d = new Date(ts)
  const p = (n) => (n < 10 ? '0' + n : '' + n)
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function summaryOf(q) {
  const s = questionSummary(q)
  return s || '（只有图片）'
}

function open(id) {
  uni.navigateTo({ url: '/pages/expert/chat?id=' + id })
}

function toAsk() {
  uni.navigateTo({ url: '/pages/expert/ask' })
}
</script>

<style scoped>
.qa {
  min-height: 100vh;
}
.body {
  padding: 6rpx 28rpx 0;
}
.nav-act {
  font-size: 23rpx;
  color: #06a96a;
  padding: 0 6rpx;
}
.filters {
  margin-bottom: 18rpx;
}
.banner {
  display: flex;
  align-items: center;
  gap: 14rpx;
  background: #fff4e4;
  border: 2rpx solid #ffe2bc;
  border-radius: 22rpx;
  padding: 18rpx 20rpx;
  margin-bottom: 16rpx;
}
.b-e {
  font-size: 30rpx;
}
.b-t {
  display: block;
  font-size: 23rpx;
  font-weight: 700;
  color: #b07a00;
}
.b-s {
  display: block;
  margin-top: 4rpx;
  font-size: 19rpx;
  color: #b99a52;
}
.b-go {
  font-size: 21rpx;
  color: #b07a00;
  font-weight: 700;
}
.item {
  background: #fff;
  border-radius: 26rpx;
  padding: 22rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 8rpx 30rpx rgba(22, 60, 45, 0.05);
}
.it-head {
  display: flex;
  gap: 14rpx;
  align-items: center;
}
.it-av {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  background: linear-gradient(150deg, #eaf3ff, #d3e5ff);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.it-emoji {
  font-size: 36rpx;
}
.it-top {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.it-name {
  font-size: 25rpx;
  font-weight: 700;
  color: #16201c;
}
.it-pub {
  font-size: 17rpx;
  color: #2f7fd0;
  background: #eaf3ff;
  border-radius: 6rpx;
  padding: 2rpx 8rpx;
}
.it-crop {
  display: block;
  margin-top: 4rpx;
  font-size: 19rpx;
  color: #9aa7a1;
}
.it-title {
  display: block;
  margin-top: 14rpx;
  font-size: 27rpx;
  font-weight: 600;
  color: #16201c;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.it-last {
  display: block;
  margin-top: 8rpx;
  font-size: 21rpx;
  color: #7c8a84;
  line-height: 1.55;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.it-foot {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-top: 14rpx;
  padding-top: 14rpx;
  border-top: 2rpx solid #f4f8f5;
}
.it-count {
  font-size: 19rpx;
  color: #b3bfba;
}
.it-rated {
  font-size: 18rpx;
  color: #b07a00;
  background: #fff8e6;
  border-radius: 6rpx;
  padding: 2rpx 8rpx;
}
.it-wait {
  font-size: 18rpx;
  color: #ff8a3d;
  background: #fff4e4;
  border-radius: 6rpx;
  padding: 2rpx 8rpx;
}
.it-go {
  margin-left: auto;
  font-size: 21rpx;
  color: #06a96a;
  font-weight: 600;
}
.empty {
  background: #fff;
  border-radius: 26rpx;
  padding: 70rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}
.e-e {
  font-size: 64rpx;
}
.e-t {
  font-size: 27rpx;
  font-weight: 700;
  color: #3d4a45;
}
.e-s {
  font-size: 21rpx;
  color: #9aa7a1;
  text-align: center;
  line-height: 1.6;
  margin-bottom: 12rpx;
}
</style>

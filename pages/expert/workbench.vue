<template>
  <view class="page wb">
    <view class="top">
      <view class="status" :style="{ height: statusBar + 'px' }" />
      <view class="t-row">
        <view class="t-left">
          <text class="t-hi">接诊台</text>
          <text class="t-sub">{{ today }} · {{ greeting }}</text>
        </view>
        <view class="t-actions">
          <view class="t-ico" @tap="to('/pages/expert/qa')">
            <icon-svg name="comment" :size="32" color="#FFFFFF" :stroke="1.8" />
            <view v-if="stats.pending" class="dot" />
          </view>
          <view class="t-ico" @tap="to('/pages/tabbar/profile/profile')">
            <icon-svg name="user" :size="32" color="#FFFFFF" :stroke="1.8" />
          </view>
        </view>
      </view>

      <view class="me">
        <ui-avatar :size="112" :emoji="expert.emoji" ring online />
        <view class="flex1">
          <view class="me-row">
            <text class="me-name">{{ expert.name }}</text>
            <text class="me-title">{{ expert.title }}</text>
          </view>
          <text class="me-org">{{ expert.org }}</text>
          <view class="me-tags">
            <text v-for="t in expert.tags" :key="t" class="me-tag">{{ t }}</text>
          </view>
        </view>
      </view>

      <view class="stats">
        <view class="st">
          <text class="st-n">{{ stats.pending }}</text>
          <text class="st-l">待接诊</text>
        </view>
        <view class="st-div" />
        <view class="st">
          <text class="st-n">{{ stats.answered }}</text>
          <text class="st-l">已解答</text>
        </view>
        <view class="st-div" />
        <view class="st">
          <text class="st-n">{{ stats.rating || expert.rating }}</text>
          <text class="st-l">评分</text>
        </view>
        <view class="st-div" />
        <view class="st">
          <text class="st-n">{{ income }}</text>
          <text class="st-l">本月收入(元)</text>
        </view>
      </view>
    </view>

    <view class="body">
      <!-- 待接诊 -->
      <view class="row between sec-head">
        <view class="row">
          <text class="sec-t">待接诊</text>
          <text v-if="pendingList.length" class="sec-badge">{{ pendingList.length }}</text>
        </view>
        <text class="sec-more" @tap="to('/pages/expert/qa')">全部 ›</text>
      </view>

      <view v-if="!pendingList.length" class="empty-card">
        <text class="ec-e">☕</text>
        <text class="ec-t">暂时没有新问诊</text>
        <text class="ec-s">可以去农友圈看看，主动回几条也能攒口碑</text>
        <ui-btn type="ghost" size="sm" text="去农友圈" @click="to('/pages/tabbar/community/community')" />
      </view>

      <view v-for="q in pendingList" :key="q.id" class="q-card" @tap="open(q.id)">
        <view class="q-top">
          <text class="q-crop">{{ q.crop }}</text>
          <text class="q-time">{{ ago(q.createdAt) }}</text>
        </view>
        <text class="q-title">{{ q.title }}</text>
        <text class="q-desc">{{ q.desc }}</text>
        <view v-if="q.images && q.images.length" class="q-imgs">
          <image v-for="(p, i) in q.images" :key="i" :src="p" mode="aspectFill" class="q-img" />
        </view>
        <view class="q-foot">
          <text class="q-from">来自 {{ q.visibility === 'public' ? '公开提问' : '指定问诊' }}</text>
          <view class="q-btn">接诊回答</view>
        </view>
      </view>

      <!-- 工具 -->
      <view class="tools card">
        <view v-for="t in tools" :key="t.name" class="tool" @tap="to(t.path)">
          <view class="tl-ico" :style="{ background: t.bg }">
            <icon-svg :name="t.icon" :size="36" :color="t.color" :stroke="1.7" />
          </view>
          <text class="tl-name">{{ t.name }}</text>
        </view>
      </view>

      <!-- 最近回答 -->
      <view class="row between sec-head mt">
        <text class="sec-t">最近回答</text>
        <text class="sec-more" @tap="to('/pages/expert/qa')">全部 ›</text>
      </view>
      <view v-if="answeredList.length" class="card list">
        <view v-for="(q, i) in answeredList" :key="q.id" class="li" :class="{ last: i === answeredList.length - 1 }" @tap="open(q.id)">
          <view class="li-ico">
            <text class="li-e">{{ q.expertEmoji }}</text>
          </view>
          <view class="flex1">
            <text class="li-t">{{ q.title }}</text>
            <text class="li-s">{{ q.crop }} · {{ ago(q.answeredAt) }} · {{ q.rating ? q.rating + ' 星' : '未评价' }}</text>
          </view>
          <icon-svg name="right" :size="22" color="#C3CCC8" />
        </view>
      </view>

      <!-- 今日提示 -->
      <view class="tip-card">
        <text class="tip-t">接诊小提示</text>
        <text class="tip-s">· 先让农户补照片（正面 + 背面），比追问十句都管用</text>
        <text class="tip-s">· 判断要给出依据：为什么是这个病，和哪个病容易混</text>
        <text class="tip-s">· 方案写到「明天做什么」，不要只写「加强管理」</text>
      </view>

      <view style="height: 160rpx" />
    </view>

    <tab-bar active="work" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { expertStats } from '@/api/expert.js'
import { allQuestions, inboxQuestions, myExpert, pendingCount } from '@/store/expert.js'
import { toast } from '@/common/utils.js'

const statusBar = ref(20)
try {
  const info = uni.getStorageSync('sys_info')
  if (info && info.statusBarHeight) statusBar.value = info.statusBarHeight
} catch (e) {}

const tick = ref(0)

const expert = computed(() => myExpert())
const questions = computed(() => {
  void tick.value
  return allQuestions()
})
const stats = computed(() => expertStats(questions.value, expert.value.id))
const pendingList = computed(() => {
  void tick.value
  return inboxQuestions().filter((q) => q.status === 'pending')
})
const answeredList = computed(() =>
  questions.value.filter((q) => q.status === 'answered' && q.expertId === expert.value.id).slice(0, 3)
)
const income = computed(() => {
  const price = expert.value.price || 0
  return price ? price * Math.max(0, stats.value.answered) : 0
})

const today = computed(() => {
  const d = new Date()
  return `${d.getMonth() + 1} 月 ${d.getDate()} 日`
})
const greeting = computed(() => {
  const h = new Date().getHours()
  if (h < 6) return '早点休息，田间的事明天再看'
  if (h < 11) return '上午好，先看一遍待接诊'
  if (h < 14) return '中午好，午后注意棚内温度'
  if (h < 18) return '下午好，这个点适合巡田'
  return '晚上好，今天的问诊记得回完'
})

const tools = [
  { name: '识图工具', icon: 'camera', bg: '#EAF9F1', color: '#06A96A', path: '/pages/scan/scan' },
  { name: '问诊单', icon: 'comment', bg: '#EAF3FF', color: '#4A8CFF', path: '/pages/expert/qa' },
  { name: '我的主页', icon: 'user', bg: '#F1EEFF', color: '#7A6BFF', path: '/pages/expert/detail?id=' + myExpert().id },
  { name: '资质资料', icon: 'checkCircle', bg: '#FFF4E4', color: '#E08A2B', path: '/pages/role/apply?role=expert' },
  { name: '农友圈', icon: 'chat', bg: '#EAF7FF', color: '#2FA0D8', path: '/pages/tabbar/community/community' },
  { name: '切换身份', icon: 'users', bg: '#F3F6F4', color: '#3D4A45', path: '/pages/role/switch' }
]

function ago(ts) {
  if (!ts) return ''
  const d = Date.now() - ts
  const m = Math.floor(d / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return m + ' 分钟前'
  const h = Math.floor(m / 60)
  if (h < 24) return h + ' 小时前'
  return Math.floor(h / 24) + ' 天前'
}

function to(url) {
  if (!url) return
  if (url.startsWith('/pages/tabbar')) return uni.reLaunch({ url })
  uni.navigateTo({ url })
}

function open(id) {
  uni.navigateTo({ url: '/pages/expert/chat?id=' + id })
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
  background: linear-gradient(160deg, #3d8fe0 0%, #2f7fd0 70%, #2568b8 100%);
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
  color: rgba(255, 255, 255, 0.78);
}
.t-actions {
  display: flex;
  gap: 10rpx;
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
  top: 8rpx;
  right: 10rpx;
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: #ffcf3d;
  border: 2rpx solid #2f7fd0;
}
.me {
  display: flex;
  gap: 20rpx;
  align-items: center;
  margin-top: 12rpx;
}
.me-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.me-name {
  font-size: 34rpx;
  font-weight: 800;
  color: #fff;
}
.me-title {
  font-size: 18rpx;
  color: #fff;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 6rpx;
  padding: 2rpx 10rpx;
}
.me-org {
  display: block;
  margin-top: 6rpx;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.78);
}
.me-tags {
  display: flex;
  gap: 8rpx;
  margin-top: 8rpx;
}
.me-tag {
  font-size: 17rpx;
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.16);
  border-radius: 6rpx;
  padding: 2rpx 8rpx;
}
.stats {
  margin-top: 24rpx;
  background: rgba(255, 255, 255, 0.16);
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
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.78);
}
.st-div {
  width: 2rpx;
  height: 38rpx;
  background: rgba(255, 255, 255, 0.22);
}
.body {
  padding: 24rpx 28rpx 0;
}
.sec-head {
  margin-bottom: 14rpx;
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
  margin-top: 26rpx;
}
.q-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 22rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 8rpx 30rpx rgba(22, 60, 45, 0.05);
}
.q-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.q-crop {
  font-size: 18rpx;
  color: #2f7fd0;
  background: #eaf3ff;
  border-radius: 6rpx;
  padding: 2rpx 10rpx;
}
.q-time {
  font-size: 18rpx;
  color: #b3bfba;
}
.q-title {
  display: block;
  margin-top: 12rpx;
  font-size: 27rpx;
  font-weight: 700;
  color: #16201c;
}
.q-desc {
  display: block;
  margin-top: 8rpx;
  font-size: 21rpx;
  color: #7c8a84;
  line-height: 1.6;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.q-imgs {
  display: flex;
  gap: 8rpx;
  margin-top: 12rpx;
}
.q-img {
  width: 120rpx;
  height: 120rpx;
  border-radius: 12rpx;
}
.q-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
  padding-top: 14rpx;
  border-top: 2rpx solid #f4f8f5;
}
.q-from {
  font-size: 18rpx;
  color: #b3bfba;
}
.q-btn {
  height: 56rpx;
  padding: 0 24rpx;
  border-radius: 56rpx;
  background: #2f7fd0;
  color: #fff;
  font-size: 21rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
}
.empty-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 40rpx 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 16rpx;
}
.ec-e {
  font-size: 52rpx;
}
.ec-t {
  font-size: 25rpx;
  font-weight: 700;
  color: #3d4a45;
}
.ec-s {
  font-size: 20rpx;
  color: #9aa7a1;
  text-align: center;
  margin-bottom: 12rpx;
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
  margin-top: 8rpx;
}
.tool {
  width: 33.33%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 22rpx;
}
.tl-ico {
  width: 84rpx;
  height: 84rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tl-name {
  font-size: 21rpx;
  color: #3d4a45;
}
.list {
  padding: 4rpx 22rpx;
}
.li {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 20rpx 0;
  border-bottom: 2rpx solid #f4f8f5;
}
.li.last {
  border-bottom: none;
}
.li-ico {
  width: 64rpx;
  height: 64rpx;
  border-radius: 18rpx;
  background: #eaf3ff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.li-e {
  font-size: 30rpx;
}
.li-t {
  display: block;
  font-size: 24rpx;
  font-weight: 600;
  color: #16201c;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.li-s {
  display: block;
  margin-top: 4rpx;
  font-size: 19rpx;
  color: #9aa7a1;
}
.tip-card {
  margin-top: 22rpx;
  padding: 20rpx 22rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.7);
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.tip-t {
  font-size: 21rpx;
  font-weight: 700;
  color: #3d4a45;
  margin-bottom: 4rpx;
}
.tip-s {
  font-size: 19rpx;
  color: #9aa7a1;
  line-height: 1.6;
}
</style>

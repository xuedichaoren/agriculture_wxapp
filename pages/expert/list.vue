<template>
  <view class="page ex">
    <nav-bar title="专家问诊" bg="#F4F8F5">
      <template #right>
        <view class="nav-act" @tap="toQa">我的问诊</view>
      </template>
    </nav-bar>

    <view class="body">
      <!-- 头图 -->
      <view class="hero">
        <ui-image name="expert.hero" :h="220" radius="26rpx">
          <view class="hero-ov">
            <text class="hero-t">地里的事，问懂行的人</text>
            <text class="hero-s">{{ onlineCount }} 位农艺师在线 · 平均 20 分钟回复</text>
          </view>
        </ui-image>
      </view>

      <!-- 搜索 -->
      <view class="search">
        <icon-svg name="search" :size="30" color="#9AA7A1" :stroke="2" />
        <input v-model="keyword" class="s-in" placeholder="搜专家、作物或病害，如「炭疽病」" placeholder-class="ph" />
        <view v-if="keyword" class="s-clear" @tap="keyword = ''">
          <icon-svg name="close" :size="22" color="#9AA7A1" :stroke="2" />
        </view>
      </view>

      <!-- 作物筛选 -->
      <scroll-view scroll-x class="chips no-scrollbar" :show-scrollbar="false">
        <view class="chips-in">
          <view class="chip" :class="{ on: crop === '' }" @tap="crop = ''">全部作物</view>
          <view v-for="c in CROPS" :key="c" class="chip" :class="{ on: crop === c }" @tap="crop = c">{{ c }}</view>
        </view>
      </scroll-view>

      <!-- 在线专家 -->
      <view v-if="!keyword && !crop" class="online">
        <ui-section title="现在在线" sub="点一下直接问" />
        <scroll-view scroll-x class="ols no-scrollbar" :show-scrollbar="false">
          <view class="ols-in">
            <view v-for="e in onlineList" :key="e.id" class="ol" @tap="toDetail(e.id)">
              <ui-avatar :size="96" :emoji="e.emoji" ring online />
              <text class="ol-name">{{ e.name }}</text>
              <text class="ol-tag">{{ e.tags[0] }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 专家列表 -->
      <ui-section :title="crop ? crop + '专家' : '全部专家'" :sub="'共 ' + list.length + ' 位'" top="8" />
      <view v-if="!list.length" class="empty">
        <text class="e-e">🔍</text>
        <text class="e-t">没找到匹配的专家</text>
        <text class="e-s">换个作物或关键词试试，也可以发公开提问让农友一起看</text>
      </view>

      <view v-for="e in list" :key="e.id" class="ex-card" @tap="toDetail(e.id)">
        <view class="ex-top">
          <ui-avatar :size="104" :emoji="e.emoji" :online="e.online" ring />
          <view class="flex1">
            <view class="ex-name-row">
              <text class="ex-name">{{ e.name }}</text>
              <text class="ex-title">{{ e.title }}</text>
              <text v-if="e.online" class="ex-on">在线</text>
            </view>
            <text class="ex-org">{{ e.org }}</text>
            <view class="ex-tags">
              <text v-for="t in e.tags" :key="t" class="ex-tag">{{ t }}</text>
            </view>
          </view>
        </view>

        <view class="ex-mid">
          <view class="em">
            <text class="em-num">{{ e.rating }}</text>
            <text class="em-lb">评分</text>
          </view>
          <view class="em-div" />
          <view class="em">
            <text class="em-num">{{ e.answered }}</text>
            <text class="em-lb">已答</text>
          </view>
          <view class="em-div" />
          <view class="em">
            <text class="em-num">{{ e.replyMin }}<text class="em-unit">分</text></text>
            <text class="em-lb">平均回复</text>
          </view>
          <view class="em-div" />
          <view class="em">
            <text class="em-num">{{ e.years }}<text class="em-unit">年</text></text>
            <text class="em-lb">从业</text>
          </view>
        </view>

        <view class="ex-foot">
          <view class="ex-crops">
            <text class="ec-lb">擅长</text>
            <text v-for="c in e.crops" :key="c" class="ec">{{ c }}</text>
          </view>
          <view class="ex-ask" :style="{ background: e.price ? '#FFF4E4' : '#E9FAF2', color: e.price ? '#B07A00' : '#06A96A' }">
            {{ e.price ? '¥' + e.price + ' 起' : '免费问诊' }}
          </view>
        </view>
      </view>

      <!-- 公开提问 -->
      <view class="pub" @tap="toAsk('', 'public')">
        <view class="pub-l">
          <text class="pub-t">不想指定专家？发个公开提问</text>
          <text class="pub-s">农友圈里的老师、老农都会看到，免费，但内容公开</text>
        </view>
        <text class="pub-go">去提问</text>
      </view>

      <!-- 常见问题 -->
      <ui-section title="问诊须知" />
      <view class="card faq">
        <view v-for="(f, i) in FAQ" :key="i" class="faq-item" :class="{ last: i === FAQ.length - 1 }" @tap="toggle(i)">
          <view class="row between">
            <text class="fq">{{ f.q }}</text>
            <icon-svg :name="openIdx === i ? 'up' : 'down'" :size="22" color="#9AA7A1" :stroke="2" />
          </view>
          <text v-if="openIdx === i" class="fa">{{ f.a }}</text>
        </view>
      </view>

      <view style="height: 40rpx" />
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { CROPS, EXPERTS, FAQ, filterExperts, onlineExperts } from '@/api/expert.js'
import { pendingCount } from '@/store/expert.js'

const keyword = ref('')
const crop = ref('')
const openIdx = ref(-1)

const list = computed(() =>
  filterExperts({ keyword: keyword.value, crop: crop.value }).sort((a, b) => {
    if (a.online !== b.online) return a.online ? -1 : 1
    return b.rating - a.rating
  })
)
const onlineList = computed(() => onlineExperts())
const onlineCount = computed(() => onlineList.value.length)
const badge = computed(() => pendingCount())

function toggle(i) {
  openIdx.value = openIdx.value === i ? -1 : i
}

function toDetail(id) {
  uni.navigateTo({ url: '/pages/expert/detail?id=' + id })
}

function toAsk(expertId, mode) {
  uni.navigateTo({
    url: '/pages/expert/ask?expert=' + (expertId || '') + (mode ? '&mode=' + mode : '')
  })
}

function toQa() {
  uni.navigateTo({ url: '/pages/expert/qa' })
}
</script>

<style scoped>
.ex {
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
.hero {
  margin-bottom: 20rpx;
}
.hero-ov {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 26rpx 24rpx;
  background: linear-gradient(180deg, rgba(10, 40, 28, 0) 0%, rgba(10, 40, 28, 0.58) 100%);
}
.hero-t {
  display: block;
  font-size: 34rpx;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.4rpx;
}
.hero-s {
  display: block;
  margin-top: 6rpx;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.8);
}
.search {
  display: flex;
  align-items: center;
  gap: 12rpx;
  height: 82rpx;
  background: #fff;
  border-radius: 82rpx;
  padding: 0 24rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}
.s-in {
  flex: 1;
  font-size: 25rpx;
  color: #16201c;
}
.ph {
  color: #b3bfba;
  font-size: 24rpx;
}
.s-clear {
  width: 40rpx;
  height: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.chips {
  width: 100%;
  margin: 18rpx 0 4rpx;
  white-space: nowrap;
}
.chips-in {
  display: inline-flex;
  gap: 10rpx;
  padding: 2rpx 0 6rpx;
}
.chip {
  display: inline-flex;
  align-items: center;
  height: 60rpx;
  padding: 0 22rpx;
  border-radius: 60rpx;
  background: #fff;
  border: 2rpx solid #edf1ef;
  font-size: 22rpx;
  color: #3d4a45;
}
.chip.on {
  background: #e9faf2;
  border-color: #0fc97a;
  color: #06a96a;
  font-weight: 700;
}
.online {
  margin-top: 16rpx;
}
.ols {
  width: 100%;
  white-space: nowrap;
}
.ols-in {
  display: inline-flex;
  gap: 16rpx;
  padding: 4rpx 0 8rpx;
}
.ol {
  width: 176rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 22rpx 12rpx 18rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}
.ol-name {
  font-size: 24rpx;
  font-weight: 700;
  color: #16201c;
}
.ol-tag {
  font-size: 18rpx;
  color: #06a96a;
  background: #e9faf2;
  border-radius: 6rpx;
  padding: 2rpx 10rpx;
}
.ex-card {
  background: #fff;
  border-radius: 26rpx;
  padding: 22rpx;
  margin-bottom: 18rpx;
  box-shadow: 0 8rpx 30rpx rgba(22, 60, 45, 0.05);
}
.ex-top {
  display: flex;
  gap: 18rpx;
}
.ex-name-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
  flex-wrap: wrap;
}
.ex-name {
  font-size: 31rpx;
  font-weight: 800;
  color: #16201c;
}
.ex-title {
  font-size: 19rpx;
  color: #4a8cff;
  background: #eaf3ff;
  border-radius: 6rpx;
  padding: 2rpx 8rpx;
}
.ex-on {
  font-size: 18rpx;
  color: #06a96a;
  background: #e9faf2;
  border-radius: 6rpx;
  padding: 2rpx 8rpx;
}
.ex-org {
  display: block;
  margin-top: 6rpx;
  font-size: 20rpx;
  color: #9aa7a1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.ex-tags {
  display: flex;
  gap: 8rpx;
  margin-top: 10rpx;
}
.ex-tag {
  font-size: 18rpx;
  color: #7c8a84;
  background: #f4f8f5;
  border-radius: 6rpx;
  padding: 3rpx 10rpx;
}
.ex-mid {
  display: flex;
  align-items: center;
  background: #f8fbf9;
  border-radius: 18rpx;
  padding: 16rpx 0;
  margin: 18rpx 0 14rpx;
}
.em {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rpx;
}
.em-num {
  font-size: 28rpx;
  font-weight: 800;
  color: #16201c;
}
.em-unit {
  font-size: 18rpx;
  font-weight: 600;
}
.em-lb {
  font-size: 17rpx;
  color: #9aa7a1;
}
.em-div {
  width: 2rpx;
  height: 32rpx;
  background: #e6ece9;
}
.ex-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
}
.ex-crops {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex: 1;
  flex-wrap: wrap;
}
.ec-lb {
  font-size: 18rpx;
  color: #b3bfba;
}
.ec {
  font-size: 19rpx;
  color: #3d8a6b;
}
.ex-ask {
  height: 58rpx;
  padding: 0 22rpx;
  border-radius: 58rpx;
  font-size: 22rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.empty {
  background: #fff;
  border-radius: 26rpx;
  padding: 60rpx 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}
.e-e {
  font-size: 56rpx;
}
.e-t {
  font-size: 26rpx;
  font-weight: 700;
  color: #3d4a45;
}
.e-s {
  font-size: 21rpx;
  color: #9aa7a1;
  text-align: center;
  line-height: 1.6;
}
.pub {
  display: flex;
  align-items: center;
  gap: 16rpx;
  background: linear-gradient(135deg, #eef7ff, #e2f2ff);
  border-radius: 24rpx;
  padding: 22rpx;
  margin: 8rpx 0 20rpx;
}
.pub-l {
  flex: 1;
}
.pub-t {
  display: block;
  font-size: 25rpx;
  font-weight: 700;
  color: #1f5c96;
}
.pub-s {
  display: block;
  margin-top: 6rpx;
  font-size: 19rpx;
  color: #5c86a8;
  line-height: 1.5;
}
.pub-go {
  font-size: 22rpx;
  color: #2f7fd0;
  font-weight: 700;
  flex-shrink: 0;
}
.card {
  background: #fff;
  border-radius: 26rpx;
  box-shadow: 0 8rpx 30rpx rgba(22, 60, 45, 0.05);
}
.faq {
  padding: 4rpx 22rpx;
}
.faq-item {
  padding: 22rpx 0;
  border-bottom: 2rpx solid #f4f8f5;
}
.faq-item.last {
  border-bottom: none;
}
.fq {
  font-size: 24rpx;
  color: #263330;
  font-weight: 600;
}
.fa {
  display: block;
  margin-top: 10rpx;
  font-size: 21rpx;
  color: #7c8a84;
  line-height: 1.65;
}
</style>

<template>
  <view class="page my-page">
    <nav-bar title="我的认养" bg="#F4F8F5">
      <template #right>
        <view class="nav-add" @tap="toAdopt">
          <text class="nav-add-txt">去认养</text>
        </view>
      </template>
    </nav-bar>

    <!-- 概览 -->
    <view class="summary">
      <view class="sum-item">
        <text class="sum-num">{{ growing.length }}</text>
        <text class="sum-label">进行中</text>
      </view>
      <view class="sum-line" />
      <view class="sum-item">
        <text class="sum-num">{{ deliveredCount }}</text>
        <text class="sum-label">已送达次数</text>
      </view>
      <view class="sum-line" />
      <view class="sum-item">
        <text class="sum-num">{{ ended.length }}</text>
        <text class="sum-label">已结束</text>
      </view>
    </view>

    <!-- 切换 -->
    <view class="tabs">
      <view class="tab" :class="{ on: tab === 'growing' }" @tap="tab = 'growing'">
        <text class="tab-txt">进行中 {{ growing.length }}</text>
        <view v-if="tab === 'growing'" class="tab-line" />
      </view>
      <view class="tab" :class="{ on: tab === 'ended' }" @tap="tab = 'ended'">
        <text class="tab-txt">已结束 {{ ended.length }}</text>
        <view v-if="tab === 'ended'" class="tab-line" />
      </view>
    </view>

    <view class="list">
      <view v-for="a in list" :key="a.id" class="item card" @tap="toDetail(a)">
        <view class="i-head">
          <view class="i-ico" :style="{ background: icoBg(a) }">
            <text class="i-emoji">{{ a.emoji }}</text>
          </view>
          <view class="flex1">
            <view class="row between">
              <text class="i-name">{{ a.code }} 号地 · {{ a.farm.name }}</text>
              <text class="i-status" :class="a.status">{{ a.statusText }}</text>
            </view>
            <text class="i-crops">{{ a.cropsText }}</text>
            <text class="i-meta">{{ a.plan.name }} · {{ a.cycle.name }} · ￥{{ a.total }}</text>
          </view>
          <icon-svg name="right" :size="22" color="#C3CCC8" />
        </view>

        <!-- 进度 -->
        <view v-if="a.growing" class="prog">
          <view class="prog-top">
            <text class="prog-txt">第 {{ a.daysGone }} 天 · 还剩 {{ a.daysLeft }} 天</text>
            <text class="prog-pct">{{ a.progress }}%</text>
          </view>
          <view class="prog-bar">
            <view class="prog-fill" :style="{ width: a.progress + '%' }" />
          </view>
        </view>
        <view v-else class="done-row">
          <text class="done-txt">
            {{ a.status === 'cancelled' ? '已于认养期内退养' : a.startDate + ' 至 ' + a.endDate + ' · 已结清' }}
          </text>
        </view>

        <!-- 配送 / 自提 -->
        <view class="deliver">
          <icon-svg :name="a.hasDelivery ? 'truck' : 'leaf'" :size="26" :color="a.hasDelivery ? '#0A8F5C' : '#7C8A84'" :stroke="1.7" />
          <text class="deliver-txt">{{ deliveryText(a) }}</text>
          <text v-if="a.hasDelivery" class="deliver-next" @tap.stop="toDelivery(a)">
            {{ a.growing ? '下次 ' + (nextOf(a) || '—') : '配送记录' }} ›
          </text>
        </view>

        <!-- 操作 -->
        <view class="acts">
          <view class="act" @tap.stop="toDetail(a)">详情</view>
          <view v-if="a.growing" class="act" @tap.stop="toMonitor(a)">云监工</view>
          <view v-if="a.growing" class="act" @tap.stop="toHarvest(a)">收成</view>
          <view class="act" @tap.stop="toRecord(a)">农事记录</view>
          <view class="act" @tap.stop="toCert(a)">认养证书</view>
          <view v-if="a.growing" class="act danger" @tap.stop="askCancel(a)">申请退养</view>
          <view v-else class="act" @tap.stop="again(a)">再认养</view>
        </view>
      </view>

      <empty-box
        v-if="!list.length"
        emoji="🌱"
        :text="tab === 'growing' ? '还没有在种的认养地块' : '还没有结束的认养记录'"
        :sub="tab === 'growing' ? '挑一块地，种点自己爱吃的' : '完成一次认养后会出现在这里'"
        btn-text="去认养一块地"
        @action="toAdopt"
      />

      <view v-if="tab === 'ended'" class="clean-tip">
        <text class="clean-txt">结束的认养记录会保留一年，证书可随时再打开</text>
      </view>
    </view>

    <view style="height: 60rpx" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import * as api from '@/api/index.js'
import { adoptionView, deliveryPlanOf, deliveryStats } from '@/api/adopt-plan.js'
import { store, cancelAdoption } from '@/store/index.js'
import { marksOf } from '@/store/adopt-extra.js'
import { toast } from '@/common/utils.js'

const tab = ref('growing')

const all = computed(() => store.adoptions.map(adoptionView).filter(Boolean))
const growing = computed(() => all.value.filter((a) => a.growing))
const ended = computed(() => all.value.filter((a) => !a.growing))
const list = computed(() => (tab.value === 'growing' ? growing.value : ended.value))

const deliveredCount = computed(() =>
  all.value.reduce((s, a) => {
    if (!a.hasDelivery) return s
    return s + deliveryStats(deliveryPlanOf(a, marksOf(a.id))).received
  }, 0)
)

function planOf(a) {
  return deliveryPlanOf(a, marksOf(a.id))
}

function nextOf(a) {
  const st = deliveryStats(planOf(a))
  return st.next ? st.next.date : ''
}

function deliveryText(a) {
  if (!a.hasDelivery) {
    return a.planKey === 'self' ? '自耕自提，不安排配送' : '代耕代管，收成可自提或代寄'
  }
  const st = deliveryStats(planOf(a))
  return '每周 ' + a.freq + ' 次 · 已收 ' + st.received + '/' + st.total + ' 次'
}

function icoBg(a) {
  return a.plot ? 'linear-gradient(150deg, ' + a.plot.bg[0] + ', ' + a.plot.bg[1] + ')' : '#eef4f0'
}

function toAdopt() {
  uni.navigateTo({ url: '/pages/farm/adopt' })
}

function toDetail(a) {
  uni.navigateTo({ url: '/pages/farm/detail?id=' + a.id })
}

function toDelivery(a) {
  if (!a.hasDelivery) return toast('这块地不安排配送')
  uni.navigateTo({ url: '/pages/farm/delivery?id=' + a.id })
}

function toRecord(a) {
  uni.navigateTo({ url: '/pages/farm/record?code=' + a.code })
}

function toMonitor(a) {
  uni.navigateTo({ url: '/pages/farm/monitor?id=' + a.id })
}

function toHarvest(a) {
  uni.navigateTo({ url: '/pages/farm/harvest?id=' + a.id })
}

function toCert(a) {
  uni.navigateTo({ url: '/pages/farm/certificate?id=' + a.id })
}

function again(a) {
  const p = a.plot
  if (p && p.leftCount > 0) uni.navigateTo({ url: '/pages/farm/plot?id=' + p.id })
  else toAdopt()
}

function askCancel(a) {
  uni.showModal({
    title: '申请退养',
    content: '退养后地块会被释放，已发生的服务费不退还。确定要退养 ' + a.code + ' 号地吗？',
    confirmText: '确定退养',
    confirmColor: '#FF4B3A',
    success: (r) => {
      if (!r.confirm) return
      cancelAdoption(a.id)
      toast('已提交退养，农场会在 24 小时内联系你')
      tab.value = 'growing'
    }
  })
}
</script>

<style scoped>
.summary {
  margin: 10rpx 24rpx 0;
  background: linear-gradient(135deg, #123b2c 0%, #1d5c45 60%, #26835f 100%);
  border-radius: 26rpx;
  padding: 26rpx 0;
  display: flex;
  align-items: center;
}
.sum-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.sum-num {
  font-size: 36rpx;
  font-weight: 800;
  color: #fff;
}
.sum-label {
  font-size: 19rpx;
  color: rgba(255, 255, 255, 0.62);
  margin-top: 4rpx;
}
.sum-line {
  width: 2rpx;
  height: 40rpx;
  background: rgba(255, 255, 255, 0.14);
}

.tabs {
  display: flex;
  margin: 24rpx 24rpx 0;
  background: #fff;
  border-radius: 22rpx;
  padding: 0 10rpx;
}
.tab {
  flex: 1;
  padding: 22rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
.tab-txt {
  font-size: 25rpx;
  color: #7c8a84;
}
.tab.on .tab-txt {
  color: #14201b;
  font-weight: 700;
}
.tab-line {
  position: absolute;
  bottom: 8rpx;
  width: 40rpx;
  height: 6rpx;
  border-radius: 6rpx;
  background: #0fc97a;
}

.list {
  padding: 20rpx 24rpx 0;
}
.item {
  padding: 22rpx;
  margin-bottom: 18rpx;
}
.i-head {
  display: flex;
  gap: 16rpx;
  align-items: center;
}
.i-ico {
  width: 96rpx;
  height: 96rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.i-emoji {
  font-size: 50rpx;
}
.i-name {
  font-size: 26rpx;
  font-weight: 700;
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.i-status {
  font-size: 18rpx;
  color: #0a8f5c;
  background: #f2fbf6;
  padding: 3rpx 12rpx;
  border-radius: 6rpx;
  flex-shrink: 0;
}
.i-status.ended {
  color: #9aa7a1;
  background: #f2f5f3;
}
.i-status.cancelled {
  color: #b3bfba;
  background: #f6f8f7;
}
.i-crops {
  display: block;
  font-size: 21rpx;
  color: #5c6a64;
  margin-top: 8rpx;
}
.i-meta {
  display: block;
  font-size: 19rpx;
  color: #9aa7a1;
  margin-top: 4rpx;
}

/* 进度 */
.prog {
  margin-top: 20rpx;
  padding: 16rpx 18rpx;
  background: #f7faf8;
  border-radius: 18rpx;
}
.prog-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.prog-txt {
  font-size: 20rpx;
  color: #3d4a45;
}
.prog-pct {
  font-size: 20rpx;
  font-weight: 700;
  color: #0a8f5c;
}
.prog-bar {
  height: 10rpx;
  border-radius: 10rpx;
  background: #e3ece7;
  margin-top: 12rpx;
  overflow: hidden;
}
.prog-fill {
  height: 10rpx;
  border-radius: 10rpx;
  background: linear-gradient(90deg, #16d488, #0a9c63);
}

.done-row {
  margin-top: 18rpx;
  padding: 14rpx 18rpx;
  background: #f7faf8;
  border-radius: 16rpx;
}
.done-txt {
  font-size: 20rpx;
  color: #9aa7a1;
}

/* 配送 */
.deliver {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 16rpx;
}
.deliver-txt {
  flex: 1;
  font-size: 20rpx;
  color: #5c6a64;
}
.deliver-next {
  font-size: 19rpx;
  color: #0a8f5c;
  font-weight: 600;
}

/* 操作 */
.acts {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 18rpx;
  padding-top: 18rpx;
  border-top: 2rpx solid #f2f5f3;
}
.act {
  flex: 1 1 calc((100% - 20rpx) / 3);
  height: 64rpx;
  border-radius: 32rpx;
  background: #f2fbf6;
  color: #0a8f5c;
  font-size: 21rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}
.act.danger {
  background: #fff5f3;
  color: #ff6b3d;
}
.clean-tip {
  text-align: center;
  padding: 20rpx 0 10rpx;
}
.clean-txt {
  font-size: 19rpx;
  color: #b3bfba;
}
.nav-add {
  padding: 10rpx 22rpx;
  border-radius: 40rpx;
  background: #e9faf2;
}
.nav-add-txt {
  font-size: 22rpx;
  color: #06a96a;
  font-weight: 600;
}
</style>

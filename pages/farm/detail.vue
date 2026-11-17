<template>
  <view class="page detail-page">
    <nav-bar title="认养详情" bg="#F4F8F5">
      <template #right>
        <view class="nav-btn" @tap="share">
          <icon-svg name="share" :size="30" color="#16201C" :stroke="1.8" />
        </view>
      </template>
    </nav-bar>

    <view v-if="!view" class="miss">
      <text class="miss-emoji">🪴</text>
      <text class="miss-txt">没找到这条认养记录</text>
      <view class="btn btn-ghost miss-btn" @tap="toAdopt">去认养大厅</view>
    </view>

    <view v-else class="body">
      <!-- 概览 -->
      <view class="hero">
        <view class="hero-deco" />
        <view class="row between hero-top">
          <text class="hero-code">{{ view.code }} 号地 · {{ view.farm.name }}</text>
          <view class="hero-state" :class="view.status">{{ view.statusText }}</view>
        </view>

        <view class="hero-main">
          <text class="hero-emoji">{{ view.emoji }}</text>
          <view class="flex1 hero-info">
            <text class="hero-crops">{{ view.cropsText }}</text>
            <text class="hero-meta">
              {{ view.plan.name }} · {{ view.cycle.name }} · {{ view.plot ? view.plot.area : '--' }}㎡
            </text>
          </view>
        </view>

        <view class="prog">
          <view class="prog-top">
            <text class="prog-txt">第 {{ view.daysGone }} 天 / 共 {{ view.totalDays }} 天</text>
            <text class="prog-pct">{{ view.progress }}%</text>
          </view>
          <view class="prog-bar">
            <view class="prog-fill" :style="{ width: view.progress + '%' }" />
          </view>
          <view class="prog-date">
            <text class="pd-txt">{{ view.startDate }}</text>
            <text class="pd-txt">{{ view.status === 'growing' ? '还剩 ' + view.daysLeft + ' 天' : view.endDate }}</text>
          </view>
        </view>
      </view>

      <!-- 快捷入口 -->
      <view class="quick card">
        <view class="q-item" @tap="toMonitor">
          <view class="q-ico"><icon-svg name="video" :size="34" color="#0A8F5C" :stroke="1.7" /></view>
          <text class="q-txt">云监工</text>
        </view>
        <view class="q-item" @tap="toHarvest">
          <view class="q-ico"><icon-svg name="gift" :size="34" color="#0A8F5C" :stroke="1.7" /></view>
          <text class="q-txt">收成</text>
        </view>
        <view class="q-item" @tap="toCalendar">
          <view class="q-ico"><icon-svg name="calendar" :size="34" color="#0A8F5C" :stroke="1.7" /></view>
          <text class="q-txt">农事日历</text>
        </view>
        <view class="q-item" @tap="toDelivery">
          <view class="q-ico"><icon-svg name="truck" :size="34" color="#0A8F5C" :stroke="1.7" /></view>
          <text class="q-txt">配送记录</text>
          <view v-if="stats.waiting" class="q-badge">{{ stats.waiting }}</view>
        </view>
        <view class="q-item" @tap="toCert">
          <view class="q-ico"><icon-svg name="coupon" :size="34" color="#0A8F5C" :stroke="1.7" /></view>
          <text class="q-txt">认养证书</text>
        </view>
        <view class="q-item" @tap="toChat">
          <view class="q-ico"><icon-svg name="comment" :size="34" color="#0A8F5C" :stroke="1.7" /></view>
          <text class="q-txt">联系农场</text>
        </view>
      </view>

      <!-- 配送 -->
      <view v-if="view.hasDelivery" class="card sec">
        <view class="row between sec-head">
          <text class="sec-title">配送</text>
          <text class="sec-action" @tap="toDelivery">全部记录</text>
        </view>
        <view class="dv">
          <view class="dv-main">
            <text class="dv-next">{{ stats.next ? stats.next.date : '已全部送达' }}</text>
            <text class="dv-tip">
              {{ stats.next ? '下次配送 · 每周 ' + view.freq + ' 次 · 已收 ' + stats.received + '/' + stats.total + ' 次' : '本期 ' + stats.total + ' 次已结清' }}
            </text>
          </view>
          <view class="dv-btn" @tap="toDelivery">查看</view>
        </view>
        <view v-if="address" class="dv-addr">
          <icon-svg name="location" :size="26" color="#7C8A84" :stroke="1.7" />
          <text class="dv-addr-txt">{{ address.region }} {{ address.detailAddress }}</text>
        </view>
      </view>

      <!-- 长势 -->
      <view class="card sec">
        <view class="row between sec-head">
          <text class="sec-title">长势 · 农事日志</text>
          <text class="sec-action" @tap="expand = !expand">{{ expand ? '收起' : '全部 ' + logs.length + ' 条' }}</text>
        </view>
        <view class="tl">
          <view v-for="(l, i) in shownLogs" :key="i" class="tl-item">
            <view class="tl-left">
              <view class="tl-dot" :class="{ first: i === 0 }" />
              <view v-if="i < shownLogs.length - 1" class="tl-bar" />
            </view>
            <view class="tl-body">
              <view class="row between">
                <text class="tl-title">{{ l.title }}</text>
                <text class="tl-date">{{ l.date }}</text>
              </view>
              <text class="tl-desc">{{ l.summary }}</text>
              <view v-if="l.from === 'me'" class="tl-mine">我补录的</view>
            </view>
          </view>
          <empty-box v-if="!logs.length" emoji="🌾" text="还没有农事日志" sub="农场播种后会同步第一条记录" />
        </view>
      </view>

      <!-- 地块档案 -->
      <view v-if="view.plot" class="card sec">
        <text class="sec-title">地块档案</text>
        <view class="arch">
          <view class="arch-item">
            <text class="a-label">土壤</text>
            <text class="a-value">{{ view.plot.soil }}</text>
          </view>
          <view class="arch-item">
            <text class="a-label">光照</text>
            <text class="a-value">{{ view.plot.sun }}</text>
          </view>
          <view class="arch-item">
            <text class="a-label">灌溉</text>
            <text class="a-value">{{ view.plot.water }}</text>
          </view>
          <view class="arch-item">
            <text class="a-label">海拔</text>
            <text class="a-value">{{ view.plot.altitude }} 米</text>
          </view>
        </view>
      </view>

      <!-- 认养信息 -->
      <view class="card sec">
        <text class="sec-title">认养信息</text>
        <view class="info-row">
          <text class="i-label">认养编号</text>
          <text class="i-value">{{ view.id }}</text>
          <text class="i-copy" @tap="copyId">复制</text>
        </view>
        <view class="info-row">
          <text class="i-label">认养人</text>
          <text class="i-value">{{ view.owner || '未填写' }}{{ view.phone ? ' · ' + view.phone : '' }}</text>
        </view>
        <view class="info-row">
          <text class="i-label">周期</text>
          <text class="i-value">{{ view.startDate }} 至 {{ view.endDate }}</text>
        </view>
        <view class="info-row">
          <text class="i-label">方式</text>
          <text class="i-value">{{ view.plan.name }} · {{ view.cycle.name }}</text>
        </view>
        <view v-if="view.remark" class="info-row">
          <text class="i-label">留言</text>
          <text class="i-value">{{ view.remark }}</text>
        </view>
        <view class="info-line" />
        <view class="info-row">
          <text class="i-label">实付</text>
          <text class="i-pay">￥{{ view.total }}</text>
        </view>
        <view class="info-row">
          <text class="i-label">下单时间</text>
          <text class="i-value">{{ view.createdAt }}</text>
        </view>
      </view>

      <view class="notice">
        <text class="notice-txt">
          未开始种植前可全额退养；已开始的服务费不退。作物受天气影响，产量会有正常浮动。
        </text>
      </view>
      <view style="height: 60rpx" />
    </view>

    <!-- 底栏 -->
    <view v-if="view" class="bar safe-bottom">
      <view v-if="view.status === 'growing'" class="bar-ghost" @tap="askCancel">申请退养</view>
      <view class="btn btn-primary bar-btn" @tap="view.status === 'growing' ? toFarm() : toPlot()">
        {{ view.status === 'growing' ? '去农场看看' : '再认养一块' }}
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import * as api from '@/api/index.js'
import {
  adoptionView,
  deliveryPlanOf,
  deliveryStats,
  timelineOf
} from '@/api/adopt-plan.js'
import { store, findAdoption, cancelAdoption } from '@/store/index.js'
import { userLogsOf, marksOf } from '@/store/adopt-extra.js'
import { toast, copyText } from '@/common/utils.js'

const adoptionId = ref('')
try {
  const pages = getCurrentPages()
  const cur = pages[pages.length - 1]
  if (cur && cur.options && cur.options.id) adoptionId.value = cur.options.id
} catch (e) {}

const expand = ref(false)

const adoption = computed(() => findAdoption(adoptionId.value))
const view = computed(() => adoptionView(adoption.value))
const logs = computed(() => {
  const a = adoption.value
  if (!a) return []
  const year = String(a.startDate || '').slice(0, 4)
  return timelineOf(a.code, userLogsOf(a.code), year)
})
const shownLogs = computed(() => (expand.value ? logs.value : logs.value.slice(0, 3)))

const plan = computed(() =>
  adoption.value ? deliveryPlanOf(adoption.value, marksOf(adoption.value.id)) : []
)
const stats = computed(() => deliveryStats(plan.value))
const address = computed(() => {
  const a = adoption.value
  if (!a || !a.addressId) return null
  return store.addresses.find((x) => x.id === a.addressId) || null
})

function copyId() {
  copyText(adoptionId.value)
}

function toAdopt() {
  uni.navigateTo({ url: '/pages/farm/adopt' })
}

function toCalendar() {
  uni.navigateTo({ url: '/pages/farm/calendar?code=' + (view.value ? view.value.code : '') })
}

function toDelivery() {
  if (!view.value || !view.value.hasDelivery) return toast('这块地是自耕自提，不安排配送')
  uni.navigateTo({ url: '/pages/farm/delivery?id=' + adoptionId.value })
}

function toCert() {
  uni.navigateTo({ url: '/pages/farm/certificate?id=' + adoptionId.value })
}

function toMonitor() {
  uni.navigateTo({ url: '/pages/farm/monitor?id=' + adoptionId.value })
}

function toHarvest() {
  uni.navigateTo({ url: '/pages/farm/harvest?id=' + adoptionId.value })
}

function toChat() {
  const fid = view.value && view.value.farmId ? view.value.farmId : 'f1'
  uni.navigateTo({ url: '/pages/message/chat?id=' + fid })
}

function toPlot() {
  const a = adoption.value
  const p = a ? api.findPlot(a.plotId) : null
  if (p && p.leftCount > 0) uni.navigateTo({ url: '/pages/farm/plot?id=' + p.id })
  else uni.navigateTo({ url: '/pages/farm/adopt' })
}

function toFarm() {
  const fid = view.value && view.value.farmId ? view.value.farmId : 'f1'
  uni.navigateTo({ url: '/pages/farm/home?id=' + fid })
}

function share() {
  uni.showActionSheet({
    itemList: ['查看认养证书', '保存 / 分享证书', '复制认养编号'],
    success: (r) => {
      if (r.tapIndex === 0 || r.tapIndex === 1) return toCert()
      if (r.tapIndex === 2) copyText(adoptionId.value)
    }
  })
}

function askCancel() {
  const a = adoption.value
  if (!a) return
  uni.showModal({
    title: '申请退养',
    content: '退养后地块会被释放，已发生的服务费不退还。确定要退养 ' + a.code + ' 号地吗？',
    confirmText: '确定退养',
    confirmColor: '#FF4B3A',
    success: (r) => {
      if (!r.confirm) return
      cancelAdoption(a.id)
      toast('已提交退养，农场会在 24 小时内联系你')
    }
  })
}
</script>

<style scoped>
.detail-page {
  padding-bottom: 180rpx;
}
.nav-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
.miss {
  padding: 140rpx 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.miss-emoji {
  font-size: 90rpx;
}
.miss-txt {
  font-size: 25rpx;
  color: #7c8a84;
  margin-top: 18rpx;
}
.miss-btn {
  margin-top: 30rpx;
  padding: 0 40rpx;
}
.body {
  padding: 10rpx 24rpx 0;
}

/* 概览 */
.hero {
  border-radius: 30rpx;
  padding: 26rpx 26rpx 22rpx;
  background: linear-gradient(135deg, #123b2c 0%, #1d5c45 58%, #26835f 100%);
  position: relative;
  overflow: hidden;
}
.hero-deco {
  position: absolute;
  width: 300rpx;
  height: 300rpx;
  border-radius: 50%;
  right: -110rpx;
  top: -140rpx;
  background: rgba(255, 255, 255, 0.08);
}
.hero-top {
  position: relative;
}
.hero-code {
  font-size: 23rpx;
  color: rgba(255, 255, 255, 0.82);
  font-weight: 600;
}
.hero-state {
  font-size: 18rpx;
  padding: 3rpx 12rpx;
  border-radius: 8rpx;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
}
.hero-state.ended,
.hero-state.cancelled {
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.7);
}
.hero-main {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 22rpx;
  position: relative;
}
.hero-emoji {
  font-size: 68rpx;
}
.hero-info {
  display: flex;
  flex-direction: column;
}
.hero-crops {
  font-size: 34rpx;
  font-weight: 800;
  color: #fff;
}
.hero-meta {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.66);
  margin-top: 8rpx;
}
.prog {
  margin-top: 24rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20rpx;
  padding: 16rpx 18rpx;
  position: relative;
}
.prog-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.prog-txt {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.8);
}
.prog-pct {
  font-size: 20rpx;
  font-weight: 800;
  color: #7df0b6;
}
.prog-bar {
  height: 10rpx;
  border-radius: 10rpx;
  background: rgba(255, 255, 255, 0.16);
  margin-top: 12rpx;
  overflow: hidden;
}
.prog-fill {
  height: 10rpx;
  border-radius: 10rpx;
  background: linear-gradient(90deg, #3ff0a5, #16d488);
}
.prog-date {
  display: flex;
  justify-content: space-between;
  margin-top: 10rpx;
}
.pd-txt {
  font-size: 17rpx;
  color: rgba(255, 255, 255, 0.5);
}

/* 快捷 */
.quick {
  margin-top: 20rpx;
  padding: 22rpx 10rpx 4rpx;
  display: flex;
  flex-wrap: wrap;
}
.q-item {
  flex: 0 0 33.33%;
  margin-bottom: 18rpx;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}
.q-ico {
  width: 76rpx;
  height: 76rpx;
  border-radius: 24rpx;
  background: #f2fbf6;
  display: flex;
  align-items: center;
  justify-content: center;
}
.q-txt {
  font-size: 20rpx;
  color: #3d4a45;
}
.q-badge {
  position: absolute;
  top: -6rpx;
  right: 40rpx;
  min-width: 30rpx;
  height: 30rpx;
  border-radius: 15rpx;
  background: #ff6b3d;
  color: #fff;
  font-size: 17rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
}

/* 通用 */
.sec {
  margin-top: 20rpx;
  padding: 24rpx;
}
.sec-head {
  margin-bottom: 16rpx;
}
.sec-title {
  display: block;
  font-size: 27rpx;
  font-weight: 700;
}
.sec-action {
  font-size: 21rpx;
  color: #0a8f5c;
}

/* 配送 */
.dv {
  display: flex;
  align-items: center;
  padding: 18rpx;
  background: #f7faf8;
  border-radius: 20rpx;
}
.dv-main {
  flex: 1;
}
.dv-next {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #16201c;
}
.dv-tip {
  display: block;
  font-size: 20rpx;
  color: #7c8a84;
  margin-top: 6rpx;
}
.dv-btn {
  padding: 10rpx 24rpx;
  border-radius: 30rpx;
  background: #e9faf2;
  color: #06a96a;
  font-size: 21rpx;
  font-weight: 600;
}
.dv-addr {
  display: flex;
  align-items: flex-start;
  gap: 8rpx;
  margin-top: 16rpx;
}
.dv-addr-txt {
  flex: 1;
  font-size: 20rpx;
  color: #7c8a84;
  line-height: 1.5;
}

/* 时间轴 */
.tl {
  display: flex;
  flex-direction: column;
}
.tl-item {
  display: flex;
  gap: 14rpx;
}
.tl-left {
  width: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.tl-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: #dde5e1;
  margin-top: 12rpx;
}
.tl-dot.first {
  background: #0fc97a;
  box-shadow: 0 0 0 6rpx rgba(15, 201, 122, 0.14);
}
.tl-bar {
  flex: 1;
  width: 3rpx;
  background: #eef2f0;
  margin: 4rpx 0;
}
.tl-body {
  flex: 1;
  padding-bottom: 24rpx;
}
.tl-title {
  font-size: 24rpx;
  font-weight: 600;
}
.tl-date {
  font-size: 19rpx;
  color: #b3bfba;
}
.tl-desc {
  display: block;
  font-size: 21rpx;
  color: #7c8a84;
  line-height: 1.55;
  margin-top: 6rpx;
}
.tl-mine {
  display: inline-block;
  margin-top: 8rpx;
  font-size: 17rpx;
  color: #0a8f5c;
  background: #f2fbf6;
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
}

/* 档案 */
.arch {
  display: flex;
  flex-wrap: wrap;
}
.arch-item {
  width: 50%;
  padding: 10rpx 0;
}
.a-label {
  display: block;
  font-size: 19rpx;
  color: #9aa7a1;
}
.a-value {
  display: block;
  font-size: 22rpx;
  color: #16201c;
  margin-top: 4rpx;
}

/* 信息 */
.info-row {
  display: flex;
  align-items: baseline;
  padding: 10rpx 0;
}
.i-label {
  width: 150rpx;
  font-size: 21rpx;
  color: #9aa7a1;
  flex-shrink: 0;
}
.i-value {
  flex: 1;
  font-size: 22rpx;
  color: #263330;
  word-break: break-all;
}
.i-copy {
  font-size: 19rpx;
  color: #0a8f5c;
}
.i-pay {
  flex: 1;
  font-size: 30rpx;
  font-weight: 800;
  color: #ff4b3a;
}
.info-line {
  height: 2rpx;
  background: #f2f5f3;
  margin: 10rpx 0;
}
.notice {
  margin-top: 20rpx;
  padding: 0 6rpx;
}
.notice-txt {
  font-size: 19rpx;
  color: #9aa7a1;
  line-height: 1.6;
}

/* 底栏 */
.bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  background: #fff;
  padding: 14rpx 24rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  box-shadow: 0 -8rpx 30rpx rgba(22, 60, 45, 0.08);
}
.bar-ghost {
  padding: 0 30rpx;
  height: 84rpx;
  line-height: 84rpx;
  border-radius: 42rpx;
  background: #fff5f3;
  color: #ff6b3d;
  font-size: 23rpx;
  font-weight: 600;
}
.bar-btn {
  flex: 1;
  height: 84rpx;
}
</style>

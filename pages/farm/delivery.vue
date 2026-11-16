<template>
  <view class="page dv-page">
    <nav-bar title="配送记录" bg="#F4F8F5" />

    <view v-if="!view || !view.hasDelivery" class="miss">
      <text class="miss-emoji">🧺</text>
      <text class="miss-txt">{{ view ? '这块地是自耕自提，不安排配送' : '没找到这条认养记录' }}</text>
      <view class="btn btn-ghost miss-btn" @tap="toDetail">返回认养详情</view>
    </view>

    <view v-else class="body">
      <!-- 概览 -->
      <view class="head">
        <view class="head-deco" />
        <view class="head-row">
          <view class="h-item">
            <text class="h-num">{{ stats.received }}</text>
            <text class="h-label">已签收</text>
          </view>
          <view class="h-line" />
          <view class="h-item">
            <text class="h-num">{{ stats.waiting }}</text>
            <text class="h-label">待配送</text>
          </view>
          <view class="h-line" />
          <view class="h-item">
            <text class="h-num">{{ stats.total }}</text>
            <text class="h-label">本期总次数</text>
          </view>
        </view>
        <view class="head-next">
          <text class="hn-label">下次配送</text>
          <text class="hn-date">{{ stats.next ? stats.next.date : '本期已全部送达' }}</text>
          <text class="hn-tip">每周 {{ view.freq }} 次 · 冷链到家</text>
        </view>
      </view>

      <!-- 地址 -->
      <view class="card addr-card">
        <view class="row between">
          <text class="ac-title">收货地址</text>
          <text class="ac-edit" @tap="toAddress">修改</text>
        </view>
        <view v-if="address" class="ac-body">
          <view class="row ac-name">
            <text class="ac-n">{{ address.name }}</text>
            <text class="ac-p">{{ address.phone }}</text>
            <text v-if="address.tag" class="ac-tag">{{ address.tag }}</text>
          </view>
          <text class="ac-detail">{{ address.region }} {{ address.detailAddress }}</text>
        </view>
        <view v-else class="ac-empty" @tap="toAddress">还没有收货地址，点这里去添加</view>
      </view>

      <!-- 列表 -->
      <view class="list-head">
        <text class="lh-title">配送明细</text>
        <text class="lh-count">共 {{ list.length }} 次</text>
      </view>

      <view class="list">
        <view v-for="d in list" :key="d.no" class="card dv-item">
          <view class="dv-top">
            <view class="dv-no">{{ d.no }}</view>
            <view class="flex1">
              <view class="row between">
                <text class="dv-date">{{ d.date }}</text>
                <text class="dv-state" :class="d.status">{{ d.label }}</text>
              </view>
              <text class="dv-desc">{{ descOf(d) }}</text>
            </view>
          </view>

          <view class="dv-meta">
            <text class="dv-way">顺丰冷链 {{ d.waybill }}</text>
            <text v-if="d.status === 'received'" class="dv-done">已签收</text>
          </view>

          <view v-if="d.status === 'waiting'" class="dv-acts">
            <view class="dv-act ghost" @tap="skip(d)">跳过本次</view>
            <view class="dv-act primary" @tap="receive(d)">确认收到</view>
          </view>
          <view v-else-if="d.status === 'skipped'" class="dv-acts">
            <view class="dv-act ghost" @tap="undo(d)">撤销跳过</view>
          </view>
          <view v-else class="dv-acts">
            <view class="dv-act ghost" @tap="undo(d)">撤销签收</view>
          </view>
        </view>

        <empty-box v-if="!list.length" emoji="🚚" text="还没有配送安排" sub="认养开始后按频率自动生成" />
      </view>

      <view class="notice">
        <text class="notice-txt">
          临时出差或吃不完可以「跳过本次」，次数会顺延到期末；收到后如有坏果，48 小时内拍照反馈可赔付。
        </text>
      </view>
      <view style="height: 60rpx" />
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { adoptionView, deliveryPlanOf, deliveryStats } from '@/api/adopt-plan.js'
import { store, findAdoption } from '@/store/index.js'
import { marksOf, markDelivery } from '@/store/adopt-extra.js'
import { toast } from '@/common/utils.js'

const adoptionId = ref('')
try {
  const pages = getCurrentPages()
  const cur = pages[pages.length - 1]
  if (cur && cur.options && cur.options.id) adoptionId.value = cur.options.id
} catch (e) {}

const adoption = computed(() => findAdoption(adoptionId.value))
const view = computed(() => adoptionView(adoption.value))
const marks = computed(() => (adoption.value ? marksOf(adoption.value.id) : {}))
const plan = computed(() => (adoption.value ? deliveryPlanOf(adoption.value, marks.value) : []))
const stats = computed(() => deliveryStats(plan.value))
// 最新的排在最上面
const list = computed(() => plan.value.slice().reverse())
const address = computed(() => {
  const a = adoption.value
  if (!a || !a.addressId) return null
  return store.addresses.find((x) => x.id === a.addressId) || null
})

function descOf(d) {
  const a = view.value
  if (!a) return ''
  return '第 ' + d.no + ' 次 · ' + a.cropsText + ' 当季采收，冷链发出'
}

function receive(d) {
  markDelivery(adoptionId.value, d.no, 'received')
  toast('已确认收到，感谢反馈')
}

function skip(d) {
  uni.showModal({
    title: '跳过本次配送',
    content: '本次不送，次数顺延到期末。确定跳过 ' + d.date + ' 这次吗？',
    confirmText: '确定跳过',
    success: (r) => {
      if (!r.confirm) return
      markDelivery(adoptionId.value, d.no, 'skipped')
      toast('已跳过，次数顺延')
    }
  })
}

function undo(d) {
  markDelivery(adoptionId.value, d.no, 'waiting')
  toast('已恢复为待配送')
}

function toDetail() {
  uni.redirectTo({ url: '/pages/farm/detail?id=' + adoptionId.value })
}

function toAddress() {
  uni.navigateTo({ url: '/pages/address/list?from=adopt' })
}
</script>

<style scoped>
.dv-page {
  min-height: 100vh;
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
  text-align: center;
}
.miss-btn {
  margin-top: 30rpx;
  padding: 0 40rpx;
}
.body {
  padding: 10rpx 24rpx 0;
}

/* 概览 */
.head {
  background: linear-gradient(135deg, #123b2c 0%, #1d5c45 58%, #26835f 100%);
  border-radius: 30rpx;
  padding: 26rpx;
  position: relative;
  overflow: hidden;
}
.head-deco {
  position: absolute;
  width: 280rpx;
  height: 280rpx;
  border-radius: 50%;
  right: -100rpx;
  top: -130rpx;
  background: rgba(255, 255, 255, 0.08);
}
.head-row {
  display: flex;
  align-items: center;
  position: relative;
}
.h-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.h-num {
  font-size: 38rpx;
  font-weight: 800;
  color: #fff;
}
.h-label {
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 4rpx;
}
.h-line {
  width: 2rpx;
  height: 42rpx;
  background: rgba(255, 255, 255, 0.14);
}
.head-next {
  margin-top: 22rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20rpx;
  padding: 16rpx 20rpx;
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  position: relative;
}
.hn-label {
  font-size: 19rpx;
  color: rgba(255, 255, 255, 0.6);
}
.hn-date {
  font-size: 28rpx;
  font-weight: 800;
  color: #fff;
}
.hn-tip {
  margin-left: auto;
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.55);
}

/* 地址 */
.addr-card {
  margin-top: 20rpx;
  padding: 22rpx 24rpx;
}
.ac-title {
  font-size: 26rpx;
  font-weight: 700;
}
.ac-edit {
  font-size: 21rpx;
  color: #0a8f5c;
}
.ac-body {
  margin-top: 12rpx;
}
.ac-name {
  align-items: center;
}
.ac-n {
  font-size: 24rpx;
  font-weight: 600;
}
.ac-p {
  font-size: 21rpx;
  color: #7c8a84;
  margin-left: 14rpx;
}
.ac-tag {
  font-size: 17rpx;
  color: #0a8f5c;
  background: #f2fbf6;
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
  margin-left: 12rpx;
}
.ac-detail {
  display: block;
  font-size: 21rpx;
  color: #3d4a45;
  line-height: 1.55;
  margin-top: 8rpx;
}
.ac-empty {
  font-size: 22rpx;
  color: #0a8f5c;
  padding: 18rpx 0 6rpx;
}

/* 列表 */
.list-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin: 26rpx 6rpx 14rpx;
}
.lh-title {
  font-size: 27rpx;
  font-weight: 700;
}
.lh-count {
  font-size: 20rpx;
  color: #9aa7a1;
}
.list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.dv-item {
  padding: 22rpx;
}
.dv-top {
  display: flex;
  gap: 16rpx;
}
.dv-no {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #f2fbf6;
  color: #0a8f5c;
  font-size: 22rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.dv-date {
  font-size: 25rpx;
  font-weight: 700;
}
.dv-state {
  font-size: 18rpx;
  padding: 3rpx 12rpx;
  border-radius: 6rpx;
  color: #0a8f5c;
  background: #f2fbf6;
}
.dv-state.waiting {
  color: #ff8a3d;
  background: #fff4e4;
}
.dv-state.skipped {
  color: #9aa7a1;
  background: #f4f6f5;
}
.dv-desc {
  display: block;
  font-size: 20rpx;
  color: #7c8a84;
  margin-top: 8rpx;
  line-height: 1.5;
}
.dv-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14rpx;
  padding-top: 14rpx;
  border-top: 2rpx solid #f4f7f5;
}
.dv-way {
  font-size: 19rpx;
  color: #9aa7a1;
}
.dv-done {
  font-size: 19rpx;
  color: #0a8f5c;
}
.dv-acts {
  display: flex;
  gap: 12rpx;
  margin-top: 14rpx;
}
.dv-act {
  flex: 1;
  height: 66rpx;
  border-radius: 33rpx;
  font-size: 22rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}
.dv-act.primary {
  background: linear-gradient(135deg, #16d488, #0bbd72);
  color: #fff;
}
.dv-act.ghost {
  background: #f4f8f5;
  color: #5c6a64;
}
.notice {
  margin-top: 22rpx;
  padding: 0 6rpx;
}
.notice-txt {
  font-size: 19rpx;
  color: #9aa7a1;
  line-height: 1.6;
}
</style>

<template>
  <view class="page ai">
    <nav-bar title="被认养订单" bg="#F4F8F5" />

    <!-- 概览 -->
    <view class="sum">
      <view class="su">
        <text class="su-n">{{ stats.pendingApps }}</text>
        <text class="su-l">待确认申请</text>
      </view>
      <view class="su-div" />
      <view class="su">
        <text class="su-n">{{ stats.activeIns }}</text>
        <text class="su-l">在养订单</text>
      </view>
      <view class="su-div" />
      <view class="su">
        <text class="su-n">{{ stats.adopters }}</text>
        <text class="su-l">认养人</text>
      </view>
      <view class="su-div" />
      <view class="su">
        <text class="su-n">￥{{ stats.monthIncome }}</text>
        <text class="su-l">本月收入</text>
      </view>
    </view>

    <!-- tabs -->
    <view class="tabs">
      <view class="tab" :class="{ on: tab === 'app' }" @tap="tab = 'app'">
        <text class="tab-t">认养申请</text>
        <text v-if="stats.pendingApps" class="tab-b">{{ stats.pendingApps }}</text>
        <view v-if="tab === 'app'" class="tab-line" />
      </view>
      <view class="tab" :class="{ on: tab === 'active' }" @tap="tab = 'active'">
        <text class="tab-t">在养</text>
        <view v-if="tab === 'active'" class="tab-line" />
      </view>
      <view class="tab" :class="{ on: tab === 'end' }" @tap="tab = 'end'">
        <text class="tab-t">已结束</text>
        <view v-if="tab === 'end'" class="tab-line" />
      </view>
    </view>

    <view class="list">
      <!-- 申请 -->
      <template v-if="tab === 'app'">
        <view v-for="a in apps" :key="a.id" class="card">
          <view class="c-head">
            <view class="c-av">
              <text class="c-e">{{ a.adopter.avatar }}</text>
            </view>
            <view class="flex1">
              <view class="row between">
                <text class="c-n">{{ a.adopter.name }}</text>
                <text class="c-time">{{ shortTime(a.createdAt) }}</text>
              </view>
              <text class="c-m">{{ a.adopter.city }} · {{ a.months }} 个月 · ￥{{ a.amount }}</text>
            </view>
          </view>

          <view class="rows">
            <view class="r">
              <text class="r-k">地块</text>
              <text class="r-v">{{ a.code }} 号 · {{ plotName(a.plotId) }}</text>
            </view>
            <view class="r">
              <text class="r-k">想种</text>
              <text class="r-v">{{ cropsOf(a) }}</text>
            </view>
            <view class="r">
              <text class="r-k">方式</text>
              <text class="r-v">{{ planName(a.planKey) }} · 从 {{ a.wantStart }} 起</text>
            </view>
            <view v-if="fullPlots.indexOf(a.plotId) > -1" class="r">
              <text class="r-k">提示</text>
              <text class="r-v warn">这块地名额已满，接了会超额</text>
            </view>
          </view>

          <view v-if="a.message" class="msg">
            <text class="msg-t">“{{ a.message }}”</text>
          </view>

          <view class="acts">
            <view class="act ghost" @tap="reject(a)">婉拒</view>
            <view class="act main" @tap="accept(a)">通过申请</view>
          </view>
        </view>

        <empty-box
          v-if="!apps.length"
          emoji="📩"
          text="没有待确认的申请"
          sub="买家在认养大厅提交申请后会出现在这里，确认后才占名额"
        />
      </template>

      <!-- 在养 / 已结束 -->
      <template v-else>
        <view v-for="i in orders" :key="i.id" class="card">
          <view class="c-head">
            <view class="c-av" :style="{ background: '#f7faf8' }">
              <text class="c-e">{{ i.adopter.avatar }}</text>
            </view>
            <view class="flex1">
              <view class="row between">
                <text class="c-n">{{ i.adopter.name }}</text>
                <ui-tag :text="i.statusText" :tone="i.statusTone" size="sm" />
              </view>
              <text class="c-m">{{ i.code }} 号 · {{ i.plotName }} · {{ i.cycleName }}</text>
            </view>
          </view>

          <view class="money">
            <view class="m-item">
              <text class="m-n">￥{{ i.amount }}</text>
              <text class="m-l">合同金额</text>
            </view>
            <view class="m-item">
              <text class="m-n">￥{{ i.monthly }}</text>
              <text class="m-l">每月摊</text>
            </view>
            <view class="m-item">
              <text class="m-n">{{ i.deliveriesDone }}/{{ i.deliveriesTotal }}</text>
              <text class="m-l">已配送</text>
            </view>
          </view>

          <view class="rows">
            <view class="r">
              <text class="r-k">周期</text>
              <text class="r-v">{{ i.startDate }} ~ {{ i.endDate }}</text>
            </view>
            <view class="r">
              <text class="r-k">作物</text>
              <text class="r-v">{{ i.cropsText }} · {{ i.planName }}</text>
            </view>
            <view v-if="i.freq" class="r">
              <text class="r-k">配送</text>
              <text class="r-v">每周 {{ i.freq }} 次 · 下次 {{ i.nextDelivery || '—' }}</text>
            </view>
            <view v-else class="r">
              <text class="r-k">配送</text>
              <text class="r-v">自耕自提，不安排配送</text>
            </view>
            <view v-if="i.remark" class="r">
              <text class="r-k">备注</text>
              <text class="r-v">{{ i.remark }}</text>
            </view>
          </view>

          <view class="acts">
            <view class="act ghost" @tap="contact(i)">联系</view>
            <view class="act ghost" @tap="toPlot(i)">看地块</view>
            <view v-if="i.status !== 'ended' && i.freq" class="act main" @tap="deliver(i)">
              记一次配送
            </view>
          </view>
        </view>

        <empty-box
          v-if="!orders.length"
          emoji="🌾"
          :text="tab === 'active' ? '还没有在养的认养单' : '还没有结束的认养单'"
          :sub="tab === 'active' ? '把地块发布出去，认养人才找得到你' : '结束的订单会在这里留档'"
        />
      </template>
    </view>

    <view style="height: 40rpx" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import * as api from '@/api/index.js'
import {
  farmIns,
  farmApps,
  farmStats,
  farmSide,
  farmPlots,
  farmPlot,
  acceptApp,
  rejectApp,
  markDelivery
} from '@/store/farm-side.js'
import { toast } from '@/common/utils.js'

const tab = ref('app')
const tick = ref(0)

const stats = computed(() => {
  void tick.value
  void farmSide.apps
  void farmSide.newIns
  void farmSide.delivered
  return farmStats()
})

const apps = computed(() => {
  void tick.value
  void farmSide.apps
  return farmApps().filter((a) => a.status === 'pending')
})

const orders = computed(() => {
  void tick.value
  void farmSide.newIns
  void farmSide.delivered
  const status = tab.value === 'active' ? 'active' : 'ended'
  const list = farmIns({ status })
  if (tab.value === 'active') {
    return list.concat(farmIns({ status: 'ending' })).sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)))
  }
  return list
})

const fullPlots = computed(() => {
  void tick.value
  void farmSide.plots
  void farmSide.newIns
  return farmPlots()
    .filter((p) => p.status === 'full' || p.left <= 0)
    .map((p) => p.id)
})

function plotName(id) {
  const p = farmPlot(id)
  return p ? p.name : ''
}

function cropsOf(a) {
  return (a.crops || []).map((id) => api.findCrop(id)?.name).filter(Boolean).join(' + ')
}

function planName(key) {
  return api.planOf(key).name
}

function shortTime(str) {
  const m = String(str || '').match(/(\d{2})-(\d{2}) (\d{2}):(\d{2})/)
  if (m) return `${m[2]}/${m[3]} ${m[4]}:${m[5]}`
  return str
}

function accept(a) {
  uni.showModal({
    title: '通过认养申请',
    content: `接 ${a.adopter.name} 的单：${a.months} 个月，￥${a.amount}。确认后名额立即占用。`,
    confirmText: '确认接单',
    confirmColor: '#E08A2B',
    success: (r) => {
      if (!r.confirm) return
      acceptApp(a)
      tick.value++
      toast('已接单')
      tab.value = 'active'
    }
  })
}

function reject(a) {
  uni.showModal({
    title: '婉拒这条申请',
    editable: true,
    placeholderText: '写个原因，对方能看到（可不填）',
    confirmText: '婉拒',
    confirmColor: '#FF5A4E',
    success: (r) => {
      if (!r.confirm) return
      rejectApp(a.id, (r.content || '').trim())
      tick.value++
      toast('已婉拒')
    }
  })
}

function contact(i) {
  uni.showModal({
    title: i.adopter.name,
    content: `电话 ${i.adopter.phone}\n${i.adopter.city}`,
    confirmText: '复制号码',
    success: (r) => {
      if (!r.confirm) return
      uni.setClipboardData({ data: i.adopter.phone })
    }
  })
}

function toPlot(i) {
  uni.navigateTo({ url: '/pages/farm/plot-manage?id=' + i.plotId })
}

function deliver(i) {
  uni.showModal({
    title: '记一次配送',
    editable: true,
    placeholderText: '填快递单号，如 SF1234567890（可留空）',
    confirmText: '确认发货',
    confirmColor: '#E08A2B',
    success: (r) => {
      if (!r.confirm) return
      const res = markDelivery(i.id)
      tick.value++
      toast(res ? `已记 ${res.done}/${res.total} 次` : '已记录')
    }
  })
}

onLoad((q) => {
  const t = q && q.type
  if (t === 'app' || t === 'active' || t === 'ended') tab.value = t
})

onShow(() => {
  tick.value++
})
</script>

<style scoped>
.ai {
  min-height: 100vh;
  background: #f4f8f5;
}
.sum {
  display: flex;
  align-items: center;
  margin: 8rpx 24rpx 0;
  background: linear-gradient(150deg, #f0a04b 0%, #e08a2b 64%, #cc7a17 100%);
  border-radius: 24rpx;
  padding: 22rpx 0;
  box-shadow: 0 10rpx 26rpx rgba(224, 138, 43, 0.2);
}
.su {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}
.su-n {
  font-size: 30rpx;
  font-weight: 800;
  color: #fff;
}
.su-l {
  font-size: 16rpx;
  color: rgba(255, 255, 255, 0.74);
}
.su-div {
  width: 2rpx;
  height: 34rpx;
  background: rgba(255, 255, 255, 0.2);
}

.tabs {
  display: flex;
  margin: 18rpx 24rpx 0;
  background: #fff;
  border-radius: 22rpx;
  padding: 0 8rpx;
}
.tab {
  flex: 1;
  padding: 22rpx 0;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  gap: 6rpx;
}
.tab-t {
  font-size: 24rpx;
  color: #7c8a84;
}
.tab.on .tab-t {
  color: #16201c;
  font-weight: 700;
}
.tab-b {
  min-width: 28rpx;
  height: 28rpx;
  border-radius: 28rpx;
  background: #ff5a4e;
  color: #fff;
  font-size: 16rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 6rpx;
}
.tab-line {
  position: absolute;
  bottom: 8rpx;
  width: 36rpx;
  height: 6rpx;
  border-radius: 6rpx;
  background: #e08a2b;
}

.list {
  padding: 18rpx 24rpx 0;
}
.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 22rpx;
  margin-bottom: 18rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}
.c-head {
  display: flex;
  gap: 14rpx;
  align-items: center;
}
.c-av {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #fff3e2;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.c-e {
  font-size: 36rpx;
}
.c-n {
  font-size: 24rpx;
  font-weight: 700;
  color: #16201c;
}
.c-time {
  font-size: 17rpx;
  color: #c3ccc8;
}
.c-m {
  display: block;
  font-size: 18rpx;
  color: #9aa7a1;
  margin-top: 4rpx;
}

.rows {
  margin-top: 14rpx;
  background: #fbfcfa;
  border-radius: 16rpx;
  padding: 10rpx 16rpx;
}
.r {
  display: flex;
  padding: 6rpx 0;
}
.r-k {
  width: 76rpx;
  font-size: 19rpx;
  color: #a8b3ad;
  flex-shrink: 0;
}
.r-v {
  flex: 1;
  font-size: 19rpx;
  color: #3d4a45;
  line-height: 1.55;
}
.r-v.warn {
  color: #e08a2b;
}

.money {
  display: flex;
  margin-top: 14rpx;
  padding: 14rpx 0;
  border-top: 2rpx solid #f7faf8;
  border-bottom: 2rpx solid #f7faf8;
}
.m-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3rpx;
}
.m-n {
  font-size: 26rpx;
  font-weight: 800;
  color: #16201c;
}
.m-l {
  font-size: 16rpx;
  color: #b3bfba;
}

.msg {
  margin-top: 12rpx;
  background: #fffbf4;
  border-radius: 12rpx;
  padding: 10rpx 12rpx;
}
.msg-t {
  font-size: 19rpx;
  color: #8a7550;
  line-height: 1.6;
}

.acts {
  display: flex;
  gap: 10rpx;
  margin-top: 16rpx;
}
.act {
  flex: 1;
  height: 66rpx;
  border-radius: 33rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: 600;
}
.act.ghost {
  background: #f7faf8;
  color: #7c8a84;
}
.act.main {
  background: linear-gradient(135deg, #f7b45c, #e08a2b);
  color: #fff;
  flex: 1.4;
}
</style>

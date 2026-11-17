<template>
  <view class="page msg-page">
    <nav-bar title="消息" />
    <scroll-view scroll-y class="body no-scrollbar">
      <view class="entries">
        <view v-for="e in entries" :key="e.name" class="entry" @tap="onEntry(e)">
          <view class="e-icon" :style="{ background: e.bg }">
            <text class="e-emoji">{{ e.emoji }}</text>
            <view v-if="e.badge" class="e-badge">{{ e.badge }}</view>
          </view>
          <text class="e-name">{{ e.name }}</text>
        </view>
      </view>

      <view class="list">
        <view v-for="m in list" :key="m.id" class="chat-item" @tap="openChat(m)">
          <view class="c-avatar" :style="{ background: m.type === 'system' ? '#eaf9f1' : m.type === 'notice' ? '#eaf3ff' : '#f2fbf6' }">
            {{ m.avatar }}
          </view>
          <view class="flex1">
            <view class="c-top">
              <text class="c-name">{{ m.name }}</text>
              <text class="c-time">{{ m.timeText }}</text>
            </view>
            <view class="c-bottom">
              <text class="c-last ellipsis">{{ m.previewText }}</text>
              <view v-if="m.unreadCount" class="c-dot">{{ m.unreadCount }}</view>
            </view>
          </view>
        </view>
      </view>

      <view class="end-tip">— 只显示最近 30 天的消息 —</view>
      <view style="height: 40rpx" />
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { MESSAGES } from '@/mock/index.js'
import { store } from '@/store/index.js'
import { pendingCount } from '@/store/expert.js'
import { toast } from '@/common/utils.js'

const list = ref(MESSAGES)
const growingCount = computed(() => store.adoptions.filter((a) => a.status === 'growing').length)

const entries = computed(() => {
  // 角标全部按真实数据算，不再写死数字
  const unshipped = store.orders.filter((o) => o.status === 'unshipped').length
  const waiting = store.orders.find((o) => o.status === 'shipping' || o.status === 'unreceipted')
  const coupons = store.coupons.filter((c) => !c.isUsed).length
  return [
    {
      name: '订单通知',
      emoji: '📦',
      bg: '#eaf9f1',
      badge: unshipped,
      path: '/pages/order/list?tab=unshipped'
    },
    {
      name: '物流助手',
      emoji: '🚚',
      bg: '#eaf3ff',
      badge: 0,
      // 原来写死了一个不存在的单号（少个 X），点进去必然空
      path: waiting ? '/pages/order/logistics?id=' + waiting.id : '/pages/order/list?tab=shipping'
    },
    { name: '认养通知', emoji: '🌱', bg: '#eefaf3', badge: growingCount.value, path: '/pages/farm/my' },
    { name: '问诊通知', emoji: '🩺', bg: '#eaf7ff', badge: pendingCount(), path: '/pages/expert/qa' },
    { name: '优惠活动', emoji: '🎁', bg: '#fff4e4', badge: coupons, path: '/pages/profile/coupon' },
    { name: '农友互动', emoji: '💬', bg: '#f1eeff', badge: 0, path: '/pages/tabbar/community/community' }
  ]
})

function onEntry(e) {
  if (e.path.startsWith('/pages/tabbar')) return uni.reLaunch({ url: e.path })
  uni.navigateTo({ url: e.path })
}

function openChat(m) {
  if (m.type === 'system') {
    if (m.name.indexOf('订单') > -1) return uni.navigateTo({ url: '/pages/order/list?tab=all' })
    if (m.name.indexOf('活动') > -1) return uni.navigateTo({ url: '/pages/profile/coupon' })
    return uni.navigateTo({ url: '/pages/order/list?tab=all' })
  }
  if (m.type === 'notice') {
    return uni.navigateTo({ url: '/pages/post/detail?id=' + (m.postId || 'o2') })
  }
  uni.navigateTo({ url: `/pages/message/chat?id=${m.id}` })
}
</script>

<style scoped>
.msg-page {
  min-height: 100vh;
}
.body {
  padding: 18rpx 24rpx 0;
  height: calc(100vh - 90rpx);
}
.entries {
  display: flex;
  background: #fff;
  border-radius: 26rpx;
  padding: 26rpx 0;
}
.entry {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}
.e-icon {
  width: 84rpx;
  height: 84rpx;
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.e-emoji {
  font-size: 40rpx;
}
.e-badge {
  position: absolute;
  top: -6rpx;
  right: -6rpx;
  min-width: 30rpx;
  height: 30rpx;
  border-radius: 30rpx;
  background: #ff5a4e;
  color: #fff;
  font-size: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6rpx;
  border: 3rpx solid #fff;
}
.e-name {
  font-size: 19rpx;
  color: #3d4a45;
  white-space: nowrap;
}
.list {
  background: #fff;
  border-radius: 26rpx;
  margin-top: 20rpx;
  padding: 0 24rpx;
}
.chat-item {
  display: flex;
  gap: 18rpx;
  padding: 24rpx 0;
  border-bottom: 2rpx solid #f6f9f7;
}
.chat-item:last-child {
  border-bottom: none;
}
.c-avatar {
  width: 92rpx;
  height: 92rpx;
  border-radius: 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 46rpx;
  flex-shrink: 0;
}
.c-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.c-name {
  font-size: 27rpx;
  font-weight: 700;
}
.c-time {
  font-size: 20rpx;
  color: #b3bfba;
}
.c-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10rpx;
  gap: 16rpx;
}
.c-last {
  flex: 1;
  font-size: 23rpx;
  color: #9aa7a1;
}
.c-dot {
  min-width: 34rpx;
  height: 34rpx;
  border-radius: 34rpx;
  background: #ff5a4e;
  color: #fff;
  font-size: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
}
.end-tip {
  text-align: center;
  font-size: 20rpx;
  color: #c3ccc8;
  padding: 30rpx 0;
}
</style>

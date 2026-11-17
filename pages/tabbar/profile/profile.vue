<template>
  <view class="page mine">
    <view class="top-bg">
      <view class="status" :style="{ height: statusBar + 'px' }" />
      <view class="top-row">
        <text class="top-title">我的</text>
        <view class="top-actions">
          <view class="t-icon" @tap="go('/pages/message/message')">
            <icon-svg name="bell" :size="34" color="#FFFFFF" :stroke="1.8" />
          </view>
          <view class="t-icon" @tap="go('/pages/profile/settings')">
            <icon-svg name="setting" :size="34" color="#FFFFFF" :stroke="1.8" />
          </view>
        </view>
      </view>

      <view class="user">
        <view class="avatar">
          <text class="avatar-emoji">{{ store.user.avatar }}</text>
        </view>
        <view class="flex1">
          <text class="nick">{{ store.user.nickname }}</text>
          <view class="level">{{ store.user.level }}</view>
          <text class="phone">{{ store.user.phone }}</text>
        </view>
        <view class="edit" @tap="toast('编辑资料（演示）')">
          <icon-svg name="edit" :size="28" color="#FFFFFF" :stroke="1.8" />
        </view>
      </view>

      <view class="stats">
        <view class="stat" @tap="go('/pages/profile/follow')">
          <text class="stat-num">12</text>
          <text class="stat-label">关注农场</text>
        </view>
        <view class="stat-div" />
        <view class="stat" @tap="toast('收藏夹')">
          <text class="stat-num">{{ store.favorites.length }}</text>
          <text class="stat-label">收藏</text>
        </view>
        <view class="stat-div" />
        <view class="stat" @tap="toast('积分商城（演示）')">
          <text class="stat-num">{{ store.user.points }}</text>
          <text class="stat-label">积分</text>
        </view>
        <view class="stat-div" />
        <view class="stat" @tap="go('/pages/profile/coupon')">
          <text class="stat-num">{{ usableCoupons }}</text>
          <text class="stat-label">优惠券</text>
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="body no-scrollbar">
      <!-- 身份卡：当前身份 + 切换入口 -->
      <view class="card role-card" @tap="toRoleSwitch">
        <view class="rc-main">
          <view class="rc-ico" :style="{ background: role.soft }">
            <text class="rc-emoji">{{ role.emoji }}</text>
          </view>
          <view class="flex1">
            <view class="rc-name-row">
              <text class="rc-name">{{ role.name }}</text>
              <text class="rc-badge" :style="{ color: role.color, background: role.soft }">{{ roleTag }}</text>
            </view>
            <text class="rc-sub">{{ role.desc }}</text>
          </view>
          <view class="rc-switch">
            <text class="rc-switch-t">切换</text>
            <icon-svg name="right" :size="20" color="#9AA7A1" />
          </view>
        </view>
        <view v-if="moreRoles.length" class="rc-more">
          <text class="rc-more-t">还开通了：{{ moreRoles.map((r) => r.name).join('、') }}</text>
          <text class="rc-more-s">同一个账号可以同时是买家、农户和专家</text>
        </view>
      </view>

      <!-- 订单 -->
      <view class="card orders">
        <view class="o-head">
          <text class="o-title">我的订单</text>
          <view class="row" @tap="go('/pages/order/list?tab=all')">
            <text class="o-all">全部订单</text>
            <icon-svg name="right" :size="20" color="#9AA7A1" />
          </view>
        </view>
        <view class="o-grid">
          <view v-for="s in statusList" :key="s.key" class="o-item" @tap="go('/pages/order/list?tab=' + s.key)">
            <view class="o-icon">
              <icon-svg :name="s.icon" :size="44" color="#16201C" :stroke="1.5" />
              <view v-if="s.count" class="o-badge">{{ s.count }}</view>
            </view>
            <text class="o-name">{{ s.name }}</text>
          </view>
        </view>
      </view>

      <!-- 我的农场 -->
      <view v-if="myAdoption" class="card ranch" @tap="go('/pages/farm/my')">
        <view class="ranch-head">
          <view class="row">
            <icon-svg name="sprout" :size="32" color="#06A96A" :stroke="1.7" />
            <text class="ranch-title">我认养的地</text>
          </view>
          <text class="ranch-more">查看长势</text>
        </view>
        <view class="ranch-body">
          <view class="plot">
            <text class="plot-emoji">{{ api.cropsEmoji(myAdoption) }}</text>
            <view class="plot-badge">{{ api.statusText(myAdoption.status) }}</view>
          </view>
          <view class="flex1">
            <text class="plot-name">{{ plotName }}</text>
            <text class="plot-desc">{{ api.cropsText(myAdoption) }} 第 {{ api.daysGone(myAdoption) }} 天 · 还剩 {{ api.daysLeft(myAdoption) }} 天</text>
            <view class="progress">
              <view class="progress-bar" :style="{ width: api.progressOf(myAdoption) + '%' }" />
            </view>
            <text class="plot-tip">{{ myAdoption.freq ? '已为你配送 ' + myAdoption.deliveriesDone + ' 次' : '自耕自提，不安排配送' }}</text>
          </view>
        </view>
      </view>

      <view v-if="!myAdoption" class="card ranch-empty" @tap="go('/pages/farm/adopt')">
        <view class="row between">
          <view class="row">
            <icon-svg name="sprout" :size="32" color="#06A96A" :stroke="1.7" />
            <text class="ranch-title">还没有认养的地</text>
          </view>
          <text class="ranch-more">去认养 ›</text>
        </view>
        <text class="re-sub">选一块地，种点自己爱吃的，长什么样随时能看</text>
      </view>

      <!-- 工具 -->
      <view class="card tools">
        <view v-for="t in tools" :key="t.name" class="tool" @tap="onTool(t)">
          <view class="tool-icon" :style="{ background: t.bg }">
            <icon-svg :name="t.icon" :size="34" :color="t.color" :stroke="1.7" />
          </view>
          <text class="tool-name">{{ t.name }}</text>
        </view>
      </view>

      <!-- 菜单 -->
      <view class="card menu">
        <view v-for="m in menus" :key="m.name" class="menu-item" @tap="onMenu(m)">
          <icon-svg :name="m.icon" :size="32" color="#3D4A45" :stroke="1.7" />
          <text class="menu-name">{{ m.name }}</text>
          <text class="menu-value">{{ m.value }}</text>
          <icon-svg name="right" :size="22" color="#C3CCC8" />
        </view>
      </view>

      <view class="version">湘农汇 v1.0.0 · 产地直采</view>
      <view style="height: 170rpx" />
    </scroll-view>

    <tab-bar active="mine" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { countByStatus, growingAdoptions, store, syncCloudUser } from '@/store/index.js'
import { activatedRoles, appStatusOf, currentRole } from '@/store/role.js'
import * as api from '@/api/index.js'
import { toast } from '@/common/utils.js'

const statusBar = ref(20)
try {
  const info = uni.getStorageSync('sys_info')
  if (info && info.statusBarHeight) statusBar.value = info.statusBarHeight
} catch (e) {}

const usableCoupons = computed(() => store.coupons.filter((c) => !c.isUsed).length)

// 当前身份；还没选过时给一个中性的占位，避免页面报错
const role = computed(
  () =>
    currentRole() || {
      key: '',
      name: '未选身份',
      emoji: '🙂',
      desc: '选一个身份，看到的功能会不一样',
      color: '#0FC97A',
      soft: '#E9FAF2'
    }
)
const roleTag = computed(() => {
  if (!role.value.key) return '去选择'
  if (role.value.key === 'buyer') return '买家'
  return appStatusOf(role.value.key) === 'approved' ? '已认证' : '审核中'
})
const moreRoles = computed(() => activatedRoles().filter((r) => r.key !== role.value.key))

function toRoleSwitch() {
  uni.navigateTo({ url: '/pages/role/switch' })
}

// 最近一块在种的认养地
const myAdoption = computed(() => growingAdoptions()[0] || null)
const plotName = computed(() => {
  if (!myAdoption.value) return ''
  const p = api.findPlot(myAdoption.value.plotId)
  const farm = (p && api.plotView(p).farm.name) || '湘农汇农场'
  return farm + ' · ' + myAdoption.value.code + ' 号地块'
})

const statusList = computed(() => [
  { key: 'unpaid', name: '待付款', icon: 'wallet', count: countByStatus('unpaid') },
  { key: 'unshipped', name: '待发货', icon: 'order', count: countByStatus('unshipped') },
  { key: 'shipping', name: '待收货', icon: 'truck', count: countByStatus('shipping') + countByStatus('unreceipted') },
  { key: 'done', name: '待评价', icon: 'star', count: 1 }
])

// 第一个宫格跟身份走：农户看到工作台，专家看到接诊台，买家看到开通入口
const tools = computed(() => {
  const r = currentRole()
  const list = []
  if (r && r.key === 'farmer') {
    list.push({ name: '农户工作台', icon: 'sprout', bg: '#FFF3E2', color: '#E08A2B', path: '/pages/farm/workbench' })
  } else if (r && r.key === 'expert') {
    list.push({ name: '接诊台', icon: 'comment', bg: '#EAF3FF', color: '#4A8CFF', path: '/pages/expert/workbench' })
  } else {
    list.push({ name: '成为农户', icon: 'shop', bg: '#FFF3E2', color: '#E08A2B', path: '/pages/role/apply?role=farmer' })
  }
  list.push(
    { name: '拍照识病', icon: 'camera', bg: '#EAF9F1', color: '#06A96A', path: '/pages/scan/scan' },
    { name: '专家问诊', icon: 'users', bg: '#EAF3FF', color: '#4A8CFF', path: '/pages/expert/list' },
    { name: '我的问诊', icon: 'comment', bg: '#F1EEFF', color: '#7A6BFF', path: '/pages/expert/qa' },
    { name: '农事日历', icon: 'calendar', bg: '#EAF3FF', color: '#4A8CFF', path: '/pages/farm/calendar' },
    { name: '我的收藏', icon: 'heart', bg: '#FFEEF0', color: '#FF5A4E', path: '/pages/profile/favorite' },
    { name: '收货地址', icon: 'location', bg: '#EAF9F1', color: '#06A96A', path: '/pages/address/list' },
    { name: '农友圈', icon: 'chat', bg: '#EAF7FF', color: '#2FA0D8', path: '/pages/tabbar/community/community' },
    { name: '优惠券', icon: 'coupon', bg: '#FFF4E4', color: '#FF8A3D', path: '/pages/profile/coupon' }
  )
  return list
})

const menus = computed(() => [
  { name: '身份与权限', icon: 'users', value: roleTag.value, path: '/pages/role/switch' },
  { name: '识图记录', icon: 'camera', value: '', path: '/pages/scan/history' },
  { name: '帮助与反馈', icon: 'comment', value: '' },
  { name: '关于湘农汇', icon: 'leaf', value: 'v1.0.0' },
  { name: '设置', icon: 'setting', value: '', path: '/pages/profile/settings' }
])

function go(url) {
  if (url.startsWith('/pages/tabbar')) return uni.reLaunch({ url })
  uni.navigateTo({ url })
}

function onTool(t) {
  if (t.path.startsWith('/pages/tabbar')) return uni.reLaunch({ url: t.path })
  if (t.path) return uni.navigateTo({ url: t.path })
  toast('功能演示：' + t.name)
}

function onMenu(m) {
  if (m.path) return uni.navigateTo({ url: m.path })
  toast('功能演示：' + m.name)
}

onShow(() => {
  syncCloudUser()
})
</script>

<style scoped>
.mine {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background: #f4f8f5;
}
.top-bg {
  background: linear-gradient(160deg, #14d183 0%, #0bad6d 70%, #089a60 100%);
  padding: 0 28rpx 34rpx;
  border-radius: 0 0 40rpx 40rpx;
  position: relative;
}
.top-row {
  height: 84rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.top-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
}
.top-actions {
  display: flex;
  gap: 10rpx;
}
.t-icon {
  width: 62rpx;
  height: 62rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
}
.user {
  display: flex;
  align-items: center;
  gap: 22rpx;
  margin-top: 14rpx;
}
.avatar {
  width: 128rpx;
  height: 128rpx;
  border-radius: 40rpx;
  background: rgba(255, 255, 255, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 24rpx rgba(4, 90, 58, 0.18);
}
.avatar-emoji {
  font-size: 68rpx;
}
.nick {
  font-size: 38rpx;
  font-weight: 800;
  color: #fff;
}
.level {
  display: inline-block;
  margin-top: 10rpx;
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
  font-size: 19rpx;
  padding: 4rpx 14rpx;
  border-radius: 30rpx;
}
.phone {
  display: block;
  margin-top: 8rpx;
  font-size: 21rpx;
  color: rgba(255, 255, 255, 0.75);
}
.edit {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
}
.stats {
  margin-top: 28rpx;
  background: rgba(255, 255, 255, 0.16);
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  padding: 20rpx 0;
}
.stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}
.stat-num {
  font-size: 32rpx;
  font-weight: 800;
  color: #fff;
}
.stat-label {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.8);
}
.stat-div {
  width: 2rpx;
  height: 40rpx;
  background: rgba(255, 255, 255, 0.24);
}
.body {
  flex: 1;
  height: 0;
  padding: 22rpx 24rpx 0;
}
.orders {
  padding: 24rpx;
  margin-bottom: 20rpx;
}
.o-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.o-title {
  font-size: 29rpx;
  font-weight: 700;
}
.o-all {
  font-size: 22rpx;
  color: #9aa7a1;
}
.o-grid {
  display: flex;
  margin-top: 24rpx;
}
.o-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}
.o-icon {
  position: relative;
}
.o-badge {
  position: absolute;
  top: -8rpx;
  right: -14rpx;
  min-width: 28rpx;
  height: 28rpx;
  border-radius: 28rpx;
  background: #ff5a4e;
  color: #fff;
  font-size: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 6rpx;
}
.o-name {
  font-size: 22rpx;
  color: #3d4a45;
}
.ranch {
  padding: 24rpx;
  margin-bottom: 20rpx;
}
.ranch-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ranch-title {
  font-size: 29rpx;
  font-weight: 700;
  margin-left: 8rpx;
}
.ranch-more {
  font-size: 22rpx;
  color: #06a96a;
}
.ranch-body {
  display: flex;
  gap: 20rpx;
  margin-top: 20rpx;
}
.plot {
  width: 140rpx;
  height: 140rpx;
  border-radius: 22rpx;
  background: linear-gradient(150deg, #e9f9ef, #c9efd9);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-shrink: 0;
}
.plot-emoji {
  font-size: 72rpx;
}
.plot-badge {
  white-space: nowrap;
  position: absolute;
  bottom: 8rpx;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.92);
  color: #06a96a;
  font-size: 17rpx;
  padding: 2rpx 10rpx;
  border-radius: 20rpx;
}
.plot-name {
  font-size: 26rpx;
  font-weight: 600;
}
.plot-desc {
  display: block;
  font-size: 21rpx;
  color: #9aa7a1;
  margin-top: 8rpx;
}
.progress {
  height: 10rpx;
  border-radius: 10rpx;
  background: #eef4f0;
  margin-top: 16rpx;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  border-radius: 10rpx;
  background: linear-gradient(90deg, #35e39b, #0bbd72);
}
.plot-tip {
  display: block;
  font-size: 19rpx;
  color: #b3bfba;
  margin-top: 10rpx;
}
.role-card {
  padding: 22rpx 24rpx;
  margin-bottom: 20rpx;
}
.rc-main {
  display: flex;
  align-items: center;
  gap: 18rpx;
}
.rc-ico {
  width: 84rpx;
  height: 84rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.rc-emoji {
  font-size: 42rpx;
}
.rc-name-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.rc-name {
  font-size: 30rpx;
  font-weight: 800;
}
.rc-badge {
  font-size: 18rpx;
  padding: 2rpx 10rpx;
  border-radius: 20rpx;
  font-weight: 600;
}
.rc-sub {
  display: block;
  margin-top: 6rpx;
  font-size: 21rpx;
  color: #9aa7a1;
}
.rc-switch {
  display: flex;
  align-items: center;
  gap: 2rpx;
  flex-shrink: 0;
}
.rc-switch-t {
  font-size: 22rpx;
  color: #06a96a;
  font-weight: 600;
}
.rc-more {
  margin-top: 16rpx;
  padding-top: 14rpx;
  border-top: 2rpx solid #f4f8f5;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.rc-more-t {
  font-size: 20rpx;
  color: #7c8a84;
}
.rc-more-s {
  font-size: 18rpx;
  color: #b3bfba;
}
.tools {
  display: flex;
  flex-wrap: wrap;
  padding: 24rpx 0 8rpx;
  margin-bottom: 20rpx;
}
.tool {
  width: 25%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 24rpx;
}
.tool-icon {
  width: 86rpx;
  height: 86rpx;
  border-radius: 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tool-name {
  font-size: 21rpx;
  color: #3d4a45;
}
.menu {
  padding: 6rpx 24rpx;
}
.menu-item {
  display: flex;
  align-items: center;
  gap: 18rpx;
  height: 100rpx;
  border-bottom: 2rpx solid #f4f8f5;
}
.menu-item:last-child {
  border-bottom: none;
}
.menu-name {
  flex: 1;
  font-size: 27rpx;
  color: #263330;
}
.menu-value {
  font-size: 22rpx;
  color: #a8b3ae;
  margin-right: 6rpx;
}
.version {
  text-align: center;
  font-size: 20rpx;
  color: #c3ccc8;
  padding: 34rpx 0 10rpx;
}
.ranch-empty {
  margin: 24rpx 28rpx 0;
  padding: 26rpx 24rpx;
}
.re-sub {
  display: block;
  font-size: 21rpx;
  color: #9aa7a1;
  margin-top: 12rpx;
}
</style>

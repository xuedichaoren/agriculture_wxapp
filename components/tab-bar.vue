<template>
  <view class="tabbar-wrap">
    <view class="tabbar">
      <view v-for="t in tabs" :key="t.key" class="tab-item" @tap="go(t)">
        <view class="ico-box">
          <icon-svg :name="t.icon" :size="46" :color="active === t.key ? '#0FC97A' : '#9AA7A1'" :stroke="active === t.key ? 2 : 1.7" />
          <view v-if="t.key === 'cart' && cartCount" class="badge">{{ cartCount > 99 ? '99+' : cartCount }}</view>
        </view>
        <text class="label" :class="{ on: active === t.key }">{{ t.name }}</text>
      </view>
    </view>
    <view class="safe-bottom" />
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { cartCount } from '@/store/index.js'

const props = defineProps({
  active: { type: String, default: 'home' }
})

const tabs = [
  { key: 'home', name: '首页', icon: 'home', path: '/pages/tabbar/home/home' },
  { key: 'cate', name: '分类', icon: 'grid', path: '/pages/tabbar/category/category' },
  { key: 'cart', name: '菜篮子', icon: 'cart', path: '/pages/tabbar/cart/cart' },
  { key: 'community', name: '农友圈', icon: 'chat', path: '/pages/tabbar/community/community' },
  { key: 'mine', name: '我的', icon: 'user', path: '/pages/tabbar/profile/profile' }
]

const count = computed(() => cartCount.value)

function go(t) {
  if (props.active === t.key) return
  uni.reLaunch({ url: t.path })
}
</script>

<style scoped>
.tabbar-wrap {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  box-shadow: 0 -6rpx 26rpx rgba(22, 60, 45, 0.06);
  z-index: 50;
  border-radius: 26rpx 26rpx 0 0;
}
.tabbar {
  display: flex;
  height: 104rpx;
  align-items: center;
}
.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
}
.ico-box {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.badge {
  position: absolute;
  top: -6rpx;
  right: -18rpx;
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
.label {
  font-size: 19rpx;
  color: #9aa7a1;
}
.label.on {
  color: #0fc97a;
  font-weight: 600;
}
</style>

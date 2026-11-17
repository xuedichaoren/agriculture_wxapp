<template>
  <view class="tabbar-wrap">
    <view class="tabbar">
      <view v-for="t in tabs" :key="t.key" class="tab-item" @tap="go(t)">
        <view class="ico-box">
          <icon-svg
            :name="t.icon"
            :size="46"
            :color="active === t.key ? brand : '#9AA7A1'"
            :stroke="active === t.key ? 2 : 1.7"
          />
          <view v-if="t.key === 'cart' && cartCount" class="badge">{{ cartCount > 99 ? '99+' : cartCount }}</view>
        </view>
        <text class="label" :class="{ on: active === t.key }" :style="active === t.key ? { color: brand } : {}">
          {{ t.name }}
        </text>
      </view>
    </view>
    <view class="safe-bottom" />
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { cartCount } from '@/store/index.js'
import { currentRole, roleTabs } from '@/store/role.js'

const props = defineProps({
  active: { type: String, default: 'home' }
})

// 底部导航跟着身份走：买家 / 农户 / 专家 各一套，配置在 common/roles.js
const tabs = computed(() => roleTabs())
// 主色也跟身份走：买家绿、农户橙、专家蓝，切换后一眼能看出身份变了
const brand = computed(() => (currentRole() && currentRole().color) || '#0FC97A')

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
  font-weight: 600;
}
</style>

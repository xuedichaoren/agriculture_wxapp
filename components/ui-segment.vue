<template>
  <view class="u-seg" :class="[`sz-${size}`, { pill }]" :style="{ background: bg }">
    <view
      v-for="o in options"
      :key="o.key"
      class="seg-item"
      :class="{ on: value === o.key }"
      :style="value === o.key ? { background: activeBg, boxShadow: '0 4rpx 12rpx rgba(6,120,80,0.12)' } : {}"
      @tap="pick(o)"
    >
      <text class="seg-tx" :style="{ color: value === o.key ? activeColor : C.sub }">{{ o.label }}</text>
      <view v-if="o.badge" class="seg-badge">{{ o.badge }}</view>
    </view>
  </view>
</template>

<script setup>
import { C } from '@/common/theme.js'

const props = defineProps({
  options: { type: Array, default: () => [] },
  value: { type: String, default: '' },
  size: { type: String, default: 'md' },
  pill: { type: Boolean, default: false },
  bg: { type: String, default: '#F1F5F2' },
  activeBg: { type: String, default: '#FFFFFF' },
  activeColor: { type: String, default: C.ink }
})
const emit = defineEmits(['change'])

function pick(o) {
  if (o.key === props.value) return
  emit('change', o.key, o)
}
</script>

<style scoped>
.u-seg {
  display: flex;
  align-items: center;
  padding: 6rpx;
  border-radius: 16rpx;
  gap: 4rpx;
}
.u-seg.pill {
  border-radius: 999rpx;
  padding: 6rpx;
}
.seg-item {
  flex: 1;
  height: 64rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  position: relative;
  transition: background 0.15s;
}
.pill .seg-item {
  border-radius: 999rpx;
}
.sz-sm .seg-item {
  height: 54rpx;
}
.seg-tx {
  font-size: 25rpx;
  font-weight: 500;
}
.seg-item.on .seg-tx {
  font-weight: 700;
}
.sz-sm .seg-tx {
  font-size: 22rpx;
}
.seg-badge {
  min-width: 24rpx;
  height: 24rpx;
  padding: 0 5rpx;
  border-radius: 24rpx;
  background: #ff5a4e;
  color: #fff;
  font-size: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>

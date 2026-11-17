<template>
  <view class="u-stat" :class="{ center }">
    <view class="val-row">
      <text class="num" :style="{ color: color, fontSize: size }">{{ value }}</text>
      <text v-if="unit" class="unit" :style="{ color: color }">{{ unit }}</text>
      <text v-if="trend" class="trend" :class="trendUp ? 'up' : 'down'">{{ trend }}</text>
    </view>
    <text class="label">{{ label }}</text>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { tone as toneOf, C } from '@/common/theme.js'

const props = defineProps({
  value: { type: [Number, String], default: 0 },
  unit: { type: String, default: '' },
  label: { type: String, default: '' },
  tone: { type: String, default: 'ink' },
  size: { type: String, default: '40rpx' },
  trend: { type: String, default: '' },
  trendUp: { type: Boolean, default: true },
  center: { type: Boolean, default: false }
})

const color = computed(() => {
  if (props.tone === 'ink') return C.ink
  if (props.tone === 'white') return '#FFFFFF'
  if (props.tone === 'sub') return C.sub
  return toneOf(props.tone).color
})
</script>

<style scoped>
.u-stat {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.center {
  align-items: center;
  text-align: center;
}
.val-row {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}
.num {
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.5rpx;
}
.unit {
  font-size: 20rpx;
  font-weight: 600;
  opacity: 0.8;
}
.trend {
  font-size: 19rpx;
  margin-left: 6rpx;
  font-weight: 600;
}
.up {
  color: #ff5a4e;
}
.down {
  color: #06a96a;
}
.label {
  font-size: 20rpx;
  color: #9aa7a1;
}
</style>

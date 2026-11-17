<template>
  <view class="u-tag" :class="[`sz-${size}`, { round }]" :style="boxStyle">
    <text class="tx" :style="txStyle"><slot>{{ text }}</slot></text>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { tone as toneOf } from '@/common/theme.js'

const props = defineProps({
  text: { type: String, default: '' },
  /** brand / danger / warn / info / purple / gold / gray */
  tone: { type: String, default: 'brand' },
  size: { type: String, default: 'md' },
  /** 默认浅底；solid 为实心 */
  plain: { type: Boolean, default: true },
  round: { type: Boolean, default: false }
})

const t = computed(() => toneOf(props.tone))

const boxStyle = computed(() => {
  if (props.plain) {
    return { background: t.value.soft, border: `2rpx solid ${t.value.line}` }
  }
  return { background: t.value.color, border: '2rpx solid transparent' }
})

const txStyle = computed(() => ({ color: props.plain ? t.value.color : '#FFFFFF' }))
</script>

<style scoped>
.u-tag {
  display: inline-flex;
  align-items: center;
  border-radius: 8rpx;
  padding: 4rpx 12rpx;
  max-width: 100%;
}
.round {
  border-radius: 999rpx;
  padding: 4rpx 16rpx;
}
.sz-sm {
  padding: 2rpx 10rpx;
}
.sz-lg {
  padding: 8rpx 18rpx;
}
.tx {
  font-size: 20rpx;
  line-height: 1.35;
  font-weight: 600;
}
.sz-sm .tx {
  font-size: 18rpx;
}
.sz-lg .tx {
  font-size: 23rpx;
}
</style>

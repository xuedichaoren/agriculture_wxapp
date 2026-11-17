<template>
  <view class="u-av" :class="{ ring }" :style="boxStyle">
    <image v-if="showImg" class="pic" :src="src" mode="aspectFill" @error="failed = true" />
    <text v-else class="emoji" :style="{ fontSize: emojiSize + 'rpx' }">{{ emoji }}</text>
    <view v-if="badge" class="dot" :style="{ background: badgeColor }" />
    <view v-if="online" class="online" />
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { C } from '@/common/theme.js'

const props = defineProps({
  src: { type: String, default: '' },
  emoji: { type: String, default: '🧑‍🌾' },
  size: { type: [Number, String], default: 96 },
  radius: { type: String, default: '' },
  ring: { type: Boolean, default: false },
  badge: { type: [Boolean, Number, String], default: false },
  badgeColor: { type: String, default: C.danger },
  online: { type: Boolean, default: false },
  bg: { type: String, default: '' }
})

const failed = ref(false)
watch(() => props.src, () => { failed.value = false })

const boxStyle = computed(() => {
  const s = typeof props.size === 'number' ? props.size + 'rpx' : props.size
  return {
    width: s,
    height: s,
    borderRadius: props.radius || (typeof props.size === 'number' ? props.size * 0.32 + 'rpx' : '26rpx'),
    background: props.bg || 'linear-gradient(150deg, #E9FAF2, #C9EFDB)'
  }
})
const emojiSize = computed(() => (typeof props.size === 'number' ? Math.round(props.size * 0.54) : 52))
const showImg = computed(() => !!props.src && !failed.value)
</script>

<style scoped>
.u-av {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}
.ring {
  border: 4rpx solid #fff;
  box-shadow: 0 8rpx 20rpx rgba(6, 120, 80, 0.14);
}
.pic {
  width: 100%;
  height: 100%;
  display: block;
}
.emoji {
  line-height: 1;
}
.dot {
  position: absolute;
  top: -2rpx;
  right: -2rpx;
  min-width: 26rpx;
  height: 26rpx;
  border-radius: 26rpx;
  border: 3rpx solid #fff;
  color: #fff;
  font-size: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4rpx;
}
.online {
  position: absolute;
  bottom: 2rpx;
  right: 2rpx;
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;
  background: #20c46b;
  border: 3rpx solid #fff;
}
</style>

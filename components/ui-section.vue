<template>
  <view class="u-sec" :style="{ marginTop: top }">
    <view class="left">
      <view v-if="bar" class="bar" :style="{ background: accent }" />
      <text class="title">{{ title }}</text>
      <text v-if="sub" class="sub">{{ sub }}</text>
    </view>
    <view class="right" @tap="onMore">
      <slot name="right">
        <template v-if="more">
          <text class="more">{{ more }}</text>
          <icon-svg name="right" :size="20" color="#9AA7A1" />
        </template>
      </slot>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { C, n } from '@/common/theme.js'

const props = defineProps({
  title: { type: String, default: '' },
  sub: { type: String, default: '' },
  more: { type: String, default: '' },
  bar: { type: Boolean, default: true },
  accent: { type: String, default: C.brand },
  top: { type: [Number, String], default: 0 }
})
const emit = defineEmits(['more'])
const top = computed(() => n(props.top))
function onMore() {
  if (props.more) emit('more')
}
</script>

<style scoped>
.u-sec {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6rpx 2rpx 18rpx;
}
.left {
  display: flex;
  align-items: center;
  gap: 12rpx;
  min-width: 0;
}
.bar {
  width: 6rpx;
  height: 28rpx;
  border-radius: 6rpx;
}
.title {
  font-size: 31rpx;
  font-weight: 700;
  color: #16201c;
  letter-spacing: -0.2rpx;
}
.sub {
  font-size: 21rpx;
  color: #9aa7a1;
  margin-left: 2rpx;
}
.right {
  display: flex;
  align-items: center;
  gap: 4rpx;
}
.more {
  font-size: 23rpx;
  color: #9aa7a1;
}
</style>

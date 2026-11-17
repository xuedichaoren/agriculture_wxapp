<template>
  <view class="u-cell" :class="{ 'no-line': last, plain }" @tap="onTap">
    <view v-if="icon" class="ico" :style="{ background: iconBg }">
      <icon-svg :name="icon" :size="iconSize" :color="iconColor" :stroke="1.8" />
    </view>
    <view v-else-if="emoji" class="ico" :style="{ background: iconBg }">
      <text class="emoji" :style="{ fontSize: iconSize + 'rpx' }">{{ emoji }}</text>
    </view>

    <view class="main">
      <view class="line1">
        <text class="title">{{ title }}</text>
        <text v-if="tag" class="tag">{{ tag }}</text>
      </view>
      <text v-if="desc" class="desc">{{ desc }}</text>
    </view>

    <view class="right">
      <slot name="right">
        <text v-if="value" class="value">{{ value }}</text>
        <icon-svg v-if="arrow" name="right" :size="22" color="#C3CCC8" />
      </slot>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { C } from '@/common/theme.js'

const props = defineProps({
  icon: { type: String, default: '' },
  emoji: { type: String, default: '' },
  iconBg: { type: String, default: C.brandSoft },
  iconColor: { type: String, default: C.brandDeep },
  iconSize: { type: [Number, String], default: 34 },
  title: { type: String, default: '' },
  desc: { type: String, default: '' },
  tag: { type: String, default: '' },
  value: { type: String, default: '' },
  arrow: { type: Boolean, default: true },
  last: { type: Boolean, default: false },
  plain: { type: Boolean, default: false }
})
const emit = defineEmits(['click'])
const iconSize = computed(() => (typeof props.iconSize === 'number' ? props.iconSize : Number(props.iconSize) || 34))

function onTap() {
  emit('click')
}
</script>

<style scoped>
.u-cell {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 22rpx 0;
  border-bottom: 2rpx solid #f4f8f5;
  min-height: 60rpx;
}
.no-line {
  border-bottom: none;
}
.plain {
  padding: 14rpx 0;
  border-bottom: none;
}
.ico {
  width: 64rpx;
  height: 64rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.emoji {
  line-height: 1;
}
.main {
  flex: 1;
  min-width: 0;
}
.line1 {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.title {
  font-size: 27rpx;
  color: #263330;
  font-weight: 500;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.tag {
  font-size: 17rpx;
  color: #06a96a;
  background: #e9faf2;
  border-radius: 6rpx;
  padding: 2rpx 8rpx;
  flex-shrink: 0;
}
.desc {
  display: block;
  margin-top: 6rpx;
  font-size: 21rpx;
  color: #9aa7a1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.right {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex-shrink: 0;
}
.value {
  font-size: 23rpx;
  color: #a8b3ae;
}
</style>

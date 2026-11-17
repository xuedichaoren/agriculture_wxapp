<template>
  <view class="u-card" :class="{ 'is-flat': flat, 'is-tight': tight }" :style="boxStyle">
    <view v-if="title || head" class="u-card-head">
      <view class="hd-left">
        <text v-if="title" class="hd-title">{{ title }}</text>
        <text v-if="sub" class="hd-sub">{{ sub }}</text>
      </view>
      <view class="hd-right"><slot name="extra" /></view>
    </view>
    <slot />
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { C, R, SH, n } from '@/common/theme.js'

const props = defineProps({
  title: { type: String, default: '' },
  sub: { type: String, default: '' },
  head: { type: Boolean, default: false },
  /** 内边距，数字按 rpx 处理 */
  pad: { type: [Number, String], default: 24 },
  radius: { type: String, default: R.lg },
  bg: { type: String, default: C.white },
  /** 去掉阴影（列表内嵌卡片用） */
  flat: { type: Boolean, default: false },
  tight: { type: Boolean, default: false },
  marginBottom: { type: [Number, String], default: 20 }
})

const boxStyle = computed(() => ({
  padding: n(props.pad),
  borderRadius: props.radius,
  background: props.bg,
  boxShadow: props.flat ? 'none' : SH.card,
  marginBottom: n(props.marginBottom)
}))
</script>

<style scoped>
.u-card {
  position: relative;
  overflow: hidden;
}
.is-tight {
  padding: 0;
}
.u-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}
.hd-left {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  min-width: 0;
}
.hd-title {
  font-size: 29rpx;
  font-weight: 700;
  color: #16201c;
}
.hd-sub {
  font-size: 21rpx;
  color: #9aa7a1;
}
.hd-right {
  flex-shrink: 0;
}
</style>

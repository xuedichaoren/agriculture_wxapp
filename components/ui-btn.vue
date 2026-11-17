<template>
  <view
    class="u-btn"
    :class="[`t-${type}`, `s-${size}`, { block, disabled: isOff, plain }]"
    :style="boxStyle"
    @tap="onTap"
  >
    <view v-if="loading" class="spin" />
    <icon-svg
      v-else-if="icon"
      :name="icon"
      :size="iconSize"
      :color="iconColor"
      :stroke="1.9"
    />
    <text class="lb"><slot>{{ text }}</slot></text>
    <view v-if="badge" class="badge">{{ badge }}</view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { C, G, R, SH } from '@/common/theme.js'

const props = defineProps({
  text: { type: String, default: '' },
  /** primary 实心主色 / ghost 浅绿底 / line 描边 / text 纯文字 / danger 危险 */
  type: { type: String, default: 'primary' },
  /** lg 92rpx / md 80rpx / sm 60rpx / xs 52rpx */
  size: { type: String, default: 'md' },
  block: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  icon: { type: String, default: '' },
  badge: { type: [Number, String], default: '' },
  plain: { type: Boolean, default: false }
})
const emit = defineEmits(['click'])

const isOff = computed(() => props.disabled || props.loading)

const iconSize = computed(() => ({ lg: 36, md: 32, sm: 26, xs: 24 }[props.size] || 30))
const iconColor = computed(() => {
  if (props.type === 'primary') return '#FFFFFF'
  if (props.type === 'danger') return C.danger
  if (props.type === 'text') return C.brandDeep
  return C.brandDeep
})

const boxStyle = computed(() => {
  const base = { borderRadius: props.type === 'text' ? '0' : R.pill }
  if (props.type === 'primary' && !isOff.value) Object.assign(base, { background: G.brand, boxShadow: SH.float })
  if (props.type === 'primary' && isOff.value) base.background = '#D9E3DE'
  return base
})

function onTap() {
  if (isOff.value) return
  emit('click')
}
</script>

<style scoped>
.u-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  position: relative;
  transition: opacity 0.12s;
  box-sizing: border-box;
}
.u-btn:active {
  opacity: 0.86;
}
.block {
  display: flex;
  width: 100%;
}

/* 尺寸 */
.s-lg {
  height: 92rpx;
  padding: 0 44rpx;
  font-size: 30rpx;
}
.s-md {
  height: 80rpx;
  padding: 0 36rpx;
  font-size: 28rpx;
}
.s-sm {
  height: 60rpx;
  padding: 0 26rpx;
  font-size: 24rpx;
}
.s-xs {
  height: 52rpx;
  padding: 0 20rpx;
  font-size: 22rpx;
}

/* 类型 */
.t-primary .lb {
  color: #fff;
  font-weight: 700;
}
.t-ghost {
  background: #e9faf2;
}
.t-ghost .lb {
  color: #06a96a;
  font-weight: 600;
}
.t-line {
  background: #fff;
  border: 2rpx solid #e6ece9;
}
.t-line .lb {
  color: #3d4a45;
  font-weight: 600;
}
.t-text {
  background: transparent;
}
.t-text .lb {
  color: #06a96a;
  font-weight: 600;
}
.t-danger {
  background: #ffecea;
}
.t-danger .lb {
  color: #ff5a4e;
  font-weight: 600;
}

.disabled {
  opacity: 0.55;
}
.lb {
  font-weight: 600;
  line-height: 1;
  color: #fff;
}
.badge {
  position: absolute;
  top: 4rpx;
  right: 8rpx;
  min-width: 26rpx;
  height: 26rpx;
  padding: 0 5rpx;
  border-radius: 26rpx;
  background: #ff5a4e;
  color: #fff;
  font-size: 17rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.spin {
  width: 26rpx;
  height: 26rpx;
  border-radius: 50%;
  border: 3rpx solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

<template>
  <view v-if="visible" class="u-sheet">
    <view class="mask" @tap="onMask" />
    <view class="panel" :style="{ maxHeight: maxH }">
      <view class="grab" />
      <view v-if="title || closable" class="head">
        <text class="title">{{ title }}</text>
        <view v-if="closable" class="close" @tap="close">
          <icon-svg name="close" :size="28" color="#7C8A84" :stroke="2" />
        </view>
      </view>
      <slot />
      <view v-if="footer" class="foot"><slot name="footer" /></view>
      <view class="safe-bottom" />
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '' },
  closable: { type: Boolean, default: true },
  maskClose: { type: Boolean, default: true },
  footer: { type: Boolean, default: false },
  maxH: { type: String, default: '78vh' }
})
const emit = defineEmits(['close'])
const maxH = computed(() => props.maxH)

function close() {
  emit('close')
}
function onMask() {
  if (props.maskClose) emit('close')
}
</script>

<style scoped>
.u-sheet {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 900;
}
.mask {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(12, 28, 22, 0.45);
  animation: fade 0.18s ease;
}
.panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: #fff;
  border-radius: 34rpx 34rpx 0 0;
  padding: 0 28rpx;
  overflow-y: auto;
  animation: up 0.24s ease;
}
.grab {
  width: 70rpx;
  height: 8rpx;
  border-radius: 8rpx;
  background: #e6ece9;
  margin: 16rpx auto 6rpx;
}
.head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18rpx 0 8rpx;
}
.title {
  font-size: 32rpx;
  font-weight: 700;
  color: #16201c;
}
.close {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  background: #f4f8f5;
  display: flex;
  align-items: center;
  justify-content: center;
}
.foot {
  padding: 20rpx 0 8rpx;
}
.safe-bottom {
  height: env(safe-area-inset-bottom);
  padding-bottom: 20rpx;
}
@keyframes up {
  from {
    transform: translateY(60rpx);
    opacity: 0.6;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
@keyframes fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>

<template>
  <view class="pi" :style="rootStyle">
    <!-- 有图片就用图片；加载失败自动退回渐变+表情，不会出现空白块 -->
    <image
      v-if="showImg"
      class="pic"
      :src="src"
      mode="aspectFill"
      :lazy-load="lazy"
      @error="failed = true"
    />
    <template v-else>
      <view class="blob b1" :style="{ background: bgc }" />
      <view class="blob b2" :style="{ background: bgc }" />
      <view class="soft" />
      <text class="emoji" :style="{ fontSize: fs + 'rpx' }">{{ emoji }}</text>
    </template>
    <slot />
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  emoji: { type: String, default: '🥬' },
  bg: { type: Array, default: () => ['#E9F9EF', '#C9EFD9'] },
  h: { type: [Number, String], default: 200 },
  radius: { type: String, default: '20rpx' },
  size: { type: [Number, String], default: '' },
  // ↓ 商品图地址，如 /static/products/p1.jpg；不传则用渐变+表情占位
  src: { type: String, default: '' },
  lazy: { type: Boolean, default: false }
})

const failed = ref(false)
watch(() => props.src, () => { failed.value = false })

const showImg = computed(() => !!props.src && !failed.value)

const rootStyle = computed(() => {
  const height = typeof props.h === 'number' ? props.h + 'rpx' : props.h
  return {
    height,
    width: props.size ? (typeof props.size === 'number' ? props.size + 'rpx' : props.size) : '100%',
    borderRadius: props.radius,
    background: `linear-gradient(150deg, ${props.bg[0]} 0%, ${props.bg[1]} 100%)`
  }
})

const bgc = computed(() => props.bg[1])
const fs = computed(() => {
  if (typeof props.h === 'number') return Math.round(props.h * 0.42)
  return 88
})
</script>

<style scoped>
.pi {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.pic {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: block;
}
.blob {
  position: absolute;
  border-radius: 50%;
  opacity: 0.55;
  filter: blur(2rpx);
}
.b1 {
  width: 60%;
  padding-bottom: 60%;
  top: -22%;
  right: -14%;
  opacity: 0.45;
}
.b2 {
  width: 46%;
  padding-bottom: 46%;
  bottom: -18%;
  left: -12%;
  opacity: 0.35;
}
.soft {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: radial-gradient(
    120% 80% at 50% 110%,
    rgba(255, 255, 255, 0.55) 0%,
    rgba(255, 255, 255, 0) 60%
  );
}
.emoji {
  position: relative;
  z-index: 2;
  line-height: 1;
  filter: drop-shadow(0 6rpx 10rpx rgba(30, 70, 50, 0.18));
}
</style>

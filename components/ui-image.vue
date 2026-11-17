<template>
  <view class="u-img" :class="{ round }" :style="boxStyle">
    <image
      v-if="showImg"
      class="pic"
      :src="realSrc"
      :mode="mode"
      :lazy-load="lazy"
      @error="failed = true"
      @load="loaded = true"
    />
    <template v-else>
      <view class="blob b1" :style="{ background: meta.bg[1] }" />
      <view class="blob b2" :style="{ background: meta.bg[0] }" />
      <view class="glow" />
      <view class="ph">
        <text class="ph-emoji" :style="{ fontSize: emojiSize + 'rpx' }">{{ meta.emoji }}</text>
        <text v-if="tip" class="ph-tip">{{ tipText }}</text>
      </view>
      <view v-if="mark" class="mark">待插图</view>
    </template>
    <view class="slot-top"><slot /></view>
  </view>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { C } from '@/common/theme.js'
import { imgOf, srcOf } from '@/common/assets.js'

const props = defineProps({
  /** 插图槽 key，见 common/assets.js（不要叫 slot，会和 Vue 插槽属性打架） */
  name: { type: String, default: '' },
  /** 也可以直接给地址，优先级高于 slot */
  src: { type: String, default: '' },
  /** 固定高度（rpx）；不给则按 ratio 自适应 */
  h: { type: [Number, String], default: '' },
  ratio: { type: Number, default: 0 },
  radius: { type: String, default: '20rpx' },
  round: { type: Boolean, default: false },
  mode: { type: String, default: 'aspectFill' },
  lazy: { type: Boolean, default: false },
  /** 占位时是否显示「建议尺寸/内容」提示，开发时打开，线上关掉 */
  tip: { type: Boolean, default: false },
  /** 占位时右上角标注「待插图」，dev 页用 */
  mark: { type: Boolean, default: false }
})

const failed = ref(false)
const loaded = ref(false)
watch(() => [props.src, props.name], () => {
  failed.value = false
  loaded.value = false
})

const meta = computed(() => imgOf(props.name))
const realSrc = computed(() => props.src || srcOf(props.name))
const showImg = computed(() => !!realSrc.value && !failed.value)

const boxStyle = computed(() => {
  const style = { borderRadius: props.round ? '50%' : props.radius }
  if (props.h) style.height = typeof props.h === 'number' ? props.h + 'rpx' : props.h
  if (!props.h) style.aspectRatio = String(props.ratio || meta.value.ratio || 15 / 8)
  return style
})

const emojiSize = computed(() => {
  const hh = typeof props.h === 'number' ? props.h : 0
  if (hh) return Math.max(32, Math.min(120, Math.round(hh * 0.34)))
  return 64
})

const tipText = computed(() => `${meta.value.w}×${meta.value.h}　${meta.value.tip}`)
</script>

<style scoped>
.u-img {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: #eef4f0;
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
}
.b1 {
  width: 62%;
  padding-bottom: 62%;
  top: -26%;
  right: -16%;
  opacity: 0.42;
}
.b2 {
  width: 48%;
  padding-bottom: 48%;
  bottom: -20%;
  left: -14%;
  opacity: 0.36;
}
.glow {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: radial-gradient(120% 80% at 50% 110%, rgba(255, 255, 255, 0.6) 0%, rgba(255, 255, 255, 0) 62%);
}
.ph {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 24rpx;
  text-align: center;
}
.ph-emoji {
  line-height: 1;
  filter: drop-shadow(0 6rpx 10rpx rgba(30, 70, 50, 0.16));
}
.ph-tip {
  margin-top: 10rpx;
  font-size: 19rpx;
  color: rgba(22, 60, 45, 0.5);
  line-height: 1.4;
}
.mark {
  position: absolute;
  top: 10rpx;
  left: 10rpx;
  z-index: 3;
  background: rgba(22, 32, 28, 0.55);
  color: #fff;
  font-size: 17rpx;
  padding: 3rpx 10rpx;
  border-radius: 20rpx;
}
/* 叠层只放装饰性内容（标题、角标），默认不拦截手势，
   需要点击的叠层请在外部自己包一层，别指望这里能穿透 */
.slot-top {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 4;
  pointer-events: none;
}
</style>

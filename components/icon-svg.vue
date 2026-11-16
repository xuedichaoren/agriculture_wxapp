<template>
  <image class="ico-svg" :src="finalSrc" :style="styleObj" mode="aspectFit" />
</template>

<script setup>
import { computed } from 'vue'
import { svgIcon } from '@/common/icons.js'

const props = defineProps({
  name: { type: String, default: 'more' },
  size: { type: [Number, String], default: 32 },
  color: { type: String, default: '#16201C' },
  stroke: { type: [Number, String], default: 1.7 },
  // ↓ 传入图片地址即用图片，不传则继续用内置 SVG（零改动、零体积）
  src: { type: String, default: '' },
  // ↓ 选中态图片（底部导航这种两态图标用），配合 on 使用
  srcOn: { type: String, default: '' },
  on: { type: Boolean, default: false }
})

const finalSrc = computed(() => {
  if (props.src) return props.on && props.srcOn ? props.srcOn : props.src
  return svgIcon(props.name, props.color, props.stroke)
})

const styleObj = computed(() => {
  const s = typeof props.size === 'number' ? props.size + 'rpx' : props.size
  return { width: s, height: s }
})
</script>

<style scoped>
.ico-svg {
  display: block;
  flex-shrink: 0;
}
</style>

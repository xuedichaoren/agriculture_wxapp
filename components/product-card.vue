<template>
  <view class="pc" :class="'mode-' + mode" @tap="$emit('tap', product)">
    <view class="thumb-wrap">
      <prod-img :src="product.coverUrl" :emoji="product.emoji" :bg="product.bg" :h="mode === 'grid' ? 232 : 176" :radius="mode === 'grid' ? '20rpx' : '16rpx'" />
      <view v-if="product.tags && product.tags.length" class="badge">{{ product.tags[0] }}</view>
    </view>

    <view class="info">
      <text class="name ellipsis-2">{{ product.name }}</text>
      <text class="spec ellipsis">{{ product.spec }}</text>
      <view class="bottom row between">
        <view class="price-wrap">
          <price-tag :price="product.price" :original-price="product.originalPrice" :num-size="mode === 'grid' ? 32 : 32" />
        </view>
        <view class="add" @tap.stop="$emit('add', product)">
          <icon-svg name="plus" :size="26" color="#FFFFFF" :stroke="2.4" />
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
defineProps({
  product: { type: Object, required: true },
  mode: { type: String, default: 'grid' }
})
defineEmits(['tap', 'add'])
</script>

<style scoped>
.pc {
  background: #fff;
  border-radius: 26rpx;
  overflow: hidden;
}
.pc.mode-grid {
  width: 100%;
  padding: 12rpx;
  box-shadow: 0 10rpx 28rpx rgba(22, 60, 45, 0.07);
}
.pc.mode-row {
  display: flex;
  padding: 20rpx;
  gap: 20rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}
.thumb-wrap {
  position: relative;
}
.pc.mode-grid .thumb-wrap {
  width: 100%;
}
.pc.mode-row .thumb-wrap {
  width: 176rpx;
  flex-shrink: 0;
}
.badge {
  position: absolute;
  left: 10rpx;
  top: 10rpx;
  background: rgba(255, 255, 255, 0.94);
  color: #0aa863;
  font-size: 19rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(10, 60, 40, 0.12);
}
.info {
  display: flex;
  flex-direction: column;
}
.pc.mode-grid .info {
  padding: 16rpx 6rpx 6rpx;
}
.pc.mode-row .info {
  flex: 1;
  min-width: 0;
  justify-content: space-between;
  padding: 4rpx 0;
}
.name {
  font-size: 27rpx;
  font-weight: 600;
  color: #16201c;
  line-height: 1.35;
}
.spec {
  font-size: 21rpx;
  color: #9aa7a1;
  margin-top: 6rpx;
}
.pc.mode-row .spec {
  margin-top: 10rpx;
}
.bottom {
  margin-top: 12rpx;
  width: 100%;
}
.price-wrap {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
}
.pc.mode-row .bottom {
  margin-top: 0;
}
.add {
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #16d488, #0bbd72);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6rpx 14rpx rgba(13, 190, 115, 0.3);
}
.add:active {
  transform: scale(0.92);
}
</style>

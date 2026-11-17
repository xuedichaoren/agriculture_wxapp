<template>
  <view class="u-sk">
    <view v-if="avatar" class="row">
      <view class="b av" />
      <view class="flex1">
        <view class="b line w60" />
        <view class="b line w40" />
      </view>
    </view>
    <view v-for="i in rows" :key="i" class="b line" :class="i === 1 ? 'w90' : i === rows ? 'w50' : 'w100'" />
  </view>
</template>

<script setup>
defineProps({
  rows: { type: Number, default: 3 },
  avatar: { type: Boolean, default: false }
})
</script>

<style scoped>
.u-sk {
  padding: 8rpx 0;
}
.b {
  background: linear-gradient(90deg, #eef4f0 25%, #f7faf8 37%, #eef4f0 63%);
  background-size: 400% 100%;
  animation: shine 1.3s ease infinite;
  border-radius: 10rpx;
}
.line {
  height: 26rpx;
  margin: 16rpx 0;
}
.w100 {
  width: 100%;
}
.w90 {
  width: 90%;
}
.w60 {
  width: 60%;
}
.w50 {
  width: 50%;
}
.w40 {
  width: 40%;
}
.row {
  display: flex;
  gap: 20rpx;
  align-items: center;
  margin-bottom: 10rpx;
}
.av {
  width: 88rpx;
  height: 88rpx;
  border-radius: 26rpx;
  flex-shrink: 0;
}
.flex1 {
  flex: 1;
}
@keyframes shine {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}
</style>

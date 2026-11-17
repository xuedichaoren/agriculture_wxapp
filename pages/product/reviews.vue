<template>
  <view class="page reviews-page">
    <nav-bar title="商品评价" />
    <scroll-view scroll-y class="body no-scrollbar">
      <view class="card summary">
        <view class="s-left">
          <text class="s-score">{{ rating.avg || '—' }}</text>
          <view class="stars">
            <text v-for="i in 5" :key="i" class="star" :class="{ dim: i > Math.round(rating.avg) }">★</text>
          </view>
          <text class="s-count">共 {{ rating.count }} 条评价</text>
        </view>
        <view class="s-right">
          <view v-for="b in bars" :key="b.label" class="bar-row">
            <text class="bar-label">{{ b.label }}</text>
            <view class="bar-track">
              <view class="bar-fill" :style="{ width: b.pct + '%' }" />
            </view>
            <text class="bar-pct">{{ b.pct }}%</text>
          </view>
        </view>
      </view>

      <scroll-view scroll-x class="tags no-scrollbar">
        <view class="tags-inner">
          <view
            v-for="t in tagList"
            :key="t.key"
            class="tag-item"
            :class="{ on: activeTag === t.key }"
            @tap="activeTag = t.key"
          >
            {{ t.label }}
          </view>
        </view>
      </scroll-view>

      <view v-if="!reviews.length" class="r-empty">这个标签下还没有评价</view>
      <view class="list">
        <view v-for="r in reviews" :key="r.id" class="review card">
          <view class="r-top">
            <view class="r-avatar">{{ r.avatar }}</view>
            <view class="flex1">
              <view class="row">
                <text class="r-user">{{ r.anonymous ? '匿名用户' : r.user }}</text>
                <view class="r-level">Lv.{{ r.level }}</view>
              </view>
              <view class="stars small">
                <text v-for="i in 5" :key="i" class="star" :class="{ dim: i > r.stars }">★</text>
              </view>
            </view>
            <text class="r-time">{{ r.time }}</text>
          </view>
          <text class="r-text">{{ r.text }}</text>
          <view v-if="r.imgs && r.imgs.length" class="r-imgs">
            <view v-for="(e, i) in r.imgs" :key="i" class="r-img">
              <text class="r-emoji">{{ e }}</text>
            </view>
          </view>
          <view v-if="r.tags && r.tags.length" class="r-tags">
            <text v-for="t in r.tags" :key="t" class="r-tag">{{ t }}</text>
          </view>
          <view class="r-foot">
            <text class="r-spec">{{ r.spec }}</text>
            <view class="r-like" @tap="toast('已点赞')">
              <icon-svg name="heart" :size="24" color="#9AA7A1" :stroke="1.8" />
              <text class="rl-num">{{ r.likes }}</text>
            </view>
          </view>
        </view>
      </view>
      <view class="end-tip">— 已经到底了 —</view>
      <view style="height: 40rpx" />
    </scroll-view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { ratingOfProduct, reviewsOfProduct } from '@/store/index.js'
import { toast } from '@/common/utils.js'

const pid = ref('')
onLoad((q) => {
  pid.value = (q && q.id) || 'p1'
})

const allReviews = computed(() => reviewsOfProduct(pid.value))
const rating = computed(() => ratingOfProduct(pid.value))

/** 三项细分：有评分的按评分算，老数据没评分就用星级兜底 */
const bars = computed(() => {
  const pick = (k) => {
    const vs = allReviews.value.map((r) => (r.scores && r.scores[k]) || r.stars).filter(Boolean)
    if (!vs.length) return 100
    return Math.round((vs.reduce((a, b) => a + b, 0) / vs.length / 5) * 100)
  }
  return [
    { label: '新鲜度', pct: pick('fresh') },
    { label: '包装', pct: pick('pack') },
    { label: '配送速度', pct: pick('deliver') }
  ]
})

const activeTag = ref('')

const tagList = computed(() => {
  const counts = {}
  allReviews.value.forEach((r) => (r.tags || []).forEach((t) => {
    counts[t] = (counts[t] || 0) + 1
  }))
  const out = [{ key: '', label: '全部(' + allReviews.value.length + ')' }]
  Object.keys(counts).forEach((t) => out.push({ key: t, label: t + '(' + counts[t] + ')' }))
  return out
})

const reviews = computed(() => {
  if (!activeTag.value) return allReviews.value
  return allReviews.value.filter((r) => (r.tags || []).indexOf(activeTag.value) > -1)
})
</script>

<style scoped>
.reviews-page {
  min-height: 100vh;
}
.body {
  padding: 18rpx 24rpx 0;
  height: calc(100vh - 90rpx);
}
.summary {
  padding: 26rpx;
  display: flex;
  gap: 30rpx;
}
.s-left {
  width: 200rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-right: 2rpx solid #f4f8f5;
}
.s-score {
  font-size: 64rpx;
  font-weight: 800;
  color: #0a8f5c;
  line-height: 1;
}
.stars {
  display: flex;
  gap: 3rpx;
  margin-top: 10rpx;
}
.stars.small .star {
  font-size: 20rpx;
}
.star {
  font-size: 24rpx;
  color: #ffb020;
}
.star.dim {
  color: #e2e8e5;
}
.s-count {
  font-size: 20rpx;
  color: #9aa7a1;
  margin-top: 10rpx;
}
.s-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12rpx;
}
.bar-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.bar-label {
  font-size: 20rpx;
  color: #7c8a84;
  width: 100rpx;
}
.bar-track {
  flex: 1;
  height: 10rpx;
  border-radius: 10rpx;
  background: #f0f4f2;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  border-radius: 10rpx;
  background: linear-gradient(90deg, #35e39b, #0bbd72);
}
.bar-pct {
  font-size: 19rpx;
  color: #9aa7a1;
  width: 60rpx;
  text-align: right;
}
.tags {
  margin-top: 20rpx;
  white-space: nowrap;
}
.tags-inner {
  display: inline-flex;
  gap: 12rpx;
}
.tag-item {
  padding: 10rpx 24rpx;
  border-radius: 40rpx;
  background: #fff;
  font-size: 22rpx;
  color: #3d4a45;
}
.tag-item.on {
  background: #e9faf2;
  color: #06a96a;
  font-weight: 700;
}
.list {
  margin-top: 20rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.r-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 10rpx;
}
.r-tag {
  font-size: 18rpx;
  color: #06a96a;
  background: #e9faf2;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}
.r-empty {
  font-size: 21rpx;
  color: #b3bfba;
  text-align: center;
  padding: 40rpx 0;
}
.review {
  padding: 24rpx;
}
.r-top {
  display: flex;
  gap: 16rpx;
  align-items: center;
}
.r-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #f4f8f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
}
.r-user {
  font-size: 25rpx;
  font-weight: 600;
}
.r-level {
  margin-left: 8rpx;
  font-size: 17rpx;
  color: #ff8a3d;
  background: #fff4e4;
  padding: 2rpx 8rpx;
  border-radius: 6rpx;
}
.r-time {
  font-size: 20rpx;
  color: #b3bfba;
  margin-left: auto;
}
.r-text {
  display: block;
  font-size: 25rpx;
  color: #3d4a45;
  line-height: 1.7;
  margin-top: 16rpx;
}
.r-imgs {
  display: flex;
  gap: 10rpx;
  margin-top: 14rpx;
}
.r-img {
  width: 150rpx;
  height: 150rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.r-emoji {
  font-size: 70rpx;
}
.r-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
}
.r-spec {
  font-size: 20rpx;
  color: #b3bfba;
}
.r-like {
  display: flex;
  align-items: center;
  gap: 6rpx;
}
.rl-num {
  font-size: 20rpx;
  color: #9aa7a1;
}
.end-tip {
  text-align: center;
  font-size: 20rpx;
  color: #c3ccc8;
  padding: 30rpx 0;
}
</style>

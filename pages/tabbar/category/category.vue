<template>
  <view class="page cat-page">
    <view class="header">
      <view class="status" :style="{ height: statusBar + 'px' }" />
      <view class="h-row">
        <text class="h-title">分类</text>
        <view class="search" @tap="go('/pages/search/search')">
          <icon-svg name="search" :size="26" color="#9AA7A1" :stroke="2" />
          <text class="ph">搜索农产品</text>
        </view>
      </view>
    </view>

    <view class="body">
      <scroll-view scroll-y class="side no-scrollbar">
        <view
          v-for="c in CATEGORIES"
          :key="c.id"
          class="side-item"
          :class="{ on: active === c.id }"
          @tap="active = c.id"
        >
          <view class="side-thumb">
            <image v-if="c.img" class="side-img" :src="c.img" mode="aspectFill" />
            <text v-else class="side-emoji">{{ c.emoji }}</text>
          </view>
          <text class="side-name">{{ c.name }}</text>
        </view>
      </scroll-view>

      <scroll-view scroll-y class="main no-scrollbar">
        <view class="main-head">
          <view class="mh-left">
            <image v-if="currentCat.img" class="mh-img" :src="currentCat.img" mode="aspectFill" />
            <view class="mh-info">
              <text class="mh-title">{{ currentCat.name }}</text>
              <text class="mh-sub">产地直发 · 共 {{ goods.length }} 款</text>
            </view>
          </view>
          <view class="sort" @tap="toggleSort">
            <text class="sort-txt" :class="{ on: sort !== 'default' }">{{ sortLabel }}</text>
            <icon-svg :name="sort === 'asc' ? 'up' : 'down'" :size="20" :color="sort === 'default' ? '#9AA7A1' : '#0FC97A'" :stroke="2.4" />
          </view>
        </view>

        <view class="chips">
          <view v-for="t in subTags" :key="t" class="chip" :class="{ on: subTag === t }" @tap="subTag = t">
            {{ t }}
          </view>
        </view>

        <view class="list">
          <view v-for="p in goods" :key="p.id" class="list-item">
            <product-card :product="p" mode="row" @tap="toDetail(p.id)" @add="onAdd" />
          </view>
        </view>

        <view v-if="!goods.length">
          <empty-box text="该分类暂时没有在售商品" emoji="🌾" sub="换个分类看看吧" />
        </view>
        <view style="height: 170rpx" />
      </scroll-view>
    </view>

    <tab-bar active="cate" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { CATEGORIES, PRODUCTS } from '@/mock/index.js'
import { addToCart } from '@/store/index.js'
import { toast } from '@/common/utils.js'

const statusBar = ref(20)
try {
  const info = uni.getStorageSync('sys_info')
  if (info && info.statusBarHeight) statusBar.value = info.statusBarHeight
} catch (e) {}

const active = ref('veg')
const sort = ref('default')
const subTag = ref('全部')
const subTags = ['全部', '当日采摘', '产地直供', '特价', '有机']

// 从首页 banner / 快捷入口带分类进来，直接定位
onLoad((q) => {
  const cat = q && q.cat
  if (cat && CATEGORIES.some((c) => c.id === cat)) active.value = cat
})

const currentCat = computed(() => CATEGORIES.find((c) => c.id === active.value) || CATEGORIES[0])

const baseGoods = computed(() => PRODUCTS.filter((p) => p.categoryId === active.value))

const goods = computed(() => {
  let arr = [...baseGoods.value]
  if (subTag.value === '特价') arr = arr.filter((p) => p.originalPrice > p.price)
  if (sort.value === 'asc') arr.sort((a, b) => a.price - b.price)
  if (sort.value === 'desc') arr.sort((a, b) => b.price - a.price)
  return arr
})

const sortLabel = computed(() =>
  sort.value === 'asc' ? '价格升序' : sort.value === 'desc' ? '价格降序' : '综合排序'
)

function toggleSort() {
  sort.value = sort.value === 'default' ? 'asc' : sort.value === 'asc' ? 'desc' : 'default'
}

function go(url) {
  uni.navigateTo({ url })
}
function toDetail(id) {
  uni.navigateTo({ url: `/pages/product/detail?id=${id}` })
}
function onAdd(p) {
  addToCart(p.id)
  toast('已加入菜篮子')
}
</script>

<style scoped>
.cat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}
.header {
  background: #fff;
  padding: 0 28rpx;
  border-bottom: 2rpx solid #f2f6f4;
}
.h-row {
  height: 88rpx;
  display: flex;
  align-items: center;
  gap: 24rpx;
}
.h-title {
  font-size: 38rpx;
  font-weight: 800;
  color: #14201b;
}
.search {
  flex: 1;
  height: 68rpx;
  background: #f4f8f5;
  border-radius: 68rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 0 24rpx;
}
.ph {
  font-size: 25rpx;
  color: #a8b3ae;
}
.body {
  flex: 1;
  display: flex;
  height: 0;
}
.side {
  width: 176rpx;
  background: #f7faf8;
  height: 100%;
}
.side-item {
  height: 118rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  position: relative;
}
.side-item.on {
  background: #fff;
}
.side-item.on::before {
  content: '';
  position: absolute;
  left: 0;
  top: 32rpx;
  bottom: 32rpx;
  width: 6rpx;
  border-radius: 0 6rpx 6rpx 0;
  background: #0fc97a;
}
.side-thumb {
  width: 56rpx;
  height: 56rpx;
  border-radius: 50%;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  box-shadow: 0 4rpx 12rpx rgba(22, 60, 45, 0.08);
}
.side-img {
  width: 100%;
  height: 100%;
}
.side-emoji {
  font-size: 32rpx;
  opacity: 0.7;
}
.side-item.on .side-emoji {
  opacity: 1;
}
.side-name {
  font-size: 23rpx;
  color: #7c8a84;
}
.side-item.on .side-name {
  color: #14201b;
  font-weight: 700;
}
.main {
  flex: 1;
  height: 100%;
  background: #fff;
}
.main-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 26rpx 24rpx 16rpx;
}
.mh-left {
  display: flex;
  align-items: center;
  gap: 14rpx;
}
.mh-info {
  display: flex;
  flex-direction: column;
}
.mh-img {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  flex-shrink: 0;
  box-shadow: 0 6rpx 16rpx rgba(22, 60, 45, 0.1);
}
.mh-title {
  font-size: 30rpx;
  font-weight: 700;
}
.mh-sub {
  display: block;
  font-size: 21rpx;
  color: #9aa7a1;
  margin-top: 6rpx;
}
.sort {
  display: flex;
  align-items: center;
  gap: 4rpx;
}
.sort-txt {
  font-size: 22rpx;
  color: #9aa7a1;
}
.sort-txt.on {
  color: #0fc97a;
  font-weight: 600;
}
.chips {
  display: flex;
  gap: 12rpx;
  padding: 0 24rpx 8rpx;
  flex-wrap: wrap;
}
.chip {
  padding: 8rpx 20rpx;
  border-radius: 40rpx;
  background: #f4f8f5;
  font-size: 21rpx;
  color: #7c8a84;
}
.chip.on {
  background: #e9faf2;
  color: #06a96a;
  font-weight: 600;
}
.list {
  padding: 12rpx 20rpx;
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}
</style>

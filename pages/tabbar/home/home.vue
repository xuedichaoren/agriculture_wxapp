<template>
  <view class="page home">
    <!-- 顶部绿色区域 -->
    <view class="header">
      <view class="status" :style="{ height: statusBar + 'px' }" />
      <view class="h-row">
        <view class="loc" @tap="pickCity">
          <icon-svg name="location" :size="30" color="#FFFFFF" :stroke="1.9" />
          <text class="loc-txt">{{ city }}</text>
          <icon-svg name="down" :size="20" color="#FFFFFF" :stroke="2.4" />
        </view>
        <view class="h-actions">
          <view class="h-icon" @tap="go('/pages/live/live')">
            <icon-svg name="video" :size="34" color="#FFFFFF" :stroke="1.8" />
          </view>
          <view class="h-icon" @tap="go('/pages/message/message')">
            <icon-svg name="bell" :size="34" color="#FFFFFF" :stroke="1.8" />
            <view v-if="store.unread" class="dot-badge" />
          </view>
        </view>
      </view>

      <view class="search" @tap="go('/pages/search/search')">
        <icon-svg name="search" :size="30" color="#9AA7A1" :stroke="2" />
        <text class="search-ph">搜「辣椒」「冰糖橙」试试</text>
        <view class="search-btn">
          <icon-svg name="scan" :size="28" color="#06A96A" :stroke="1.9" />
        </view>
      </view>
    </view>

    <scroll-view
      scroll-y
      class="body"
      :scroll-into-view="scrollInto"
      @scrolltolower="loadMore"
    >
      <!-- Banner：实拍图 + 左侧压暗，保证白字可读 -->
      <view class="banner-wrap">
        <swiper
          class="banner"
          :indicator-dots="true"
          indicator-color="rgba(255,255,255,.42)"
          indicator-active-color="#FFFFFF"
          :autoplay="true"
          :interval="4200"
          :circular="true"
        >
          <swiper-item v-for="b in BANNERS" :key="b.id">
            <view class="banner-card" hover-class="banner-card-hover" :hover-stay-time="80" @tap="onBanner(b)">
              <image v-if="b.img" class="b-img" :src="b.img" mode="aspectFill" />
              <view v-else class="b-img" :style="{ background: `linear-gradient(120deg, ${b.bg[0]}, ${b.bg[1]})` }" />
              <view class="b-shade" />
              <view class="b-txt">
                <view v-if="b.tag" class="b-pill">{{ b.tag }}</view>
                <text class="b-title">{{ b.title }}</text>
                <text class="b-sub">{{ b.subtitle }}</text>
                <view class="b-btn">{{ b.btn || '立即选购' }}</view>
              </view>
            </view>
          </swiper-item>
        </swiper>
      </view>

      <!-- 快捷入口 -->
      <view class="quick card">
        <view v-for="q in QUICK_ENTRIES" :key="q.id" class="q-item" @tap="onQuick(q)">
          <view class="q-icon" :style="{ background: `linear-gradient(150deg, ${q.bg[0]}, ${q.bg[1]})` }">
            <text class="q-emoji">{{ q.emoji }}</text>
          </view>
          <text class="q-name">{{ q.name }}</text>
        </view>
      </view>

      <!-- 分类：圆形实拍图 -->
      <scroll-view scroll-x class="cats no-scrollbar" :show-scrollbar="false">
        <view class="cats-inner">
          <view class="cat" :class="{ on: activeCat === 'all' }" @tap="switchCat('all')">
            <view class="cat-ring">
              <image class="cat-img" src="/static/images/misc/harvest.jpg" mode="aspectFill" />
            </view>
            <text class="cat-name">全部</text>
          </view>
          <view
            v-for="c in CATEGORIES"
            :key="c.id"
            class="cat"
            :class="{ on: activeCat === c.id }"
            @tap="switchCat(c.id)"
          >
            <view class="cat-ring">
              <image v-if="c.img" class="cat-img" :src="c.img" mode="aspectFill" />
              <text v-else class="cat-emoji">{{ c.emoji }}</text>
            </view>
            <text class="cat-name">{{ c.name }}</text>
          </view>
        </view>
      </scroll-view>

      <!-- 限时特价 -->
      <view class="sec-head">
        <view class="row">
          <text class="sec-title">限时特价</text>
          <view class="countdown">
            <text class="cd-label">距结束</text>
            <text class="cd-num">{{ hh }}</text>
            <text class="cd-colon">:</text>
            <text class="cd-num">{{ mm }}</text>
            <text class="cd-colon">:</text>
            <text class="cd-num">{{ ss }}</text>
          </view>
        </view>
        <view class="more" @tap="go('/pages/search/search')">
          <text>全部</text>
          <icon-svg name="right" :size="22" color="#9AA7A1" />
        </view>
      </view>

      <scroll-view scroll-x class="flash no-scrollbar" :show-scrollbar="false">
        <view class="flash-inner">
          <view
            v-for="p in flashList"
            :key="p.id"
            class="flash-card"
            hover-class="card-hover"
            :hover-stay-time="80"
            @tap="toDetail(p.id)"
          >
            <prod-img :src="p.coverUrl" :emoji="p.emoji" :bg="p.bg" :h="196" radius="20rpx" />
            <text class="f-name ellipsis">{{ p.name }}</text>
            <view class="row between">
              <price-tag :price="p.price" :num-size="32" />
              <text class="f-sales">已售{{ p.salesCount }}</text>
            </view>
          </view>
        </view>
      </scroll-view>

      <!-- 农场推荐：封面实拍 + 在售小图 -->
      <view class="farm-card card">
        <view class="farm-cover" hover-class="card-hover" :hover-stay-time="80" @tap="go('/pages/farm/home?id=' + featureFarm.id)">
          <image v-if="featureFarm.photo" class="fc-img" :src="featureFarm.photo" mode="aspectFill" />
          <view class="fc-shade" />
          <view class="fc-info">
            <view class="row">
              <text class="fc-name">{{ featureFarm.name }}</text>
              <view class="fc-tag">{{ featureFarm.tags[0] }}</view>
              <text class="fc-rate">★ {{ featureFarm.rating }}</text>
            </view>
            <text class="fc-desc">{{ featureFarm.city }} · {{ followText }}关注</text>
          </view>
          <view class="fc-btn">进农场</view>
        </view>
        <view class="farm-goods">
          <view v-for="p in farmGoods" :key="p.id" class="fg-item" @tap.stop="toDetail(p.id)">
            <prod-img :src="p.coverUrl" :emoji="p.emoji" :bg="p.bg" :h="132" radius="16rpx" />
            <text class="fg-price">¥{{ p.price }}</text>
          </view>
        </view>
      </view>

      <!-- 直播 -->
      <view class="live-card" hover-class="card-hover" :hover-stay-time="80" @tap="go('/pages/live/live')">
        <image class="live-bg" src="/static/images/farm/plot.jpg" mode="aspectFill" />
        <view class="live-shade" />
        <view class="live-left">
          <view class="live-badge">
            <view class="live-dot" />
            <text class="live-txt">直播中</text>
          </view>
          <text class="live-title">跟着张婶逛辣椒地</text>
          <text class="live-sub">正在看 1.2 万人 · 今晚现摘现发</text>
        </view>
        <view class="live-play">
          <icon-svg name="video" :size="30" color="#0A3B2A" :stroke="2" />
        </view>
      </view>

      <!-- 猜你喜欢 -->
      <view class="sec-head" id="rec">
        <text class="sec-title">{{ activeCatName }}</text>
        <text class="sec-sub">{{ activeCat === 'all' ? '根据你的口味挑选' : '按分类筛选的结果' }}</text>
      </view>

      <view class="grid">
        <view v-for="p in list" :key="p.id" class="grid-item">
          <product-card :product="p" mode="grid" @tap="toDetail(p.id)" @add="onAdd" />
        </view>
      </view>

      <view class="end">
        <text class="end-txt">{{ noMore ? '— 已经到底啦，去地里看看 —' : '加载中…' }}</text>
      </view>
      <view class="tab-space" />
    </scroll-view>

    <tab-bar active="home" />
  </view>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { onPullDownRefresh } from '@dcloudio/uni-app'
import { BANNERS, CATEGORIES, FARMS, PRODUCTS, QUICK_ENTRIES } from '@/mock/index.js'
import { addToCart, store } from '@/store/index.js'
import { toast } from '@/common/utils.js'

const statusBar = ref(20)
const city = ref('湖南 · 长沙')
const activeCat = ref('all')
const list = ref([])
const page = ref(1)
const noMore = ref(false)
const hh = ref('02')
const mm = ref('18')
const ss = ref('45')
let timer = null

/** 首页只推一个农场，取种子数据的第一家，别再单独写死一份 */
const featureFarm = computed(() => FARMS[0] || {})
const followText = computed(() => {
  const n = Number(featureFarm.value.followerCount) || 0
  return n >= 10000 ? (n / 10000).toFixed(1) + ' 万' : n + ''
})

const flashList = computed(() => PRODUCTS.filter((p) => p.originalPrice > p.price).slice(0, 6))
const farmGoods = computed(() => PRODUCTS.filter((p) => p.farmId === featureFarm.value.id).slice(0, 4))

const allList = computed(() =>
  activeCat.value === 'all' ? PRODUCTS : PRODUCTS.filter((p) => p.categoryId === activeCat.value)
)

function loadMore() {
  if (noMore.value) return
  if (list.value.length >= allList.value.length) {
    noMore.value = true
    return
  }
  const start = (page.value - 1) * 8
  list.value = list.value.concat(allList.value.slice(start, start + 8))
  page.value++
  if (page.value > 4) noMore.value = true
}

const scrollInto = ref('')

const activeCatName = computed(() => {
  if (activeCat.value === 'all') return '为你推荐'
  const c = CATEGORIES.find((x) => x.id === activeCat.value)
  return c ? c.name : '为你推荐'
})

function switchCat(id) {
  activeCat.value = id
  page.value = 1
  noMore.value = false
  list.value = allList.value.slice(0, 8)
  // 筛选结果在视口之外，不滚过去用户会以为没反应
  scrollInto.value = ''
  setTimeout(() => {
    scrollInto.value = 'rec'
  }, 60)
}

function onBanner(b) {
  if (!b) return
  if (!b.path) return toast('活动页还在准备')
  if (b.path.indexOf('/pages/tabbar/') === 0) return uni.reLaunch({ url: b.path })
  uni.navigateTo({
    url: b.path,
    fail: () => toast('页面打不开，稍后再试')
  })
}

function pickCity() {
  uni.showActionSheet({
    itemList: ['湖南 · 长沙', '长沙 · 拱墅区', '上海 · 浦东新区', '苏州 · 姑苏区'],
    success: (res) => {
      city.value = ['湖南 · 长沙', '长沙 · 拱墅区', '上海 · 浦东新区', '苏州 · 姑苏区'][res.tapIndex]
    }
  })
}

function go(url) {
  uni.navigateTo({ url })
}

function toDetail(id) {
  if (!id) return
  uni.navigateTo({
    url: `/pages/product/detail?id=${id}`,
    fail: () => toast('商品页打不开，稍后再试')
  })
}

function onAdd(p) {
  addToCart(p.id, 1)
  toast('已加入菜篮子')
}

function onQuick(q) {
  if (q.path) {
    // 底部导航页只能用 reLaunch，navigateTo 会失败
    if (q.path.indexOf('/pages/tabbar/') === 0) return uni.reLaunch({ url: q.path })
    return go(q.path)
  }
  if (q.id === 'q3') return go('/pages/farm/calendar')
  toast('功能演示：' + q.name)
}

function tick() {
  let total = Number(hh.value) * 3600 + Number(mm.value) * 60 + Number(ss.value)
  total = total > 0 ? total - 1 : 7200
  const p = (n) => (n < 10 ? '0' + n : '' + n)
  hh.value = p(Math.floor(total / 3600))
  mm.value = p(Math.floor((total % 3600) / 60))
  ss.value = p(total % 60)
}

onMounted(() => {
  try {
    const info = uni.getStorageSync('sys_info')
    if (info && info.statusBarHeight) statusBar.value = info.statusBarHeight
  } catch (e) {}
  list.value = allList.value.slice(0, 8)
  page.value = 2
  timer = setInterval(tick, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

onPullDownRefresh(() => {
  switchCat(activeCat.value)
  setTimeout(() => {
    uni.stopPullDownRefresh()
    toast('已是最新')
  }, 500)
})
</script>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}
.header {
  background: linear-gradient(160deg, #12cf80 0%, #0bb271 60%, #0aa868 100%);
  padding: 0 28rpx 30rpx;
  border-radius: 0 0 34rpx 34rpx;
  position: relative;
  z-index: 3;
}
.h-row {
  height: 84rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.loc {
  display: flex;
  align-items: center;
  gap: 6rpx;
}
.loc-txt {
  color: #fff;
  font-size: 27rpx;
  font-weight: 600;
  max-width: 300rpx;
  overflow: hidden;
  white-space: nowrap;
}
.h-actions {
  display: flex;
  gap: 10rpx;
}
.h-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.dot-badge {
  position: absolute;
  top: 12rpx;
  right: 14rpx;
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #ff5a4e;
  border: 2rpx solid #12cf80;
}
.search {
  height: 76rpx;
  background: #fff;
  border-radius: 76rpx;
  display: flex;
  align-items: center;
  padding: 0 12rpx 0 26rpx;
  gap: 14rpx;
  margin-top: 6rpx;
  box-shadow: 0 8rpx 24rpx rgba(6, 100, 65, 0.12);
}
.search-ph {
  flex: 1;
  font-size: 26rpx;
  color: #a8b3ae;
}
.search-btn {
  width: 54rpx;
  height: 54rpx;
  border-radius: 50%;
  background: #e9faf2;
  display: flex;
  align-items: center;
  justify-content: center;
}
.body {
  flex: 1;
  height: 0;
}

/* ---------- Banner ---------- */
.banner-wrap {
  margin-top: 22rpx;
  padding: 0 28rpx;
}
.banner {
  height: 300rpx;
  border-radius: 30rpx;
  overflow: hidden;
  box-shadow: 0 16rpx 36rpx rgba(10, 60, 42, 0.16);
}
.banner-card {
  position: relative;
  height: 100%;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  border-radius: 30rpx;
}
.b-img {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.b-shade {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(
    100deg,
    rgba(6, 32, 22, 0.84) 0%,
    rgba(6, 32, 22, 0.58) 42%,
    rgba(6, 32, 22, 0.08) 100%
  );
}
.b-txt {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0 0 36rpx 32rpx;
}
.b-pill {
  background: rgba(255, 255, 255, 0.22);
  border: 2rpx solid rgba(255, 255, 255, 0.4);
  color: #fff;
  font-size: 19rpx;
  font-weight: 600;
  padding: 4rpx 14rpx;
  border-radius: 40rpx;
  margin-bottom: 14rpx;
}
.b-title {
  color: #fff;
  font-size: 38rpx;
  font-weight: 800;
  letter-spacing: -0.5rpx;
  text-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.24);
}
.b-sub {
  color: rgba(255, 255, 255, 0.88);
  font-size: 22rpx;
  margin-top: 10rpx;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
}
.b-btn {
  margin-top: 22rpx;
  height: 56rpx;
  padding: 0 26rpx;
  border-radius: 56rpx;
  background: #fff;
  color: #0a8f5c;
  font-size: 22rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.16);
}
.banner-card-hover {
  opacity: 0.94;
}

/* ---------- 快捷入口 ---------- */
.quick {
  margin: 24rpx 28rpx 0;
  padding: 26rpx 10rpx 10rpx;
  display: flex;
  flex-wrap: wrap;
}
.q-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  width: 33.33%;
  margin-bottom: 16rpx;
}
.q-icon {
  width: 92rpx;
  height: 92rpx;
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 2rpx rgba(255, 255, 255, 0.7);
}
.q-emoji {
  font-size: 44rpx;
}
.q-name {
  font-size: 22rpx;
  color: #3d4a45;
}

/* ---------- 分类 ---------- */
.cats {
  margin-top: 24rpx;
  white-space: nowrap;
}
.cats-inner {
  display: inline-flex;
  align-items: flex-start;
  gap: 22rpx;
  padding: 0 28rpx;
}
.cat {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  flex-shrink: 0;
  width: 104rpx;
}
.cat-ring {
  width: 92rpx;
  height: 92rpx;
  border-radius: 50%;
  padding: 4rpx;
  background: #fff;
  box-shadow: 0 6rpx 16rpx rgba(22, 60, 45, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.cat-img {
  width: 84rpx;
  height: 84rpx;
  border-radius: 50%;
  display: block;
}
.cat.on .cat-ring {
  background: linear-gradient(135deg, #16d488, #0bbd72);
  box-shadow: 0 8rpx 20rpx rgba(13, 190, 115, 0.34);
}
.cat-emoji {
  font-size: 40rpx;
}
.cat-name {
  font-size: 21rpx;
  color: #5c6a64;
  font-weight: 500;
  max-width: 104rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  text-align: center;
}
.cat.on .cat-name {
  color: #06a96a;
  font-weight: 700;
}

/* ---------- 分区标题 ---------- */
.sec-head {
  padding: 34rpx 28rpx 18rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sec-title {
  font-size: 34rpx;
  font-weight: 800;
  color: #14201b;
  letter-spacing: -0.5rpx;
}
.sec-sub {
  font-size: 22rpx;
  color: #9aa7a1;
}
.countdown {
  display: flex;
  align-items: center;
  gap: 4rpx;
  margin-left: 16rpx;
}
.cd-label {
  font-size: 20rpx;
  color: #9aa7a1;
  margin-right: 6rpx;
}
.cd-num {
  background: #14201b;
  color: #fff;
  font-size: 19rpx;
  padding: 2rpx 7rpx;
  border-radius: 6rpx;
  font-weight: 600;
}
.cd-colon {
  color: #14201b;
  font-size: 18rpx;
}
.more {
  display: flex;
  align-items: center;
  gap: 2rpx;
  font-size: 23rpx;
  color: #9aa7a1;
}

/* ---------- 限时特价 ---------- */
.flash {
  white-space: nowrap;
}
.flash-inner {
  display: inline-flex;
  gap: 18rpx;
  padding: 0 28rpx;
}
.card-hover {
  transform: scale(0.97);
  opacity: 0.9;
}
.flash-card {
  width: 224rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 12rpx;
  box-shadow: 0 10rpx 26rpx rgba(22, 60, 45, 0.07);
}
.f-name {
  display: block;
  font-size: 24rpx;
  font-weight: 600;
  color: #16201c;
  margin: 12rpx 2rpx 8rpx;
}
.f-sales {
  font-size: 17rpx;
  color: #b3bfba;
  margin-left: 8rpx;
  flex-shrink: 0;
}

/* ---------- 农场卡 ---------- */
.farm-card {
  margin: 30rpx 28rpx 0;
  padding: 14rpx 14rpx 18rpx;
}
.farm-cover {
  position: relative;
  height: 200rpx;
  border-radius: 20rpx;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
}
.fc-img {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.fc-shade {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(180deg, rgba(8, 30, 22, 0) 30%, rgba(8, 30, 22, 0.78) 100%);
}
.fc-info {
  position: relative;
  z-index: 2;
  padding: 0 0 18rpx 20rpx;
  flex: 1;
  min-width: 0;
}
.fc-name {
  font-size: 29rpx;
  font-weight: 700;
  color: #fff;
  margin-right: 10rpx;
}
.fc-tag {
  font-size: 18rpx;
  color: #fff;
  background: rgba(255, 255, 255, 0.24);
  border-radius: 6rpx;
  padding: 2rpx 10rpx;
}
.fc-rate {
  font-size: 19rpx;
  font-weight: 700;
  color: #ffd66b;
  margin-left: 10rpx;
}
.fc-desc {
  display: block;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.82);
  margin-top: 8rpx;
}
.fc-btn {
  position: relative;
  z-index: 2;
  margin: 0 18rpx 18rpx 0;
  padding: 10rpx 22rpx;
  border-radius: 40rpx;
  background: rgba(255, 255, 255, 0.94);
  color: #0a8f5c;
  font-size: 21rpx;
  font-weight: 700;
}
.farm-goods {
  display: flex;
  gap: 14rpx;
  margin-top: 16rpx;
}
.fg-item {
  flex: 1;
  position: relative;
}
.fg-price {
  position: absolute;
  left: 8rpx;
  bottom: 8rpx;
  background: rgba(255, 255, 255, 0.92);
  color: #ff4b3a;
  font-size: 19rpx;
  font-weight: 700;
  padding: 2rpx 8rpx;
  border-radius: 8rpx;
}

/* ---------- 直播 ---------- */
.live-card {
  margin: 24rpx 28rpx 0;
  height: 188rpx;
  border-radius: 26rpx;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 26rpx;
  box-shadow: 0 12rpx 30rpx rgba(16, 40, 30, 0.18);
}
.live-bg {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.live-shade {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(90deg, rgba(8, 26, 20, 0.86) 0%, rgba(8, 26, 20, 0.42) 100%);
}
.live-left {
  display: flex;
  flex-direction: column;
  z-index: 2;
}
.live-badge {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: rgba(255, 75, 58, 0.2);
  border: 2rpx solid rgba(255, 90, 78, 0.55);
  padding: 4rpx 14rpx;
  border-radius: 40rpx;
  align-self: flex-start;
}
.live-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: #ff5a4e;
  animation: pulse 1.4s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}
.live-txt {
  color: #ff8f86;
  font-size: 19rpx;
  font-weight: 600;
}
.live-title {
  color: #fff;
  font-size: 32rpx;
  font-weight: 700;
  margin-top: 14rpx;
}
.live-sub {
  color: rgba(255, 255, 255, 0.66);
  font-size: 21rpx;
  margin-top: 8rpx;
}
.live-play {
  position: relative;
  z-index: 2;
  width: 84rpx;
  height: 84rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.92);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.2);
}

/* ---------- 列表 ---------- */
.grid {
  display: flex;
  flex-wrap: wrap;
  padding: 0 20rpx;
  gap: 16rpx;
}
.grid-item {
  width: calc(50% - 8rpx);
}
.end {
  padding: 44rpx 0 10rpx;
  text-align: center;
}
.end-txt {
  font-size: 21rpx;
  color: #b3bfba;
}
.tab-space {
  height: 150rpx;
}
</style>

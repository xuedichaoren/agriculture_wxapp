<template>
  <view class="page adopt">
    <nav-bar title="认养一块地" bg="#F4F8F5">
      <template #right>
        <view class="nav-mine" @tap="toMine">
          <text class="nav-mine-txt">我的认养</text>
        </view>
      </template>
    </nav-bar>

    <!-- 头图 -->
    <view class="hero">
      <image class="hero-img" src="/static/images/farm/hero.jpg" mode="aspectFill" />
      <view class="hero-shade" />
      <view class="hero-deco" />
      <text class="hero-kicker">湘农汇 · 认养计划</text>
      <text class="hero-title">认养一块地</text>
      <text class="hero-title">吃自己种的菜</text>
      <text class="hero-sub">选地块 · 选作物 · 剩下的交给老师傅</text>

      <view class="hero-stats">
        <view class="hs">
          <text class="hs-num">{{ plots.length }}</text>
          <text class="hs-label">在认养地块</text>
        </view>
        <view class="hs-line" />
        <view class="hs">
          <text class="hs-num">1.2万</text>
          <text class="hs-label">已认养家庭</text>
        </view>
        <view class="hs-line" />
        <view class="hs">
          <text class="hs-num">30天</text>
          <text class="hs-label">最快可收</text>
        </view>
      </view>
    </view>

    <!-- 三步 -->
    <view class="steps card">
      <view class="step">
        <view class="step-num">1</view>
        <text class="step-name">挑地块</text>
        <text class="step-sub">看书档案</text>
      </view>
      <view class="step-arrow">›</view>
      <view class="step">
        <view class="step-num">2</view>
        <text class="step-name">点作物</text>
        <text class="step-sub">想吃什么种什么</text>
      </view>
      <view class="step-arrow">›</view>
      <view class="step">
        <view class="step-num">3</view>
        <text class="step-name">等收菜</text>
        <text class="step-sub">长势随时看</text>
      </view>
    </view>

    <!-- 筛选 -->
    <view class="filter">
      <view class="f-row">
        <text class="f-label">农场</text>
        <view class="f-chips">
          <view class="chip" :class="{ on: farmId === 'all' }" @tap="farmId = 'all'">全部</view>
          <view
            v-for="f in filters.farms"
            :key="f.id"
            class="chip"
            :class="{ on: farmId === f.id }"
            @tap="farmId = f.id"
          >{{ f.name }} {{ f.count }}</view>
        </view>
      </view>
      <view class="f-row">
        <text class="f-label">面积</text>
        <view class="f-chips">
          <view class="chip" :class="{ on: area === 'all' }" @tap="area = 'all'">全部</view>
          <view
            v-for="a in filters.areas"
            :key="a"
            class="chip"
            :class="{ on: area === a }"
            @tap="area = a"
          >{{ a }}㎡</view>
        </view>
      </view>
    </view>

    <!-- 地块列表 -->
    <view class="list">
      <view class="list-head">
        <text class="list-title">可选地块</text>
        <text class="list-count">共 {{ list.length }} 块</text>
      </view>

      <view
        v-for="p in list"
        :key="p.id"
        class="plot"
        :class="{ full: p.full }"
        @tap="open(p)"
      >
        <view class="p-img" :style="{ background: 'linear-gradient(150deg, ' + p.bg[0] + ', ' + p.bg[1] + ')' }">
          <text class="p-emoji">{{ p.emoji }}</text>
          <view class="p-code">{{ p.code }}</view>
          <view v-if="p.few" class="p-few">仅剩 {{ p.leftCount }} 块</view>
        </view>

        <view class="p-main">
          <view class="row between p-top">
            <text class="p-name">{{ p.farm.name }}</text>
            <text class="p-area">{{ p.area }}㎡ · {{ p.rows }} 垄</text>
          </view>
          <text class="p-hl">{{ p.highlight }}</text>
          <view class="p-tags">
            <text v-for="t in p.tags" :key="t" class="p-tag">{{ t }}</text>
          </view>
          <view class="row between p-foot">
            <view class="row p-price">
              <text class="p-sym">¥</text>
              <text class="p-num">{{ p.price }}</text>
              <text class="p-unit">/季起</text>
            </view>
            <text class="p-adopted">{{ p.adoptedCount }} 户已认</text>
          </view>
        </view>
      </view>

      <empty-box
        v-if="!list.length"
        emoji="🌾"
        text="这个条件下还没有地块"
        sub="换个农场或面积看看"
      />
    </view>

    <!-- 保障 -->
    <view class="promise card">
      <text class="pr-title">认养有保障</text>
      <view class="pr-item">
        <icon-svg name="checkCircle" :size="28" color="#06A96A" :stroke="1.8" />
        <text class="pr-txt">签约即出电子证书，地块归属唯一编号</text>
      </view>
      <view class="pr-item">
        <icon-svg name="checkCircle" :size="28" color="#06A96A" :stroke="1.8" />
        <text class="pr-txt">每周一条长势记录，随时可查农事日志</text>
      </view>
      <view class="pr-item">
        <icon-svg name="checkCircle" :size="28" color="#06A96A" :stroke="1.8" />
        <text class="pr-txt">坏果包赔 · 不满意可随时退养</text>
      </view>
    </view>

    <view style="height: 60rpx" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import * as api from '@/api/index.js'
import { toast } from '@/common/utils.js'

const farmId = ref('all')
const area = ref('all')

const plots = computed(() => api.listPlots())
const filters = computed(() => api.plotFilters())
const list = computed(() => api.listPlots({ farmId: farmId.value, area: area.value }))

function open(p) {
  if (p.full) return toast('这块地已经认满了，看看其他地块吧')
  uni.navigateTo({ url: '/pages/farm/plot?id=' + p.id })
}

function toMine() {
  uni.navigateTo({ url: '/pages/farm/my' })
}
</script>

<style scoped>
.adopt {
  padding-bottom: 30rpx;
}
.nav-mine {
  padding: 10rpx 22rpx;
  border-radius: 40rpx;
  background: #e9faf2;
}
.nav-mine-txt {
  font-size: 22rpx;
  color: #06a96a;
  font-weight: 600;
}

/* 头图 */
.hero {
  margin: 10rpx 24rpx 0;
  border-radius: 30rpx;
  padding: 34rpx 30rpx 26rpx;
  background: linear-gradient(135deg, #123b2c 0%, #1d5c45 58%, #26835f 100%);
  position: relative;
  overflow: hidden;
}
.hero-img {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
.hero-shade {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(120deg, rgba(8, 34, 24, 0.9) 0%, rgba(8, 34, 24, 0.68) 55%, rgba(8, 34, 24, 0.32) 100%);
}
.hero-kicker,
.hero-title,
.hero-sub,
.hero-stats {
  position: relative;
  z-index: 2;
}
.hero-deco {
  position: absolute;
  width: 320rpx;
  height: 320rpx;
  border-radius: 50%;
  right: -110rpx;
  top: -140rpx;
  background: rgba(255, 255, 255, 0.08);
}
.hero-kicker {
  display: block;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.6);
  letter-spacing: 2rpx;
}
.hero-title {
  display: block;
  font-size: 44rpx;
  font-weight: 800;
  color: #fff;
  line-height: 1.28;
  margin-top: 8rpx;
}
.hero-sub {
  display: block;
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.72);
  margin-top: 16rpx;
}
.hero-stats {
  display: flex;
  align-items: center;
  margin-top: 30rpx;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 22rpx;
  padding: 18rpx 0;
}
.hs {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.hs-num {
  font-size: 32rpx;
  font-weight: 800;
  color: #fff;
}
.hs-label {
  font-size: 19rpx;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 4rpx;
}
.hs-line {
  width: 2rpx;
  height: 40rpx;
  background: rgba(255, 255, 255, 0.14);
}

/* 步骤 */
.steps {
  margin: 20rpx 24rpx 0;
  padding: 24rpx 16rpx;
  display: flex;
  align-items: center;
}
.step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.step-num {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #16d488, #0bbd72);
  color: #fff;
  font-size: 22rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}
.step-name {
  font-size: 23rpx;
  font-weight: 600;
  margin-top: 10rpx;
}
.step-sub {
  font-size: 18rpx;
  color: #9aa7a1;
  margin-top: 4rpx;
}
.step-arrow {
  font-size: 30rpx;
  color: #cfdad5;
  padding-bottom: 20rpx;
}

/* 筛选 */
.filter {
  margin: 26rpx 24rpx 0;
}
.f-row {
  display: flex;
  align-items: flex-start;
  margin-bottom: 14rpx;
}
.f-label {
  width: 70rpx;
  font-size: 22rpx;
  color: #7c8a84;
  line-height: 56rpx;
}
.f-chips {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.chip {
  padding: 0 22rpx;
  height: 56rpx;
  line-height: 56rpx;
  border-radius: 28rpx;
  background: #fff;
  font-size: 22rpx;
  color: #5c6a64;
  border: 2rpx solid #fff;
}
.chip.on {
  background: #e9faf2;
  color: #06a96a;
  font-weight: 600;
  border-color: #b9ecd4;
}

/* 列表 */
.list {
  margin: 22rpx 24rpx 0;
}
.list-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 14rpx;
}
.list-title {
  font-size: 28rpx;
  font-weight: 700;
}
.list-count {
  font-size: 21rpx;
  color: #9aa7a1;
}
.plot {
  display: flex;
  background: #fff;
  border-radius: 26rpx;
  padding: 18rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 8rpx 30rpx rgba(22, 60, 45, 0.05);
}
.plot.full {
  opacity: 0.62;
}
.p-img {
  width: 176rpx;
  height: 176rpx;
  border-radius: 20rpx;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.p-emoji {
  font-size: 82rpx;
}
.p-code {
  position: absolute;
  left: 10rpx;
  top: 10rpx;
  padding: 2rpx 10rpx;
  border-radius: 8rpx;
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  font-size: 18rpx;
  font-weight: 600;
}
.p-few {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  text-align: center;
  padding: 4rpx 0;
  font-size: 18rpx;
  color: #fff;
  background: rgba(255, 107, 61, 0.9);
  border-radius: 0 0 20rpx 20rpx;
}
.p-main {
  flex: 1;
  min-width: 0;
  padding-left: 18rpx;
  display: flex;
  flex-direction: column;
}
.p-name {
  font-size: 27rpx;
  font-weight: 700;
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.p-area {
  font-size: 19rpx;
  color: #7c8a84;
  background: #f4f8f5;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}
.p-hl {
  display: block;
  font-size: 21rpx;
  color: #7c8a84;
  line-height: 1.5;
  margin-top: 8rpx;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.p-tags {
  display: flex;
  gap: 8rpx;
  margin-top: 10rpx;
  flex-wrap: wrap;
}
.p-tag {
  font-size: 17rpx;
  color: #0a8f5c;
  background: #f2fbf6;
  padding: 3rpx 10rpx;
  border-radius: 6rpx;
}
.p-foot {
  margin-top: auto;
  padding-top: 10rpx;
}
.p-price {
  align-items: baseline;
}
.p-sym {
  font-size: 20rpx;
  color: #ff4b3a;
  font-weight: 700;
}
.p-num {
  font-size: 36rpx;
  color: #ff4b3a;
  font-weight: 800;
  margin-left: 2rpx;
}
.p-unit {
  font-size: 18rpx;
  color: #9aa7a1;
  margin-left: 4rpx;
}
.p-adopted {
  font-size: 18rpx;
  color: #b3bfba;
}

/* 保障 */
.promise {
  margin: 16rpx 24rpx 0;
  padding: 26rpx 24rpx;
}
.pr-title {
  display: block;
  font-size: 26rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
}
.pr-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 12rpx;
}
.pr-txt {
  font-size: 22rpx;
  color: #3d4a45;
}
</style>

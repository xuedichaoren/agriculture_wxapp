<template>
  <view class="page dev">
    <nav-bar title="UI 与插图" bg="#F4F8F5">
      <template #right>
        <view class="nav-tip" @tap="copyDoc">说明</view>
      </template>
    </nav-bar>

    <view class="body">
      <!-- 概览 -->
      <view class="hero">
        <text class="hero-t">组件库 v1 · 11 个基础组件</text>
        <text class="hero-s">
          颜色、圆角、阴影全部来自 common/theme.js；插图槽来自 common/assets.js，
          把图片按路径丢进 static/images/ 就会自动替换，不用改页面。
        </text>
        <view class="hero-row">
          <view class="hero-pill">待插图 {{ imageSlots.length }} 处</view>
          <view class="hero-pill">已注册组件 11 个</view>
        </view>
      </view>

      <!-- 颜色 -->
      <ui-section title="颜色" sub="品牌绿为主，语义色只用于状态" />
      <view class="card pad">
        <view class="swatches">
          <view v-for="c in colors" :key="c.k" class="sw" @tap="copy(c.v)">
            <view class="sw-box" :style="{ background: c.v }" />
            <text class="sw-name">{{ c.k }}</text>
            <text class="sw-val">{{ c.v }}</text>
          </view>
        </view>
        <view class="grads">
          <view v-for="g in grads" :key="g.k" class="grad" :style="{ background: g.v }">
            <text class="grad-t">{{ g.k }}</text>
          </view>
        </view>
      </view>

      <!-- 卡片 -->
      <ui-section title="卡片" sub="ui-card，最常见的内容容器" />
      <ui-card title="带标题的卡片" sub="默认 24rpx 内边距">
        <text class="demo-txt">标题在左、副标题紧随其后；右上角可以用 extra 插槽放状态或操作。</text>
        <template #extra>
          <ui-tag tone="brand" text="示例" />
        </template>
      </ui-card>
      <ui-card flat>
        <text class="demo-txt">flat 去掉阴影，适合嵌在列表里的次级卡片。</text>
      </ui-card>
      <ui-card tight>
        <view class="demo-tight">
          <text class="demo-txt">tight 去掉内边距，图片或整块内容直接贴边。</text>
        </view>
      </ui-card>

      <!-- 按钮 -->
      <ui-section title="按钮" sub="ui-btn" />
      <view class="card pad">
        <view class="btn-row">
          <ui-btn type="primary" text="主操作" />
          <ui-btn type="ghost" text="次要" />
          <ui-btn type="line" text="描边" />
        </view>
        <view class="btn-row">
          <ui-btn type="text" text="文字按钮" />
          <ui-btn type="danger" text="危险" />
          <ui-btn type="primary" text="禁用" disabled />
        </view>
        <view class="btn-row">
          <ui-btn size="sm" type="ghost" text="小按钮" />
          <ui-btn size="xs" type="line" text="超小" />
          <ui-btn size="md" type="primary" text="加载中" loading />
        </view>
        <ui-btn type="primary" block size="lg" text="通栏主按钮" />
      </view>

      <!-- 标签 -->
      <ui-section title="标签" sub="ui-tag，7 种语义色" />
      <view class="card pad">
        <view class="tag-row">
          <ui-tag tone="brand" text="品牌" />
          <ui-tag tone="warn" text="待审核" />
          <ui-tag tone="danger" text="已驳回" />
          <ui-tag tone="info" text="已开通" />
          <ui-tag tone="purple" text="专家" />
          <ui-tag tone="gold" text="付费" />
          <ui-tag tone="gray" text="未知" />
        </view>
        <view class="tag-row">
          <ui-tag tone="brand" text="实心" :plain="false" round />
          <ui-tag tone="warn" text="小号" size="sm" round />
          <ui-tag tone="info" text="大号" size="lg" round />
        </view>
      </view>

      <!-- 分段 -->
      <ui-section title="分段选择" sub="ui-segment" />
      <view class="card pad">
        <ui-segment :options="segOptions" :value="seg" @change="onSeg" />
        <view class="seg-gap" />
        <ui-segment :options="segOptions" :value="seg" size="sm" pill @change="onSeg" />
      </view>

      <!-- 数据块 -->
      <ui-section title="数据" sub="ui-stat" />
      <view class="card pad">
        <view class="stat-row">
          <ui-stat :value="128" label="已收（斤）" tone="brand" />
          <ui-stat :value="43" label="待收（斤）" tone="warn" />
          <ui-stat :value="86" unit="%" label="完成度" tone="info" />
        </view>
      </view>

      <!-- 列表 -->
      <ui-section title="列表项" sub="ui-cell" />
      <view class="card pad">
        <ui-cell icon="camera" title="拍照识病" desc="上传叶片照片，判植物与病害" value="试一试" @click="to('/pages/scan/scan')" />
        <ui-cell icon="users" title="专家问诊" tag="新" desc="8 位农艺师在线" @click="to('/pages/expert/list')" />
        <ui-cell emoji="🌾" title="我的地块" value="3 块" :last="true" @click="to('/pages/farm/my')" />
      </view>

      <!-- 头像 -->
      <ui-section title="头像" sub="ui-avatar，支持在线状态点" />
      <view class="card pad">
        <view class="av-row">
          <ui-avatar :size="112" emoji="👨‍🌾" ring />
          <ui-avatar :size="88" emoji="🧑‍🔬" online />
          <ui-avatar :size="72" emoji="🌾" badge="3" />
          <ui-avatar :size="72" emoji="🛒" radius="50%" />
        </view>
      </view>

      <!-- 骨架 -->
      <ui-section title="骨架屏" sub="ui-skeleton，识别 / 加载时用" />
      <view class="card pad">
        <ui-skeleton avatar :rows="3" />
      </view>

      <!-- 弹层 -->
      <ui-section title="底部弹层" sub="ui-sheet" />
      <view class="card pad">
        <ui-btn type="ghost" block text="打开弹层" @click="sheet = true" />
      </view>

      <!-- 插图清单 -->
      <ui-section title="插图槽" sub="点击复制路径" top="10" />
      <view v-for="(list, g) in groups" :key="g" class="group">
        <text class="g-title">{{ groupName[g] || g }}</text>
        <view class="slots">
          <view v-for="it in list" :key="it.key" class="slot" @tap="copy(it.src)">
            <ui-image :name="it.key" :h="150" radius="18rpx" mark />
            <text class="s-key">{{ it.key }}</text>
            <text class="s-file">{{ it.file }}</text>
            <text class="s-size">{{ it.w }}×{{ it.h }} · {{ Math.round(it.ratio * 100) / 100 }}</text>
            <text class="s-tip">{{ it.tip }}</text>
          </view>
        </view>
      </view>

      <view class="tail">新增插图：在 common/assets.js 里加一条，页面写 &lt;ui-image name="你的key" /&gt;</view>
      <view style="height: 40rpx" />
    </view>

    <ui-sheet :visible="sheet" title="底部弹层示例" @close="sheet = false">
      <text class="sheet-txt">弹层内容放这里。选作物、选去向、筛专家都用它，避免各页面重复写遮罩与动画。</text>
      <template #footer>
        <ui-btn type="primary" block text="知道了" @click="sheet = false" />
      </template>
    </ui-sheet>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { C, G } from '@/common/theme.js'
import { allSlots, groupedSlots, GROUP_NAME } from '@/common/assets.js'
import { toast } from '@/common/utils.js'

const seg = ref('a')
const sheet = ref(false)
const segOptions = [
  { key: 'a', label: '全部', badge: 6 },
  { key: 'b', label: '待回复' },
  { key: 'c', label: '已回复' }
]

const colors = [
  { k: 'brand', v: C.brand },
  { k: 'brandDeep', v: C.brandDeep },
  { k: 'brandSoft', v: C.brandSoft },
  { k: 'ink', v: C.ink },
  { k: 'sub', v: C.sub },
  { k: 'price', v: C.price },
  { k: 'warn', v: C.warn },
  { k: 'info', v: C.info },
  { k: 'purple', v: C.purple }
]

const grads = [
  { k: 'brand', v: G.brand },
  { k: 'header', v: G.header },
  { k: 'sunset', v: G.sunset },
  { k: 'sky', v: G.sky },
  { k: 'soil', v: G.soil }
]

const imageSlots = allSlots()
const groups = groupedSlots()
const groupName = GROUP_NAME

function onSeg(v) {
  seg.value = v
}

function copy(text) {
  uni.setClipboardData({ data: String(text), success: () => toast('已复制 ' + text) })
}

function to(url) {
  uni.navigateTo({ url })
}

function copyDoc() {
  copy('docs/08-UI组件库与插图指南.md')
}
</script>

<style scoped>
.dev {
  min-height: 100vh;
}
.body {
  padding: 8rpx 28rpx 0;
}
.nav-tip {
  font-size: 23rpx;
  color: #06a96a;
  padding: 0 6rpx;
}
.hero {
  background: linear-gradient(150deg, #113a2c, #0a5c40);
  border-radius: 28rpx;
  padding: 28rpx 26rpx;
  margin-bottom: 24rpx;
}
.hero-t {
  display: block;
  font-size: 30rpx;
  font-weight: 800;
  color: #fff;
}
.hero-s {
  display: block;
  margin-top: 10rpx;
  font-size: 21rpx;
  color: rgba(255, 255, 255, 0.72);
  line-height: 1.65;
}
.hero-row {
  display: flex;
  gap: 12rpx;
  margin-top: 18rpx;
}
.hero-pill {
  font-size: 19rpx;
  color: #d6ffe9;
  background: rgba(255, 255, 255, 0.14);
  border-radius: 30rpx;
  padding: 6rpx 16rpx;
}
.card {
  background: #fff;
  border-radius: 28rpx;
  box-shadow: 0 8rpx 30rpx rgba(22, 60, 45, 0.05);
  margin-bottom: 24rpx;
}
.pad {
  padding: 24rpx;
}
.demo-txt {
  display: block;
  font-size: 23rpx;
  color: #3d4a45;
  line-height: 1.7;
}
.demo-tight {
  padding: 24rpx;
}
.swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}
.sw {
  width: calc((100% - 28rpx) / 3);
}
.sw-box {
  height: 72rpx;
  border-radius: 14rpx;
  border: 2rpx solid rgba(0, 0, 0, 0.04);
}
.sw-name {
  display: block;
  margin-top: 8rpx;
  font-size: 19rpx;
  color: #3d4a45;
  font-weight: 600;
}
.sw-val {
  display: block;
  font-size: 17rpx;
  color: #b3bfba;
}
.grads {
  display: flex;
  gap: 10rpx;
  margin-top: 20rpx;
}
.grad {
  flex: 1;
  height: 78rpx;
  border-radius: 14rpx;
  display: flex;
  align-items: flex-end;
  padding: 8rpx;
}
.grad-t {
  font-size: 17rpx;
  color: #fff;
  opacity: 0.9;
}
.btn-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 18rpx;
  flex-wrap: wrap;
}
.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-bottom: 14rpx;
}
.seg-gap {
  height: 16rpx;
}
.stat-row {
  display: flex;
  justify-content: space-between;
  padding: 4rpx 6rpx;
}
.av-row {
  display: flex;
  align-items: center;
  gap: 24rpx;
}
.group {
  margin-bottom: 26rpx;
}
.g-title {
  display: block;
  font-size: 23rpx;
  font-weight: 700;
  color: #3d4a45;
  margin-bottom: 14rpx;
}
.slots {
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
}
.slot {
  width: calc((100% - 18rpx) / 2);
  background: #fff;
  border-radius: 20rpx;
  padding: 14rpx;
  box-shadow: 0 6rpx 20rpx rgba(22, 60, 45, 0.04);
}
.s-key {
  display: block;
  margin-top: 12rpx;
  font-size: 21rpx;
  font-weight: 700;
  color: #16201c;
}
.s-file {
  display: block;
  margin-top: 2rpx;
  font-size: 18rpx;
  color: #06a96a;
}
.s-size {
  display: block;
  font-size: 17rpx;
  color: #b3bfba;
}
.s-tip {
  display: block;
  margin-top: 6rpx;
  font-size: 18rpx;
  color: #9aa7a1;
  line-height: 1.5;
}
.tail {
  margin: 10rpx 2rpx 0;
  font-size: 20rpx;
  color: #9aa7a1;
  line-height: 1.6;
}
.sheet-txt {
  display: block;
  padding: 16rpx 0 8rpx;
  font-size: 24rpx;
  color: #3d4a45;
  line-height: 1.7;
}
</style>

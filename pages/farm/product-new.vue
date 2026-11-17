<template>
  <view class="page pn-page">
    <nav-bar title="上架新商品" />

    <scroll-view scroll-y class="body no-scrollbar" :show-scrollbar="false">
      <!-- 预览 -->
      <view class="preview">
        <view class="pv-img" :style="{ background: `linear-gradient(150deg, ${bg[0]}, ${bg[1]})` }">
          <text class="pv-emoji">{{ form.emoji }}</text>
        </view>
        <view class="flex1">
          <text class="pv-name">{{ form.name || '商品名称' }}</text>
          <text class="pv-spec">{{ form.spec || '规格，如 500g／份' }}</text>
          <view class="pv-price">
            <text class="pv-sym">¥</text>
            <text class="pv-num">{{ form.price || '0.00' }}</text>
            <text v-if="Number(form.originalPrice) > Number(form.price)" class="pv-origin">¥{{ form.originalPrice }}</text>
          </view>
        </view>
      </view>

      <!-- 基本信息 -->
      <view class="card">
        <text class="c-title">基本信息</text>

        <view class="field">
          <text class="f-label">商品名称<text class="req">*</text></text>
          <input class="f-input" v-model="form.name" placeholder="例：湘研早熟辣椒" placeholder-class="f-ph" :maxlength="20" />
        </view>

        <view class="field">
          <text class="f-label">分类</text>
          <view class="f-chips">
            <view
              v-for="c in CATEGORIES"
              :key="c.id"
              class="f-chip"
              :class="{ on: form.categoryId === c.id }"
              @tap="form.categoryId = c.id"
            >{{ c.emoji }} {{ c.name }}</view>
          </view>
        </view>

        <view class="field">
          <text class="f-label">图标</text>
          <view class="f-chips">
            <view
              v-for="e in EMOJIS"
              :key="e"
              class="f-emoji"
              :class="{ on: form.emoji === e }"
              @tap="form.emoji = e"
            >{{ e }}</view>
          </view>
        </view>
      </view>

      <!-- 价格库存 -->
      <view class="card">
        <text class="c-title">价格与库存</text>

        <view class="field row">
          <text class="f-label">售价（元）<text class="req">*</text></text>
          <input class="f-input right" v-model="form.price" type="digit" placeholder="0.00" placeholder-class="f-ph" />
        </view>

        <view class="field row">
          <text class="f-label">原价（元）</text>
          <input class="f-input right" v-model="form.originalPrice" type="digit" placeholder="选填，用于划线价" placeholder-class="f-ph" />
        </view>

        <view class="field row">
          <text class="f-label">规格</text>
          <input class="f-input right" v-model="form.spec" placeholder="如 500g／份" placeholder-class="f-ph" :maxlength="16" />
        </view>

        <view class="field row">
          <text class="f-label">库存（份）</text>
          <input class="f-input right" v-model="form.stock" type="number" placeholder="0" placeholder-class="f-ph" />
        </view>
      </view>

      <!-- 描述 -->
      <view class="card">
        <text class="c-title">让买家放心</text>

        <view class="field">
          <text class="f-label">一句话卖点</text>
          <input class="f-input" v-model="form.summary" placeholder="例：武陵山坡地种的，皮薄肉厚，炒腊肉最下饭" placeholder-class="f-ph" :maxlength="40" />
        </view>

        <view class="field">
          <text class="f-label">标签</text>
          <view class="f-chips">
            <view
              v-for="t in TAGS"
              :key="t"
              class="f-chip"
              :class="{ on: form.tags.indexOf(t) > -1 }"
              @tap="toggleTag(t)"
            >{{ t }}</view>
          </view>
          <text class="f-tip">最多选 3 个，标签会显示在商品图上</text>
        </view>

        <view class="field">
          <text class="f-label">详情</text>
          <textarea
            class="f-ta"
            v-model="form.detailText"
            :maxlength="300"
            placeholder="产地、采摘时间、保存方法、规格，一行一条最好读"
            placeholder-class="f-ph"
            :show-confirm-bar="false"
          />
        </view>
      </view>

      <!-- 提示 -->
      <view class="notice">
        <text class="nt-t">上架前先想清楚三件事</text>
        <text class="nt-s">1. 库存按今天实际能摘的量填，宁可少填，卖超了要退款更麻烦</text>
        <text class="nt-s">2. 生鲜有 ±5% 自然误差，规格里写清「约」多少，能少很多纠纷</text>
        <text class="nt-s">3. 价格别只对标超市，算上运费和损耗再定</text>
        <text class="nt-s">当前版本新建的商品只在你自己的商品列表里可见，接后端后会同步到买家端</text>
      </view>

      <view style="height: 180rpx" />
    </scroll-view>

    <view class="foot">
      <ui-btn type="primary" size="lg" block :loading="saving" text="立即上架" @click="submit" />
      <view class="safe-bottom" />
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { CATEGORIES } from '@/mock/index.js'
import { addProduct } from '@/store/sell.js'
import { toast } from '@/common/utils.js'

const TAGS = ['当日采摘', '不打农药', '产地直供', '有机种植', '现挖现发', '坏果包赔']
const EMOJIS = ['🥬', '🌶️', '🍊', '🍑', '🥕', '🥔', '🍄', '🌾', '🥓', '🍵', '🥚', '🍯']

const saving = ref(false)

const form = reactive({
  name: '',
  categoryId: 'veg',
  emoji: '🥬',
  price: '',
  originalPrice: '',
  spec: '',
  stock: '',
  summary: '',
  detailText: '',
  tags: []
})

const bg = computed(() => {
  const c = CATEGORIES.find((x) => x.id === form.categoryId)
  return c ? c.bg : ['#EAF9F1', '#CFF3E0']
})

function toggleTag(t) {
  const i = form.tags.indexOf(t)
  if (i > -1) return form.tags.splice(i, 1)
  if (form.tags.length >= 3) return toast('最多选 3 个')
  form.tags.push(t)
}

function submit() {
  if (saving.value) return
  if (!form.name.trim()) return toast('先填个商品名')
  if (!(Number(form.price) > 0)) return toast('售价要大于 0')
  saving.value = true
  const item = addProduct({
    name: form.name,
    categoryId: form.categoryId,
    emoji: form.emoji,
    price: form.price,
    originalPrice: form.originalPrice,
    spec: form.spec,
    stock: form.stock,
    summary: form.summary,
    detailText: form.detailText,
    tags: form.tags
  })
  saving.value = false
  if (!item) return toast('信息没填全，再检查一下')
  toast('已上架，出现在你的商品列表里')
  setTimeout(() => {
    const pages = getCurrentPages()
    if (pages.length > 1) uni.navigateBack()
    else uni.reLaunch({ url: '/pages/farm/sell' })
  }, 700)
}
</script>

<style scoped>
.pn-page {
  min-height: 100vh;
  background: #f4f8f5;
  display: flex;
  flex-direction: column;
}
.body {
  flex: 1;
  height: 0;
  padding: 18rpx 24rpx 0;
}
.card {
  background: #fff;
  border-radius: 22rpx;
  padding: 22rpx 20rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}
.c-title {
  display: block;
  font-size: 26rpx;
  font-weight: 700;
  color: #16201c;
  margin-bottom: 6rpx;
}

/* 预览 */
.preview {
  display: flex;
  align-items: center;
  gap: 18rpx;
  background: #fff;
  border-radius: 22rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}
.pv-img {
  width: 140rpx;
  height: 140rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.pv-emoji {
  font-size: 66rpx;
}
.pv-name {
  display: block;
  font-size: 26rpx;
  font-weight: 700;
  color: #16201c;
}
.pv-spec {
  display: block;
  margin-top: 5rpx;
  font-size: 19rpx;
  color: #9aa7a1;
}
.pv-price {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
  margin-top: 10rpx;
}
.pv-sym {
  font-size: 20rpx;
  color: #ff5a4e;
  font-weight: 700;
}
.pv-num {
  font-size: 34rpx;
  color: #ff5a4e;
  font-weight: 800;
}
.pv-origin {
  font-size: 18rpx;
  color: #b3bfba;
  text-decoration: line-through;
  margin-left: 6rpx;
}

/* 字段 */
.field {
  padding: 16rpx 0;
  border-bottom: 2rpx solid #f4f8f5;
}
.field:last-child {
  border-bottom: none;
}
.field.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}
.f-label {
  font-size: 23rpx;
  color: #3d4a45;
  font-weight: 500;
}
.req {
  color: #ff5a4e;
  margin-left: 4rpx;
}
.f-input {
  margin-top: 12rpx;
  height: 72rpx;
  background: #f8fbf9;
  border-radius: 14rpx;
  padding: 0 16rpx;
  font-size: 23rpx;
  color: #16201c;
}
.field.row .f-input {
  margin-top: 0;
  flex: 1;
  text-align: right;
  background: transparent;
  padding: 0;
}
.f-ph {
  color: #b3bfba;
  font-size: 21rpx;
}
.f-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 12rpx;
}
.f-chip {
  padding: 8rpx 18rpx;
  border-radius: 24rpx;
  background: #f4f8f5;
  font-size: 20rpx;
  color: #5c6a64;
  border: 2rpx solid transparent;
}
.f-chip.on {
  background: #fff4e4;
  border-color: #e08a2b;
  color: #d97e1c;
  font-weight: 600;
}
.f-emoji {
  width: 60rpx;
  height: 60rpx;
  border-radius: 14rpx;
  background: #f4f8f5;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  border: 2rpx solid transparent;
}
.f-emoji.on {
  border-color: #e08a2b;
  background: #fff4e4;
}
.f-ta {
  width: 100%;
  height: 180rpx;
  background: #f8fbf9;
  border-radius: 14rpx;
  padding: 16rpx;
  margin-top: 12rpx;
  font-size: 21rpx;
  color: #16201c;
  line-height: 1.7;
  box-sizing: border-box;
}
.f-tip {
  display: block;
  margin-top: 8rpx;
  font-size: 17rpx;
  color: #b3bfba;
}

/* 提示 */
.notice {
  background: #fffbf4;
  border-radius: 18rpx;
  padding: 18rpx 20rpx;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.nt-t {
  font-size: 21rpx;
  font-weight: 700;
  color: #a08a6a;
}
.nt-s {
  font-size: 18rpx;
  color: #b09a78;
  line-height: 1.6;
}

/* 底部 */
.foot {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16rpx 24rpx;
  background: #fff;
  box-shadow: 0 -6rpx 24rpx rgba(22, 60, 45, 0.06);
}
</style>

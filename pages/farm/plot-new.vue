<template>
  <view class="page pn">
    <nav-bar title="发布地块" bg="#F4F8F5" />

    <view class="body">
      <view class="tipcard">
        <text class="tip-t">写清楚这几件事，认养人才敢下单</text>
        <text class="tip-s">土质、光照、种什么、大概能收多少。含糊的描述会被平台降权，排在大厅后面。</text>
      </view>

      <!-- 基本信息 -->
      <view class="card">
        <text class="c-t">基本信息</text>
        <view class="field">
          <text class="f-k">地块名称</text>
          <input v-model="form.name" class="f-input" placeholder="如：阳坡辣椒地，写个认得出的小名" maxlength="16" />
        </view>
        <view class="field">
          <text class="f-k">地块编号</text>
          <input v-model="form.code" class="f-input" placeholder="如：E-02，不填自动生成" maxlength="8" />
        </view>
        <view class="field-2">
          <view class="f-half">
            <text class="f-k">面积（㎡）</text>
            <input v-model="form.area" class="f-input" type="number" placeholder="20" />
          </view>
          <view class="f-half">
            <text class="f-k">垄数</text>
            <input v-model="form.rows" class="f-input" type="number" placeholder="4" />
          </view>
        </view>
      </view>

      <!-- 种什么 -->
      <view class="card">
        <view class="row between">
          <text class="c-t">种什么</text>
          <text class="c-s">可多选，已选 {{ form.crops.length }}</text>
        </view>
        <view class="chips">
          <view
            v-for="c in crops"
            :key="c.id"
            class="chip"
            :class="{ on: form.crops.indexOf(c.id) > -1 }"
            @tap="toggleCrop(c.id)"
          >
            <text class="chip-e">{{ c.emoji }}</text>
            <text class="chip-t">{{ c.name }}</text>
          </view>
        </view>
      </view>

      <!-- 认养设置 -->
      <view class="card">
        <text class="c-t">认养设置</text>
        <view class="field-2">
          <view class="f-half">
            <text class="f-k">认养名额（份）</text>
            <input v-model="form.capacity" class="f-input" type="number" placeholder="4" />
          </view>
          <view class="f-half">
            <text class="f-k">单价（元 / 季）</text>
            <input v-model="form.price" class="f-input" type="number" placeholder="299" />
          </view>
        </view>
        <view class="field">
          <text class="f-k">预计产量（斤）</text>
          <input v-model="form.yieldExpect" class="f-input" type="number" placeholder="如 1200，不知道可不填" />
        </view>
        <text class="f-tip">
          名额 = 这块地能同时接几个人。按垄算：一垄一个人最容易履约，硬塞容易后期扯皮。
        </text>
      </view>

      <!-- 地块条件 -->
      <view class="card">
        <text class="c-t">地块条件</text>
        <view class="field">
          <text class="f-k">土质</text>
          <input v-model="form.soil" class="f-input" placeholder="如：黄壤土 · pH 6.4" maxlength="20" />
        </view>
        <view class="field">
          <text class="f-k">光照</text>
          <input v-model="form.sun" class="f-input" placeholder="如：南向坡地 · 日照 8h" maxlength="20" />
        </view>
        <view class="field">
          <text class="f-k">水源</text>
          <input v-model="form.water" class="f-input" placeholder="如：山泉水滴灌" maxlength="20" />
        </view>
      </view>

      <!-- 介绍 -->
      <view class="card">
        <text class="c-t">一句话介绍</text>
        <textarea
          v-model="form.highlight"
          class="f-area"
          placeholder="说点具体的：这块地好在哪、适合什么人。比如「最好的一块向阳地，辣椒皮薄肉厚，炒腊肉最香」"
          maxlength="80"
        />
        <view class="tags">
          <view
            v-for="t in tagOptions"
            :key="t"
            class="tag"
            :class="{ on: form.tags.indexOf(t) > -1 }"
            @tap="toggleTag(t)"
          >{{ t }}</view>
        </view>
      </view>

      <!-- 预览 -->
      <view class="card preview">
        <text class="c-t">预计效果</text>
        <view class="pv">
          <view class="pv-ico">
            <text class="pv-e">{{ form.crops.length ? emojiOf(form.crops[0]) : '🌱' }}</text>
          </view>
          <view class="flex1">
            <view class="row between">
              <text class="pv-n">{{ form.name || '未命名地块' }}</text>
              <ui-tag text="招募中" tone="brand" size="sm" />
            </view>
            <text class="pv-m">{{ form.code || '新地块' }} 号 · {{ form.area || 0 }}㎡ · {{ cropsText }}</text>
            <text class="pv-p">￥{{ form.price || 0 }} / 季 · {{ form.capacity || 0 }} 个名额</text>
          </view>
        </view>
      </view>

      <ui-btn type="primary" size="lg" block text="发布到认养大厅" @click="submit" />
      <text class="agree">发布即表示同意《认养服务规范》：按约定周期托管、按时配送、坏果包赔</text>
      <view style="height: 40rpx" />
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import * as api from '@/api/index.js'
import { addPlot } from '@/store/farm-side.js'
import { toast } from '@/common/utils.js'

const form = reactive({
  name: '',
  code: '',
  area: '',
  rows: '',
  crops: [],
  capacity: '',
  price: '',
  yieldExpect: '',
  soil: '',
  sun: '',
  water: '',
  highlight: '',
  tags: []
})

const tagOptions = ['武陵山区', '农家肥', '不打农药', '当日采摘', '小份尝鲜', '适合上班族', '可挂牌', '老树']
const crops = computed(() => api.ADOPT_CROPS)
const cropsText = computed(() =>
  form.crops
    .map((id) => api.findCrop(id)?.name)
    .filter(Boolean)
    .join(' + ') || '还没选作物'
)

function emojiOf(id) {
  return api.findCrop(id)?.emoji || '🌱'
}

function toggleCrop(id) {
  const i = form.crops.indexOf(id)
  if (i > -1) form.crops.splice(i, 1)
  else form.crops.push(id)
}

function toggleTag(t) {
  const i = form.tags.indexOf(t)
  if (i > -1) form.tags.splice(i, 1)
  else form.tags.push(t)
}

function submit() {
  if (!form.name.trim()) return toast('先给地块起个名字')
  if (!form.crops.length) return toast('至少选一种作物')
  const cap = Number(form.capacity)
  const price = Number(form.price)
  if (!cap || cap < 1) return toast('名额至少 1 个')
  if (!price || price < 1) return toast('填一个单价')

  const plot = addPlot({
    name: form.name.trim(),
    code: form.code.trim(),
    area: form.area,
    rows: form.rows,
    crops: form.crops.slice(),
    capacity: cap,
    price,
    yieldExpect: form.yieldExpect,
    soil: form.soil.trim(),
    sun: form.sun.trim(),
    water: form.water.trim(),
    highlight: form.highlight.trim(),
    tags: form.tags.slice(),
    emoji: emojiOf(form.crops[0])
  })
  toast('已发布，等第一条认养申请')
  setTimeout(() => {
    uni.redirectTo({ url: '/pages/farm/plot-manage?id=' + plot.id })
  }, 600)
}
</script>

<style scoped>
.pn {
  min-height: 100vh;
  background: #f4f8f5;
}
.body {
  padding: 8rpx 24rpx 0;
}
.tipcard {
  background: #fffbf4;
  border: 2rpx solid #ffe9c9;
  border-radius: 20rpx;
  padding: 16rpx 18rpx;
}
.tip-t {
  display: block;
  font-size: 22rpx;
  font-weight: 700;
  color: #8a5a10;
}
.tip-s {
  display: block;
  font-size: 18rpx;
  color: #b58a46;
  line-height: 1.6;
  margin-top: 5rpx;
}

.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 22rpx;
  margin-top: 18rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}
.c-t {
  font-size: 27rpx;
  font-weight: 700;
  color: #16201c;
}
.c-s {
  font-size: 18rpx;
  color: #b3bfba;
}

.field {
  margin-top: 16rpx;
}
.field-2 {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}
.f-half {
  flex: 1;
}
.f-k {
  display: block;
  font-size: 20rpx;
  color: #8b978f;
  margin-bottom: 8rpx;
}
.f-input {
  height: 84rpx;
  background: #f7faf8;
  border-radius: 16rpx;
  padding: 0 18rpx;
  font-size: 24rpx;
  color: #16201c;
}
.f-area {
  width: 100%;
  height: 160rpx;
  background: #f7faf8;
  border-radius: 16rpx;
  padding: 16rpx 18rpx;
  font-size: 23rpx;
  color: #16201c;
  margin-top: 14rpx;
  box-sizing: border-box;
}
.f-tip {
  display: block;
  font-size: 18rpx;
  color: #b3bfba;
  line-height: 1.6;
  margin-top: 12rpx;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 16rpx;
}
.chip {
  display: flex;
  align-items: center;
  gap: 5rpx;
  padding: 10rpx 16rpx;
  border-radius: 30rpx;
  background: #f7faf8;
  border: 2rpx solid transparent;
}
.chip.on {
  background: #fff3e2;
  border-color: #f7c98a;
}
.chip-e {
  font-size: 22rpx;
}
.chip-t {
  font-size: 20rpx;
  color: #5c6a64;
}
.chip.on .chip-t {
  color: #c97615;
  font-weight: 700;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 14rpx;
}
.tag {
  padding: 8rpx 16rpx;
  border-radius: 8rpx;
  background: #f7faf8;
  font-size: 19rpx;
  color: #7c8a84;
}
.tag.on {
  background: #fff3e2;
  color: #c97615;
}

.preview {
  background: #fbfdfb;
}
.pv {
  display: flex;
  gap: 14rpx;
  align-items: center;
  margin-top: 16rpx;
  background: #fff;
  border-radius: 18rpx;
  padding: 16rpx;
}
.pv-ico {
  width: 84rpx;
  height: 84rpx;
  border-radius: 20rpx;
  background: #f4f8f5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.pv-e {
  font-size: 42rpx;
}
.pv-n {
  font-size: 24rpx;
  font-weight: 700;
  color: #16201c;
}
.pv-m {
  display: block;
  font-size: 18rpx;
  color: #9aa7a1;
  margin-top: 4rpx;
}
.pv-p {
  display: block;
  font-size: 19rpx;
  color: #d97e1c;
  font-weight: 600;
  margin-top: 4rpx;
}
.agree {
  display: block;
  font-size: 17rpx;
  color: #b3bfba;
  text-align: center;
  line-height: 1.6;
  margin-top: 16rpx;
}
</style>

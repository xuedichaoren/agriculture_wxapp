<template>
  <view class="page record-page">
    <nav-bar title="农事记录" bg="#F4F8F5" />

    <view v-if="!mine.length" class="miss">
      <text class="miss-emoji">🌱</text>
      <text class="miss-txt">还没有在种的认养地块</text>
      <view class="btn btn-ghost miss-btn" @tap="toAdopt">去认养一块</view>
    </view>

    <view v-else class="body">
      <view class="card form">
        <text class="f-title">添加一条农事记录</text>

        <view class="f-row" @tap="pickPlot">
          <text class="f-label">地块</text>
          <text class="f-value">{{ current ? current.code + ' 号地 · ' + current.cropsText : '请选择地块' }}</text>
          <icon-svg name="right" :size="22" color="#C3CCC8" />
        </view>

        <picker mode="date" :value="date" :end="today" @change="onDate">
          <view class="f-row">
            <text class="f-label">日期</text>
            <text class="f-value">{{ date }}</text>
            <icon-svg name="right" :size="22" color="#C3CCC8" />
          </view>
        </picker>

        <view class="f-block">
          <text class="f-label">农事类型</text>
          <view class="types">
            <view
              v-for="t in types"
              :key="t.key"
              class="type"
              :class="{ on: type === t.key }"
              @tap="type = t.key"
            >
              <text class="type-emoji">{{ t.emoji }}</text>
              <text class="type-txt">{{ t.name }}</text>
            </view>
          </view>
        </view>

        <view class="f-block">
          <text class="f-label">记录内容</text>
          <textarea
            v-model="content"
            class="textarea"
            placeholder="今天做了什么？天气、长势、用量都可以记一下"
            placeholder-class="ph"
            maxlength="200"
          />
          <text class="counter">{{ content.length }}/200</text>
        </view>

        <view class="f-block">
          <text class="f-label">照片</text>
          <view class="photos">
            <view v-for="(p, i) in photos" :key="i" class="photo" :style="{ background: p.bg }">
              <text class="photo-emoji">{{ p.emoji }}</text>
            </view>
            <view class="photo add" @tap="addPhoto">
              <icon-svg name="camera" :size="34" color="#9AA7A1" :stroke="1.8" />
            </view>
          </view>
          <text class="photo-tip">演示版用占位色块代替相册图片</text>
        </view>
      </view>

      <view class="btn btn-primary save" :class="{ 'btn-disabled': !content.trim() }" @tap="save">
        保存记录
      </view>

      <view class="history">
        <view class="row between h-head">
          <text class="h-title">这块地的记录</text>
          <text class="h-count">共 {{ logs.length }} 条</text>
        </view>
        <view class="h-list">
          <view v-for="(r, i) in logs" :key="i" class="h-item">
            <view class="h-line">
              <view class="h-dot" :class="{ first: i === 0 }" />
              <view v-if="i < logs.length - 1" class="h-bar" />
            </view>
            <view class="h-body">
              <view class="row between">
                <text class="h-name">{{ r.title }}</text>
                <text class="h-date">{{ r.date }}</text>
              </view>
              <text class="h-desc">{{ r.summary }}</text>
              <view v-if="r.from === 'me'" class="h-mine">我补录的</view>
            </view>
          </view>
          <empty-box v-if="!logs.length" emoji="🌾" text="还没有记录" sub="写下第一条，长势就有据可查" />
        </view>
      </view>
      <view style="height: 60rpx" />
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { adoptionView, timelineOf, spanDays, todayStr } from '@/api/adopt-plan.js'
import { store } from '@/store/index.js'
import { addFarmLog, userLogsOf } from '@/store/adopt-extra.js'
import { toast } from '@/common/utils.js'

const types = [
  { key: 'harvest', name: '采收', emoji: '🌾' },
  { key: 'care', name: '管护', emoji: '🧑‍🌾' },
  { key: 'fertilize', name: '施肥', emoji: '🍂' },
  { key: 'sow', name: '播种', emoji: '🌱' },
  { key: 'pest', name: '防虫', emoji: '🐛' }
]

const today = todayStr()
const mine = computed(() => store.adoptions.map(adoptionView).filter((a) => a && a.growing))

const code = ref('')
try {
  const pages = getCurrentPages()
  const cur = pages[pages.length - 1]
  if (cur && cur.options && cur.options.code) code.value = cur.options.code
} catch (e) {}
if (!code.value && mine.value.length) code.value = mine.value[0].code

const current = computed(() => mine.value.find((a) => a.code === code.value) || mine.value[0])
if (!code.value && current.value) code.value = current.value.code

const date = ref(today)
const type = ref('care')
const content = ref('')
const photos = ref([])

const logs = computed(() => {
  if (!current.value) return []
  const year = String(current.value.startDate || '').slice(0, 4)
  return timelineOf(current.value.code, userLogsOf(current.value.code), year)
})

const typeObj = computed(() => types.find((t) => t.key === type.value) || types[0])

function pickPlot() {
  if (mine.value.length <= 1) return
  uni.showActionSheet({
    itemList: mine.value.map((a) => a.code + ' 号地 · ' + a.cropsText),
    success: (r) => {
      code.value = mine.value[r.tapIndex].code
    }
  })
}

function onDate(e) {
  date.value = e.detail.value
}

function addPhoto() {
  const pool = [
    { emoji: '🌿', bg: 'linear-gradient(150deg,#eaf9ef,#cdefd8)' },
    { emoji: '🌾', bg: 'linear-gradient(150deg,#fff4e4,#ffe2b8)' },
    { emoji: '🍅', bg: 'linear-gradient(150deg,#ffece9,#ffc9c1)' }
  ]
  if (photos.value.length >= 3) return toast('最多放 3 张')
  photos.value.push(pool[photos.value.length % 3])
}

function save() {
  if (!current.value) return toast('先选一块地')
  if (!content.value.trim()) return toast('写点什么再保存吧')

  const a = current.value
  const day = spanDays(a.startDate, date.value)
  addFarmLog(a.code, {
    day,
    date: date.value,
    type: type.value,
    title: '第 ' + day + ' 天 · ' + typeObj.value.name,
    summary: content.value.trim(),
    emoji: typeObj.value.emoji
  })
  content.value = ''
  photos.value = []
  toast('记录已保存，认养详情里能看到')
}

function toAdopt() {
  uni.navigateTo({ url: '/pages/farm/adopt' })
}
</script>

<style scoped>
.record-page {
  min-height: 100vh;
}
.miss {
  padding: 140rpx 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.miss-emoji {
  font-size: 90rpx;
}
.miss-txt {
  font-size: 25rpx;
  color: #7c8a84;
  margin-top: 18rpx;
}
.miss-btn {
  margin-top: 30rpx;
  padding: 0 40rpx;
}
.body {
  padding: 10rpx 24rpx 0;
}
.form {
  padding: 26rpx 24rpx;
}
.f-title {
  font-size: 30rpx;
  font-weight: 700;
  display: block;
  margin-bottom: 10rpx;
}
.f-row {
  display: flex;
  align-items: center;
  height: 96rpx;
  border-bottom: 2rpx solid #f6f9f7;
  gap: 16rpx;
}
.f-label {
  font-size: 24rpx;
  color: #7c8a84;
}
.f-value {
  margin-left: auto;
  font-size: 25rpx;
  color: #263330;
  max-width: 60%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.f-block {
  padding: 22rpx 0;
  border-bottom: 2rpx solid #f6f9f7;
}
.f-block:last-child {
  border-bottom: none;
}
.types {
  display: flex;
  gap: 14rpx;
  margin-top: 16rpx;
  flex-wrap: wrap;
}
.type {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 14rpx 24rpx;
  border-radius: 18rpx;
  background: #f4f8f5;
  border: 2rpx solid transparent;
}
.type.on {
  background: #e9faf2;
  border-color: #0fc97a;
}
.type-emoji {
  font-size: 26rpx;
}
.type-txt {
  font-size: 23rpx;
  color: #3d4a45;
}
.type.on .type-txt {
  color: #06a96a;
  font-weight: 600;
}
.textarea {
  width: 100%;
  min-height: 160rpx;
  background: #f7faf8;
  border-radius: 18rpx;
  padding: 20rpx;
  font-size: 25rpx;
  margin-top: 14rpx;
  box-sizing: border-box;
}
.ph {
  color: #b9c4bf;
  font-size: 24rpx;
}
.counter {
  display: block;
  text-align: right;
  font-size: 19rpx;
  color: #b3bfba;
  margin-top: 8rpx;
}
.photos {
  display: flex;
  gap: 14rpx;
  margin-top: 16rpx;
}
.photo {
  width: 130rpx;
  height: 130rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.photo.add {
  background: #f7faf8;
  border: 2rpx dashed #d9e3de;
}
.photo-emoji {
  font-size: 60rpx;
}
.photo-tip {
  display: block;
  font-size: 18rpx;
  color: #b3bfba;
  margin-top: 10rpx;
}
.save {
  margin: 26rpx 0 10rpx;
}
.history {
  margin-top: 34rpx;
}
.h-head {
  margin-bottom: 18rpx;
}
.h-title {
  font-size: 28rpx;
  font-weight: 700;
}
.h-count {
  font-size: 20rpx;
  color: #9aa7a1;
}
.h-list {
  background: #fff;
  border-radius: 24rpx;
  padding: 24rpx 24rpx 8rpx;
}
.h-item {
  display: flex;
  gap: 16rpx;
}
.h-line {
  width: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.h-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: #dde5e1;
  margin-top: 10rpx;
}
.h-dot.first {
  background: #0fc97a;
  box-shadow: 0 0 0 6rpx rgba(15, 201, 122, 0.14);
}
.h-bar {
  flex: 1;
  width: 3rpx;
  background: #eef2f0;
  margin: 4rpx 0;
}
.h-body {
  flex: 1;
  padding-bottom: 26rpx;
}
.h-name {
  font-size: 25rpx;
  font-weight: 600;
}
.h-date {
  font-size: 20rpx;
  color: #b3bfba;
}
.h-desc {
  display: block;
  font-size: 22rpx;
  color: #7c8a84;
  margin-top: 8rpx;
  line-height: 1.6;
}
.h-mine {
  display: inline-block;
  margin-top: 8rpx;
  font-size: 17rpx;
  color: #0a8f5c;
  background: #f2fbf6;
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
}
</style>

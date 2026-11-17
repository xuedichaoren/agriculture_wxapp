<template>
  <view class="page his">
    <nav-bar title="识别记录" bg="#F4F8F5">
      <template #right>
        <view v-if="list.length" class="nav-act" @tap="clearAll">清空</view>
      </template>
    </nav-bar>

    <view class="body">
      <view v-if="list.length" class="filters">
        <ui-segment :options="filters" :value="tab" size="sm" @change="onTab" />
      </view>

      <view v-if="!list.length" class="empty">
        <ui-image name="scan.empty" :h="300" radius="24rpx" />
        <text class="e-t">还没有识别记录</text>
        <text class="e-s">拍一张有症状的叶片，结果会自动留在这里，方便复查对比</text>
        <ui-btn type="primary" size="md" text="去识别" @click="toScan" />
      </view>

      <view v-else>
        <view v-for="it in list" :key="it.id" class="item" @tap="open(it.id)" @longpress="del(it.id)">
          <view class="it-thumb">
            <image v-if="it.filePath && !it.broken" :src="it.filePath" mode="aspectFill" class="it-img" @error="it.broken = true" />
            <text v-else class="it-emoji">{{ it.plantEmoji }}</text>
          </view>
          <view class="flex1">
            <view class="it-top">
              <text class="it-name">{{ it.diseaseName || '未识别' }}</text>
              <text v-if="it.confidence" class="it-conf">{{ it.confidence }}%</text>
            </view>
            <text class="it-sub">{{ it.plantName }} · {{ it.severity || '—' }}</text>
            <view class="it-foot">
              <text class="it-date">{{ fmt(it.at) }}</text>
              <text class="it-mode">{{ modeText(it.mode) }}</text>
            </view>
          </view>
          <icon-svg name="right" :size="22" color="#C3CCC8" />
        </view>
        <text class="hint">长按可删除单条记录</text>
      </view>

      <view style="height: 40rpx" />
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { allRecords, clearResults, removeResult } from '@/store/diagnose.js'
import { toast } from '@/common/utils.js'

const tab = ref('all')
const records = ref([])

const filters = [
  { key: 'all', label: '全部' },
  { key: 'disease', label: '病虫害' },
  { key: 'growth', label: '长势' }
]

onShow(() => {
  records.value = allRecords()
})

const list = computed(() => {
  if (tab.value === 'all') return records.value
  return records.value.filter((r) => r.mode === tab.value || (tab.value === 'growth' && r.mode === 'auto'))
})

function onTab(v) {
  tab.value = v
}

function fmt(ts) {
  const d = new Date(ts)
  const p = (n) => (n < 10 ? '0' + n : '' + n)
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function modeText(m) {
  if (m === 'growth') return '长势'
  if (m === 'disease') return '病虫害'
  return '智能'
}

function open(id) {
  uni.navigateTo({ url: '/pages/scan/result?id=' + id })
}

function toScan() {
  uni.redirectTo({ url: '/pages/scan/scan' })
}

function del(id) {
  uni.showModal({
    title: '删除这条记录',
    content: '删除后不可恢复',
    success: (res) => {
      if (!res.confirm) return
      removeResult(id)
      records.value = allRecords()
      toast('已删除')
    }
  })
}

function clearAll() {
  uni.showModal({
    title: '清空识别记录',
    content: '全部记录都会被删除，不可恢复',
    success: (res) => {
      if (!res.confirm) return
      clearResults()
      records.value = []
      toast('已清空')
    }
  })
}
</script>

<style scoped>
.his {
  min-height: 100vh;
}
.body {
  padding: 6rpx 28rpx 0;
}
.nav-act {
  font-size: 23rpx;
  color: #7c8a84;
  padding: 0 6rpx;
}
.filters {
  margin-bottom: 18rpx;
}
.item {
  display: flex;
  align-items: center;
  gap: 18rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}
.it-thumb {
  width: 120rpx;
  height: 120rpx;
  border-radius: 18rpx;
  background: linear-gradient(150deg, #eafaf1, #d3f2e2);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}
.it-img {
  width: 100%;
  height: 100%;
  display: block;
}
.it-emoji {
  font-size: 52rpx;
}
.it-top {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.it-name {
  font-size: 27rpx;
  font-weight: 700;
  color: #16201c;
}
.it-conf {
  font-size: 18rpx;
  color: #06a96a;
  background: #e9faf2;
  border-radius: 6rpx;
  padding: 2rpx 8rpx;
}
.it-sub {
  display: block;
  margin-top: 6rpx;
  font-size: 21rpx;
  color: #7c8a84;
}
.it-foot {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 8rpx;
}
.it-date {
  font-size: 19rpx;
  color: #b3bfba;
}
.it-mode {
  font-size: 17rpx;
  color: #9aa7a1;
  background: #f4f8f5;
  border-radius: 6rpx;
  padding: 2rpx 8rpx;
}
.hint {
  display: block;
  text-align: center;
  margin-top: 10rpx;
  font-size: 19rpx;
  color: #c3ccc8;
}
.empty {
  padding: 60rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14rpx;
}
.e-t {
  margin-top: 18rpx;
  font-size: 28rpx;
  font-weight: 700;
  color: #3d4a45;
}
.e-s {
  font-size: 21rpx;
  color: #9aa7a1;
  text-align: center;
  line-height: 1.6;
  margin-bottom: 16rpx;
}
</style>

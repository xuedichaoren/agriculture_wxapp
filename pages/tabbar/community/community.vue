<template>
  <view class="page cm">
    <view class="header">
      <view class="status" :style="{ height: statusBar + 'px' }" />
      <view class="h-row">
        <text class="h-title">农友圈</text>
        <view class="h-right">
          <view class="publish" @tap="go('/pages/post/publish')">
            <icon-svg name="camera" :size="26" color="#FFFFFF" :stroke="1.9" />
            <text class="publish-txt">发布</text>
          </view>
        </view>
      </view>
      <scroll-view scroll-x class="tabs no-scrollbar" :show-scrollbar="false">
        <view class="tabs-inner">
          <view v-for="t in tabs" :key="t.key" class="tab" :class="{ on: active === t.key }" @tap="switchTab(t.key)">
            <text class="tab-txt">{{ t.name }}</text>
            <view v-if="active === t.key" class="tab-line" />
          </view>
        </view>
      </scroll-view>
    </view>

    <scroll-view scroll-y class="body no-scrollbar" @scrolltolower="loadMore">
      <view v-if="loading && !posts.length" class="tip">正在加载农友圈…</view>
      <view v-else-if="errMsg && !posts.length" class="tip" @tap="reload">{{ errMsg }}，点击重试</view>
      <view v-else-if="!posts.length" class="tip">
        {{ active === 'follow' ? '还没有关注的人，去推荐里逛逛吧' : '还没有动态，来发第一条吧' }}
      </view>

      <view class="feed">
        <view v-for="p in posts" :key="p.id" class="post card" @tap="go('/pages/post/detail?id=' + p.id)">
          <view class="p-head">
            <view class="avatar av-bg">{{ p.authorAvatar }}</view>
            <view class="flex1">
              <view class="row">
                <text class="p-name">{{ p.authorName }}</text>
                <view class="role">{{ p.authorRole }}</view>
              </view>
              <text class="p-time">{{ fmtTime(p.createdAt) }} · 湖南</text>
            </view>
            <view v-if="!p.isMine" class="follow" :class="{ on: followed.has(p.authorId) }" @tap.stop="onFollow(p)">
              {{ followed.has(p.authorId) ? '已关注' : '关注' }}
            </view>
          </view>

          <text class="p-text">{{ p.content }}</text>

          <view v-if="p.images.length" class="p-media" :class="'n' + Math.min(p.images.length, 3)">
            <view
              v-for="(img, i) in p.images.slice(0, 3)"
              :key="i"
              class="media av-bg"
            >
              <text class="media-emoji">{{ img }}</text>
            </view>
          </view>

          <view v-if="p.productId" class="p-goods" @tap.stop="toProduct(p)">
            <text class="goods-tag">同款在售</text>
            <text class="goods-name">{{ productName(p.productId) }}</text>
            <icon-svg name="right" :size="20" color="#06A96A" />
          </view>

          <view class="p-actions">
            <view class="act" @tap.stop="like(p)">
              <icon-svg name="heart" :size="30" :color="p.isLiked ? '#FF5A4E' : '#9AA7A1'" :stroke="1.8" />
              <text class="act-txt" :class="{ liked: p.isLiked }">{{ p.likeCount }}</text>
            </view>
            <view class="act" @tap.stop="go('/pages/post/detail?id=' + p.id)">
              <icon-svg name="comment" :size="30" color="#9AA7A1" :stroke="1.8" />
              <text class="act-txt">{{ p.commentCount }}</text>
            </view>
            <view class="act">
              <icon-svg name="share" :size="28" color="#9AA7A1" :stroke="1.8" />
              <text class="act-txt">分享</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="posts.length" class="end">
        <text class="end-txt">{{ noMore ? '— 农友们都在地里忙着呢 —' : '上拉加载更多' }}</text>
      </view>
      <view style="height: 170rpx" />
    </scroll-view>

    <tab-bar active="community" />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onPullDownRefresh } from '@dcloudio/uni-app'
import { onShow } from '@dcloudio/uni-app'
import * as api from '@/api/index.js'
import { findProduct } from '@/mock/index.js'
import { toast } from '@/common/utils.js'

const statusBar = ref(20)
try {
  const info = uni.getStorageSync('sys_info')
  if (info && info.statusBarHeight) statusBar.value = info.statusBarHeight
} catch (e) {}

const tabs = [
  { key: 'recommend', name: '推荐' },
  { key: 'follow', name: '关注' }
]
const active = ref('recommend')
const posts = ref([])
const page = ref(0)
const loading = ref(false)
const noMore = ref(false)
const errMsg = ref('')
const followed = ref(new Set())

function productName(id) {
  const p = findProduct(id)
  return p ? p.name : '查看商品'
}

function fmtTime(v) {
  if (!v) return ''
  const t = new Date(v).getTime()
  const d = Date.now() - t
  if (d < 60e3) return '刚刚'
  if (d < 3600e3) return Math.floor(d / 60e3) + ' 分钟前'
  if (d < 86400e3) return Math.floor(d / 3600e3) + ' 小时前'
  if (d < 7 * 86400e3) return Math.floor(d / 86400e3) + ' 天前'
  const dt = new Date(t)
  return dt.getMonth() + 1 + '-' + dt.getDate()
}

async function loadFollowing() {
  try {
    const list = await api.fetchFollowing()
    followed.value = new Set(list.map((x) => x.userId))
  } catch (e) {
    followed.value = new Set()
  }
}

async function load(reset) {
  if (loading.value) return
  if (reset) {
    page.value = 0
    noMore.value = false
    errMsg.value = ''
  }
  if (noMore.value && !reset) return
  loading.value = true
  try {
    const fn = active.value === 'follow' ? api.fetchFollowFeed : api.fetchFeed
    const rows = await fn({ page: page.value, size: 10 })
    posts.value = reset ? rows : posts.value.concat(rows)
    page.value += 1
    if (rows.length < 10) noMore.value = true
  } catch (e) {
    errMsg.value = e && e.message ? e.message : '加载失败'
    if (reset) toast(errMsg.value)
  } finally {
    loading.value = false
  }
}

function reload() {
  load(true)
}

function switchTab(key) {
  if (active.value === key) return
  active.value = key
  posts.value = []
  noMore.value = false
  load(true)
}

async function like(p) {
  try {
    const next = await api.toggleLike(p.id, p.isLiked)
    p.isLiked = next
    p.likeCount += next ? 1 : -1
    if (p.likeCount < 0) p.likeCount = 0
  } catch (e) {
    toast(e.message || '操作失败')
  }
}

async function onFollow(p) {
  if (followed.value.has(p.authorId)) {
    toast('已关注，可在「我的-关注」查看')
    return
  }
  try {
    await api.follow(p.authorId)
    followed.value = new Set([...followed.value, p.authorId])
    toast('已关注 ' + p.authorName)
  } catch (e) {
    toast(e.message || '关注失败')
  }
}

function go(url) {
  uni.navigateTo({ url })
}

function toProduct(p) {
  uni.navigateTo({ url: '/pages/product/detail?id=' + p.productId })
}

function loadMore() {
  if (noMore.value || loading.value) return
  load(false)
}

onShow(() => {
  loadFollowing()
  if (!posts.value.length) load(true)
})

onPullDownRefresh(async () => {
  await load(true)
  await loadFollowing()
  uni.stopPullDownRefresh()
})
</script>

<style scoped>

.cm {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}
.header {
  background: #fff;
  padding: 0 28rpx;
}
.h-row {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.h-title {
  font-size: 38rpx;
  font-weight: 800;
}
.publish {
  display: flex;
  align-items: center;
  gap: 6rpx;
  background: linear-gradient(135deg, #16d488, #0bbd72);
  padding: 10rpx 22rpx;
  border-radius: 40rpx;
  box-shadow: 0 8rpx 20rpx rgba(13, 190, 115, 0.25);
}
.publish-txt {
  color: #fff;
  font-size: 23rpx;
  font-weight: 600;
}
.tabs {
  white-space: nowrap;
}
.tabs-inner {
  display: inline-flex;
  gap: 44rpx;
  padding: 6rpx 4rpx 0;
}
.tab {
  padding-bottom: 16rpx;
  position: relative;
}
.tab-txt {
  font-size: 28rpx;
  color: #7c8a84;
}
.tab.on .tab-txt {
  color: #14201b;
  font-weight: 700;
  font-size: 30rpx;
}
.tab-line {
  position: absolute;
  bottom: 4rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 36rpx;
  height: 6rpx;
  border-radius: 6rpx;
  background: #0fc97a;
}
.body {
  flex: 1;
  height: 0;
}
.feed {
  padding: 22rpx 24rpx;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}
.post {
  padding: 26rpx;
}
.p-head {
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.avatar {
  width: 84rpx;
  height: 84rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
}
.p-name {
  font-size: 28rpx;
  font-weight: 700;
}
.role {
  margin-left: 10rpx;
  font-size: 18rpx;
  color: #06a96a;
  background: #e9faf2;
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
}
.p-time {
  display: block;
  font-size: 21rpx;
  color: #a8b3ae;
  margin-top: 6rpx;
}
.follow {
  padding: 8rpx 22rpx;
  border: 2rpx solid #0fc97a;
  color: #06a96a;
  border-radius: 40rpx;
  font-size: 21rpx;
  font-weight: 600;
}
.p-text {
  display: block;
  margin-top: 20rpx;
  font-size: 27rpx;
  line-height: 1.65;
  color: #263330;
}
.p-media {
  display: flex;
  gap: 10rpx;
  margin-top: 18rpx;
}
.p-media.n1 .media {
  width: 68%;
  height: 300rpx;
}
.p-media.n2 .media {
  width: 48%;
  height: 240rpx;
}
.p-media.n3 .media {
  width: 32%;
  height: 200rpx;
}
.media {
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.media-emoji {
  font-size: 110rpx;
}
.p-actions {
  display: flex;
  align-items: center;
  margin-top: 22rpx;
  padding-top: 18rpx;
  border-top: 2rpx solid #f4f8f5;
  gap: 34rpx;
}
.act {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.act-txt {
  font-size: 22rpx;
  color: #9aa7a1;
}
.act-txt.liked {
  color: #ff5a4e;
}
.buy-txt {
  font-size: 22rpx;
  color: #06a96a;
  font-weight: 600;
}
.end {
  padding: 30rpx 0;
  text-align: center;
}
.end-txt {
  font-size: 21rpx;
  color: #b3bfba;
}

.av-bg {
  background: linear-gradient(150deg, #EAF7EF, #CFEBDC);
}
.tip {
  padding: 80rpx 40rpx;
  text-align: center;
  font-size: 26rpx;
  color: #9aa7a1;
}
.follow.on {
  background: #F1F6F3;
  color: #9aa7a1;
  border-color: #e6ede9;
}
.p-goods {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-top: 14rpx;
  padding: 12rpx 16rpx;
  background: #F4FBF7;
  border-radius: 14rpx;
}
.goods-tag {
  font-size: 20rpx;
  color: #06A96A;
  background: #E2F7EC;
  padding: 4rpx 10rpx;
  border-radius: 8rpx;
}
.goods-name {
  flex: 1;
  font-size: 24rpx;
  color: #16201C;
}
</style>

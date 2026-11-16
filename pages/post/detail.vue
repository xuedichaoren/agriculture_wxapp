<template>
  <view class="page pd">
    <view class="nav">
      <view class="status" :style="{ height: statusBar + 'px' }" />
      <view class="nav-row">
        <view class="nav-btn" @tap="back">
          <icon-svg name="back" :size="36" color="#16201C" :stroke="2" />
        </view>
        <text class="nav-title">动态详情</text>
        <view class="nav-btn" @tap="onMore">
          <icon-svg name="more" :size="32" color="#16201C" />
        </view>
      </view>
    </view>

    <scroll-view scroll-y class="body no-scrollbar">
      <view v-if="loading" class="tip">加载中…</view>
      <view v-else-if="!post" class="tip">这条动态不存在或已被删除</view>

      <view v-else class="main">
        <view class="p-head">
          <view class="avatar">{{ post.authorAvatar }}</view>
          <view class="flex1">
            <view class="row">
              <text class="p-name">{{ post.authorName }}</text>
              <view class="role">{{ post.authorRole }}</view>
            </view>
            <text class="p-time">{{ fmtTime(post.createdAt) }} · 湖南</text>
          </view>
          <view v-if="!post.isMine" class="follow" :class="{ on: followed }" @tap="onFollow">
            {{ followed ? '已关注' : '关注' }}
          </view>
        </view>

        <text class="p-text">{{ post.content }}</text>

        <view v-if="post.images.length" class="p-media">
          <view v-for="(img, i) in post.images" :key="i" class="media">
            <text class="media-emoji">{{ img }}</text>
          </view>
        </view>

        <view v-if="post.productId && product" class="goods" @tap="toProduct">
          <prod-img :src="product.coverUrl" :emoji="product.emoji" :bg="product.bg" :h="120" :size="120" radius="16rpx" />
          <view class="g-info">
            <text class="g-name">{{ product.name }}</text>
            <text class="g-spec">{{ product.spec }}</text>
            <price-tag :price="product.price" :original-price="product.originalPrice" :num-size="32" />
          </view>
          <view class="g-btn">去看看</view>
        </view>

        <view class="p-actions">
          <view class="act" @tap="like">
            <icon-svg name="heart" :size="32" :color="post.isLiked ? '#FF5A4E' : '#9AA7A1'" :stroke="1.8" />
            <text class="act-txt" :class="{ liked: post.isLiked }">{{ post.likeCount }}</text>
          </view>
          <view class="act">
            <icon-svg name="comment" :size="32" color="#9AA7A1" :stroke="1.8" />
            <text class="act-txt">{{ comments.length }}</text>
          </view>
          <view class="act">
            <icon-svg name="share" :size="30" color="#9AA7A1" :stroke="1.8" />
            <text class="act-txt">分享</text>
          </view>
        </view>

        <view class="cmt-block">
          <text class="cmt-title">评论 {{ comments.length }}</text>
          <view v-for="c in comments" :key="c.id" class="cmt">
            <view class="c-avatar">{{ c.avatar }}</view>
            <view class="flex1">
              <view class="row">
                <text class="c-name">{{ c.name }}</text>
                <text class="c-time">{{ fmtTime(c.createdAt) }}</text>
              </view>
              <text class="c-text">{{ c.text }}</text>
            </view>
          </view>
          <view v-if="!comments.length" class="c-empty">还没有评论，来说两句</view>
        </view>

        <view style="height: 160rpx" />
      </view>
    </scroll-view>

    <view class="bar">
      <input
        v-model="draft"
        class="bar-input"
        placeholder="说点什么…"
        placeholder-class="ph"
        confirm-type="send"
        @confirm="send"
      />
      <view class="bar-send" :class="{ off: !draft.trim() }" @tap="send">发送</view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import * as api from '@/api/index.js'
import { findProduct } from '@/mock/index.js'
import { toast } from '@/common/utils.js'

const statusBar = ref(20)
try {
  const info = uni.getStorageSync('sys_info')
  if (info && info.statusBarHeight) statusBar.value = info.statusBarHeight
} catch (e) {}

const postId = ref('')
const post = ref(null)
const comments = ref([])
const loading = ref(true)
const draft = ref('')
const followed = ref(false)

const product = computed(() => (post.value && post.value.productId ? findProduct(post.value.productId) : null))

function fmtTime(v) {
  if (!v) return ''
  const t = new Date(v).getTime()
  const d = Date.now() - t
  if (d < 60e3) return '刚刚'
  if (d < 3600e3) return Math.floor(d / 60e3) + ' 分钟前'
  if (d < 86400e3) return Math.floor(d / 3600e3) + ' 小时前'
  if (d < 7 * 86400e3) return Math.floor(d / 86400e3) + ' 天前'
  const dt = new Date(t)
  return (
    dt.getMonth() + 1 + '-' + dt.getDate() + ' ' +
    String(dt.getHours()).padStart(2, '0') + ':' + String(dt.getMinutes()).padStart(2, '0')
  )
}

async function load() {
  loading.value = true
  try {
    const p = await api.fetchPost(postId.value)
    post.value = p
    if (p) {
      comments.value = await api.fetchComments(p.id)
      if (!p.isMine) followed.value = await api.isFollowing(p.authorId)
    }
  } catch (e) {
    toast(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function back() {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack()
  else uni.reLaunch({ url: '/pages/tabbar/community/community' })
}

async function like() {
  if (!post.value) return
  try {
    const next = await api.toggleLike(post.value.id, post.value.isLiked)
    post.value.isLiked = next
    post.value.likeCount = Math.max(0, post.value.likeCount + (next ? 1 : -1))
  } catch (e) {
    needLogin(e)
  }
}

async function onFollow() {
  if (!post.value) return
  try {
    if (followed.value) {
      await api.unfollow(post.value.authorId)
      followed.value = false
      toast('已取消关注')
    } else {
      await api.follow(post.value.authorId)
      followed.value = true
      toast('已关注')
    }
  } catch (e) {
    needLogin(e)
  }
}

async function send() {
  const text = draft.value.trim()
  if (!text || !post.value) return
  try {
    await api.createComment(post.value.id, text)
    draft.value = ''
    comments.value = await api.fetchComments(post.value.id)
    post.value.commentCount = comments.value.length
    toast('评论成功')
  } catch (e) {
    needLogin(e)
  }
}

function needLogin(e) {
  const msg = (e && e.message) || '操作失败'
  if (/登录/.test(msg) || (e && e.code === 'unauthenticated')) {
    uni.showModal({
      title: '需要登录',
      content: '登录后才能点赞、评论和关注',
      confirmText: '去登录',
      confirmColor: '#0FC97A',
      success: (r) => {
        if (r.confirm) uni.navigateTo({ url: '/pages/login/login' })
      }
    })
    return
  }
  toast(msg)
}

function toProduct() {
  if (!product.value) return
  uni.navigateTo({ url: '/pages/product/detail?id=' + product.value.id })
}

function onMore() {
  if (!post.value || !post.value.isMine) {
    toast('只有自己的动态可以删除')
    return
  }
  uni.showActionSheet({
    itemList: ['删除这条动态'],
    success: async (r) => {
      if (r.tapIndex !== 0) return
      try {
        await api.deletePost(post.value.id)
        toast('已删除')
        setTimeout(back, 400)
      } catch (e) {
        toast(e.message || '删除失败')
      }
    }
  })
}

onLoad((opts) => {
  postId.value = (opts && opts.id) || ''
  if (!postId.value) {
    loading.value = false
    return
  }
  load()
})
</script>

<style scoped>
.pd {
  min-height: 100vh;
  background: #f6f9f7;
  display: flex;
  flex-direction: column;
}
.nav {
  background: #fff;
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 2rpx solid #f2f6f4;
}
.nav-row {
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20rpx;
}
.nav-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.nav-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #16201c;
}
.body {
  flex: 1;
  height: 0;
}
.tip {
  padding: 120rpx 40rpx;
  text-align: center;
  font-size: 26rpx;
  color: #9aa7a1;
}
.main {
  padding: 24rpx 28rpx 0;
}
.p-head {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 22rpx;
}
.avatar {
  width: 76rpx;
  height: 76rpx;
  border-radius: 50%;
  background: linear-gradient(150deg, #eaf7ef, #cfebdc);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  flex-shrink: 0;
}
.row {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.p-name {
  font-size: 28rpx;
  font-weight: 700;
  color: #16201c;
}
.role {
  font-size: 20rpx;
  color: #06a96a;
  background: #e2f7ec;
  padding: 2rpx 10rpx;
  border-radius: 8rpx;
}
.p-time {
  font-size: 22rpx;
  color: #9aa7a1;
  margin-top: 6rpx;
}
.follow {
  padding: 10rpx 26rpx;
  border-radius: 30rpx;
  background: #0fc97a;
  color: #fff;
  font-size: 24rpx;
  font-weight: 600;
}
.follow.on {
  background: #f1f6f3;
  color: #9aa7a1;
}
.p-text {
  display: block;
  margin: 24rpx 0 0;
  padding: 0 4rpx;
  font-size: 30rpx;
  line-height: 1.75;
  color: #16201c;
}
.p-media {
  display: flex;
  gap: 12rpx;
  margin-top: 20rpx;
}
.media {
  flex: 1;
  height: 200rpx;
  border-radius: 18rpx;
  background: linear-gradient(150deg, #eaf7ef, #cfebdc);
  display: flex;
  align-items: center;
  justify-content: center;
}
.media-emoji {
  font-size: 72rpx;
}
.goods {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 24rpx;
  padding: 16rpx;
  background: #fff;
  border-radius: 20rpx;
}
.g-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.g-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #16201c;
}
.g-spec {
  font-size: 22rpx;
  color: #9aa7a1;
}
.g-btn {
  padding: 10rpx 22rpx;
  border-radius: 26rpx;
  background: #0fc97a;
  color: #fff;
  font-size: 24rpx;
}
.p-actions {
  display: flex;
  align-items: center;
  gap: 48rpx;
  padding: 26rpx 8rpx;
  margin-top: 16rpx;
  border-bottom: 2rpx solid #eef3f0;
}
.act {
  display: flex;
  align-items: center;
  gap: 8rpx;
}
.act-txt {
  font-size: 24rpx;
  color: #9aa7a1;
}
.act-txt.liked {
  color: #ff5a4e;
  font-weight: 600;
}
.cmt-block {
  padding: 24rpx 4rpx 0;
}
.cmt-title {
  font-size: 26rpx;
  font-weight: 700;
  color: #16201c;
}
.cmt {
  display: flex;
  gap: 16rpx;
  padding: 24rpx 0;
  border-bottom: 2rpx solid #f2f6f4;
}
.c-avatar {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: #eef6f1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
  flex-shrink: 0;
}
.c-name {
  font-size: 24rpx;
  font-weight: 600;
  color: #16201c;
}
.c-time {
  font-size: 20rpx;
  color: #b3bfba;
  margin-left: 12rpx;
}
.c-text {
  display: block;
  margin-top: 8rpx;
  font-size: 26rpx;
  line-height: 1.6;
  color: #35403b;
}
.c-empty {
  padding: 40rpx 0;
  text-align: center;
  font-size: 24rpx;
  color: #b3bfba;
}
.bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 2rpx solid #f2f6f4;
}
.bar-input {
  flex: 1;
  height: 72rpx;
  background: #f4f8f6;
  border-radius: 36rpx;
  padding: 0 28rpx;
  font-size: 26rpx;
  color: #16201c;
}
.ph {
  color: #b3bfba;
}
.bar-send {
  padding: 16rpx 30rpx;
  border-radius: 36rpx;
  background: #0fc97a;
  color: #fff;
  font-size: 26rpx;
  font-weight: 600;
}
.bar-send.off {
  background: #cfe8db;
}
</style>

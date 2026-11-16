<template>
  <view class="page fl">
    <nav-bar title="我的关注" />

    <view class="tabs">
      <view class="tab" :class="{ on: tab === 'following' }" @tap="switchTab('following')">
        <text class="tab-txt">关注 {{ stats.followingCount }}</text>
      </view>
      <view class="tab" :class="{ on: tab === 'followers' }" @tap="switchTab('followers')">
        <text class="tab-txt">粉丝 {{ stats.followerCount }}</text>
      </view>
    </view>

    <view class="list">
      <view v-if="loading" class="tip">加载中…</view>
      <view v-else-if="!list.length" class="tip">
        {{ tab === 'following' ? '还没有关注任何人，去农友圈逛逛' : '还没有粉丝，多发几条动态吧' }}
      </view>

      <view v-for="u in list" :key="u.userId" class="row card">
        <view class="avatar">{{ u.avatar }}</view>
        <view class="flex1">
          <view class="name-row">
            <text class="name">{{ u.nickname }}</text>
            <view class="role">{{ u.userRole }}</view>
          </view>
          <text class="meta">{{ u.city || '湖南' }}{{ u.bio ? ' · ' + u.bio : '' }}</text>
        </view>
        <view
          v-if="tab === 'following'"
          class="btn ghost"
          @tap.stop="unfollow(u)"
        >已关注</view>
        <view v-else class="btn" @tap.stop="followBack(u)">关注</view>
      </view>
    </view>

    <view style="height: 40rpx" />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import * as api from '@/api/index.js'
import { toast } from '@/common/utils.js'

const tab = ref('following')
const list = ref([])
const loading = ref(true)
const stats = ref({ following: 0, followers: 0 })

async function load() {
  loading.value = true
  try {
    const me = await api.fetchMe()
    if (!me) {
      list.value = []
      loading.value = false
      return
    }
    stats.value = await api.fetchFollowStats(me.userId)
    list.value = tab.value === 'following' ? await api.fetchFollowing() : await api.fetchFollowers()
  } catch (e) {
    toast(e.message || '加载失败')
    list.value = []
  } finally {
    loading.value = false
  }
}

function switchTab(t) {
  if (tab.value === t) return
  tab.value = t
  list.value = []
  load()
}

async function unfollow(u) {
  try {
    await api.unfollow(u.userId)
    list.value = list.value.filter((x) => x.userId !== u.userId)
    stats.value.following = Math.max(0, stats.value.following - 1)
    toast('已取消关注')
  } catch (e) {
    toast(e.message || '操作失败')
  }
}

async function followBack(u) {
  try {
    await api.follow(u)
    toast('已关注')
  } catch (e) {
    toast(e.message || '操作失败')
  }
}

onShow(load)
</script>

<style scoped>
.fl {
  min-height: 100vh;
  background: #f6f9f7;
}
.tabs {
  display: flex;
  background: #fff;
  padding: 0 28rpx;
  border-bottom: 2rpx solid #f2f6f4;
}
.tab {
  flex: 1;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.tab-txt {
  font-size: 28rpx;
  color: #7c8a83;
}
.tab.on .tab-txt {
  color: #16201c;
  font-weight: 700;
}
.tab.on::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 56rpx;
  height: 6rpx;
  border-radius: 3rpx;
  background: #0fc97a;
}
.list {
  padding: 24rpx 28rpx 0;
}
.tip {
  padding: 120rpx 20rpx;
  text-align: center;
  font-size: 26rpx;
  color: #9aa7a1;
}
.row {
  display: flex;
  align-items: center;
  gap: 18rpx;
  background: #fff;
  border-radius: 22rpx;
  padding: 22rpx;
  margin-bottom: 18rpx;
}
.avatar {
  width: 84rpx;
  height: 84rpx;
  border-radius: 50%;
  background: linear-gradient(150deg, #eaf7ef, #cfebdc);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44rpx;
  flex-shrink: 0;
}
.name-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.name {
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
.meta {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #9aa7a1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 380rpx;
}
.btn {
  padding: 12rpx 28rpx;
  border-radius: 30rpx;
  background: #0fc97a;
  color: #fff;
  font-size: 24rpx;
  font-weight: 600;
}
.btn.ghost {
  background: #f1f6f3;
  color: #8b9a93;
}
</style>

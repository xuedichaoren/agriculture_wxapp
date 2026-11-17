<template>
  <view class="page">
    <nav-bar title="编辑资料" bg="#FFFFFF" />

    <scroll-view scroll-y class="body no-scrollbar">
      <!-- 头像 -->
      <view class="hero">
        <view class="hero-bg" />
        <view class="av-wrap" @tap="onAvatar">
          <image v-if="form.avatarUrl" class="av-img" :src="form.avatarUrl" mode="aspectFill" />
          <text v-else class="av-emoji">{{ form.avatar }}</text>
          <view class="av-cam">
            <icon-svg name="camera" :size="30" color="#FFFFFF" :stroke="2" />
          </view>
        </view>
        <text class="av-tip">点击更换头像</text>
        <view class="av-name">{{ form.nickname || '还没有昵称' }}</view>
      </view>

      <!-- 基本信息 -->
      <view class="card">
        <view class="sec-head">
          <text class="sec-title">基本信息</text>
          <text class="sec-sub">昵称和头像会展示在评价与农友圈</text>
        </view>

        <view class="cell">
          <text class="c-label">昵称</text>
          <input
            v-model="form.nickname"
            class="c-input"
            maxlength="12"
            placeholder="给自己取个名字"
            placeholder-class="c-ph"
            :adjust-position="true"
          />
          <text class="c-count">{{ form.nickname.length }}/12</text>
        </view>

        <view class="cell">
          <text class="c-label">性别</text>
          <view class="chips">
            <view
              v-for="g in GENDERS"
              :key="g.key"
              class="chip"
              :class="{ on: form.gender === g.key }"
              @tap="form.gender = g.key"
            >
              {{ g.name }}
            </view>
          </view>
        </view>

        <picker mode="date" :value="form.birthday" :end="today" @change="onBirthday">
          <view class="cell">
            <text class="c-label">生日</text>
            <text class="c-value" :class="{ ph: !form.birthday }">{{ form.birthday || '选择生日' }}</text>
            <view class="c-arrow"><icon-svg name="right" :size="22" color="#C3CCC8" /></view>
          </view>
        </picker>

        <picker mode="region" :value="form.region" @change="onRegion">
          <view class="cell">
            <text class="c-label">所在地</text>
            <view class="c-value ell" :class="{ ph: !regionText }"><text class="c-value-t">{{ regionText || '选择省 / 市 / 区' }}</text></view>
            <view class="c-arrow"><icon-svg name="right" :size="22" color="#C3CCC8" /></view>
          </view>
        </picker>

        <view class="cell cell-top">
          <text class="c-label">介绍</text>
          <textarea
            v-model="form.bio"
            class="c-area"
            maxlength="60"
            placeholder="说说你在种什么、爱吃什么"
            placeholder-class="c-ph"
            :auto-height="true"
            :show-confirm-bar="false"
            :adjust-position="true"
          />
          <text class="c-count count-area">{{ form.bio.length }}/60</text>
        </view>
      </view>

      <!-- 贴纸头像 -->
      <view class="card">
        <view class="sec-head">
          <text class="sec-title">不想露脸就用贴纸</text>
          <text class="sec-sub">挑一个顺眼的，立刻生效</text>
        </view>
        <view class="stickers">
          <view
            v-for="e in STICKERS"
            :key="e"
            class="sticker"
            :class="{ on: !form.avatarUrl && form.avatar === e }"
            @tap="pickSticker(e)"
          >
            {{ e }}
          </view>
        </view>
      </view>

      <!-- 账号 -->
      <view class="card">
        <view class="sec-head">
          <text class="sec-title">账号信息</text>
          <text class="sec-sub">手机号是登录凭证，修改需要短信验证</text>
        </view>
        <view class="cell">
          <text class="c-label">手机号</text>
          <text class="c-value">{{ store.user.phone }}</text>
          <view class="c-link" @tap="onChangePhone">更换</view>
        </view>
        <view class="cell" @tap="go('/pages/address/list')">
          <text class="c-label">收货地址</text>
          <text class="c-value">{{ addressCount }} 个</text>
          <view class="c-arrow"><icon-svg name="right" :size="22" color="#C3CCC8" /></view>
        </view>
        <view class="cell" @tap="onImportWx">
          <text class="c-label">微信资料</text>
          <text class="c-value sub">一键同步微信昵称头像</text>
          <view class="c-arrow"><icon-svg name="right" :size="22" color="#C3CCC8" /></view>
        </view>
      </view>

      <view class="foot-tip">资料仅用于展示与售后联系，不会对外公开手机号</view>
      <view style="height: 200rpx" />
    </scroll-view>

    <!-- 底部保存 -->
    <view class="footer">
      <view class="save-btn" :class="{ dis: !dirty }" @tap="save">
        {{ dirty ? '保存修改' : '没有改动' }}
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { store, updateProfile } from '@/store/index.js'
import { toast } from '@/common/utils.js'

const GENDERS = [
  { key: 'male', name: '男' },
  { key: 'female', name: '女' },
  { key: 'secret', name: '保密' }
]

// 农事相关的贴纸头像，比通用 emoji 更贴合场景
const STICKERS = ['🧑‍🌾', '👩‍🌾', '🌶️', '🍊', '🍑', '🥬', '🌽', '🍄', '🐓', '🌱', '🧺', '🍚']

const today = (() => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return d.getFullYear() + '-' + m + '-' + day
})()

const form = reactive({
  nickname: '',
  avatar: '🧑',
  avatarUrl: '',
  gender: 'secret',
  birthday: '',
  region: [],
  bio: ''
})

// 保存一份原值，用来判断有没有真的改过
let origin = {}

onLoad(() => {
  const u = store.user || {}
  form.nickname = u.nickname || ''
  form.avatar = u.avatar || '🧑'
  form.avatarUrl = u.avatarUrl || ''
  form.gender = u.gender || 'secret'
  form.birthday = u.birthday || ''
  form.region = Array.isArray(u.region) ? u.region.slice() : []
  form.bio = u.bio || ''
  origin = JSON.stringify(form)
})

const dirty = computed(() => JSON.stringify(form) !== origin)

const regionText = computed(() => (form.region && form.region.length ? form.region.join(' ') : ''))

const addressCount = computed(() => (store.addresses || []).length)

function onBirthday(e) {
  form.birthday = e.detail.value
}

function onRegion(e) {
  form.region = e.detail.value || []
}

function pickSticker(e) {
  form.avatar = e
  form.avatarUrl = ''
}

function onAvatar() {
  const hasImg = !!form.avatarUrl
  const items = hasImg ? ['拍照', '从相册选择', '用回贴纸头像'] : ['拍照', '从相册选择']
  uni.showActionSheet({
    itemList: items,
    success: (res) => {
      if (hasImg && res.tapIndex === 2) {
        form.avatarUrl = ''
        return
      }
      const sourceType = res.tapIndex === 0 ? ['camera'] : ['album']
      chooseAndSave(sourceType)
    }
  })
}

function chooseAndSave(sourceType) {
  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType,
    success: (res) => {
      const temp = (res.tempFilePaths || [])[0]
      if (!temp) return
      // 临时路径重启就失效，尽量存进本地文件系统
      try {
        uni.getFileSystemManager().saveFile({
          tempFilePath: temp,
          success: (r) => {
            form.avatarUrl = r.savedFilePath || temp
          },
          fail: () => {
            form.avatarUrl = temp
          }
        })
      } catch (e) {
        form.avatarUrl = temp
      }
    }
  })
}

function onChangePhone() {
  toast('修改手机号需要短信验证（演示版暂未开通）')
}

function onImportWx() {
  // 小程序里 wx.getUserProfile 已收紧，这里只做提示，不假装能拿到
  toast('微信头像昵称授权已下线，请手动上传')
}

function go(url) {
  uni.navigateTo({ url })
}

function save() {
  if (!dirty.value) return
  const nick = (form.nickname || '').trim()
  if (!nick) return toast('昵称不能为空')
  if (nick.length > 12) return toast('昵称最多 12 个字')
  updateProfile({
    nickname: nick,
    avatar: form.avatar,
    avatarUrl: form.avatarUrl,
    gender: form.gender,
    birthday: form.birthday,
    region: form.region.slice(),
    bio: (form.bio || '').trim()
  })
  origin = JSON.stringify(form)
  toast('已保存')
  setTimeout(() => {
    const pages = getCurrentPages()
    if (pages.length > 1) uni.navigateBack()
    else uni.reLaunch({ url: '/pages/tabbar/profile/profile' })
  }, 500)
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f4f8f5;
  display: flex;
  flex-direction: column;
}
.body {
  flex: 1;
  overflow: hidden;
}

/* ---------- 头像区 ---------- */
.hero {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8rpx 0 34rpx;
  background: #fff;
  overflow: hidden;
}
.hero-bg {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 190rpx;
  background: linear-gradient(160deg, #e9faf2 0%, #f7fcfa 65%, #ffffff 100%);
}
.av-wrap {
  position: relative;
  z-index: 2;
  width: 168rpx;
  height: 168rpx;
  border-radius: 50%;
  background: #ffffff;
  border: 6rpx solid #ffffff;
  box-shadow: 0 12rpx 34rpx rgba(10, 90, 60, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
  margin-top: 10rpx;
}
.av-img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
}
.av-emoji {
  font-size: 84rpx;
  line-height: 1;
}
.av-cam {
  position: absolute;
  right: -4rpx;
  bottom: -2rpx;
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #16d488 0%, #0bbd72 100%);
  border: 4rpx solid #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4rpx 12rpx rgba(11, 189, 114, 0.35);
}
.av-tip {
  position: relative;
  z-index: 2;
  font-size: 22rpx;
  color: #9aa7a1;
  margin-top: 12rpx;
}
.av-name {
  position: relative;
  z-index: 2;
  font-size: 30rpx;
  font-weight: 600;
  color: #16201c;
  margin-top: 8rpx;
  max-width: 480rpx;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* ---------- 卡片 ---------- */
.card {
  margin: 20rpx 24rpx 0;
  padding: 8rpx 26rpx 4rpx;
  background: #fff;
  border-radius: 26rpx;
  box-shadow: 0 6rpx 22rpx rgba(16, 60, 44, 0.05);
}
.sec-head {
  padding: 22rpx 0 12rpx;
  border-bottom: 1rpx solid #f4f8f5;
}
.sec-title {
  display: block;
  font-size: 27rpx;
  font-weight: 600;
  color: #16201c;
}
.sec-sub {
  display: block;
  font-size: 21rpx;
  color: #9aa7a1;
  margin-top: 6rpx;
  line-height: 1.5;
}

/* ---------- 行 ---------- */
.cell {
  display: flex;
  align-items: center;
  min-height: 104rpx;
  border-bottom: 1rpx solid #f4f8f5;
}
.cell:last-child {
  border-bottom: none;
}
.cell-top {
  align-items: flex-start;
  padding: 26rpx 0;
  position: relative;
}
.c-label {
  width: 130rpx;
  flex-shrink: 0;
  font-size: 27rpx;
  color: #3d4a45;
}
.cell-top .c-label {
  padding-top: 4rpx;
}
.c-input {
  flex: 1;
  font-size: 27rpx;
  color: #16201c;
  text-align: right;
  padding-right: 20rpx;
}
.c-ph {
  color: #b3bfba;
  font-size: 26rpx;
}
.c-value {
  flex: 1;
  min-width: 0;
  font-size: 27rpx;
  color: #16201c;
  text-align: right;
  padding-right: 18rpx;
}
.c-value-t {
  font-size: 27rpx;
  color: inherit;
}
.c-value.ph {
  color: #b3bfba;
}
.c-value.sub {
  color: #7c8a84;
  font-size: 24rpx;
}
.ell {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.c-count {
  width: 78rpx;
  text-align: right;
  font-size: 21rpx;
  color: #b3bfba;
  flex-shrink: 0;
}
.count-area {
  position: absolute;
  right: 0;
  bottom: 10rpx;
}
.c-arrow {
  flex: 0 0 22rpx;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.c-link {
  font-size: 24rpx;
  color: #06a96a;
  padding: 8rpx 0 8rpx 16rpx;
}

/* ---------- 性别 chips ---------- */
.chips {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  gap: 14rpx;
}
.chip {
  min-width: 104rpx;
  height: 56rpx;
  padding: 0 22rpx;
  border-radius: 28rpx;
  background: #f4f8f5;
  border: 1rpx solid #edf1ef;
  font-size: 24rpx;
  color: #7c8a84;
  display: flex;
  align-items: center;
  justify-content: center;
}
.chip.on {
  background: #e9faf2;
  border-color: #0fc97a;
  color: #06a96a;
  font-weight: 600;
}

/* ---------- 介绍 ---------- */
.c-area {
  flex: 1;
  min-height: 96rpx;
  font-size: 27rpx;
  color: #16201c;
  line-height: 1.6;
  padding-right: 70rpx;
  width: auto;
}

/* ---------- 贴纸 ---------- */
.stickers {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  padding: 22rpx 0 24rpx;
}
.sticker {
  flex: 0 0 calc((100% - 80rpx) / 6);
  height: 96rpx;
  border-radius: 22rpx;
  background: #f7faf8;
  border: 2rpx solid #f1f5f3;
  font-size: 52rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sticker.on {
  background: #e9faf2;
  border-color: #0fc97a;
  box-shadow: 0 4rpx 12rpx rgba(15, 201, 122, 0.18);
}

.foot-tip {
  margin: 22rpx 40rpx 0;
  font-size: 21rpx;
  color: #b3bfba;
  line-height: 1.7;
  text-align: center;
}

/* ---------- 底部保存 ---------- */
.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 18rpx 32rpx calc(18rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  border-top: 1rpx solid #edf1ef;
  backdrop-filter: blur(10px);
}
.save-btn {
  height: 92rpx;
  border-radius: 46rpx;
  background: linear-gradient(135deg, #16d488 0%, #0bbd72 100%);
  color: #fff;
  font-size: 30rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 24rpx rgba(11, 189, 114, 0.28);
}
.save-btn:active {
  opacity: 0.9;
}
.save-btn.dis {
  background: #e6ece9;
  color: #9aa7a1;
  box-shadow: none;
}
</style>

<template>
  <view class="page lg">
    <!-- 顶部品牌区 -->
    <view class="hero">
      <view class="deco d1" />
      <view class="deco d2" />
      <view class="brand">
        <view class="logo">🌾</view>
        <text class="app">湘农汇</text>
        <text class="slogan">湖南好物 · 从山间到餐桌</text>
      </view>

      <view class="roles">
        <view v-for="r in ROLE_LIST" :key="r.key" class="role-chip">
          <text class="rc-emoji">{{ r.emoji }}</text>
          <text class="rc-name">{{ r.name }}</text>
        </view>
      </view>
    </view>

    <!-- 登录面板 -->
    <view class="panel">
      <ui-btn type="primary" size="lg" block :loading="loading" text="微信一键登录" @click="wechatLogin" />
      <text class="tip">{{ tip }}</text>

      <view class="agree" @tap="agreed = !agreed">
        <view class="box" :class="{ on: agreed }">
          <icon-svg v-if="agreed" name="check" :size="20" color="#FFFFFF" :stroke="3" />
        </view>
        <text class="agree-txt">已阅读并同意《用户协议》和《隐私政策》</text>
      </view>

      <view class="skip" @tap="browse">先随便逛逛</view>
    </view>

    <!-- 说明 -->
    <view class="notes">
      <view class="note-row">
        <text class="n-ico">📱</text>
        <text class="n-txt">手机号登录暂未开放，登录统一走微信授权</text>
      </view>
      <view class="note-row">
        <text class="n-ico">🔐</text>
        <text class="n-txt">登录后可开通「买家 / 农户 / 专家」三种身份，随时切换</text>
      </view>
      <view class="note-row">
        <text class="n-ico">🧪</text>
        <text class="n-txt">当前为演示环境，数据只保存在这台设备</text>
      </view>
    </view>

    <view class="foot">
      <text class="foot-txt">助农 · 产地直采 · 湖南特产</text>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { CLOUD_OK, IS_LOCAL_MODE } from '@/common/cloud.js'
import { ROLE_LIST } from '@/common/roles.js'
import * as api from '@/api/index.js'
import { setLoginSession } from '@/store/index.js'
import { afterLoginUrl } from '@/store/role.js'
import { toast } from '@/common/utils.js'

const agreed = ref(false)
const loading = ref(false)
const tip = ref('使用微信授权登录，一键同步头像昵称')

onLoad(() => {
  if (IS_LOCAL_MODE) {
    tip.value = '小程序端未接后端：点一下创建本机账号，数据只存在这台设备'
  } else if (!CLOUD_OK) {
    tip.value = '当前环境不支持微信登录，请在微信中打开'
  }
})

/** 取 wx.login 的 code —— 预留给后端换 openid */
function wechatCode() {
  return new Promise((resolve) => {
    try {
      uni.login({
        provider: 'weixin',
        success: (r) => resolve((r && r.code) || ''),
        fail: () => resolve('')
      })
    } catch (e) {
      resolve('')
    }
  })
}

async function wechatLogin() {
  if (!agreed.value) return toast('请先同意用户协议')
  if (loading.value) return
  loading.value = true
  try {
    if (IS_LOCAL_MODE) {
      // 小程序端没有后端，code 换不了 openid，先用本机标识建号。
      // 接入后端后这一段整体替换：把 code 传给服务端，换回 session 即可。
      const code = await wechatCode()
      const session = await api.signInLocally({ nickname: '微信用户', loginCode: code })
      const u = (session && session.user) || (session && session.data && session.data.user) || {}
      setLoginSession({ nickname: u.name || '微信用户', avatar: u.avatarUrl || '' })
      await finish()
      return
    }
    if (!CLOUD_OK) throw new Error('请在微信或浏览器中打开湘农汇')
    // H5 / 微信内网页：走 OAuth 跳转，回调在 App.vue 里统一处理
    const url = await api.signInWithWechat(location.origin)
    location.assign(url)
  } catch (e) {
    toast((e && e.message) || '微信登录失败')
  } finally {
    loading.value = false
  }
}

async function finish() {
  try {
    await api.ensureProfile()
  } catch (e) {}
  toast('登录成功')
  const url = afterLoginUrl()
  setTimeout(() => uni.reLaunch({ url }), 320)
}

function browse() {
  uni.reLaunch({ url: '/pages/tabbar/home/home' })
}
</script>

<style scoped>
.lg {
  min-height: 100vh;
  background: #f4f8f5;
  display: flex;
  flex-direction: column;
}

/* 顶部 */
.hero {
  position: relative;
  padding: 150rpx 40rpx 46rpx;
  background: linear-gradient(160deg, #14d183 0%, #0bad6d 68%, #089a60 100%);
  border-radius: 0 0 52rpx 52rpx;
  overflow: hidden;
}
.deco {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
}
.d1 {
  width: 420rpx;
  height: 420rpx;
  top: -180rpx;
  right: -140rpx;
}
.d2 {
  width: 260rpx;
  height: 260rpx;
  bottom: -120rpx;
  left: -80rpx;
  opacity: 0.7;
}
.brand {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
}
.logo {
  width: 128rpx;
  height: 128rpx;
  border-radius: 38rpx;
  background: rgba(255, 255, 255, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 66rpx;
}
.app {
  font-size: 46rpx;
  font-weight: 800;
  color: #fff;
  letter-spacing: 5rpx;
}
.slogan {
  font-size: 23rpx;
  color: rgba(255, 255, 255, 0.82);
}
.roles {
  position: relative;
  display: flex;
  justify-content: center;
  gap: 14rpx;
  margin-top: 34rpx;
}
.role-chip {
  display: flex;
  align-items: center;
  gap: 8rpx;
  background: rgba(255, 255, 255, 0.16);
  border-radius: 40rpx;
  padding: 10rpx 20rpx;
}
.rc-emoji {
  font-size: 26rpx;
}
.rc-name {
  font-size: 21rpx;
  color: #fff;
  font-weight: 600;
}

/* 面板 */
.panel {
  margin: -30rpx 36rpx 0;
  background: #fff;
  border-radius: 32rpx;
  padding: 40rpx 32rpx 30rpx;
  box-shadow: 0 20rpx 50rpx rgba(10, 80, 55, 0.12);
  position: relative;
  z-index: 2;
}
.tip {
  display: block;
  margin-top: 16rpx;
  text-align: center;
  font-size: 20rpx;
  color: #9aa7a1;
  line-height: 1.6;
}
.agree {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  margin-top: 30rpx;
}
.box {
  width: 32rpx;
  height: 32rpx;
  border-radius: 8rpx;
  border: 2rpx solid #cfdad5;
  display: flex;
  align-items: center;
  justify-content: center;
}
.box.on {
  background: #0fc97a;
  border-color: #0fc97a;
}
.agree-txt {
  font-size: 21rpx;
  color: #8b9a93;
}
.skip {
  margin-top: 26rpx;
  text-align: center;
  font-size: 24rpx;
  color: #7c8a84;
  padding: 12rpx 0;
}

/* 说明 */
.notes {
  margin: 34rpx 40rpx 0;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}
.note-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.n-ico {
  font-size: 24rpx;
}
.n-txt {
  font-size: 21rpx;
  color: #9aa7a1;
  flex: 1;
  line-height: 1.5;
}
.foot {
  margin-top: auto;
  padding: 44rpx 0 54rpx;
  text-align: center;
}
.foot-txt {
  font-size: 21rpx;
  color: #c3ccc8;
}
</style>

<template>
  <view class="page lg">
    <view class="head">
      <view class="logo">🌾</view>
      <text class="app">湘农汇</text>
      <text class="slogan">湖南好物 · 从山间到餐桌</text>
    </view>

    <view class="panel">
      <view class="wx-btn" @tap="wechatLogin">
        <text class="wx-ico">💬</text>
        <text class="wx-txt">微信一键登录</text>
      </view>
      <text class="wx-tip">{{ wxTip }}</text>

      <view class="divider">
        <view class="line" />
        <text class="div-txt">或使用手机号</text>
        <view class="line" />
      </view>

      <view class="field">
        <text class="cc">+86</text>
        <input
          v-model="phone"
          class="input"
          type="number"
          maxlength="11"
          placeholder="请输入手机号"
          placeholder-class="ph"
          @input="phoneErr = ''"
        />
      </view>
      <text v-if="phoneErr" class="err">{{ phoneErr }}</text>

      <view class="field">
        <input
          v-model="code"
          class="input"
          type="number"
          maxlength="6"
          placeholder="6 位验证码"
          placeholder-class="ph"
        />
        <view class="code-btn" :class="{ off: counting || sending }" @tap="sendCode">
          {{ counting ? countdown + 's' : sending ? '发送中' : '获取验证码' }}
        </view>
      </view>

      <view v-if="demoCode" class="demo-tip">
        <text class="demo-txt">演示模式：验证码 {{ demoCode }}（不会真实发短信）</text>
      </view>

      <view class="agree" @tap="agreed = !agreed">
        <view class="box" :class="{ on: agreed }">
          <icon-svg v-if="agreed" name="check" :size="20" color="#FFFFFF" :stroke="3" />
        </view>
        <text class="agree-txt">已阅读并同意《用户协议》和《隐私政策》</text>
      </view>

      <view class="submit" :class="{ off: !canSubmit }" @tap="phoneLogin">
        {{ loading ? '登录中…' : '登录 / 注册' }}
      </view>

      <text class="note">未注册的手机号将自动创建湘农汇账号</text>
    </view>

    <view class="foot">
      <text class="foot-txt">助农 · 产地直采 · 湖南特产</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { CLOUD_OK, IS_LOCAL_MODE } from '@/common/cloud.js'
import * as api from '@/api/index.js'
import { toast } from '@/common/utils.js'

const phone = ref('')
const code = ref('')
const agreed = ref(false)
const loading = ref(false)
const sending = ref(false)
const counting = ref(false)
const countdown = ref(60)
const phoneErr = ref('')
const wxTip = ref('使用微信授权登录，一键同步头像昵称')
// 本地演示模式下的验证码（不发送短信，直接显示在页面上）
const demoCode = ref('')

let pending = null
let timer = null

const canSubmit = computed(() => /^1\d{10}$/.test(phone.value) && code.value.length >= 6 && agreed.value)

onLoad(() => {
  if (IS_LOCAL_MODE) {
    wxTip.value = '小程序端未接后端：点一下会直接创建本机账号，数据只存在这台设备'
  } else if (!CLOUD_OK) {
    wxTip.value = '当前环境不支持微信登录，请使用浏览器或微信打开'
  }
})

async function wechatLogin() {
  if (!agreed.value) return toast('请先同意用户协议')
  if (loading.value) return
  loading.value = true
  try {
    if (IS_LOCAL_MODE) {
      // 小程序端没有后端：wx.login 的 code 无法在本地换取 openid，
      // 所以身份由本机标识生成，只在这台设备上有效。
      try {
        await new Promise((resolve, reject) => {
          uni.login({ provider: 'weixin', success: resolve, fail: reject })
        })
      } catch (e) {
        // 非微信环境也允许继续，本地登录不依赖它
      }
      await api.signInLocally({})
      await afterLogin()
      return
    }
    if (!CLOUD_OK) throw new Error('请在微信或浏览器中打开湘农汇')
    const url = await api.signInWithWechat(location.origin)
    location.assign(url)
  } catch (e) {
    toast(e.message || '微信登录失败')
  } finally {
    loading.value = false
  }
}

async function sendCode() {
  if (counting.value || sending.value) return
  if (!/^1\d{10}$/.test(phone.value)) {
    phoneErr.value = '请输入正确的 11 位手机号'
    return
  }
  sending.value = true
  try {
    if (IS_LOCAL_MODE) {
      // 本地演示：不发短信，直接把验证码显示出来
      demoCode.value = String(Math.floor(100000 + Math.random() * 900000))
      pending = { phone: phone.value, verificationId: 'local_' + phone.value, isExistingUser: false }
      toast('演示验证码：' + demoCode.value)
      counting.value = true
      countdown.value = 60
      timer = setInterval(() => {
        countdown.value -= 1
        if (countdown.value <= 0) {
          clearInterval(timer)
          counting.value = false
        }
      }, 1000)
      return
    }
    const data = await api.sendSmsCode(phone.value)
    pending = { phone: phone.value, verificationId: data.verificationId, isExistingUser: data.isExistingUser }
    toast('验证码已发送')
    counting.value = true
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value -= 1
      if (countdown.value <= 0) {
        clearInterval(timer)
        counting.value = false
      }
    }, 1000)
  } catch (e) {
    toast(e.message || '验证码发送失败')
  } finally {
    sending.value = false
  }
}

async function phoneLogin() {
  if (!canSubmit.value || loading.value) return
  if (!pending || pending.phone !== phone.value) {
    toast('请先获取当前手机号的验证码')
    return
  }
  if (IS_LOCAL_MODE && code.value !== demoCode.value) {
    toast('请输入上方显示的演示验证码')
    return
  }
  loading.value = true
  try {
    await api.verifySmsCode({
      phone: pending.phone,
      verificationId: pending.verificationId,
      isExistingUser: pending.isExistingUser,
      code: code.value
    })
    pending = null
    await afterLogin()
  } catch (e) {
    toast(e.message || '登录失败')
  } finally {
    loading.value = false
  }
}

async function afterLogin() {
  try {
    await api.ensureProfile()
  } catch (e) {}
  toast('登录成功')
  setTimeout(() => {
    uni.reLaunch({ url: '/pages/tabbar/home/home' })
  }, 400)
}
</script>

<style scoped>
.lg {
  min-height: 100vh;
  background: linear-gradient(180deg, #0fc97a 0%, #0aa868 42%, #f6f9f7 42%, #f6f9f7 100%);
  display: flex;
  flex-direction: column;
}
.head {
  padding: 150rpx 0 90rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14rpx;
}
.logo {
  width: 130rpx;
  height: 130rpx;
  border-radius: 36rpx;
  background: rgba(255, 255, 255, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 68rpx;
}
.app {
  font-size: 46rpx;
  font-weight: 800;
  color: #fff;
  letter-spacing: 4rpx;
}
.slogan {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.82);
}
.panel {
  margin: 0 40rpx;
  background: #fff;
  border-radius: 30rpx;
  padding: 40rpx 32rpx 34rpx;
  box-shadow: 0 20rpx 50rpx rgba(10, 80, 55, 0.12);
}
.wx-btn {
  height: 92rpx;
  border-radius: 46rpx;
  background: #22c55e;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
}
.wx-ico {
  font-size: 34rpx;
}
.wx-txt {
  color: #fff;
  font-size: 30rpx;
  font-weight: 700;
}
.wx-tip {
  display: block;
  margin-top: 14rpx;
  text-align: center;
  font-size: 21rpx;
  color: #9aa7a1;
}
.divider {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin: 34rpx 0 26rpx;
}
.line {
  flex: 1;
  height: 2rpx;
  background: #eef3f0;
}
.div-txt {
  font-size: 21rpx;
  color: #b3bfba;
}
.field {
  display: flex;
  align-items: center;
  gap: 14rpx;
  height: 96rpx;
  padding: 0 26rpx;
  background: #f6f9f7;
  border-radius: 18rpx;
  margin-bottom: 18rpx;
}
.cc {
  font-size: 27rpx;
  color: #16201c;
  font-weight: 600;
}
.input {
  flex: 1;
  font-size: 28rpx;
  color: #16201c;
}
.ph {
  color: #b3bfba;
}
.err {
  display: block;
  margin: -8rpx 0 14rpx 6rpx;
  font-size: 21rpx;
  color: #ef4444;
}
.code-btn {
  font-size: 24rpx;
  color: #0fc97a;
  font-weight: 600;
  padding-left: 18rpx;
  border-left: 2rpx solid #e2ebe6;
}
.code-btn.off {
  color: #b3bfba;
}
.agree {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin: 8rpx 0 26rpx;
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
.submit {
  height: 92rpx;
  border-radius: 46rpx;
  background: #0fc97a;
  color: #fff;
  font-size: 30rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 24rpx rgba(15, 201, 122, 0.26);
}
.submit.off {
  background: #cfe8db;
  box-shadow: none;
}
.note {
  display: block;
  margin-top: 20rpx;
  text-align: center;
  font-size: 20rpx;
  color: #b3bfba;
}
.foot {
  margin-top: auto;
  padding: 50rpx 0 60rpx;
  text-align: center;
}
.foot-txt {
  font-size: 21rpx;
  color: #b3bfba;
}
.demo-tip {
  margin: -6rpx 0 20rpx;
  padding: 16rpx 22rpx;
  background: #fff8e6;
  border-radius: 14rpx;
}
.demo-txt {
  font-size: 22rpx;
  color: #b07a00;
}
</style>

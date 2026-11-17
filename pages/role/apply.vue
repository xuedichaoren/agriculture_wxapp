<template>
  <view class="page ap">
    <nav-bar :title="cfg.title" bg="#F4F8F5" />

    <view class="body">
      <!-- 已开通 / 审核中 -->
      <view v-if="status !== 'none'" class="state card">
        <view class="st-ico" :style="{ background: stTone.soft }">
          <text class="st-emoji">{{ status === 'approved' ? '✅' : status === 'pending' ? '⏳' : '⚠️' }}</text>
        </view>
        <text class="st-title">{{ stText }}</text>
        <text class="st-sub">{{ stSub }}</text>
        <ui-btn
          v-if="status === 'approved'"
          type="primary"
          block
          :text="'进入' + role.name + '首页'"
          @click="enter"
        />
        <ui-btn
          v-else-if="status === 'pending'"
          type="line"
          block
          text="演示：模拟审核通过"
          @click="simulate"
        />
        <ui-btn v-else type="ghost" block text="重新提交资料" @click="again" />
      </view>

      <!-- 申请表单 -->
      <view v-else>
        <view class="head">
          <view class="h-emoji" :style="{ background: role.soft }">{{ role.emoji }}</view>
          <view class="flex1">
            <text class="h-title">{{ cfg.title }}</text>
            <text class="h-sub">{{ cfg.tip }}</text>
          </view>
        </view>

        <view class="card form">
          <view v-for="f in cfg.fields" :key="f.key" class="field">
            <view class="lb-row">
              <text class="lb">{{ f.label }}</text>
              <text v-if="f.required" class="req">必填</text>
            </view>
            <textarea
              v-if="f.type === 'textarea'"
              v-model="form[f.key]"
              class="ta"
              :placeholder="f.ph"
              placeholder-class="ph"
              :maxlength="200"
              auto-height
            />
            <input
              v-else
              v-model="form[f.key]"
              class="in"
              :type="f.type === 'number' ? 'number' : f.type === 'digit' ? 'digit' : 'text'"
              :placeholder="f.ph"
              placeholder-class="ph"
            />
          </view>

          <view class="agree" @tap="agreed = !agreed">
            <view class="box" :class="{ on: agreed }">
              <icon-svg v-if="agreed" name="check" :size="20" color="#FFFFFF" :stroke="3" />
            </view>
            <text class="agree-txt">我承诺所填资料真实，同意平台核验</text>
          </view>
        </view>

        <view class="why card">
          <text class="why-t">为什么需要审核</text>
          <text class="why-s">农户上架的商品会直接卖给买家，专家给出的用药建议会影响一整季收成，所以两头都要核验身份。资料只用于审核，不会展示在农友圈。</text>
        </view>

        <ui-btn type="primary" size="lg" block :loading="submitting" text="提交申请" @click="submit" />
        <text class="foot-note">提交后 1 个工作日内出结果，可在「我的 → 身份」查看</text>
      </view>
    </view>

    <view class="safe-bottom" />
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { APPLY_FORMS, APP_STATUS, roleOf } from '@/common/roles.js'
import { activateRole, appOf, appStatusOf, applyRole, clearApplication, reviewRole } from '@/store/role.js'
import { toast } from '@/common/utils.js'

const roleKey = ref('farmer')
const agreed = ref(false)
const submitting = ref(false)
const tick = ref(0)

const role = computed(() => roleOf(roleKey.value) || roleOf('farmer'))
const cfg = computed(() => APPLY_FORMS[roleKey.value] || APPLY_FORMS.farmer)
const status = computed(() => {
  // tick 只是为了让审核状态在模拟后重新计算
  void tick.value
  return appStatusOf(roleKey.value)
})
const stTone = computed(() => {
  const k = APP_STATUS[status.value] || APP_STATUS.none
  const map = {
    brand: { soft: '#E9FAF2' },
    warn: { soft: '#FFF8E6' },
    danger: { soft: '#FFECEA' },
    gray: { soft: '#F3F6F4' }
  }
  return map[k.tone] || map.gray
})
const stText = computed(() => (APP_STATUS[status.value] || APP_STATUS.none).text)
const stSub = computed(() => {
  if (status.value === 'approved') return '身份已开通，可以开始使用了'
  if (status.value === 'pending') return '资料已提交，等待平台审核'
  return '上次申请未通过，可以补充资料后重新提交'
})

const form = reactive({})
function resetForm() {
  for (const k of Object.keys(form)) delete form[k]
  for (const f of cfg.value.fields) form[f.key] = ''
  const old = appOf(roleKey.value)
  if (old && old.form) Object.assign(form, old.form)
}

onLoad((q) => {
  if (q && q.role) roleKey.value = q.role
  resetForm()
})

function again() {
  clearApplication(roleKey.value)
  resetForm()
  tick.value++
  uni.showToast({ title: '可以修改后重新提交', icon: 'none' })
}

function submit() {
  if (submitting.value) return
  for (const f of cfg.value.fields) {
    if (f.required && !String(form[f.key] || '').trim()) {
      return toast('请填写' + f.label)
    }
  }
  if (!agreed.value) return toast('请先勾选承诺')
  submitting.value = true
  const key = roleKey.value
  applyRole(key, JSON.parse(JSON.stringify(form)))
  setTimeout(() => {
    submitting.value = false
    tick.value++
    toast('已提交，等待审核')
  }, 400)
}

function simulate() {
  uni.showModal({
    title: '模拟审核',
    content: '演示用：直接标记为通过并进入身份',
    success: (res) => {
      if (!res.confirm) return
      reviewRole(roleKey.value, true)
      activateRole(roleKey.value)
      tick.value++
      enter()
    }
  })
}

function enter() {
  uni.reLaunch({ url: role.value.home })
}
</script>

<style scoped>
.ap {
  min-height: 100vh;
}
.body {
  padding: 8rpx 28rpx 40rpx;
}
.head {
  display: flex;
  gap: 20rpx;
  padding: 16rpx 4rpx 26rpx;
}
.h-emoji {
  width: 96rpx;
  height: 96rpx;
  border-radius: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  flex-shrink: 0;
}
.h-title {
  font-size: 36rpx;
  font-weight: 800;
  color: #16201c;
}
.h-sub {
  display: block;
  margin-top: 8rpx;
  font-size: 21rpx;
  color: #7c8a84;
  line-height: 1.55;
}
.form {
  padding: 10rpx 24rpx 24rpx;
}
.field {
  padding: 18rpx 0 8rpx;
  border-bottom: 2rpx solid #f4f8f5;
}
.field:last-of-type {
  border-bottom: none;
}
.lb-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.lb {
  font-size: 24rpx;
  color: #3d4a45;
  font-weight: 600;
}
.req {
  font-size: 17rpx;
  color: #ff8a3d;
  background: #fff4e4;
  border-radius: 6rpx;
  padding: 2rpx 8rpx;
}
.in {
  height: 76rpx;
  font-size: 27rpx;
  color: #16201c;
}
.ta {
  min-height: 120rpx;
  font-size: 27rpx;
  color: #16201c;
  padding: 12rpx 0;
  width: 100%;
  line-height: 1.6;
}
.ph {
  color: #c3ccc8;
  font-size: 25rpx;
}
.agree {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 22rpx;
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
  font-size: 20rpx;
  color: #8b9a93;
}
.why {
  padding: 22rpx 24rpx;
  margin: 20rpx 0 26rpx;
  background: rgba(255, 255, 255, 0.7);
}
.why-t {
  font-size: 23rpx;
  font-weight: 700;
  color: #3d4a45;
}
.why-s {
  display: block;
  margin-top: 8rpx;
  font-size: 21rpx;
  color: #9aa7a1;
  line-height: 1.6;
}
.foot-note {
  display: block;
  margin-top: 18rpx;
  text-align: center;
  font-size: 20rpx;
  color: #b3bfba;
}
.state {
  margin-top: 60rpx;
  padding: 50rpx 36rpx 36rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14rpx;
}
.st-ico {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8rpx;
}
.st-emoji {
  font-size: 64rpx;
}
.st-title {
  font-size: 34rpx;
  font-weight: 800;
  color: #16201c;
}
.st-sub {
  font-size: 22rpx;
  color: #9aa7a1;
  text-align: center;
  margin-bottom: 20rpx;
}
</style>

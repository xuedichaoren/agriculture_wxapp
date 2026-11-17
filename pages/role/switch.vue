<template>
  <view class="page sw">
    <nav-bar title="选择身份" :back="!first" bg="#F4F8F5" />

    <view class="body">
      <view class="intro">
        <text class="h1">{{ first ? '你打算怎么用湘农汇？' : '切换身份' }}</text>
        <text class="h2">
          {{ first ? '选好之后随时能在「我的」里切回来，一个账号可以开通多个身份' : '同一个账号，不同身份看到的功能不一样' }}
        </text>
      </view>

      <view
        v-for="r in ROLE_LIST"
        :key="r.key"
        class="role"
        :class="[{ on: r.key === roleStore.current }, `k-${r.key}`]"
        :style="r.key === roleStore.current ? { borderColor: r.color } : {}"
        @tap="pick(r)"
      >
        <view class="r-top">
          <ui-image :name="r.img" :h="112" radius="28rpx" class="r-img" />
          <view class="flex1">
            <view class="r-name-row">
              <text class="r-name">{{ r.name }}</text>
              <ui-tag
                v-if="r.key === roleStore.current"
                tone="brand"
                size="sm"
                round
                text="当前"
              />
              <ui-tag
                v-else-if="statusOf(r.key) === 'pending'"
                tone="warn"
                size="sm"
                round
                text="审核中"
              />
              <ui-tag
                v-else-if="statusOf(r.key) === 'approved'"
                tone="info"
                size="sm"
                round
                text="已开通"
              />
            </view>
            <text class="r-sub">{{ r.sub }}</text>
            <text class="r-desc">{{ r.desc }}</text>
          </view>
        </view>

        <view class="r-foot">
          <view class="feats">
            <text v-for="f in r.features" :key="f" class="feat">{{ f }}</text>
          </view>
          <view class="act" :style="{ background: actStyle(r).bg, color: actStyle(r).color }" @tap.stop="pick(r)">
            {{ actStyle(r).text }}
          </view>
        </view>
      </view>

      <view v-if="pendingList.length" class="tip-card">
        <text class="tip-t">申请已提交，审核一般 1 个工作日内完成</text>
        <text class="tip-s">{{ pendingList.map((p) => p.name).join('、') }} 的资料已记录在本机</text>
        <ui-btn size="sm" type="line" text="演示：模拟审核通过" @click="simulate" />
      </view>

      <view class="note">
        <text class="note-t">身份与权限</text>
        <text class="note-s">买家：下单、认养、问诊</text>
        <text class="note-s">农户：地块、上架卖货、订单、收成</text>
        <text class="note-s">专家：接诊、出防治方案、识图复核</text>
      </view>
    </view>

    <view class="safe-bottom" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { ROLE_LIST, roleOf } from '@/common/roles.js'
import {
  appStatusOf,
  applyRole,
  reviewRole,
  roleStore,
  switchRole,
  activateRole
} from '@/store/role.js'
import { toast } from '@/common/utils.js'

const first = ref(false)

const pendingList = computed(() =>
  ROLE_LIST.filter((r) => appStatusOf(r.key) === 'pending')
)

onLoad((q) => {
  first.value = q && (q.first === '1' || q.first === 1)
})

function statusOf(key) {
  return appStatusOf(key)
}

function actStyle(r) {
  if (r.key === roleStore.current) return { text: '正在使用', bg: '#F3F6F4', color: '#7C8A84' }
  if (appStatusOf(r.key) === 'approved') return { text: '切换到此身份', bg: r.soft, color: r.color }
  if (appStatusOf(r.key) === 'pending') return { text: '查看进度', bg: '#FFF8E6', color: '#B07A00' }
  return { text: '申请开通', bg: r.soft, color: r.color }
}

function pick(r) {
  const st = appStatusOf(r.key)
  if (r.key === roleStore.current) return toast('当前已是' + r.name)
  if (st === 'approved') {
    switchRole(r.key)
    return goHome(r)
  }
  if (st === 'pending') {
    uni.navigateTo({ url: '/pages/role/apply?role=' + r.key })
    return
  }
  uni.navigateTo({ url: '/pages/role/apply?role=' + r.key })
}

function goHome(r) {
  uni.showToast({ title: '已切换为' + r.name, icon: 'none' })
  setTimeout(() => uni.reLaunch({ url: r.home }), 300)
}

function simulate() {
  const p = pendingList.value[0]
  if (!p) return
  uni.showModal({
    title: '模拟审核',
    content: '演示用：把「' + p.name + '」的申请标记为通过并直接切换过去',
    success: (res) => {
      if (!res.confirm) return
      reviewRole(p.key, true)
      activateRole(p.key)
      goHome(roleOf(p.key))
    }
  })
}
</script>

<style scoped>
.sw {
  min-height: 100vh;
  padding-bottom: 40rpx;
}
.body {
  padding: 8rpx 28rpx 0;
}
.intro {
  padding: 10rpx 4rpx 28rpx;
}
.h1 {
  display: block;
  font-size: 42rpx;
  font-weight: 800;
  color: #16201c;
  letter-spacing: -1rpx;
}
.h2 {
  display: block;
  margin-top: 12rpx;
  font-size: 23rpx;
  color: #7c8a84;
  line-height: 1.6;
}
.role {
  background: #fff;
  border-radius: 30rpx;
  padding: 26rpx 24rpx 20rpx;
  margin-bottom: 20rpx;
  border: 3rpx solid transparent;
  box-shadow: 0 8rpx 30rpx rgba(22, 60, 45, 0.05);
}
.role.on {
  box-shadow: 0 14rpx 36rpx rgba(6, 120, 80, 0.14);
}
.r-top {
  display: flex;
  gap: 20rpx;
}
.r-img {
  width: 112rpx;
  flex-shrink: 0;
}
.r-name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.r-name {
  font-size: 34rpx;
  font-weight: 800;
  color: #16201c;
}
.r-sub {
  display: block;
  margin-top: 4rpx;
  font-size: 22rpx;
  color: #06a96a;
  font-weight: 600;
}
.r-desc {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #7c8a84;
  line-height: 1.55;
}
.r-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20rpx;
  padding-top: 18rpx;
  border-top: 2rpx solid #f4f8f5;
  gap: 12rpx;
}
.feats {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  flex: 1;
}
.feat {
  font-size: 18rpx;
  color: #8b9a93;
  background: #f6f9f7;
  border-radius: 6rpx;
  padding: 4rpx 10rpx;
}
.act {
  flex-shrink: 0;
  height: 60rpx;
  padding: 0 24rpx;
  border-radius: 60rpx;
  font-size: 23rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
}
.tip-card {
  background: #fff8e6;
  border-radius: 24rpx;
  padding: 24rpx;
  margin-top: 4rpx;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}
.tip-t {
  font-size: 24rpx;
  color: #b07a00;
  font-weight: 600;
}
.tip-s {
  font-size: 21rpx;
  color: #b99a52;
  margin-bottom: 12rpx;
}
.note {
  margin-top: 30rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.6);
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}
.note-t {
  font-size: 22rpx;
  font-weight: 700;
  color: #3d4a45;
  margin-bottom: 6rpx;
}
.note-s {
  font-size: 21rpx;
  color: #9aa7a1;
}
</style>

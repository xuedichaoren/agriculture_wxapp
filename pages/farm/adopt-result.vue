<template>
  <view class="page result-page">
    <nav-bar title="认养成功" bg="#F4F8F5" />

    <scroll-view v-if="adoption" scroll-y class="body no-scrollbar">
      <!-- 成功 -->
      <view class="ok">
        <view class="ok-circle">
          <text class="ok-emoji">🌱</text>
        </view>
        <text class="ok-title">认养成功</text>
        <text class="ok-sub">{{ adoption.code }} 号地从今天起归你啦</text>
        <view class="ok-code" @tap="copyId">
          <text class="ok-code-label">认养编号</text>
          <text class="ok-code-value">{{ adoption.id }}</text>
          <text class="ok-code-copy">复制</text>
        </view>
      </view>

      <!-- 电子证书 -->
      <view class="cert-wrap">
        <view class="cert">
          <view class="cert-head">
            <text class="cert-brand">湘农汇 · 认养证书</text>
            <text class="cert-no">NO.{{ adoption.id.slice(-6) }}</text>
          </view>
          <view class="cert-title">土 地 认 养 证 书</view>
          <text class="cert-line">兹证明</text>
          <text class="cert-owner">{{ adoption.owner || '认养人' }}</text>
          <text class="cert-line">于 {{ adoption.startDate }} 认养下列地块，认养期内产出归其所有：</text>

          <view class="cert-rows">
            <view class="c-row">
              <text class="c-label">地块</text>
              <text class="c-value">{{ adoption.code }} 号地 · {{ plot ? plot.area : '' }}㎡</text>
            </view>
            <view class="c-row">
              <text class="c-label">农场</text>
              <text class="c-value">{{ farmName }}</text>
            </view>
            <view class="c-row">
              <text class="c-label">作物</text>
              <text class="c-value">{{ cropsText }}</text>
            </view>
            <view class="c-row">
              <text class="c-label">方式</text>
              <text class="c-value">{{ planName }} · {{ cycleName }}</text>
            </view>
            <view class="c-row">
              <text class="c-label">期限</text>
              <text class="c-value">{{ adoption.startDate }} 至 {{ adoption.endDate }}</text>
            </view>
          </view>

          <view class="cert-foot">
            <view class="cert-seal">
              <text class="seal-txt">湘农汇</text>
              <text class="seal-sub">认养专用章</text>
            </view>
            <view class="cert-sign">
              <text class="sign-txt">{{ farmName }}</text>
              <text class="sign-date">签发于 {{ adoption.startDate }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 下一步 -->
      <view class="tips card">
        <text class="tips-title">接下来会发生什么</text>
        <view class="tip-item">
          <view class="tip-num">1</view>
          <text class="tip-txt">农场会在 24 小时内安排播种，播种后你能收到第一条农事记录</text>
        </view>
        <view class="tip-item">
          <view class="tip-num">2</view>
          <text class="tip-txt">{{ deliveryTip }}</text>
        </view>
        <view class="tip-item">
          <view class="tip-num">3</view>
          <text class="tip-txt">长势、照片、施肥用药都能在「我的认养」里随时查</text>
        </view>
      </view>

      <view class="actions">
        <view class="btn btn-primary" @tap="toFarm">看看地块长势</view>
        <view class="btn btn-ghost mt" @tap="toCert">保存 / 分享证书</view>
        <view class="btn btn-ghost mt" @tap="toMine">我的认养</view>
      </view>

      <view class="foot-note">
        <text class="foot-txt">证书已存入「我的认养」，随时可以再打开</text>
      </view>
      <view style="height: 60rpx" />
    </scroll-view>

    <view v-else class="empty-wrap">
      <empty-box emoji="🌾" text="没找到这张认养单" sub="可能已经退养或数据被清理" btn-text="去认养大厅" @action="toAdopt" />
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import * as api from '@/api/index.js'
import { findAdoption } from '@/store/index.js'
import { copyText } from '@/common/utils.js'

const adoptionId = ref('')
try {
  const pages = getCurrentPages()
  const cur = pages[pages.length - 1]
  if (cur && cur.options && cur.options.id) adoptionId.value = cur.options.id
} catch (e) {}

const adoption = computed(() => findAdoption(adoptionId.value))
const plot = computed(() => (adoption.value ? api.findPlot(adoption.value.plotId) : null))
const farmName = computed(() => (plot.value ? (api.plotView(plot.value).farm.name || '') : ''))
const cropsText = computed(() => (adoption.value ? api.cropsText(adoption.value) : ''))
const planName = computed(() => (adoption.value ? api.planOf(adoption.value.planKey).name : ''))
const cycleName = computed(() => (adoption.value ? api.cycleOf(adoption.value.cycleKey).name : ''))

const deliveryTip = computed(() => {
  const a = adoption.value
  if (!a) return ''
  if (!a.freq) {
    return a.planKey === 'self' ? '作物成熟前一周会提醒你来农场采摘' : '收成后可以自提，也可以让农场代寄'
  }
  return '首次配送预计 ' + (a.nextDelivery || a.startDate) + '，之后每周 ' + a.freq + ' 次冷链送到家'
})

function copyId() {
  if (!adoption.value) return
  copyText(adoption.value.id)
}

function toFarm() {
  const fid = adoption.value ? adoption.value.farmId : 'f1'
  uni.redirectTo({ url: '/pages/farm/home?id=' + fid })
}

function toMine() {
  uni.redirectTo({ url: '/pages/farm/my' })
}

function toCert() {
  uni.navigateTo({ url: '/pages/farm/certificate?id=' + adoptionId.value })
}

function toAdopt() {
  uni.redirectTo({ url: '/pages/farm/adopt' })
}

</script>

<style scoped>
.result-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}
.body {
  flex: 1;
  height: 0;
}

/* 成功 */
.ok {
  padding: 40rpx 0 10rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.ok-circle {
  width: 150rpx;
  height: 150rpx;
  border-radius: 50%;
  background: linear-gradient(150deg, #eafaf1, #c9efd9);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12rpx 30rpx rgba(13, 190, 115, 0.18);
}
.ok-emoji {
  font-size: 72rpx;
}
.ok-title {
  font-size: 38rpx;
  font-weight: 800;
  margin-top: 24rpx;
}
.ok-sub {
  font-size: 23rpx;
  color: #7c8a84;
  margin-top: 8rpx;
}
.ok-code {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 22rpx;
  padding: 10rpx 22rpx;
  background: #fff;
  border-radius: 40rpx;
  box-shadow: 0 8rpx 24rpx rgba(22, 60, 45, 0.06);
}
.ok-code-label {
  font-size: 19rpx;
  color: #9aa7a1;
}
.ok-code-value {
  font-size: 21rpx;
  color: #16201c;
  font-weight: 600;
}
.ok-code-copy {
  font-size: 19rpx;
  color: #0a8f5c;
}

/* 证书 */
.cert-wrap {
  margin: 32rpx 24rpx 0;
  padding: 4rpx;
  border-radius: 30rpx;
  background: linear-gradient(135deg, #0fc97a, #0a7f52 40%, #d8b465 100%);
}
.cert {
  background: #fffef9;
  border-radius: 27rpx;
  padding: 30rpx 26rpx 24rpx;
  position: relative;
  overflow: hidden;
}
.cert-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.cert-brand {
  font-size: 20rpx;
  color: #a08b52;
  letter-spacing: 2rpx;
}
.cert-no {
  font-size: 18rpx;
  color: #b9a97f;
}
.cert-title {
  font-size: 32rpx;
  font-weight: 800;
  letter-spacing: 6rpx;
  color: #1c3a2c;
  margin-top: 18rpx;
}
.cert-line {
  display: block;
  font-size: 21rpx;
  color: #6b7c73;
  line-height: 1.7;
  margin-top: 12rpx;
}
.cert-owner {
  display: block;
  font-size: 38rpx;
  font-weight: 800;
  color: #0a7f52;
  margin: 8rpx 0;
  letter-spacing: 4rpx;
}
.cert-rows {
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 2rpx dashed #e6ddc6;
}
.c-row {
  display: flex;
  padding: 7rpx 0;
}
.c-label {
  width: 90rpx;
  font-size: 20rpx;
  color: #a08b52;
  flex-shrink: 0;
}
.c-value {
  flex: 1;
  font-size: 21rpx;
  color: #2a3b33;
}
.cert-foot {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: 22rpx;
}
.cert-seal {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(198, 60, 50, 0.55);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transform: rotate(-12deg);
}
.seal-txt {
  font-size: 22rpx;
  font-weight: 800;
  color: rgba(198, 60, 50, 0.75);
  letter-spacing: 1rpx;
}
.seal-sub {
  font-size: 14rpx;
  color: rgba(198, 60, 50, 0.6);
  margin-top: 4rpx;
}
.cert-sign {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  padding-bottom: 8rpx;
}
.sign-txt {
  font-size: 22rpx;
  font-weight: 600;
  color: #1c3a2c;
}
.sign-date {
  font-size: 18rpx;
  color: #a08b52;
  margin-top: 4rpx;
}

/* 提示 */
.tips {
  margin: 24rpx 24rpx 0;
  padding: 26rpx 24rpx;
}
.tips-title {
  display: block;
  font-size: 26rpx;
  font-weight: 700;
  margin-bottom: 16rpx;
}
.tip-item {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  margin-bottom: 14rpx;
}
.tip-num {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background: #e9faf2;
  color: #0a8f5c;
  font-size: 19rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2rpx;
}
.tip-txt {
  flex: 1;
  font-size: 21rpx;
  color: #5c6a64;
  line-height: 1.55;
}

.actions {
  margin: 30rpx 24rpx 0;
}
.mt {
  margin-top: 16rpx;
}
.foot-note {
  margin-top: 24rpx;
  text-align: center;
}
.foot-txt {
  font-size: 19rpx;
  color: #b3bfba;
}
.empty-wrap {
  flex: 1;
}
</style>

<template>
  <view class="page confirm-page">
    <nav-bar title="确认认养" bg="#F4F8F5" />

    <view v-if="!ready" class="loading">
      <text class="loading-txt">地块信息已失效，请重新选择</text>
      <view class="btn btn-ghost back-btn" @tap="backToList">返回认养大厅</view>
    </view>

    <view v-else class="body">
      <!-- 地块摘要 -->
      <view class="card plot-card">
        <view class="p-ico" :style="{ background: 'linear-gradient(150deg, ' + plot.bg[0] + ', ' + plot.bg[1] + ')' }">
          <text class="p-emoji">{{ plot.emoji }}</text>
        </view>
        <view class="flex1">
          <view class="row between">
            <text class="p-name">{{ plot.code }} 号地 · {{ plot.farm.name }}</text>
            <text class="p-edit" @tap="edit">修改</text>
          </view>
          <text class="p-crops">{{ cropsText }}</text>
          <text class="p-meta">{{ plan.name }} · {{ cycle.name }} · {{ plot.area }}㎡</text>
        </view>
      </view>

      <!-- 认养人 -->
      <view class="card sec">
        <text class="sec-title">认养人信息</text>
        <view class="field">
          <text class="f-label">姓名</text>
          <input v-model="owner" class="f-input" placeholder="用于证书署名" placeholder-class="ph" maxlength="12" />
        </view>
        <view class="field">
          <text class="f-label">手机号</text>
          <input v-model="phone" class="f-input" type="number" placeholder="农场有事会联系你" placeholder-class="ph" maxlength="11" />
        </view>
        <view class="field no-border">
          <text class="f-label">给农场留言</text>
          <input v-model="remark" class="f-input" placeholder="选填，比如忌口、收货时间" placeholder-class="ph" maxlength="30" />
        </view>
      </view>

      <!-- 配送 -->
      <view v-if="needDelivery" class="card sec">
        <view class="row between sec-head">
          <text class="sec-title">配送地址</text>
          <text class="sec-action" @tap="chooseAddress">切换</text>
        </view>
        <view v-if="address" class="addr">
          <view class="row">
            <text class="addr-name">{{ address.name }}</text>
            <text class="addr-phone">{{ address.phone }}</text>
            <text v-if="address.tag" class="addr-tag">{{ address.tag }}</text>
          </view>
          <text class="addr-detail">{{ address.region }} {{ address.detailAddress }}</text>
        </view>
        <view v-else class="addr-empty" @tap="chooseAddress">还没有地址，点这里去添加</view>

        <view class="line" />
        <text class="sec-title sub-title">配送频率</text>
        <view class="freqs">
          <view
            v-for="f in FREQS"
            :key="f.value"
            class="freq"
            :class="{ on: freq === f.value }"
            @tap="freq = f.value"
          >
            <text class="freq-name">{{ f.name }}</text>
            <text class="freq-tip">{{ f.tip }}</text>
          </view>
        </view>
      </view>

      <view v-else class="card sec">
        <text class="sec-title">配送方式</text>
        <view class="self-tip">
          <text class="self-emoji">{{ plan.key === 'self' ? '🧑‍🌾' : '🌿' }}</text>
          <text class="self-txt">{{ plan.key === 'self' ? '自己到农场采摘，不安排配送' : '代耕代管，收成可自提或联系农场代寄' }}</text>
        </view>
      </view>

      <!-- 开始日期 -->
      <view class="card sec">
        <view class="row between sec-head">
          <text class="sec-title">开始日期</text>
          <text class="sec-action">{{ endDate }} 结束</text>
        </view>
        <picker mode="date" :value="startDate" :start="minDate" @change="onDate">
          <view class="field no-border">
            <text class="f-label">认养起算</text>
            <text class="f-input date-value">{{ startDate }}</text>
            <icon-svg name="right" :size="22" color="#C3CCC8" />
          </view>
        </picker>
        <view class="picks">
          <view v-for="d in quickDates" :key="d.value" class="pick" :class="{ on: startDate === d.value }" @tap="startDate = d.value">
            {{ d.label }}
          </view>
        </view>
      </view>

      <!-- 费用 -->
      <view class="card sec">
        <text class="sec-title">费用明细</text>
        <view class="fee-row">
          <text class="fee-label">地块认养费 · {{ cycle.name }}</text>
          <text class="fee-value">¥{{ price.base }}</text>
        </view>
        <view v-if="price.serviceFee" class="fee-row">
          <text class="fee-label">服务费 · {{ plan.name }}</text>
          <text class="fee-value">¥{{ price.serviceFee }}</text>
        </view>
        <view v-if="price.seedFee" class="fee-row">
          <text class="fee-label">种苗附加费</text>
          <text class="fee-value">¥{{ price.seedFee }}</text>
        </view>
        <view class="fee-row">
          <text class="fee-label">运费</text>
          <text class="fee-value free">认养免运费</text>
        </view>
      </view>

      <!-- 协议 -->
      <view class="agree" @tap="agreed = !agreed">
        <view class="box" :class="{ on: agreed }">
          <icon-svg v-if="agreed" name="check" :size="18" color="#FFFFFF" :stroke="3.2" />
        </view>
        <text class="agree-txt">我已阅读并同意《认养服务协议》，知悉作物受天气影响，产量会有正常浮动</text>
      </view>

      <view style="height: 60rpx" />
    </view>

    <!-- 底栏 -->
    <view v-if="ready" class="bar safe-bottom">
      <view class="bar-price">
        <view class="row bar-price-row">
          <text class="bp-sym">¥</text>
          <text class="bp-num">{{ price.total }}</text>
        </view>
        <text class="bp-tip">已省 ¥{{ price.save }}</text>
      </view>
      <view class="btn btn-primary bar-btn" :class="{ 'btn-disabled': !canSubmit }" @tap="submit">
        确认支付
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import * as api from '@/api/index.js'
import { store, createAdoption, clearAdoptDraft, defaultAddress } from '@/store/index.js'
import { todayStr, toast } from '@/common/utils.js'

const FREQS = [
  { value: 1, name: '每周 1 次', tip: '够吃就行' },
  { value: 2, name: '每周 2 次', tip: '吃得更新鲜' }
]

const draft = ref(store.adoptDraft)
const ready = computed(() => !!draft.value && !!plot.value)
const plot = computed(() => (draft.value ? api.plotView(api.findPlot(draft.value.plotId)) : null))
const plan = computed(() => api.planOf(draft.value?.planKey))
const cycle = computed(() => api.cycleOf(draft.value?.cycleKey))
const needDelivery = computed(() => plan.value.key === 'full')

const owner = ref(store.user.nickname || '')
const phone = ref(stripMask(store.user.phone))
const remark = ref('')
const freq = ref(2)
const startDate = ref(todayStr())
const minDate = computed(() => todayStr())
const agreed = ref(false)
const addressId = ref(defaultAddress() ? defaultAddress().id : '')

function stripMask(p) {
  const s = String(p || '')
  return /^1\d{10}$/.test(s) ? s : ''
}

const address = computed(() => store.addresses.find((a) => a.id === addressId.value) || null)

const cropsText = computed(() => {
  const list = (draft.value?.cropIds || []).map(api.findCrop).filter(Boolean)
  if (!list.length) return '未选择作物'
  return list.map((c) => c.emoji + ' ' + c.name).join('  ')
})

const price = computed(() =>
  api.calcAdoptPrice({
    plot: plot.value,
    planKey: draft.value?.planKey,
    cycleKey: draft.value?.cycleKey,
    cropIds: draft.value?.cropIds || []
  })
)

const endDate = computed(() => api.addMonths(startDate.value, cycle.value.months))

const quickDates = computed(() => {
  const base = new Date()
  const fmt = (n) => {
    const d = new Date(base.getTime() + n * 86400000)
    return api.fmt(d)
  }
  return [
    { label: '今天', value: fmt(0) },
    { label: '3 天后', value: fmt(3) },
    { label: '下周一', value: fmt(7) }
  ]
})

const canSubmit = computed(() => ready.value && owner.value.trim() && /^1\d{10}$/.test(phone.value) && agreed.value)

function onDate(e) {
  startDate.value = e.detail.value
}

function chooseAddress() {
  const list = store.addresses
  if (!list.length) {
    toast('还没有收货地址')
    return
  }
  uni.showActionSheet({
    itemList: list.map((a) => a.name + ' ' + a.phone + ' ' + a.detailAddress.slice(0, 12)),
    success: (r) => {
      addressId.value = list[r.tapIndex].id
    }
  })
}

function edit() {
  uni.navigateBack()
}

function backToList() {
  uni.navigateTo({ url: '/pages/farm/adopt' })
}

function submit() {
  if (!ready.value) return
  if (!owner.value.trim()) return toast('请填写认养人姓名')
  if (!/^1\d{10}$/.test(phone.value)) return toast('请填写正确的手机号')
  if (needDelivery.value && !address.value) return toast('请先选择配送地址')
  if (!agreed.value) return toast('请先同意认养服务协议')

  const d = draft.value
  const adoption = createAdoption({
    plotId: plot.value.id,
    code: plot.value.code,
    farmId: plot.value.farmId,
    crops: d.cropIds,
    planKey: d.planKey,
    cycleKey: d.cycleKey,
    startDate: startDate.value,
    endDate: endDate.value,
    total: price.value.total,
    freq: needDelivery.value ? freq.value : 0,
    nextDelivery: needDelivery.value ? api.fmt(new Date(new Date(startDate.value).getTime() + 30 * 86400000)) : '',
    deliveriesTotal: needDelivery.value ? cycle.value.months * 2 * freq.value : 0,
    owner: owner.value.trim(),
    phone: phone.value,
    addressId: addressId.value,
    remark: remark.value.trim()
  })
  clearAdoptDraft()
  uni.redirectTo({ url: '/pages/farm/adopt-result?id=' + adoption.id })
}
</script>

<style scoped>
.confirm-page {
  padding-bottom: 180rpx;
}
.loading {
  padding: 160rpx 60rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.loading-txt {
  font-size: 25rpx;
  color: #7c8a84;
}
.back-btn {
  margin-top: 30rpx;
  padding: 0 40rpx;
}
.body {
  padding: 10rpx 24rpx 0;
}

/* 地块摘要 */
.plot-card {
  display: flex;
  gap: 18rpx;
  padding: 20rpx;
  align-items: center;
}
.p-ico {
  width: 110rpx;
  height: 110rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.p-emoji {
  font-size: 56rpx;
}
.p-name {
  font-size: 26rpx;
  font-weight: 700;
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.p-edit {
  font-size: 21rpx;
  color: #0a8f5c;
  flex-shrink: 0;
}
.p-crops {
  display: block;
  font-size: 21rpx;
  color: #5c6a64;
  margin-top: 8rpx;
}
.p-meta {
  display: block;
  font-size: 19rpx;
  color: #9aa7a1;
  margin-top: 4rpx;
}

/* 通用卡片 */
.sec {
  margin-top: 20rpx;
  padding: 24rpx;
}
.sec-head {
  margin-bottom: 10rpx;
}
.sec-title {
  display: block;
  font-size: 26rpx;
  font-weight: 700;
  margin-bottom: 14rpx;
}
.sec-head .sec-title {
  margin-bottom: 0;
}
.sub-title {
  margin-top: 22rpx;
}
.sec-action {
  font-size: 21rpx;
  color: #0a8f5c;
}

/* 表单 */
.field {
  display: flex;
  align-items: center;
  padding: 22rpx 0;
  border-bottom: 2rpx solid #f2f5f3;
}
.field.no-border {
  border-bottom: none;
}
.f-label {
  width: 180rpx;
  font-size: 23rpx;
  color: #5c6a64;
  flex-shrink: 0;
}
.f-input {
  flex: 1;
  font-size: 25rpx;
  color: #16201c;
  text-align: right;
}
.date-value {
  padding-right: 8rpx;
}
.ph {
  color: #b3bfba;
}

/* 地址 */
.addr {
  padding: 6rpx 0 18rpx;
}
.addr-name {
  font-size: 25rpx;
  font-weight: 600;
}
.addr-phone {
  font-size: 22rpx;
  color: #7c8a84;
  margin-left: 14rpx;
}
.addr-tag {
  font-size: 17rpx;
  color: #0a8f5c;
  background: #f2fbf6;
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
  margin-left: 12rpx;
}
.addr-detail {
  display: block;
  font-size: 22rpx;
  color: #3d4a45;
  line-height: 1.55;
  margin-top: 8rpx;
}
.addr-empty {
  font-size: 22rpx;
  color: #0a8f5c;
  padding: 20rpx 0;
}
.line {
  height: 2rpx;
  background: #f2f5f3;
}

/* 频率 */
.freqs {
  display: flex;
  gap: 14rpx;
}
.freq {
  flex: 1;
  padding: 16rpx;
  border-radius: 18rpx;
  background: #f7faf8;
  border: 2rpx solid #f7faf8;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.freq.on {
  background: #f2fbf6;
  border-color: #0fc97a;
}
.freq-name {
  font-size: 23rpx;
  font-weight: 600;
}
.freq-tip {
  font-size: 18rpx;
  color: #9aa7a1;
  margin-top: 4rpx;
}

/* 自提提示 */
.self-tip {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 16rpx;
  background: #f7faf8;
  border-radius: 18rpx;
}
.self-emoji {
  font-size: 40rpx;
}
.self-txt {
  flex: 1;
  font-size: 21rpx;
  color: #5c6a64;
  line-height: 1.5;
}

/* 快捷日期 */
.picks {
  display: flex;
  gap: 12rpx;
  margin-top: 6rpx;
}
.pick {
  padding: 8rpx 22rpx;
  border-radius: 30rpx;
  background: #f7faf8;
  font-size: 20rpx;
  color: #5c6a64;
  border: 2rpx solid #f7faf8;
}
.pick.on {
  background: #f2fbf6;
  color: #0a8f5c;
  border-color: #b9ecd4;
}

/* 费用 */
.fee-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12rpx 0;
}
.fee-label {
  font-size: 22rpx;
  color: #5c6a64;
}
.fee-value {
  font-size: 23rpx;
  color: #16201c;
}
.fee-value.free {
  color: #0a8f5c;
}

/* 协议 */
.agree {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  margin: 24rpx 6rpx 0;
}
.box {
  width: 32rpx;
  height: 32rpx;
  border-radius: 8rpx;
  border: 2rpx solid #cfdad5;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2rpx;
}
.box.on {
  background: #0fc97a;
  border-color: #0fc97a;
}
.agree-txt {
  flex: 1;
  font-size: 20rpx;
  color: #8b9a93;
  line-height: 1.55;
}

/* 底栏 */
.bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  background: #fff;
  padding: 14rpx 24rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  box-shadow: 0 -8rpx 30rpx rgba(22, 60, 45, 0.08);
}
.bar-price {
  flex: 1;
}
.bar-price-row {
  align-items: baseline;
}
.bp-sym {
  font-size: 22rpx;
  color: #ff4b3a;
  font-weight: 700;
}
.bp-num {
  font-size: 42rpx;
  color: #ff4b3a;
  font-weight: 800;
  margin-left: 2rpx;
}
.bp-tip {
  display: block;
  font-size: 18rpx;
  color: #9aa7a1;
  margin-top: 2rpx;
}
.bar-btn {
  width: 300rpx;
  height: 86rpx;
}
</style>

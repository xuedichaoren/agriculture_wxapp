<template>
  <view class="page harvest">
    <nav-bar title="收成" bg="#F4F8F5">
      <template #right>
        <view class="nav-more" @tap="more">
          <icon-svg name="more" :size="30" color="#16201C" :stroke="1.8" />
        </view>
      </template>
    </nav-bar>

    <view v-if="!view" class="miss">
      <text class="miss-emoji">🧺</text>
      <text class="miss-txt">还没有在种的认养地块</text>
      <view class="btn btn-ghost miss-btn" @tap="toAdopt">去认养一块</view>
    </view>

    <view v-else class="body">
      <!-- 总览 -->
      <view class="hero">
        <view class="hero-deco" />
        <view class="row between hero-top">
          <text class="hero-code">{{ view.code }} 号地 · {{ view.farm.name }}</text>
          <view class="hero-tag" :class="{ off: !view.growing }">{{ view.statusText }}</view>
        </view>
        <view class="hero-nums">
          <view class="hn">
            <text class="hn-num">{{ view.expect }}</text>
            <text class="hn-label">本季预计(斤)</text>
          </view>
          <view class="hn-line" />
          <view class="hn">
            <text class="hn-num">{{ view.picked }}</text>
            <text class="hn-label">已收(斤)</text>
          </view>
          <view class="hn-line" />
          <view class="hn">
            <text class="hn-num hl">{{ view.left }}</text>
            <text class="hn-label">待收(斤)</text>
          </view>
        </view>
        <view class="hero-prog">
          <view class="hero-bar">
            <view class="hero-fill" :style="{ width: view.pct + '%' }" />
          </view>
          <view class="row between hero-prog-row">
            <text class="hero-prog-txt">已收 {{ view.pct }}%</text>
            <text class="hero-prog-txt">{{ view.cropsText }}</text>
          </view>
        </view>
      </view>

      <!-- 作物明细 -->
      <view class="card sec">
        <view class="row between sec-head">
          <text class="sec-title">按作物</text>
          <text class="sec-sub">预计按亩产折算</text>
        </view>
        <view v-for="r in view.rows" :key="r.cropId" class="row-crop">
          <view class="rc-ico" :style="{ background: 'linear-gradient(150deg, ' + r.bg[0] + ', ' + r.bg[1] + ')' }">
            <text class="rc-emoji">{{ r.emoji }}</text>
          </view>
          <view class="flex1">
            <view class="row between">
              <text class="rc-name">{{ r.name }}</text>
              <text class="rc-num">{{ r.picked }} / {{ r.expect }} 斤</text>
            </view>
            <view class="rc-bar">
              <view class="rc-fill" :style="{ width: r.pct + '%' }" />
            </view>
            <text class="rc-sub">
              已收 {{ r.pct }}%
              <text v-if="r.reserved > 0"> · 已安排 {{ r.reserved }} 斤</text>
              · 还剩 {{ r.left }} 斤
            </text>
          </view>
        </view>
      </view>

      <!-- 下次采收 -->
      <view v-if="view.nextPick" class="card sec next">
        <view class="nx-left">
          <text class="nx-kicker">下一次采收</text>
          <text class="nx-date">{{ view.nextPick.date.slice(5) }} · {{ view.nextPick.cropName }}</text>
          <text class="nx-sub">预计可采 {{ view.nextPick.kg }} 斤，采前会通知你</text>
        </view>
        <view class="nx-btn" @tap="remind">提醒我</view>
      </view>

      <!-- 去向 -->
      <view class="card sec">
        <view class="row between sec-head">
          <text class="sec-title">待收的 {{ view.left }} 斤怎么处理</text>
          <text class="sec-sub">随时可改</text>
        </view>
        <view class="ways">
          <view
            v-for="w in ways"
            :key="w.key"
            class="way"
            :class="{ off: !view.canRedeem }"
            @tap="openSheet(w)"
          >
            <text class="way-emoji">{{ w.emoji }}</text>
            <text class="way-name">{{ w.name }}</text>
            <text class="way-sub">{{ w.short }}</text>
          </view>
        </view>
        <view v-if="view.reserved > 0" class="reserved">
          <text class="reserved-txt">已安排 {{ view.reserved }} 斤</text>
          <text v-if="view.points" class="reserved-pts">· 已换 {{ view.points }} 积分</text>
        </view>
        <text class="way-note">安排后农场按备注处理，寄送满 3 斤包邮，存菜窖免费 30 天</text>
      </view>

      <!-- 收成记录 -->
      <view class="card sec">
        <view class="row between sec-head">
          <text class="sec-title">收成记录</text>
          <text class="sec-sub">共 {{ records.length }} 条</text>
        </view>
        <view v-if="!records.length" class="rec-empty">
          <text class="rec-empty-txt">还没有采收记录，第一批菜长成后会出现在这里</text>
        </view>
        <view v-else class="tl">
          <view v-for="(r, i) in records" :key="r.key" class="tl-item">
            <view class="tl-left">
              <view class="tl-dot" :class="{ mine: r.mine }" />
              <view v-if="i < records.length - 1" class="tl-line" />
            </view>
            <view class="flex1 tl-main">
              <view class="row between">
                <text class="tl-title">{{ r.emoji }} {{ r.cropName }} {{ r.kg }} 斤</text>
                <text class="tl-date">{{ r.date.slice(5) }}</text>
              </view>
              <text class="tl-sub">{{ r.mine ? '我安排的 · ' : '农场采收 · ' }}{{ r.wayText }}<text v-if="r.points"> · {{ r.points }} 积分</text></text>
            </view>
          </view>
        </view>
      </view>

      <view style="height: 60rpx" />
    </view>

    <!-- 安排弹层 -->
    <view v-if="sheet" class="mask" @tap="closeSheet">
      <view class="sheet" @tap.stop>
        <view class="sh-head">
          <text class="sh-title">{{ wayObj.name }}</text>
          <text class="sh-close" @tap="closeSheet">关闭</text>
        </view>
        <text class="sh-sub">{{ wayObj.sub }}</text>

        <text class="sh-label">选作物</text>
        <view class="sh-crops">
          <view
            v-for="r in redeemRows"
            :key="r.cropId"
            class="sh-chip"
            :class="{ on: cropId === r.cropId }"
            @tap="pickCrop(r)"
          >{{ r.emoji }} {{ r.name }} 剩 {{ r.left }} 斤</view>
        </view>

        <view class="row between sh-kg">
          <text class="sh-label">斤数</text>
          <view class="stepper">
            <view class="st-btn" :class="{ off: kg <= 1 }" @tap="stepKg(-1)">−</view>
            <text class="st-num">{{ kg }}</text>
            <view class="st-btn" :class="{ off: kg >= maxKg }" @tap="stepKg(1)">+</view>
          </view>
        </view>
        <text class="sh-hint">{{ hintText }}</text>

        <view class="btn btn-primary sh-btn" :class="{ 'btn-disabled': !maxKg }" @tap="confirm">确认安排</view>
        <view class="safe-bottom" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { adoptionView } from '@/api/adopt-plan.js'
import { harvestViewOf, pickRecordsOf, pointsOfKg, REDEEM_WAYS } from '@/api/adopt-harvest.js'
import { findAdoption, store, persist } from '@/store/index.js'
import { harvestOpsOf, addHarvestOp } from '@/store/adopt-extra.js'
import { toast, todayStr } from '@/common/utils.js'

const adoptionId = ref('')
try {
  const pages = getCurrentPages()
  const cur = pages[pages.length - 1]
  if (cur && cur.options && cur.options.id) adoptionId.value = cur.options.id
} catch (e) {}

const ways = REDEEM_WAYS
const sheet = ref(false)
const wayKey = ref('ship')
const cropId = ref('')
const kg = ref(1)

const adoption = computed(() => findAdoption(adoptionId.value))
const base = computed(() => adoptionView(adoption.value))
const ops = computed(() => harvestOpsOf(adoptionId.value))
const view = computed(() => {
  const v = harvestViewOf(adoption.value, ops.value)
  return v ? { ...v, code: base.value ? base.value.code : '', farm: base.value ? base.value.farm : {}, cropsText: base.value ? base.value.cropsText : '' } : null
})
const records = computed(() => pickRecordsOf(adoption.value, ops.value))

const wayObj = computed(() => REDEEM_WAYS.find((w) => w.key === wayKey.value) || REDEEM_WAYS[0])
// 不足 1 斤的作物不进弹层：凑不出一次像样的寄送，留给下一茬一起算
const redeemRows = computed(() => (view.value ? view.value.rows.filter((r) => r.left >= 1) : []))
const crop = computed(() => redeemRows.value.find((r) => r.cropId === cropId.value) || redeemRows.value[0] || null)
const maxKg = computed(() => (crop.value ? Math.floor(crop.value.left) : 0))
const hintText = computed(() => {
  if (!maxKg.value) return '这种作物已经没有待收斤数了'
  if (wayKey.value === 'points') return `可换 ${pointsOfKg(kg.value)} 积分，到账后可在下单时抵现`
  if (wayKey.value === 'ship') return kg.value < 3 ? '不满 3 斤需付 8 元运费' : '满 3 斤包邮，采后 24 小时内发出'
  return '农场代存 30 天，随时可以改成寄送'
})

function openSheet(w) {
  if (!view.value || !view.value.growing) return toast('这块地已经结束了')
  const rows = redeemRows.value
  if (!rows.length) {
    return toast(view.value.left > 0 ? '待收不到 1 斤，等下次采了一起安排' : '待收斤数已经安排完了')
  }
  wayKey.value = w.key
  cropId.value = rows[0].cropId
  kg.value = Math.max(1, Math.min(3, Math.floor(rows[0].left)))
  sheet.value = true
}

function closeSheet() {
  sheet.value = false
}

function pickCrop(r) {
  cropId.value = r.cropId
  kg.value = Math.max(1, Math.min(3, Math.floor(r.left)))
}

function stepKg(d) {
  const next = kg.value + d
  if (next < 1) return
  if (next > maxKg.value) return
  kg.value = next
}

function confirm() {
  if (!crop.value || !maxKg.value) return toast('没有可安排的斤数')
  const points = wayKey.value === 'points' ? pointsOfKg(kg.value) : 0
  addHarvestOp(adoptionId.value, {
    cropId: crop.value.cropId,
    cropName: crop.value.name,
    kg: kg.value,
    way: wayKey.value,
    points,
    date: todayStr()
  })
  if (points) {
    store.user.points = Number(store.user.points || 0) + points
    persist()
  }
  sheet.value = false
  toast(points ? `已换 ${points} 积分` : wayObj.value.name + ' 已安排')
}

function remind() {
  uni.showModal({
    title: '采收提醒',
    content: '会在采收前一天通过服务通知提醒你，记得来收菜。',
    showCancel: false,
    confirmText: '知道了'
  })
}

function more() {
  uni.showActionSheet({
    itemList: ['看农事日志', '看云监工', '联系农场'],
    success: (r) => {
      const id = adoptionId.value
      if (r.tapIndex === 0) uni.navigateTo({ url: '/pages/farm/calendar?code=' + (view.value ? view.value.code : '') })
      else if (r.tapIndex === 1) uni.navigateTo({ url: '/pages/farm/monitor?id=' + id })
      else uni.navigateTo({ url: '/pages/message/chat?id=' + (base.value ? base.value.farmId : 'f1') })
    }
  })
}

function toAdopt() {
  uni.navigateTo({ url: '/pages/farm/adopt' })
}
</script>

<style scoped>
.harvest {
  padding-bottom: 20rpx;
}
.nav-more {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 总览 */
.hero {
  margin: 10rpx 24rpx 0;
  border-radius: 30rpx;
  padding: 26rpx 26rpx 22rpx;
  background: linear-gradient(135deg, #123b2c 0%, #1d5c45 58%, #26835f 100%);
  position: relative;
  overflow: hidden;
}
.hero-deco {
  position: absolute;
  width: 300rpx;
  height: 300rpx;
  border-radius: 50%;
  right: -110rpx;
  top: -130rpx;
  background: rgba(255, 255, 255, 0.08);
}
.hero-top {
  position: relative;
}
.hero-code {
  font-size: 21rpx;
  color: rgba(255, 255, 255, 0.72);
}
.hero-tag {
  font-size: 18rpx;
  color: #0a3d2b;
  background: #8ef0c2;
  padding: 4rpx 14rpx;
  border-radius: 20rpx;
  font-weight: 700;
}
.hero-tag.off {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}
.hero-nums {
  display: flex;
  align-items: center;
  margin-top: 22rpx;
  position: relative;
}
.hn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.hn-num {
  font-size: 46rpx;
  font-weight: 800;
  color: #fff;
  line-height: 1.1;
}
.hn-num.hl {
  color: #8ef0c2;
}
.hn-label {
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.55);
  margin-top: 6rpx;
}
.hn-line {
  width: 2rpx;
  height: 46rpx;
  background: rgba(255, 255, 255, 0.14);
}
.hero-prog {
  margin-top: 22rpx;
}
.hero-bar {
  height: 10rpx;
  border-radius: 10rpx;
  background: rgba(255, 255, 255, 0.16);
  overflow: hidden;
}
.hero-fill {
  height: 100%;
  border-radius: 10rpx;
  background: linear-gradient(90deg, #8ef0c2, #16d488);
}
.hero-prog-row {
  margin-top: 10rpx;
}
.hero-prog-txt {
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.55);
}

/* 卡片 */
.sec {
  margin: 20rpx 24rpx 0;
  padding: 24rpx;
}
.sec-head {
  margin-bottom: 16rpx;
}
.sec-title {
  font-size: 27rpx;
  font-weight: 700;
}
.sec-sub {
  font-size: 19rpx;
  color: #9aa7a1;
}

/* 作物行 */
.row-crop {
  display: flex;
  gap: 16rpx;
  padding: 14rpx 0;
  border-bottom: 2rpx solid #f4f7f5;
}
.row-crop:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}
.rc-ico {
  width: 76rpx;
  height: 76rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.rc-emoji {
  font-size: 38rpx;
}
.rc-name {
  font-size: 25rpx;
  font-weight: 600;
}
.rc-num {
  font-size: 20rpx;
  color: #0a8f5c;
  font-weight: 700;
}
.rc-bar {
  height: 8rpx;
  border-radius: 8rpx;
  background: #f1f6f3;
  margin-top: 10rpx;
  overflow: hidden;
}
.rc-fill {
  height: 100%;
  border-radius: 8rpx;
  background: linear-gradient(90deg, #16d488, #0bbd72);
}
.rc-sub {
  display: block;
  font-size: 18rpx;
  color: #9aa7a1;
  margin-top: 8rpx;
}

/* 下次采收 */
.next {
  display: flex;
  align-items: center;
  background: linear-gradient(120deg, #f2fbf6 0%, #ffffff 62%);
  border: 2rpx solid #e4f6ec;
}
.nx-left {
  flex: 1;
}
.nx-kicker {
  display: block;
  font-size: 18rpx;
  color: #0a8f5c;
  font-weight: 700;
}
.nx-date {
  display: block;
  font-size: 27rpx;
  font-weight: 700;
  margin-top: 6rpx;
}
.nx-sub {
  display: block;
  font-size: 19rpx;
  color: #7c8a84;
  margin-top: 6rpx;
}
.nx-btn {
  flex-shrink: 0;
  height: 60rpx;
  padding: 0 26rpx;
  border-radius: 30rpx;
  background: #06a96a;
  color: #fff;
  font-size: 21rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 去向 */
.ways {
  display: flex;
  gap: 12rpx;
}
.way {
  flex: 1;
  border-radius: 20rpx;
  background: #f7faf8;
  padding: 18rpx 8rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}
.way.off {
  opacity: 0.45;
}
.way-emoji {
  font-size: 36rpx;
}
.way-name {
  font-size: 22rpx;
  font-weight: 600;
}
.way-sub {
  font-size: 17rpx;
  color: #9aa7a1;
}
.reserved {
  display: flex;
  align-items: center;
  gap: 6rpx;
  margin-top: 14rpx;
}
.reserved-txt {
  font-size: 19rpx;
  color: #0a8f5c;
  font-weight: 600;
}
.reserved-pts {
  font-size: 19rpx;
  color: #ff8a3d;
}
.way-note {
  display: block;
  font-size: 18rpx;
  color: #b3bfba;
  line-height: 1.5;
  margin-top: 12rpx;
}

/* 记录 */
.tl {
  padding-top: 4rpx;
}
.tl-item {
  display: flex;
  gap: 14rpx;
}
.tl-left {
  width: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 8rpx;
}
.tl-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: #cfdad5;
}
.tl-dot.mine {
  background: #16d488;
  box-shadow: 0 0 0 4rpx rgba(22, 212, 136, 0.16);
}
.tl-line {
  flex: 1;
  width: 2rpx;
  background: #f0f4f2;
  margin: 6rpx 0;
  min-height: 34rpx;
}
.tl-main {
  padding-bottom: 20rpx;
}
.tl-title {
  font-size: 24rpx;
  font-weight: 600;
}
.tl-date {
  font-size: 18rpx;
  color: #b3bfba;
}
.tl-sub {
  display: block;
  font-size: 19rpx;
  color: #7c8a84;
  margin-top: 4rpx;
}
.rec-empty {
  padding: 30rpx 0;
  text-align: center;
}
.rec-empty-txt {
  font-size: 20rpx;
  color: #b3bfba;
}

/* 弹层 */
.mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(10, 24, 19, 0.45);
  z-index: 90;
  display: flex;
  align-items: flex-end;
}
.sheet {
  width: 100%;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 28rpx 28rpx 20rpx;
}
.sh-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sh-title {
  font-size: 30rpx;
  font-weight: 700;
}
.sh-close {
  font-size: 22rpx;
  color: #9aa7a1;
}
.sh-sub {
  display: block;
  font-size: 20rpx;
  color: #7c8a84;
  margin-top: 6rpx;
}
.sh-label {
  display: block;
  font-size: 22rpx;
  color: #3d4a45;
  font-weight: 600;
  margin-top: 24rpx;
}
.sh-crops {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 12rpx;
}
.sh-chip {
  padding: 0 20rpx;
  height: 60rpx;
  line-height: 60rpx;
  border-radius: 30rpx;
  background: #f4f8f5;
  font-size: 21rpx;
  color: #5c6a64;
  border: 2rpx solid transparent;
}
.sh-chip.on {
  background: #e9faf2;
  color: #06a96a;
  font-weight: 600;
  border-color: #b9ecd4;
}
.sh-kg {
  margin-top: 22rpx;
}
.sh-kg .sh-label {
  margin-top: 0;
}
.stepper {
  display: flex;
  align-items: center;
  gap: 4rpx;
  background: #f4f8f5;
  border-radius: 30rpx;
  padding: 6rpx;
}
.st-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: #fff;
  color: #0a8f5c;
  font-size: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}
.st-btn.off {
  color: #cfdad5;
}
.st-num {
  width: 90rpx;
  text-align: center;
  font-size: 27rpx;
  font-weight: 700;
}
.sh-hint {
  display: block;
  font-size: 19rpx;
  color: #9aa7a1;
  margin-top: 14rpx;
}
.sh-btn {
  margin-top: 24rpx;
}
.safe-bottom {
  height: 10rpx;
}

/* 缺省 */
.miss {
  padding: 160rpx 40rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.miss-emoji {
  font-size: 92rpx;
}
.miss-txt {
  font-size: 25rpx;
  color: #7c8a84;
  margin-top: 16rpx;
}
.miss-btn {
  margin-top: 30rpx;
  padding: 0 44rpx;
  height: 76rpx;
}
</style>

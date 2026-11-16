<template>
  <view class="page plot-page">
    <!-- 头图 -->
    <view class="cover" :style="{ background: coverBg }">
      <view class="status" :style="{ height: statusBar + 'px' }" />
      <view class="cover-nav">
        <view class="cn-btn" @tap="back">
          <icon-svg name="back" :size="32" color="#FFFFFF" :stroke="2" />
        </view>
        <view class="cn-btn" @tap="share">
          <icon-svg name="share" :size="30" color="#FFFFFF" :stroke="1.8" />
        </view>
      </view>
      <text class="cover-emoji">{{ plot.emoji }}</text>
      <view class="cover-mask" />
    </view>

    <!-- 标题 -->
    <view class="head-card">
      <view class="h-top">
        <view class="row flex1">
          <text class="p-code">{{ plot.code }} 号地</text>
          <view v-if="!plot.full" class="state">{{ plot.few ? '仅剩 ' + plot.leftCount + ' 块' : '可认养' }}</view>
          <view v-else class="state off">已认满</view>
        </view>
        <text class="p-score">★ {{ plot.rating }}</text>
      </view>
      <text class="p-name">{{ plot.farm.name }}</text>
      <text class="p-hl">{{ plot.highlight }}</text>
      <view class="p-tags">
        <text v-for="t in plot.tags" :key="t" class="p-tag">{{ t }}</text>
      </view>
      <view class="p-meta">
        <view class="pm">
          <text class="pm-num">{{ plot.area }}㎡</text>
          <text class="pm-label">地块面积</text>
        </view>
        <view class="pm">
          <text class="pm-num">{{ plot.rows }} 垄</text>
          <text class="pm-label">可种垄数</text>
        </view>
        <view class="pm">
          <text class="pm-num">{{ plot.adoptedCount }}</text>
          <text class="pm-label">已认养户</text>
        </view>
      </view>
    </view>

    <view class="body">
      <!-- 地块档案 -->
      <view class="card sec">
        <view class="sec-head">
          <icon-svg name="leaf" :size="30" color="#06A96A" :stroke="1.7" />
          <text class="sec-title">地块档案</text>
        </view>
        <view class="arch">
          <view class="arch-item">
            <text class="a-label">土壤</text>
            <text class="a-value">{{ plot.soil }}</text>
          </view>
          <view class="arch-item">
            <text class="a-label">光照</text>
            <text class="a-value">{{ plot.sun }}</text>
          </view>
          <view class="arch-item">
            <text class="a-label">灌溉</text>
            <text class="a-value">{{ plot.water }}</text>
          </view>
          <view class="arch-item">
            <text class="a-label">海拔</text>
            <text class="a-value">{{ plot.altitude }} 米</text>
          </view>
        </view>
      </view>

      <!-- 选作物 -->
      <view class="card sec">
        <view class="sec-head">
          <icon-svg name="sprout" :size="30" color="#06A96A" :stroke="1.7" />
          <text class="sec-title">这季种什么</text>
          <text class="sec-tip">可多选，最多 3 种</text>
        </view>
        <view class="crops">
          <view
            v-for="c in plot.cropList"
            :key="c.id"
            class="crop"
            :class="{ on: cropIds.includes(c.id) }"
            @tap="toggleCrop(c.id)"
          >
            <view class="crop-ico" :style="{ background: 'linear-gradient(150deg, ' + c.bg[0] + ', ' + c.bg[1] + ')' }">
              <text class="crop-emoji">{{ c.emoji }}</text>
            </view>
            <view class="flex1">
              <view class="row between">
                <text class="crop-name">{{ c.name }}</text>
                <text v-if="c.extra" class="crop-extra">+¥{{ c.extra }} 种苗</text>
                <text v-else class="crop-extra free">种苗已含</text>
              </view>
              <text class="crop-meta">{{ c.season }} · 约 {{ c.days }} 天可收 · {{ c.yieldText }}</text>
            </view>
            <view class="crop-check" :class="{ on: cropIds.includes(c.id) }">
              <icon-svg v-if="cropIds.includes(c.id)" name="check" :size="18" color="#FFFFFF" :stroke="3.4" />
            </view>
          </view>
        </view>
      </view>

      <!-- 认养方式 -->
      <view class="card sec">
        <view class="sec-head">
          <icon-svg name="users" :size="30" color="#06A96A" :stroke="1.7" />
          <text class="sec-title">怎么种</text>
          <text class="sec-tip">服务费一次性</text>
        </view>
        <view class="plans">
          <view
            v-for="p in ADOPT_PLANS"
            :key="p.key"
            class="plan"
            :class="{ on: planKey === p.key }"
            @tap="planKey = p.key"
          >
            <view class="plan-top">
              <text class="plan-emoji">{{ p.emoji }}</text>
              <text class="plan-name">{{ p.name }}</text>
              <view v-if="p.hot" class="plan-hot">推荐</view>
              <text class="plan-fee">{{ p.fee ? '+¥' + p.fee : '免费' }}</text>
            </view>
            <text class="plan-desc">{{ p.desc }}</text>
            <view v-if="planKey === p.key" class="plan-points">
              <view v-for="pt in p.points" :key="pt" class="pp">
                <view class="pp-dot" />
                <text class="pp-txt">{{ pt }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 认养周期 -->
      <view class="card sec">
        <view class="sec-head">
          <icon-svg name="calendar" :size="30" color="#06A96A" :stroke="1.7" />
          <text class="sec-title">认养多久</text>
        </view>
        <view class="cycles">
          <view
            v-for="c in ADOPT_CYCLES"
            :key="c.key"
            class="cycle"
            :class="{ on: cycleKey === c.key }"
            @tap="cycleKey = c.key"
          >
            <text class="cycle-name">{{ c.name }}</text>
            <text class="cycle-tip">{{ c.tip }}</text>
          </view>
        </view>
      </view>

      <!-- 费用 -->
      <view class="card sec">
        <view class="sec-head">
          <icon-svg name="wallet" :size="30" color="#06A96A" :stroke="1.7" />
          <text class="sec-title">费用明细</text>
        </view>
        <view class="fee">
          <view class="fee-row">
            <text class="fee-label">地块认养费 · {{ currentCycle.name }}</text>
            <text class="fee-value">¥{{ price.base }}</text>
          </view>
          <view v-if="price.serviceFee" class="fee-row">
            <text class="fee-label">服务费 · {{ currentPlan.name }}</text>
            <text class="fee-value">¥{{ price.serviceFee }}</text>
          </view>
          <view v-if="price.seedFee" class="fee-row">
            <text class="fee-label">种苗附加费</text>
            <text class="fee-value">¥{{ price.seedFee }}</text>
          </view>
          <view class="fee-line" />
          <view class="fee-row">
            <text class="fee-total-label">合计</text>
            <view class="row">
              <text class="fee-total">¥{{ price.total }}</text>
              <text class="fee-save">已省 ¥{{ price.save }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="notice">
        <text class="notice-txt">认养成功后可在「我的认养」查看电子证书、农事日志与配送日历；未开始种植前可全额退养。</text>
      </view>
    </view>

    <!-- 底栏 -->
    <view class="bar safe-bottom">
      <view class="bar-price">
        <view class="row bar-price-row">
          <text class="bp-sym">¥</text>
          <text class="bp-num">{{ price.total }}</text>
        </view>
        <text class="bp-tip">{{ selectedCrops.length || 0 }} 种作物 · {{ currentCycle.name }}</text>
      </view>
      <view class="btn btn-primary bar-btn" :class="{ 'btn-disabled': plot.full }" @tap="submit">
        {{ plot.full ? '已被认满' : '立即认养' }}
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import * as api from '@/api/index.js'
import { ADOPT_PLANS, ADOPT_CYCLES } from '@/api/index.js'
import { setAdoptDraft } from '@/store/index.js'
import { toast } from '@/common/utils.js'

const statusBar = ref(20)
try {
  const info = uni.getStorageSync('sys_info')
  if (info && info.statusBarHeight) statusBar.value = info.statusBarHeight
} catch (e) {}

const plotId = ref('ap1')
try {
  const pages = getCurrentPages()
  const cur = pages[pages.length - 1]
  if (cur && cur.options && cur.options.id) plotId.value = cur.options.id
} catch (e) {}

const plot = computed(() => api.plotView(api.findPlot(plotId.value)) || api.plotView(api.ADOPT_PLOTS[0]))
const coverBg = computed(() => `linear-gradient(160deg, ${plot.value.bg[0]}, ${plot.value.bg[1]})`)

const cropIds = ref([plot.value.crops[0]])
const planKey = ref('full')
const cycleKey = ref('q1')

const currentPlan = computed(() => api.planOf(planKey.value))
const currentCycle = computed(() => api.cycleOf(cycleKey.value))
const selectedCrops = computed(() => cropIds.value.map(api.findCrop).filter(Boolean))
const price = computed(() =>
  api.calcAdoptPrice({
    plot: plot.value,
    planKey: planKey.value,
    cycleKey: cycleKey.value,
    cropIds: cropIds.value
  })
)

function toggleCrop(id) {
  const list = cropIds.value
  const idx = list.indexOf(id)
  if (idx > -1) {
    if (list.length === 1) return toast('至少留一种作物')
    list.splice(idx, 1)
    return
  }
  if (list.length >= 3) return toast('一块地最多种 3 种，多了长不好')
  list.push(id)
}

function back() {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack()
  else uni.navigateTo({ url: '/pages/farm/adopt' })
}

function share() {
  uni.showActionSheet({ itemList: ['分享给好友', '生成地块名片', '复制链接'] })
}

function submit() {
  if (plot.value.full) return toast('这块地已经被认满了')
  if (!cropIds.value.length) return toast('先选一种作物吧')
  setAdoptDraft({
    plotId: plot.value.id,
    cropIds: cropIds.value.slice(),
    planKey: planKey.value,
    cycleKey: cycleKey.value
  })
  uni.navigateTo({ url: '/pages/farm/adopt-confirm' })
}
</script>

<style scoped>
.plot-page {
  padding-bottom: 180rpx;
}
.cover {
  height: 420rpx;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.cover-nav {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 0 24rpx;
  padding-top: 8rpx;
  z-index: 3;
}
.cn-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.24);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 80rpx;
}
.cover-emoji {
  font-size: 200rpx;
  filter: drop-shadow(0 16rpx 24rpx rgba(30, 70, 50, 0.18));
}
.cover-mask {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.16) 0%, rgba(255, 255, 255, 0) 50%);
}

.head-card {
  background: #fff;
  border-radius: 34rpx 34rpx 0 0;
  margin-top: -46rpx;
  padding: 26rpx 28rpx 24rpx;
  position: relative;
  z-index: 2;
}
.h-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.p-code {
  font-size: 22rpx;
  font-weight: 700;
  color: #0a8f5c;
  background: #e9faf2;
  padding: 6rpx 16rpx;
  border-radius: 10rpx;
}
.state {
  font-size: 19rpx;
  color: #ff6b3d;
  background: #fff2ec;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  margin-left: 12rpx;
}
.state.off {
  color: #9aa7a1;
  background: #f2f5f3;
}
.p-score {
  font-size: 21rpx;
  color: #ff9d2e;
  font-weight: 600;
}
.p-name {
  display: block;
  font-size: 38rpx;
  font-weight: 800;
  margin-top: 18rpx;
}
.p-hl {
  display: block;
  font-size: 23rpx;
  color: #5c6a64;
  line-height: 1.6;
  margin-top: 10rpx;
}
.p-tags {
  display: flex;
  gap: 10rpx;
  margin-top: 14rpx;
  flex-wrap: wrap;
}
.p-tag {
  font-size: 19rpx;
  color: #0a8f5c;
  background: #f2fbf6;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
}
.p-meta {
  display: flex;
  margin-top: 22rpx;
  background: #f7faf8;
  border-radius: 20rpx;
  padding: 16rpx 0;
}
.pm {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.pm-num {
  font-size: 28rpx;
  font-weight: 800;
  color: #14201b;
}
.pm-label {
  font-size: 18rpx;
  color: #9aa7a1;
  margin-top: 4rpx;
}

.body {
  padding: 0 24rpx;
}
.sec {
  margin-top: 20rpx;
  padding: 26rpx 24rpx;
}
.sec-head {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 20rpx;
}
.sec-title {
  font-size: 28rpx;
  font-weight: 700;
  flex: 1;
}
.sec-tip {
  font-size: 19rpx;
  color: #9aa7a1;
}

/* 档案 */
.arch {
  display: flex;
  flex-wrap: wrap;
}
.arch-item {
  width: 50%;
  padding: 12rpx 0;
}
.a-label {
  font-size: 20rpx;
  color: #9aa7a1;
  display: block;
}
.a-value {
  font-size: 23rpx;
  color: #16201c;
  margin-top: 4rpx;
  display: block;
}

/* 作物 */
.crops {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.crop {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx;
  border-radius: 20rpx;
  background: #f7faf8;
  border: 2rpx solid #f7faf8;
}
.crop.on {
  background: #f2fbf6;
  border-color: #b9ecd4;
}
.crop-ico {
  width: 84rpx;
  height: 84rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.crop-emoji {
  font-size: 44rpx;
}
.crop-name {
  font-size: 25rpx;
  font-weight: 600;
}
.crop-extra {
  font-size: 18rpx;
  color: #ff6b3d;
}
.crop-extra.free {
  color: #9aa7a1;
}
.crop-meta {
  display: block;
  font-size: 19rpx;
  color: #7c8a84;
  margin-top: 6rpx;
}
.crop-check {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 2rpx solid #d5dfda;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.crop-check.on {
  background: #0fc97a;
  border-color: #0fc97a;
}

/* 套餐 */
.plans {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.plan {
  padding: 18rpx;
  border-radius: 20rpx;
  background: #f7faf8;
  border: 2rpx solid #f7faf8;
}
.plan.on {
  background: #f2fbf6;
  border-color: #b9ecd4;
}
.plan-top {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.plan-emoji {
  font-size: 30rpx;
}
.plan-name {
  font-size: 25rpx;
  font-weight: 700;
}
.plan-hot {
  font-size: 17rpx;
  color: #fff;
  background: #ff6b3d;
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
}
.plan-fee {
  margin-left: auto;
  font-size: 22rpx;
  font-weight: 700;
  color: #ff4b3a;
}
.plan-desc {
  display: block;
  font-size: 20rpx;
  color: #7c8a84;
  margin-top: 8rpx;
}
.plan-points {
  margin-top: 14rpx;
  padding-top: 14rpx;
  border-top: 2rpx dashed #dcebe3;
}
.pp {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 8rpx;
}
.pp-dot {
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: #0fc97a;
}
.pp-txt {
  font-size: 20rpx;
  color: #3d4a45;
}

/* 周期 */
.cycles {
  display: flex;
  gap: 12rpx;
}
.cycle {
  flex: 1;
  padding: 18rpx 0;
  border-radius: 18rpx;
  background: #f7faf8;
  border: 2rpx solid #f7faf8;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.cycle.on {
  background: #f2fbf6;
  border-color: #0fc97a;
}
.cycle-name {
  font-size: 25rpx;
  font-weight: 700;
}
.cycle-tip {
  font-size: 18rpx;
  color: #0a8f5c;
  margin-top: 4rpx;
}

/* 费用 */
.fee {
  display: flex;
  flex-direction: column;
}
.fee-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10rpx 0;
}
.fee-label {
  font-size: 22rpx;
  color: #5c6a64;
}
.fee-value {
  font-size: 23rpx;
  color: #16201c;
}
.fee-line {
  height: 2rpx;
  background: #f0f4f2;
  margin: 8rpx 0;
}
.fee-total-label {
  font-size: 23rpx;
  font-weight: 700;
}
.fee-total {
  font-size: 34rpx;
  font-weight: 800;
  color: #ff4b3a;
}
.fee-save {
  font-size: 18rpx;
  color: #0a8f5c;
  background: #f2fbf6;
  padding: 3rpx 10rpx;
  border-radius: 6rpx;
  margin-left: 10rpx;
}
.notice {
  margin-top: 20rpx;
  padding: 0 6rpx;
}
.notice-txt {
  font-size: 19rpx;
  color: #9aa7a1;
  line-height: 1.6;
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

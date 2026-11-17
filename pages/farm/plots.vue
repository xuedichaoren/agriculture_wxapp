<template>
  <view class="page plots-page">
    <nav-bar title="我的地" bg="#F4F8F5">
      <template #right>
        <view class="nav-add" @tap="toNew">
          <text class="nav-add-txt">＋ 发布</text>
        </view>
      </template>
    </nav-bar>

    <!-- 概览 -->
    <view class="hero">
      <view class="h-top">
        <text class="h-t">被认养概况</text>
        <text class="h-tip">名额满了会自动停止招募</text>
      </view>
      <view class="h-grid">
        <view class="hg">
          <text class="hg-n">{{ stats.recruiting }}</text>
          <text class="hg-l">招募中</text>
        </view>
        <view class="hg">
          <text class="hg-n">{{ stats.booked }}<text class="hg-u">/{{ stats.seats }}</text></text>
          <text class="hg-l">已被认养份数</text>
        </view>
        <view class="hg">
          <text class="hg-n">{{ stats.adopters }}</text>
          <text class="hg-l">认养人</text>
        </view>
        <view class="hg">
          <text class="hg-n">{{ stats.monthIncome }}</text>
          <text class="hg-l">本月认养收入</text>
        </view>
      </view>
    </view>

    <!-- 待确认申请 -->
    <view v-if="stats.pendingApps" class="app-bar" @tap="toApps">
      <view class="ab-ico">
        <text class="ab-e">📩</text>
      </view>
      <view class="flex1">
        <text class="ab-t">有 {{ stats.pendingApps }} 条认养申请等你确认</text>
        <text class="ab-s">确认后名额立即占用，认养人也会收到通知</text>
      </view>
      <text class="ab-go">去处理 ›</text>
    </view>

    <!-- 筛选 -->
    <scroll-view scroll-x class="filters no-scrollbar" :show-scrollbar="false">
      <view class="filters-in">
        <view
          v-for="f in filters"
          :key="f.key"
          class="f"
          :class="{ on: tab === f.key }"
          @tap="tab = f.key"
        >
          <text class="f-t">{{ f.name }}</text>
          <text v-if="f.count" class="f-c">{{ f.count }}</text>
        </view>
      </view>
    </scroll-view>

    <view class="list">
      <view v-for="p in list" :key="p.id" class="plot" @tap="toManage(p)">
        <view class="p-head">
          <view class="p-ico" :style="{ background: 'linear-gradient(150deg, ' + p.bg[0] + ', ' + p.bg[1] + ')' }">
            <text class="p-emoji">{{ p.emoji }}</text>
          </view>
          <view class="flex1">
            <view class="row between">
              <text class="p-name">{{ p.name }}</text>
              <ui-tag :text="p.statusText" :tone="p.statusTone" size="sm" />
            </view>
            <text class="p-meta">{{ p.code }} 号 · {{ p.area }}㎡ · {{ p.cropsText }}</text>
            <view class="p-tags">
              <text v-for="t in p.tags.slice(0, 2)" :key="t" class="p-tag">{{ t }}</text>
            </view>
          </view>
        </view>

        <!-- 名额进度 -->
        <view class="seats">
          <view class="s-top">
            <text class="s-l">认养名额</text>
            <text class="s-v">
              已认养 <text class="s-hl">{{ p.booked }}</text> / {{ p.capacity }} 份
              <text v-if="p.left > 0" class="s-left">· 还剩 {{ p.left }}</text>
              <text v-else class="s-full">· 已满</text>
            </text>
          </view>
          <view class="s-bar">
            <view class="s-fill" :style="{ width: p.ratio + '%' }" />
          </view>
        </view>

        <!-- 认养人 + 收入 -->
        <view class="p-foot">
          <view class="avatars">
            <view v-for="a in p.adopters" :key="a.name" class="av">
              <text class="av-e">{{ a.avatar }}</text>
            </view>
            <view v-if="p.moreAdopters" class="av more">
              <text class="av-e">+{{ p.moreAdopters }}</text>
            </view>
            <text v-if="!p.adopterTotal" class="av-none">还没有人认养，发条长势试试</text>
            <text v-else class="av-total">{{ p.adopterTotal }} 位认养人</text>
          </view>
          <view class="pinc">
            <text class="pinc-n">￥{{ p.monthIncome }}</text>
            <text class="pinc-l">本月</text>
          </view>
        </view>

        <!-- 操作 -->
        <view class="acts">
          <view class="act" @tap.stop="toManage(p)">认养管理</view>
          <view class="act" @tap.stop="toPush(p)">发长势</view>
          <view class="act" :class="{ warn: !paused(p) }" @tap.stop="togglePause(p)">
            {{ paused(p) ? '恢复招募' : '暂停招募' }}
          </view>
        </view>
      </view>

      <empty-box
        v-if="!list.length"
        emoji="🌱"
        :text="tab === 'all' ? '还没有发布地块' : '这个状态下没有地块'"
        sub="把地的情况写清楚，认养人才敢下单：土质、光照、种什么、能收多少"
        btn-text="发布第一块地"
        @action="toNew"
      />
    </view>

    <view class="foot">
      <view class="foot-btn" @tap="toNew">
        <text class="fb-t">＋ 发布新地块</text>
      </view>
    </view>

    <tab-bar active="plots" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import {
  farmPlots,
  farmStats,
  setPlotStatus,
  isPaused,
  farmSide
} from '@/store/farm-side.js'
import { toast } from '@/common/utils.js'

const tab = ref('all')
const tick = ref(0)

const stats = computed(() => {
  void tick.value
  void farmSide.plots
  void farmSide.newIns
  void farmSide.apps
  return farmStats()
})

const filters = computed(() => {
  const s = stats.value
  return [
    { key: 'all', name: '全部', count: s.plotCount },
    { key: 'recruiting', name: '招募中', count: s.recruiting },
    { key: 'full', name: '已满员', count: s.full },
    { key: 'paused', name: '已下架', count: s.paused }
  ]
})

const list = computed(() => {
  void tick.value
  void farmSide.plots
  void farmSide.newIns
  return farmPlots({ status: tab.value })
})

function paused(p) {
  return p.status === 'paused'
}

function togglePause(p) {
  if (paused(p)) {
    setPlotStatus(p.id, 'recruiting')
    toast('已恢复招募')
    tick.value++
    return
  }
  uni.showModal({
    title: '暂停招募',
    content: '暂停后不再出现在认养大厅，但已有的 ' + p.booked + ' 位认养人照常履约，不受影响。',
    confirmText: '暂停招募',
    confirmColor: '#E08A2B',
    success: (r) => {
      if (!r.confirm) return
      setPlotStatus(p.id, 'paused')
      tick.value++
      toast('已下架，可在「已下架」里恢复')
    }
  })
}

function toManage(p) {
  uni.navigateTo({ url: '/pages/farm/plot-manage?id=' + p.id })
}

function toPush(p) {
  uni.navigateTo({ url: '/pages/farm/plot-manage?id=' + p.id + '&act=push' })
}

function toApps() {
  uni.navigateTo({ url: '/pages/farm/adopt-in?type=app' })
}

function toNew() {
  uni.navigateTo({ url: '/pages/farm/plot-new' })
}

onShow(() => {
  tick.value++
})
</script>

<style scoped>
.plots-page {
  min-height: 100vh;
  background: #f4f8f5;
  padding-bottom: 200rpx;
}
.nav-add {
  padding: 10rpx 20rpx;
  border-radius: 40rpx;
  background: #fff3e2;
}
.nav-add-txt {
  font-size: 22rpx;
  color: #d97e1c;
  font-weight: 700;
}

/* 概览 */
.hero {
  margin: 8rpx 24rpx 0;
  background: linear-gradient(150deg, #f0a04b 0%, #e08a2b 62%, #cc7a17 100%);
  border-radius: 26rpx;
  padding: 24rpx 22rpx 22rpx;
  box-shadow: 0 12rpx 30rpx rgba(224, 138, 43, 0.22);
}
.h-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18rpx;
}
.h-t {
  font-size: 25rpx;
  font-weight: 700;
  color: #fff;
}
.h-tip {
  font-size: 17rpx;
  color: rgba(255, 255, 255, 0.72);
}
.h-grid {
  display: flex;
}
.hg {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}
.hg-n {
  font-size: 32rpx;
  font-weight: 800;
  color: #fff;
}
.hg-u {
  font-size: 20rpx;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.72);
}
.hg-l {
  font-size: 17rpx;
  color: rgba(255, 255, 255, 0.72);
}

/* 申请条 */
.app-bar {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin: 18rpx 24rpx 0;
  padding: 16rpx 18rpx;
  background: #fff8ec;
  border: 2rpx solid #ffe3bd;
  border-radius: 20rpx;
}
.ab-ico {
  width: 60rpx;
  height: 60rpx;
  border-radius: 18rpx;
  background: #ffeed6;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.ab-e {
  font-size: 30rpx;
}
.ab-t {
  display: block;
  font-size: 23rpx;
  font-weight: 700;
  color: #8a5a10;
}
.ab-s {
  display: block;
  font-size: 18rpx;
  color: #b58a46;
  margin-top: 3rpx;
}
.ab-go {
  font-size: 21rpx;
  color: #d97e1c;
  font-weight: 700;
}

/* 筛选 */
.filters {
  margin-top: 20rpx;
}
.filters-in {
  display: flex;
  gap: 12rpx;
  padding: 0 24rpx;
}
.f {
  padding: 12rpx 22rpx;
  border-radius: 40rpx;
  background: #fff;
  display: flex;
  align-items: center;
  gap: 6rpx;
  flex-shrink: 0;
}
.f.on {
  background: #16201c;
}
.f-t {
  font-size: 21rpx;
  color: #5c6a64;
}
.f.on .f-t {
  color: #fff;
  font-weight: 700;
}
.f-c {
  font-size: 17rpx;
  color: #b3bfba;
}
.f.on .f-c {
  color: rgba(255, 255, 255, 0.6);
}

/* 地块卡 */
.list {
  padding: 18rpx 24rpx 0;
}
.plot {
  background: #fff;
  border-radius: 24rpx;
  padding: 22rpx;
  margin-bottom: 18rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}
.p-head {
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
}
.p-ico {
  width: 92rpx;
  height: 92rpx;
  border-radius: 22rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.p-emoji {
  font-size: 46rpx;
}
.p-name {
  font-size: 26rpx;
  font-weight: 700;
  color: #16201c;
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.p-meta {
  display: block;
  font-size: 19rpx;
  color: #8b978f;
  margin-top: 6rpx;
}
.p-tags {
  display: flex;
  gap: 8rpx;
  margin-top: 8rpx;
}
.p-tag {
  font-size: 16rpx;
  color: #b58a46;
  background: #fff8ec;
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
}

/* 名额 */
.seats {
  margin-top: 18rpx;
  background: #fbfcfa;
  border-radius: 16rpx;
  padding: 14rpx 16rpx;
}
.s-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.s-l {
  font-size: 19rpx;
  color: #8b978f;
}
.s-v {
  font-size: 19rpx;
  color: #3d4a45;
}
.s-hl {
  font-size: 23rpx;
  font-weight: 800;
  color: #d97e1c;
}
.s-left {
  color: #06a96a;
}
.s-full {
  color: #4a8cff;
}
.s-bar {
  height: 10rpx;
  border-radius: 10rpx;
  background: #eceee9;
  margin-top: 10rpx;
  overflow: hidden;
}
.s-fill {
  height: 10rpx;
  border-radius: 10rpx;
  background: linear-gradient(90deg, #f7b45c, #e08a2b);
}

/* 认养人 */
.p-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
}
.avatars {
  display: flex;
  align-items: center;
}
.av {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  background: #f3f6f4;
  border: 2rpx solid #fff;
  margin-left: -10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.av:first-child {
  margin-left: 0;
}
.av.more {
  background: #fff3e2;
}
.av-e {
  font-size: 22rpx;
}
.av-total {
  font-size: 18rpx;
  color: #9aa7a1;
  margin-left: 10rpx;
}
.av-none {
  font-size: 18rpx;
  color: #c3ccc8;
}
.pinc {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}
.pinc-n {
  font-size: 26rpx;
  font-weight: 800;
  color: #d97e1c;
}
.pinc-l {
  font-size: 16rpx;
  color: #b3bfba;
}

/* 操作 */
.acts {
  display: flex;
  gap: 10rpx;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 2rpx solid #f5f7f5;
}
.act {
  flex: 1;
  height: 62rpx;
  border-radius: 31rpx;
  background: #fff8ec;
  color: #d97e1c;
  font-size: 21rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}
.act.warn {
  background: #f5f7f5;
  color: #7c8a84;
}

/* 底部按钮 */
.foot {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 120rpx;
  padding: 0 24rpx;
}
.foot-btn {
  height: 84rpx;
  border-radius: 42rpx;
  background: linear-gradient(135deg, #f7b45c, #e08a2b);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 24rpx rgba(224, 138, 43, 0.28);
}
.fb-t {
  font-size: 26rpx;
  font-weight: 700;
  color: #fff;
}
</style>

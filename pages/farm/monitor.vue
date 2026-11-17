<template>
  <view class="page monitor">
    <nav-bar title="云监工" bg="#0E2A21" light>
      <template #right>
        <view class="nav-btn" @tap="more">
          <icon-svg name="more" :size="30" color="#FFFFFF" :stroke="2" />
        </view>
      </template>
    </nav-bar>

    <view v-if="!view" class="miss">
      <text class="miss-emoji">📷</text>
      <text class="miss-txt">没找到这条认养记录</text>
      <view class="btn btn-ghost miss-btn" @tap="toMy">我的认养</view>
    </view>

    <view v-else class="body">
      <!-- 直播画面 -->
      <view class="live">
        <view class="live-deco" />
        <view class="row between live-top">
          <view class="row live-badge">
            <view class="live-dot" />
            <text class="live-txt">LIVE</text>
            <text class="live-cam">{{ cam.name }} · {{ meta.bitrate }}</text>
          </view>
          <view class="row viewers">
            <icon-svg name="user" :size="20" color="rgba(255,255,255,0.78)" :stroke="1.8" />
            <text class="viewers-txt">{{ meta.viewers }} 人在看</text>
          </view>
        </view>

        <view class="frame">
          <view class="frame-glow" />
          <text class="frame-emoji">{{ view.emoji }}</text>
          <view class="scan" />
          <view class="corner tl" />
          <view class="corner tr" />
          <view class="corner bl" />
          <view class="corner br" />
          <text class="frame-tip">{{ cam.tip }}</text>
        </view>

        <view class="row between live-foot">
          <text class="live-code">{{ view.code }} 号地 · {{ view.farm.name }}</text>
          <text class="live-stamp">{{ meta.updatedAt }} 更新</text>
        </view>

        <view class="cams">
          <view
            v-for="c in cams"
            :key="c.key"
            class="cam"
            :class="{ on: camKey === c.key }"
            @tap="camKey = c.key"
          >
            <text class="cam-name">{{ c.name }}</text>
            <text class="cam-pos">{{ c.pos }}</text>
          </view>
        </view>
      </view>

      <!-- 环境读数 -->
      <view class="card sec env">
        <view class="row between sec-head">
          <text class="sec-title">地里现在</text>
          <text class="sec-sub">{{ meta.since }}</text>
        </view>
        <view class="env-grid">
          <view v-for="e in env" :key="e.key" class="env-item">
            <text class="env-label">{{ e.label }}</text>
            <view class="row env-val">
              <text class="env-num">{{ e.value }}</text>
              <text class="env-unit">{{ e.unit }}</text>
            </view>
            <text class="env-trend" :class="{ up: e.up && !e.flat, down: !e.up && !e.flat }">
              {{ e.flat ? '与昨日持平' : (e.up ? '↑ ' : '↓ ') + e.trendText + ' 较昨日' }}
            </text>
          </view>
        </view>
        <view class="soil">
          <icon-svg name="leaf" :size="24" color="#7C8A84" :stroke="1.7" />
          <text class="soil-txt">{{ soil.name }} · pH {{ soil.ph }} · {{ view.plot ? view.plot.water : '--' }}</text>
        </view>
      </view>

      <!-- 远程派单 -->
      <view class="card sec">
        <view class="row between sec-head">
          <text class="sec-title">让农场搭把手</text>
          <text class="sec-sub">派单 2 小时内处理</text>
        </view>
        <view class="cmds">
          <view v-for="c in commands" :key="c.key" class="cmd">
            <view class="cmd-ico">{{ c.emoji }}</view>
            <view class="flex1 cmd-main">
              <view class="row cmd-title">
                <text class="cmd-name">{{ c.name }}</text>
                <text v-if="c.fee" class="cmd-fee">￥{{ c.fee }}</text>
              </view>
              <text class="cmd-sub">{{ c.queued ? c.sentAt + ' · 农场主处理中' : c.sub }}</text>
            </view>
            <view
              class="cmd-btn"
              :class="{ on: c.queued, off: !c.queued && c.disabled }"
              @tap="dispatch(c)"
            >{{ c.queued ? '已派单' : '派单' }}</view>
          </view>
        </view>
        <text class="cmd-note">农事操作由农场老师傅执行，完成后会补一条农事记录</text>
      </view>

      <!-- 每日抓拍 -->
      <view class="card sec">
        <view class="row between sec-head">
          <text class="sec-title">每日抓拍</text>
          <text class="sec-sub">每天 8 点自动拍一张</text>
        </view>
        <scroll-view scroll-x class="snaps no-scrollbar" :show-scrollbar="false">
          <view v-for="s in snaps" :key="s.key" class="snap">
            <view class="snap-img" :style="{ background: 'linear-gradient(150deg, ' + snapBg[0] + ', ' + snapBg[1] + ')' }">
              <text class="snap-emoji">{{ s.emoji }}</text>
              <text class="snap-time">{{ s.time }}</text>
              <view v-if="s.today" class="snap-now">今天</view>
            </view>
            <text class="snap-date">{{ s.today ? '今天' : s.md }}</text>
            <text class="snap-tag">{{ s.tag }}</text>
          </view>
        </scroll-view>
      </view>

      <!-- 近 7 天温度 -->
      <view class="card sec">
        <view class="row between sec-head">
          <text class="sec-title">近 7 天日均温</text>
          <text class="sec-sub">℃</text>
        </view>
        <view class="bars">
          <view v-for="t in trend" :key="t.key" class="bar-wrap">
            <text class="bar-val">{{ t.value }}</text>
            <view class="bar-track">
              <view class="bar" :class="{ today: t.today }" :style="{ height: t.pct + '%' }" />
            </view>
            <text class="bar-label">{{ t.label }}</text>
          </view>
        </view>
      </view>

      <!-- 底部操作 -->
      <view class="acts">
        <view class="act" @tap="toChat">
          <icon-svg name="chat" :size="30" color="#0A8F5C" :stroke="1.8" />
          <text class="act-txt">呼叫农场主</text>
        </view>
        <view class="act" @tap="toCalendar">
          <icon-svg name="calendar" :size="30" color="#0A8F5C" :stroke="1.8" />
          <text class="act-txt">农事日志</text>
        </view>
      </view>

      <text class="foot-tip">摄像头仅对准你的地块，画面 30 天滚动覆盖</text>
      <view style="height: 50rpx" />
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { adoptionView } from '@/api/adopt-plan.js'
import { CAMS, liveViewOf, envOf, soilOf, snapshotsOf, trendSeriesOf, commandsOf } from '@/api/adopt-live.js'
import { findAdoption } from '@/store/index.js'
import { sentCommandsOf, sendPlotCommand } from '@/store/adopt-extra.js'
import { toast, copyText } from '@/common/utils.js'

const adoptionId = ref('')
try {
  const pages = getCurrentPages()
  const cur = pages[pages.length - 1]
  if (cur && cur.options && cur.options.id) adoptionId.value = cur.options.id
} catch (e) {}

const camKey = ref('cam1')
const cams = CAMS

const adoption = computed(() => findAdoption(adoptionId.value))
const view = computed(() => adoptionView(adoption.value))
const cam = computed(() => CAMS.find((c) => c.key === camKey.value) || CAMS[0])
const meta = computed(() => liveViewOf(adoption.value) || {})
const env = computed(() => envOf(adoption.value))
const soil = computed(() => soilOf(view.value && view.value.plot))
const snaps = computed(() => snapshotsOf(adoption.value, 8))
const trend = computed(() => trendSeriesOf(adoption.value, 7))
const commands = computed(() => commandsOf(adoption.value, sentCommandsOf(adoptionId.value)))

const snapBg = computed(() => {
  const p = view.value && view.value.plot
  return p && p.bg ? p.bg : ['#EAF7EE', '#CFEAD8']
})

function dispatch(item) {
  if (!view.value || !view.value.growing) return toast('这块地已经结束了，不能再派单')
  if (item.queued) return toast('已经派过单了，农场主正在处理')
  const content = item.fee
    ? `确认让农场安排「${item.name}」？费用 ￥${item.fee} 从认养余额扣除。`
    : `确认让农场安排「${item.name}」？本项免费。`
  uni.showModal({
    title: '派单给农场主',
    content,
    confirmText: '确认派单',
    success: (r) => {
      if (!r.confirm) return
      sendPlotCommand(adoptionId.value, item.key)
      toast('已派单，农场主 2 小时内处理')
    }
  })
}

function more() {
  uni.showActionSheet({
    itemList: ['复制地块信息', '看农事日志', '呼叫农场主'],
    success: (r) => {
      if (r.tapIndex === 0) {
        const v = view.value
        copyText(v ? `${v.code} 号地 · ${v.farm.name} · ${v.cropsText}` : '')
      } else if (r.tapIndex === 1) {
        toCalendar()
      } else {
        toChat()
      }
    }
  })
}

function toCalendar() {
  uni.navigateTo({ url: '/pages/farm/calendar?code=' + (view.value ? view.value.code : '') })
}

function toChat() {
  const fid = view.value && view.value.farmId ? view.value.farmId : 'f1'
  uni.navigateTo({ url: '/pages/message/chat?id=' + fid })
}

function toMy() {
  uni.redirectTo({ url: '/pages/farm/my' })
}
</script>

<style scoped>
.monitor {
  padding-bottom: 20rpx;
}
.nav-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 直播 */
.live {
  margin: 0 24rpx;
  margin-top: 10rpx;
  border-radius: 30rpx;
  padding: 20rpx 20rpx 0;
  background: linear-gradient(160deg, #123b2c 0%, #0d2b21 60%, #0a2119 100%);
  overflow: hidden;
  position: relative;
}
.live-deco {
  position: absolute;
  width: 340rpx;
  height: 340rpx;
  border-radius: 50%;
  right: -120rpx;
  top: -160rpx;
  background: rgba(255, 255, 255, 0.05);
}
.live-top {
  position: relative;
  z-index: 2;
}
.live-badge {
  gap: 8rpx;
}
.live-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #ff4b3a;
  box-shadow: 0 0 0 4rpx rgba(255, 75, 58, 0.25);
}
.live-txt {
  font-size: 20rpx;
  font-weight: 800;
  color: #fff;
  letter-spacing: 1rpx;
}
.live-cam {
  font-size: 19rpx;
  color: rgba(255, 255, 255, 0.55);
  margin-left: 8rpx;
}
.viewers {
  gap: 6rpx;
}
.viewers-txt {
  font-size: 19rpx;
  color: rgba(255, 255, 255, 0.7);
}

.frame {
  margin-top: 16rpx;
  height: 340rpx;
  border-radius: 22rpx;
  background: radial-gradient(circle at 50% 42%, #4a8a6c 0%, #2c5c46 42%, #14342a 100%);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.frame-glow {
  position: absolute;
  width: 380rpx;
  height: 380rpx;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0) 68%);
  top: -40rpx;
}
.frame-emoji {
  font-size: 130rpx;
  opacity: 0.9;
  position: relative;
  z-index: 2;
}
.scan {
  position: absolute;
  left: 0;
  right: 0;
  height: 3rpx;
  background: linear-gradient(90deg, rgba(22, 212, 136, 0) 0%, rgba(22, 212, 136, 0.75) 50%, rgba(22, 212, 136, 0) 100%);
  animation: scanMove 3.6s linear infinite;
}
@keyframes scanMove {
  0% {
    top: 12%;
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  85% {
    opacity: 1;
  }
  100% {
    top: 88%;
    opacity: 0;
  }
}
.corner {
  position: absolute;
  width: 30rpx;
  height: 30rpx;
  border: 3rpx solid rgba(255, 255, 255, 0.42);
}
.corner.tl {
  left: 18rpx;
  top: 18rpx;
  border-right: 0;
  border-bottom: 0;
  border-radius: 8rpx 0 0 0;
}
.corner.tr {
  right: 18rpx;
  top: 18rpx;
  border-left: 0;
  border-bottom: 0;
  border-radius: 0 8rpx 0 0;
}
.corner.bl {
  left: 18rpx;
  bottom: 18rpx;
  border-right: 0;
  border-top: 0;
  border-radius: 0 0 0 8rpx;
}
.corner.br {
  right: 18rpx;
  bottom: 18rpx;
  border-left: 0;
  border-top: 0;
  border-radius: 0 0 8rpx 0;
}
.frame-tip {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 22rpx;
  text-align: center;
  font-size: 19rpx;
  color: rgba(255, 255, 255, 0.55);
}
.live-foot {
  margin-top: 16rpx;
}
.live-code {
  font-size: 21rpx;
  color: rgba(255, 255, 255, 0.82);
  font-weight: 600;
}
.live-stamp {
  font-size: 18rpx;
  color: rgba(255, 255, 255, 0.42);
}

.cams {
  display: flex;
  gap: 10rpx;
  margin-top: 16rpx;
  padding-bottom: 20rpx;
}
.cam {
  flex: 1;
  padding: 12rpx 10rpx;
  border-radius: 16rpx;
  background: rgba(255, 255, 255, 0.07);
  border: 2rpx solid transparent;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.cam.on {
  background: rgba(22, 212, 136, 0.16);
  border-color: rgba(22, 212, 136, 0.5);
}
.cam-name {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
}
.cam-pos {
  font-size: 17rpx;
  color: rgba(255, 255, 255, 0.45);
  margin-top: 2rpx;
}

/* 卡片通用 */
.sec {
  margin: 20rpx 24rpx 0;
  padding: 24rpx;
}
.sec-head {
  margin-bottom: 18rpx;
}
.sec-title {
  font-size: 27rpx;
  font-weight: 700;
}
.sec-sub {
  font-size: 19rpx;
  color: #9aa7a1;
}

/* 环境 */
.env-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
}
.env-item {
  width: calc((100% - 14rpx) / 2);
  background: #f7faf8;
  border-radius: 20rpx;
  padding: 18rpx 20rpx;
}
.env-label {
  font-size: 20rpx;
  color: #7c8a84;
}
.env-val {
  align-items: baseline;
  margin-top: 4rpx;
}
.env-num {
  font-size: 40rpx;
  font-weight: 800;
  color: #16201c;
  line-height: 1.1;
}
.env-unit {
  font-size: 19rpx;
  color: #7c8a84;
  margin-left: 4rpx;
}
.env-trend {
  font-size: 18rpx;
  color: #9aa7a1;
}
.env-trend.up {
  color: #ff8a3d;
}
.env-trend.down {
  color: #2f9ae0;
}
.soil {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 16rpx;
  padding-top: 16rpx;
  border-top: 2rpx solid #f2f5f3;
}
.soil-txt {
  font-size: 20rpx;
  color: #7c8a84;
}

/* 派单 */
.cmd {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 16rpx 0;
  border-bottom: 2rpx solid #f4f7f5;
}
.cmd:last-child {
  border-bottom: 0;
}
.cmd-ico {
  width: 68rpx;
  height: 68rpx;
  border-radius: 20rpx;
  background: #f2fbf6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 34rpx;
  flex-shrink: 0;
}
.cmd-title {
  gap: 10rpx;
}
.cmd-name {
  font-size: 25rpx;
  font-weight: 600;
}
.cmd-fee {
  font-size: 18rpx;
  color: #ff4b3a;
  background: #fff5f3;
  padding: 2rpx 10rpx;
  border-radius: 6rpx;
}
.cmd-sub {
  display: block;
  font-size: 19rpx;
  color: #9aa7a1;
  margin-top: 4rpx;
}
.cmd-btn {
  flex-shrink: 0;
  height: 56rpx;
  padding: 0 26rpx;
  border-radius: 28rpx;
  background: #e9faf2;
  color: #06a96a;
  font-size: 21rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cmd-btn.on {
  background: #f2f5f3;
  color: #9aa7a1;
}
.cmd-btn.off {
  background: #f7f9f8;
  color: #c3ccc8;
}
.cmd-note {
  display: block;
  font-size: 18rpx;
  color: #b3bfba;
  margin-top: 14rpx;
  line-height: 1.5;
}

/* 抓拍 */
.snaps {
  white-space: nowrap;
}
.snap {
  display: inline-flex;
  flex-direction: column;
  width: 168rpx;
  margin-right: 14rpx;
}
.snap-img {
  width: 168rpx;
  height: 168rpx;
  border-radius: 18rpx;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.snap-emoji {
  font-size: 68rpx;
}
.snap-time {
  position: absolute;
  left: 10rpx;
  bottom: 8rpx;
  font-size: 17rpx;
  color: #fff;
  background: rgba(0, 0, 0, 0.34);
  padding: 2rpx 8rpx;
  border-radius: 6rpx;
}
.snap-now {
  position: absolute;
  right: 8rpx;
  top: 8rpx;
  font-size: 16rpx;
  color: #fff;
  background: #06a96a;
  padding: 2rpx 8rpx;
  border-radius: 6rpx;
}
.snap-date {
  font-size: 19rpx;
  color: #3d4a45;
  margin-top: 8rpx;
}
.snap-tag {
  font-size: 17rpx;
  color: #9aa7a1;
}

/* 温度柱 */
.bars {
  display: flex;
  align-items: flex-end;
  gap: 10rpx;
  padding-top: 10rpx;
}
.bar-wrap {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.bar-val {
  font-size: 17rpx;
  color: #7c8a84;
  margin-bottom: 6rpx;
}
.bar-track {
  width: 26rpx;
  height: 180rpx;
  border-radius: 13rpx;
  background: #f4f7f5;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}
.bar {
  width: 100%;
  border-radius: 13rpx;
  background: linear-gradient(180deg, #b6ecd3 0%, #6fd6a8 100%);
}
.bar.today {
  background: linear-gradient(180deg, #16d488 0%, #0a8f5c 100%);
}
.bar-label {
  font-size: 17rpx;
  color: #9aa7a1;
  margin-top: 8rpx;
}

/* 底部 */
.acts {
  display: flex;
  gap: 16rpx;
  margin: 22rpx 24rpx 0;
}
.act {
  flex: 1;
  height: 88rpx;
  border-radius: 22rpx;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  box-shadow: 0 8rpx 30rpx rgba(22, 60, 45, 0.05);
}
.act-txt {
  font-size: 24rpx;
  color: #16201c;
  font-weight: 600;
}
.foot-tip {
  display: block;
  text-align: center;
  font-size: 18rpx;
  color: #b3bfba;
  margin-top: 18rpx;
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

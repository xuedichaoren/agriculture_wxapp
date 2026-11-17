<template>
  <view class="page pm">
    <nav-bar :title="plot.name || '地块管理'" bg="#F4F8F5">
      <template #right>
        <view class="nav-more" @tap="showMore">
          <icon-svg name="more" :size="32" color="#3D4A45" :stroke="2" />
        </view>
      </template>
    </nav-bar>

    <view v-if="plot" class="body">
      <!-- 地块头 -->
      <view class="hero">
        <view class="h-row">
          <view class="h-ico" :style="{ background: 'linear-gradient(150deg, ' + plot.bg[0] + ', ' + plot.bg[1] + ')' }">
            <text class="h-emoji">{{ plot.emoji }}</text>
          </view>
          <view class="flex1">
            <view class="row between">
              <text class="h-name">{{ plot.name }}</text>
              <ui-tag :text="plot.statusText" :tone="plot.statusTone" size="sm" />
            </view>
            <text class="h-meta">{{ plot.code }} 号 · {{ plot.area }}㎡ · {{ plot.rows }} 垄</text>
            <text class="h-crops">{{ plot.cropsText }}</text>
          </view>
        </view>
        <view class="h-attrs">
          <view class="at">
            <text class="at-n">{{ plot.soil }}</text>
            <text class="at-l">土质</text>
          </view>
          <view class="at">
            <text class="at-n">{{ plot.sun }}</text>
            <text class="at-l">光照</text>
          </view>
          <view class="at">
            <text class="at-n">{{ plot.water }}</text>
            <text class="at-l">水源</text>
          </view>
        </view>
      </view>

      <!-- 名额与价格 -->
      <view class="card">
        <view class="row between">
          <text class="c-t">认养名额</text>
          <text class="c-link" @tap="editCapacity">调整份数</text>
        </view>
        <view class="seat-row">
          <view class="sr">
            <text class="sr-n">{{ plot.booked }}</text>
            <text class="sr-l">已认养</text>
          </view>
          <view class="sr">
            <text class="sr-n">{{ plot.capacity }}</text>
            <text class="sr-l">总名额</text>
          </view>
          <view class="sr">
            <text class="sr-n hl">{{ plot.left }}</text>
            <text class="sr-l">剩余</text>
          </view>
          <view class="sr">
            <text class="sr-n">￥{{ plot.monthIncome }}</text>
            <text class="sr-l">本月收入</text>
          </view>
        </view>
        <view class="s-bar">
          <view class="s-fill" :style="{ width: plot.ratio + '%' }" />
        </view>
        <view class="price-row">
          <text class="pr-l">认养单价</text>
          <view class="pr-r">
            <text class="pr-n">￥{{ plot.price }}</text>
            <text class="pr-unit">/ 季</text>
            <text class="pr-edit" @tap="editPrice">改价</text>
          </view>
        </view>
        <text class="pr-tip">
          平台建议区间 ￥{{ Math.round(plot.price * 0.8) }}~{{ Math.round(plot.price * 1.25) }}；
          改价只影响新单，已下的单按原价履约。
        </text>
      </view>

      <!-- 待确认申请 -->
      <view v-if="apps.length" class="card">
        <view class="row between mb">
          <view class="row">
            <text class="c-t">认养申请</text>
            <text class="c-badge">{{ apps.length }}</text>
          </view>
          <text class="c-s">确认后自动生成订单</text>
        </view>
        <view v-for="a in apps" :key="a.id" class="app">
          <view class="ap-top">
            <view class="ap-av">
              <text class="ap-e">{{ a.adopter.avatar }}</text>
            </view>
            <view class="flex1">
              <view class="row between">
                <text class="ap-name">{{ a.adopter.name }}</text>
                <text class="ap-time">{{ shortTime(a.createdAt) }}</text>
              </view>
              <text class="ap-meta">{{ a.adopter.city }} · {{ a.months }} 个月 · ￥{{ a.amount }}</text>
            </view>
          </view>
          <view class="ap-info">
            <text class="ap-k">想认养</text>
            <text class="ap-v">{{ cropsOf(a) }} · {{ planName(a.planKey) }} · {{ a.wantStart }} 起</text>
          </view>
          <view v-if="a.message" class="ap-msg">
            <text class="ap-msg-t">“{{ a.message }}”</text>
          </view>
          <view class="ap-acts">
            <view class="ap-btn ghost" @tap="reject(a)">不合适</view>
            <view class="ap-btn main" @tap="accept(a)">通过申请</view>
          </view>
        </view>
      </view>

      <!-- 认养人 -->
      <view class="card">
        <view class="row between mb">
          <text class="c-t">认养人 {{ plot.adopterTotal }}</text>
          <text class="c-s">点头像可联系</text>
        </view>
        <view v-if="!adopters.length" class="empty-line">
          <text class="el-t">还没有人认养这块地</text>
          <text class="el-s">发一条长势到农友圈和认养大厅，比干等着有效</text>
        </view>
        <view v-for="a in adopters" :key="a.name" class="adopter" @tap="contact(a)">
          <view class="ad-av">
            <text class="ad-e">{{ a.avatar }}</text>
          </view>
          <view class="flex1">
            <text class="ad-n">{{ a.name }}</text>
            <text class="ad-m">{{ a.city }} · 累计 ￥{{ a.amount }}</text>
          </view>
          <view class="ad-r">
            <text class="ad-c">{{ a.count }} 份</text>
            <icon-svg name="phone" :size="26" color="#C3CCC8" :stroke="1.7" />
          </view>
        </view>
      </view>

      <!-- 长势推送 -->
      <view class="card">
        <view class="row between mb">
          <text class="c-t">长势推送</text>
          <text class="c-link" @tap="openPush">发一条</text>
        </view>
        <view v-if="!pushes.length" class="empty-line">
          <text class="el-t">还没推送过长势</text>
          <text class="el-s">认养人最想看的就是「我那块地现在什么样」，一周一条就够</text>
        </view>
        <view v-for="g in pushes.slice(0, 6)" :key="g.id" class="push">
          <view class="pu-dot" />
          <view class="flex1">
            <view class="row between">
              <text class="pu-t">{{ g.emoji }} {{ g.title }}</text>
              <text class="pu-d">{{ g.date }}</text>
            </view>
            <text class="pu-x">{{ g.text }}</text>
            <text v-if="g.reach" class="pu-reach">已送达 {{ g.reach }} 位认养人</text>
          </view>
        </view>
      </view>

      <!-- 我的记录 -->
      <view class="card">
        <view class="row between mb">
          <text class="c-t">农事记录</text>
          <text class="c-link" @tap="openLog">记一笔</text>
        </view>
        <view v-if="!logs.length" class="empty-line">
          <text class="el-t">还没记录</text>
          <text class="el-s">记下施肥、打药、整枝，出问题时能倒查</text>
        </view>
        <view v-for="(l, i) in logs.slice(0, 8)" :key="i" class="log">
          <text class="lg-d">{{ l.date }}</text>
          <text class="lg-t">{{ l.emoji }} {{ l.title }}</text>
          <text v-if="l.text" class="lg-x">{{ l.text }}</text>
        </view>
      </view>

      <view class="bottom">
        <view class="bb ghost" @tap="togglePause">
          {{ plot.status === 'paused' ? '恢复招募' : '暂停招募' }}
        </view>
        <view class="bb main" @tap="openPush">发长势给认养人</view>
      </view>

      <view style="height: 40rpx" />
    </view>

    <view v-else class="loading">
      <text class="l-t">地块不存在或已删除</text>
    </view>

    <!-- 发长势弹层 -->
    <view v-if="pushOn" class="mask" @tap="pushOn = false">
      <view class="sheet" @tap.stop>
        <view class="sh-head">
          <text class="sh-t">发一条长势</text>
          <view class="sh-x" @tap="pushOn = false">
            <icon-svg name="close" :size="30" color="#9AA7A1" :stroke="2" />
          </view>
        </view>
        <input v-model="pushForm.title" class="sh-input" placeholder="一句话标题，如：辣椒开始转红" maxlength="24" />
        <textarea
          v-model="pushForm.text"
          class="sh-area"
          placeholder="说说这块地这几天的变化。认养人看不懂农学术语，用大白话就行"
          maxlength="200"
        />
        <view class="sh-emojis">
          <text
            v-for="e in ['🌱', '🌶️', '🍅', '🥬', '🍑', '🍊', '💧', '🧴']"
            :key="e"
            class="sh-e"
            :class="{ on: pushForm.emoji === e }"
            @tap="pushForm.emoji = e"
          >{{ e }}</text>
        </view>
        <view class="sh-tip">
          <text class="sh-tip-t">会推送给本地的 {{ plot ? plot.adopterTotal : 0 }} 位认养人，并同步到农友圈</text>
        </view>
        <ui-btn type="primary" size="lg" block text="发送" @click="submitPush" />
      </view>
    </view>

    <!-- 农事记录弹层 -->
    <view v-if="logOn" class="mask" @tap="logOn = false">
      <view class="sheet" @tap.stop>
        <view class="sh-head">
          <text class="sh-t">记一笔农事</text>
          <view class="sh-x" @tap="logOn = false">
            <icon-svg name="close" :size="30" color="#9AA7A1" :stroke="2" />
          </view>
        </view>
        <input v-model="logForm.title" class="sh-input" placeholder="做了什么，如：追了一次钾肥" maxlength="24" />
        <textarea v-model="logForm.text" class="sh-area" placeholder="用量、天气、当时的判断都可以记" maxlength="200" />
        <ui-btn type="primary" size="lg" block text="保存" @click="submitLog" />
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import * as api from '@/api/index.js'
import {
  farmPlot,
  farmApps,
  farmSide,
  farmAdoptersOf,
  acceptApp,
  rejectApp,
  setPlotStatus,
  setPlotPrice,
  setPlotCapacity,
  pushGrowth,
  farmPushes,
  plotLogs,
  addPlotLog
} from '@/store/farm-side.js'
import { toast } from '@/common/utils.js'

const pid = ref('')
const tick = ref(0)
const pushOn = ref(false)
const logOn = ref(false)
const pushForm = reactive({ title: '', text: '', emoji: '🌱' })
const logForm = reactive({ title: '', text: '' })

const plot = computed(() => {
  void tick.value
  void farmSide.plots
  void farmSide.newIns
  void farmSide.apps
  void farmSide.pushes
  void farmSide.logs
  return pid.value ? farmPlot(pid.value) : null
})

const apps = computed(() => {
  void tick.value
  void farmSide.apps
  return pid.value ? farmApps(pid.value).filter((a) => a.status === 'pending') : []
})

const adopters = computed(() => {
  void tick.value
  void farmSide.newIns
  return pid.value ? farmAdoptersOf(pid.value) : []
})

const pushes = computed(() => {
  void tick.value
  void farmSide.pushes
  return pid.value ? farmPushes(pid.value) : []
})

const logs = computed(() => {
  void tick.value
  void farmSide.logs
  return pid.value ? plotLogs(pid.value) : []
})

function cropsOf(a) {
  return (a.crops || []).map((id) => api.findCrop(id)?.name).filter(Boolean).join('+')
}

function planName(key) {
  return api.planOf(key).name
}

function shortTime(str) {
  const m = String(str || '').match(/(\d{2})-(\d{2}) (\d{2}):(\d{2})/)
  if (m) return `${m[2]}/${m[3]} ${m[4]}:${m[5]}`
  return str
}

function accept(a) {
  const p = plot.value
  const over = p && p.booked >= p.capacity
  uni.showModal({
    title: '通过认养申请',
    content: over
      ? `${p.name} 名额已满（${p.booked}/${p.capacity}），仍可接单，但会出现超额。确认要接吗？`
      : `确认接 ${a.adopter.name} 的单，${a.months} 个月，￥${a.amount}。确认后名额立即占用。`,
    confirmText: '确认接单',
    confirmColor: '#E08A2B',
    success: (r) => {
      if (!r.confirm) return
      acceptApp(a)
      tick.value++
      toast('已接单，记得给对方发个消息')
    }
  })
}

function reject(a) {
  uni.showModal({
    title: '不合适就不接',
    editable: true,
    placeholderText: '简单写个原因，如：这季排满了（可不填）',
    confirmText: '婉拒',
    confirmColor: '#FF5A4E',
    success: (r) => {
      if (!r.confirm) return
      rejectApp(a.id, (r.content || '').trim())
      tick.value++
      toast('已婉拒')
    }
  })
}

function contact(a) {
  uni.showModal({
    title: a.name,
    content: `电话 ${a.phone}\n${a.city}\n累计认养 ￥${a.amount}`,
    confirmText: '复制号码',
    success: (r) => {
      if (!r.confirm) return
      uni.setClipboardData({ data: a.phone })
    }
  })
}

function editPrice() {
  uni.showModal({
    title: '修改认养单价',
    editable: true,
    placeholderText: '当前 ￥' + plot.value.price + ' / 季',
    content: String(plot.value.price),
    success: (r) => {
      if (!r.confirm) return
      if (setPlotPrice(pid.value, r.content)) {
        tick.value++
        toast('已改价，只影响新单')
      } else {
        toast('请输入有效价格')
      }
    }
  })
}

function editCapacity() {
  uni.showModal({
    title: '调整认养名额',
    editable: true,
    placeholderText: '当前 ' + plot.value.capacity + ' 份，不能小于已认养的 ' + plot.value.booked + ' 份',
    content: String(plot.value.capacity),
    success: (r) => {
      if (!r.confirm) return
      if (setPlotCapacity(pid.value, r.content)) {
        tick.value++
        toast('已调整')
      } else {
        toast('名额不能少于已认养的 ' + plot.value.booked + ' 份')
      }
    }
  })
}

function togglePause() {
  const p = plot.value
  if (p.status === 'paused') {
    setPlotStatus(p.id, 'recruiting')
    tick.value++
    toast('已恢复招募')
    return
  }
  uni.showModal({
    title: '暂停招募',
    content: '暂停后这块地不再出现在认养大厅，已在养的 ' + p.booked + ' 位认养人照常履约。',
    confirmText: '暂停招募',
    confirmColor: '#E08A2B',
    success: (r) => {
      if (!r.confirm) return
      setPlotStatus(p.id, 'paused')
      tick.value++
      toast('已暂停招募')
    }
  })
}

function showMore() {
  const p = plot.value
  uni.showActionSheet({
    itemList: [p.status === 'paused' ? '恢复招募' : '暂停招募', '调整份数', '修改价格'],
    success: (r) => {
      if (r.tapIndex === 0) togglePause()
      else if (r.tapIndex === 1) editCapacity()
      else if (r.tapIndex === 2) editPrice()
    }
  })
}

function openPush() {
  pushForm.title = ''
  pushForm.text = ''
  pushForm.emoji = (plot.value && plot.value.emoji) || '🌱'
  pushOn.value = true
}

function submitPush() {
  if (!pushForm.title.trim()) return toast('先写个标题')
  pushGrowth(pid.value, {
    title: pushForm.title.trim(),
    text: pushForm.text.trim(),
    emoji: pushForm.emoji
  })
  pushOn.value = false
  tick.value++
  toast('已推送')
}

function openLog() {
  logForm.title = ''
  logForm.text = ''
  logOn.value = true
}

function submitLog() {
  if (!logForm.title.trim()) return toast('写一下做了什么')
  addPlotLog(pid.value, {
    title: logForm.title.trim(),
    text: logForm.text.trim(),
    emoji: plot.value ? plot.value.emoji : '🌱'
  })
  logOn.value = false
  tick.value++
  toast('已记录')
}

onLoad((q) => {
  pid.value = (q && q.id) || ''
  if (q && q.act === 'push') setTimeout(openPush, 300)
})
</script>

<style scoped>
.pm {
  min-height: 100vh;
  background: #f4f8f5;
  padding-bottom: 40rpx;
}
.nav-more {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.body {
  padding: 8rpx 24rpx 0;
}

/* hero */
.hero {
  background: #fff;
  border-radius: 24rpx;
  padding: 22rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}
.h-row {
  display: flex;
  gap: 16rpx;
  align-items: flex-start;
}
.h-ico {
  width: 100rpx;
  height: 100rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.h-emoji {
  font-size: 50rpx;
}
.h-name {
  font-size: 29rpx;
  font-weight: 800;
  color: #16201c;
}
.h-meta {
  display: block;
  font-size: 19rpx;
  color: #8b978f;
  margin-top: 6rpx;
}
.h-crops {
  display: block;
  font-size: 21rpx;
  color: #3d4a45;
  margin-top: 4rpx;
}
.h-attrs {
  display: flex;
  margin-top: 18rpx;
  padding-top: 16rpx;
  border-top: 2rpx solid #f5f7f5;
}
.at {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}
.at-n {
  font-size: 19rpx;
  color: #3d4a45;
  text-align: center;
}
.at-l {
  font-size: 16rpx;
  color: #b3bfba;
}

/* card */
.card {
  background: #fff;
  border-radius: 24rpx;
  padding: 22rpx;
  margin-top: 18rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}
.c-t {
  font-size: 27rpx;
  font-weight: 700;
  color: #16201c;
}
.c-s {
  font-size: 18rpx;
  color: #b3bfba;
}
.c-link {
  font-size: 21rpx;
  color: #d97e1c;
  font-weight: 600;
}
.c-badge {
  margin-left: 8rpx;
  min-width: 30rpx;
  height: 30rpx;
  border-radius: 30rpx;
  background: #ff5a4e;
  color: #fff;
  font-size: 17rpx;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
}
.mb {
  margin-bottom: 16rpx;
}

/* 名额 */
.seat-row {
  display: flex;
  margin-top: 16rpx;
}
.sr {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3rpx;
}
.sr-n {
  font-size: 30rpx;
  font-weight: 800;
  color: #16201c;
}
.sr-n.hl {
  color: #d97e1c;
}
.sr-l {
  font-size: 17rpx;
  color: #b3bfba;
}
.s-bar {
  height: 10rpx;
  border-radius: 10rpx;
  background: #eceee9;
  margin-top: 14rpx;
  overflow: hidden;
}
.s-fill {
  height: 10rpx;
  border-radius: 10rpx;
  background: linear-gradient(90deg, #f7b45c, #e08a2b);
}
.price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 18rpx;
  padding-top: 16rpx;
  border-top: 2rpx solid #f5f7f5;
}
.pr-l {
  font-size: 22rpx;
  color: #5c6a64;
}
.pr-r {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
}
.pr-n {
  font-size: 28rpx;
  font-weight: 800;
  color: #d97e1c;
}
.pr-unit {
  font-size: 17rpx;
  color: #b3bfba;
}
.pr-edit {
  font-size: 19rpx;
  color: #4a8cff;
  margin-left: 12rpx;
}
.pr-tip {
  display: block;
  font-size: 17rpx;
  color: #b3bfba;
  line-height: 1.6;
  margin-top: 10rpx;
}

/* 申请 */
.app {
  background: #fffbf4;
  border: 2rpx solid #ffe9c9;
  border-radius: 18rpx;
  padding: 16rpx;
  margin-bottom: 12rpx;
}
.ap-top {
  display: flex;
  gap: 12rpx;
  align-items: center;
}
.ap-av {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #ffeed6;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ap-e {
  font-size: 32rpx;
}
.ap-name {
  font-size: 23rpx;
  font-weight: 700;
  color: #16201c;
}
.ap-time {
  font-size: 17rpx;
  color: #c3b092;
}
.ap-meta {
  display: block;
  font-size: 18rpx;
  color: #a08a6a;
  margin-top: 3rpx;
}
.ap-info {
  display: flex;
  gap: 8rpx;
  margin-top: 12rpx;
}
.ap-k {
  font-size: 18rpx;
  color: #b3a184;
}
.ap-v {
  flex: 1;
  font-size: 18rpx;
  color: #6b5c42;
}
.ap-msg {
  margin-top: 10rpx;
  background: #fff;
  border-radius: 12rpx;
  padding: 10rpx 12rpx;
}
.ap-msg-t {
  font-size: 18rpx;
  color: #8a7550;
  line-height: 1.6;
}
.ap-acts {
  display: flex;
  gap: 10rpx;
  margin-top: 14rpx;
}
.ap-btn {
  flex: 1;
  height: 62rpx;
  border-radius: 31rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 21rpx;
  font-weight: 600;
}
.ap-btn.ghost {
  background: #fff;
  color: #9aa7a1;
  border: 2rpx solid #f0eee9;
}
.ap-btn.main {
  background: linear-gradient(135deg, #f7b45c, #e08a2b);
  color: #fff;
}

/* 认养人 */
.adopter {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 14rpx 0;
  border-top: 2rpx solid #f8faf8;
}
.adopter:first-of-type {
  border-top: none;
}
.ad-av {
  width: 68rpx;
  height: 68rpx;
  border-radius: 50%;
  background: #f3f6f4;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ad-e {
  font-size: 34rpx;
}
.ad-n {
  display: block;
  font-size: 23rpx;
  font-weight: 600;
  color: #16201c;
}
.ad-m {
  display: block;
  font-size: 18rpx;
  color: #9aa7a1;
  margin-top: 3rpx;
}
.ad-r {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.ad-c {
  font-size: 19rpx;
  color: #d97e1c;
  font-weight: 600;
}

/* 推送 */
.push {
  display: flex;
  gap: 12rpx;
  padding: 12rpx 0;
  border-top: 2rpx solid #f8faf8;
}
.push:first-of-type {
  border-top: none;
}
.pu-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #f0a04b;
  margin-top: 10rpx;
  flex-shrink: 0;
}
.pu-t {
  font-size: 22rpx;
  font-weight: 600;
  color: #16201c;
  flex: 1;
}
.pu-d {
  font-size: 17rpx;
  color: #c3ccc8;
}
.pu-x {
  display: block;
  font-size: 19rpx;
  color: #6d7a74;
  line-height: 1.6;
  margin-top: 4rpx;
}
.pu-reach {
  display: block;
  font-size: 17rpx;
  color: #b3bfba;
  margin-top: 6rpx;
}

/* 记录 */
.log {
  padding: 12rpx 0;
  border-top: 2rpx solid #f8faf8;
}
.log:first-of-type {
  border-top: none;
}
.lg-d {
  font-size: 17rpx;
  color: #c3ccc8;
}
.lg-t {
  display: block;
  font-size: 21rpx;
  color: #16201c;
  font-weight: 600;
  margin-top: 2rpx;
}
.lg-x {
  display: block;
  font-size: 19rpx;
  color: #7c8a84;
  margin-top: 3rpx;
}

.empty-line {
  padding: 20rpx 0 8rpx;
}
.el-t {
  display: block;
  font-size: 22rpx;
  color: #7c8a84;
}
.el-s {
  display: block;
  font-size: 18rpx;
  color: #b3bfba;
  margin-top: 5rpx;
  line-height: 1.6;
}

/* 底部 */
.bottom {
  display: flex;
  gap: 14rpx;
  margin-top: 22rpx;
}
.bb {
  height: 84rpx;
  border-radius: 42rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 25rpx;
  font-weight: 700;
}
.bb.ghost {
  flex: 1;
  background: #fff;
  color: #7c8a84;
}
.bb.main {
  flex: 1.6;
  background: linear-gradient(135deg, #f7b45c, #e08a2b);
  color: #fff;
  box-shadow: 0 10rpx 24rpx rgba(224, 138, 43, 0.26);
}

/* 弹层 */
.mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(12, 20, 16, 0.45);
  z-index: 90;
  display: flex;
  align-items: flex-end;
}
.sheet {
  width: 100%;
  background: #fff;
  border-radius: 30rpx 30rpx 0 0;
  padding: 26rpx 28rpx 40rpx;
}
.sh-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}
.sh-t {
  font-size: 30rpx;
  font-weight: 800;
  color: #16201c;
}
.sh-x {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sh-input {
  height: 88rpx;
  background: #f7faf8;
  border-radius: 16rpx;
  padding: 0 20rpx;
  font-size: 24rpx;
  color: #16201c;
}
.sh-area {
  width: 100%;
  height: 180rpx;
  background: #f7faf8;
  border-radius: 16rpx;
  padding: 18rpx 20rpx;
  font-size: 23rpx;
  color: #16201c;
  margin-top: 14rpx;
  box-sizing: border-box;
}
.sh-emojis {
  display: flex;
  gap: 12rpx;
  margin: 16rpx 0;
}
.sh-e {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  background: #f7faf8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30rpx;
}
.sh-e.on {
  background: #fff3e2;
}
.sh-tip {
  margin-bottom: 18rpx;
}
.sh-tip-t {
  font-size: 18rpx;
  color: #b3bfba;
  line-height: 1.6;
}
.loading {
  padding: 200rpx 0;
  display: flex;
  justify-content: center;
}
.l-t {
  font-size: 24rpx;
  color: #b3bfba;
}
</style>

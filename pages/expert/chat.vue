<template>
  <view class="page chat">
    <nav-bar :title="q ? q.expertName : '问诊详情'" bg="#F4F8F5">
      <template #right>
        <view class="nav-act" @tap="more">
          <icon-svg name="more" :size="30" color="#16201C" :stroke="1.8" />
        </view>
      </template>
    </nav-bar>

    <view v-if="!q" class="miss">
      <text class="miss-t">这张问诊单不见了</text>
    </view>

    <template v-else>
      <!-- 问诊摘要 -->
      <view class="sum">
        <view class="sum-top">
          <ui-tag :tone="statusTone(q.status)" size="sm" round :text="qStatusText(q.status)" />
          <text class="sum-crop">{{ q.crop }}</text>
          <text v-if="q.visibility === 'public'" class="sum-pub">公开</text>
          <text class="sum-time">{{ fmt(q.createdAt) }}</text>
        </view>
        <text class="sum-title">{{ q.title }}</text>
      </view>

      <!-- 消息 -->
      <scroll-view
        scroll-y
        class="msgs"
        :scroll-into-view="anchor"
        :scroll-with-animation="true"
        :show-scrollbar="false"
      >
        <view class="msgs-in">
          <view v-for="(m, i) in q.messages" :id="'msg-' + i" :key="m.id" class="msg" :class="m.role">
            <view v-if="m.role === 'expert'" class="m-av">
              <text class="m-emoji">{{ q.expertEmoji || '👨‍🌾' }}</text>
            </view>
            <view class="bubble">
              <text class="b-txt">{{ m.text }}</text>
              <view v-if="m.images && m.images.length" class="b-imgs">
                <image
                  v-for="(p, k) in m.images"
                  :key="k"
                  :src="p"
                  mode="aspectFill"
                  class="b-img"
                  @tap="previewImg(m.images, k)"
                />
              </view>
              <view class="b-foot">
                <text class="b-time">{{ fmtTime(m.at) }}</text>
                <text v-if="m.role === 'expert'" class="b-who">{{ q.expertName }}</text>
                <text v-else class="b-who">我</text>
              </view>
            </view>
            <view v-if="m.role === 'user'" class="m-av me">
              <text class="m-emoji">🧑</text>
            </view>
          </view>

          <!-- 待回复 -->
          <view v-if="q.status === 'pending'" class="waiting">
            <view class="w-dots">
              <view class="wd" />
              <view class="wd" />
              <view class="wd" />
            </view>
            <text class="w-t">已送达，等{{ q.expertName || '农友' }}回复</text>
            <text class="w-s">专家一般 15~30 分钟内回复，急症可以下拉刷新</text>
          </view>

          <!-- 评价入口 -->
          <view v-if="showRate" class="rate-entry">
            <text class="re-t">这次问诊解决了吗？</text>
            <text class="re-s">评价会帮助其他农友找到靠谱的专家</text>
            <ui-btn type="ghost" size="sm" text="去评价" @click="openRate" />
          </view>

          <view style="height: 20rpx" />
        </view>
      </scroll-view>

      <!-- 专家快捷回复 -->
      <scroll-view v-if="isExpert && q.status === 'pending'" scroll-x class="quick no-scrollbar" :show-scrollbar="false">
        <view class="quick-in">
          <view v-for="t in QUICK_ANSWERS" :key="t.key" class="qk" @tap="useQuick(t)">{{ t.label }}</view>
        </view>
      </scroll-view>

      <!-- 输入 -->
      <view class="input-bar">
        <view class="in-box">
          <textarea
            v-model="draft"
            class="in-ta"
            :placeholder="isExpert ? '给出判断和具体动作，别只说「注意管理」' : '还有哪里不清楚，可以继续追问'"
            placeholder-class="ph"
            :maxlength="500"
            auto-height
            :show-confirm-bar="false"
          />
          <view class="in-extra">
            <view class="in-ico" @tap="addImg">
              <icon-svg name="camera" :size="30" color="#7C8A84" :stroke="1.8" />
            </view>
            <view class="send" :class="{ off: !draft.trim() && !pendingImgs.length }" @tap="send">发送</view>
          </view>
        </view>
        <view v-if="pendingImgs.length" class="p-imgs">
          <view v-for="(p, i) in pendingImgs" :key="i" class="p-img-box">
            <image :src="p" mode="aspectFill" class="p-img" />
            <view class="p-del" @tap="pendingImgs.splice(i, 1)">
              <icon-svg name="close" :size="16" color="#FFFFFF" :stroke="2.6" />
            </view>
          </view>
        </view>
      </view>
    </template>

    <!-- 评价弹层 -->
    <ui-sheet :visible="rateOn" title="评价这次问诊" @close="rateOn = false">
      <view class="rate-body">
        <view class="stars">
          <text v-for="i in 5" :key="i" class="star" :class="{ on: i <= stars }" @tap="stars = i">★</text>
        </view>
        <text class="stars-t">{{ starText }}</text>
        <view class="rate-tags">
          <view v-for="t in RATE_TAGS" :key="t" class="rt" :class="{ on: rateTags.includes(t) }" @tap="toggleTag(t)">
            {{ t }}
          </view>
        </view>
        <textarea v-model="rateText" class="rate-ta" placeholder="说两句（选填），比如哪句话最有用" placeholder-class="ph" :maxlength="120" />
      </view>
      <template #footer>
        <ui-btn type="primary" block text="提交评价" @click="submitRate" />
      </template>
    </ui-sheet>
  </view>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { qStatusText, statusTone } from '@/api/expert.js'
import { addMessage, questionOf, rateQuestion, closeQuestion } from '@/store/expert.js'
import { currentRole } from '@/store/role.js'
import { toast } from '@/common/utils.js'

const id = ref('')
const draft = ref('')
const pendingImgs = ref([])
const anchor = ref('')
const stars = ref(5)
const rateTags = ref([])
const rateText = ref('')
const rateOn = ref(false)

const QUICK_ANSWERS = [
  {
    key: 'need',
    label: '要更多照片',
    text: '照片有点糊，麻烦补两张：一片病叶的正面、一片的背面，尽量顺光拍，叶子占画面 70%。'
  },
  {
    key: 'fungus',
    label: '真菌性病害',
    text: '从症状看更像真菌性病害。先摘掉病叶病果带出田外，改善通风、降低湿度；发病初期用保护性杀菌剂（如代森锰锌）压一遍，3 天后再看扩展情况。'
  },
  {
    key: 'nutrient',
    label: '像缺素/生理问题',
    text: '这个不像侵染性病害，更像缺素或根系吸收问题。先别打药，叶面喷一次磷酸二氢钾 + 微量元素，7 天后对比新叶，同时查一下土壤湿度和 pH。'
  }
]

const RATE_TAGS = ['判断准确', '回复快', '讲得清楚', '方案能落地', '态度好']

const q = computed(() => questionOf(id.value))
const isExpert = computed(() => {
  const r = currentRole()
  return !!r && r.key === 'expert'
})
const showRate = computed(() => !!q.value && q.value.status === 'answered' && !q.value.rated && !isExpert.value)

const starText = computed(() => {
  const map = { 1: '不太满意', 2: '一般', 3: '还行', 4: '满意', 5: '非常满意' }
  return map[stars.value] || ''
})

onLoad((opt) => {
  id.value = (opt && opt.id) || ''
  nextTick(scrollBottom)
})

watch(
  () => (q.value ? q.value.messages.length : 0),
  () => scrollBottom()
)

function scrollBottom() {
  if (!q.value) return
  anchor.value = 'msg-' + (q.value.messages.length - 1)
}

function fmt(ts) {
  const d = new Date(ts)
  const p = (n) => (n < 10 ? '0' + n : '' + n)
  return `${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

function fmtTime(ts) {
  const d = new Date(ts)
  const p = (n) => (n < 10 ? '0' + n : '' + n)
  return `${p(d.getHours())}:${p(d.getMinutes())}`
}

function addImg() {
  uni.chooseImage({
    count: 3 - pendingImgs.value.length,
    sizeType: ['compressed'],
    success: (r) => {
      pendingImgs.value = pendingImgs.value.concat(r.tempFilePaths || [])
    }
  })
}

function previewImg(urls, i) {
  uni.previewImage({ urls, current: i })
}

function send() {
  const text = draft.value.trim()
  if (!text && !pendingImgs.value.length) return
  addMessage(id.value, {
    role: isExpert.value ? 'expert' : 'user',
    text,
    images: pendingImgs.value.slice()
  })
  draft.value = ''
  pendingImgs.value = []
  nextTick(scrollBottom)
}

function useQuick(t) {
  draft.value = t.text
}

function toggleTag(t) {
  const i = rateTags.value.indexOf(t)
  if (i > -1) rateTags.value.splice(i, 1)
  else rateTags.value.push(t)
}

function openRate() {
  rateOn.value = true
}

function submitRate() {
  rateQuestion(id.value, stars.value, rateTags.value, rateText.value)
  rateOn.value = false
  toast('感谢评价')
}

function more() {
  if (!q.value) return
  const items = ['复制问诊编号', '关闭这次问诊']
  if (isExpert.value) items.unshift('标记为已处理')
  uni.showActionSheet({
    itemList: items,
    success: (res) => {
      const label = items[res.tapIndex]
      if (label === '复制问诊编号') {
        uni.setClipboardData({ data: q.value.id })
      } else if (label === '关闭这次问诊' || label === '标记为已处理') {
        uni.showModal({
          title: '确认',
          content: '关闭后不再接收回复，可以随时重新发起',
          success: (r) => {
            if (!r.confirm) return
            closeQuestion(id.value)
            toast('已关闭')
          }
        })
      }
    }
  })
}
</script>

<style scoped>
.chat {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f4f8f5;
  overflow: hidden;
}
.sum {
  padding: 16rpx 28rpx 18rpx;
}
.sum-top {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.sum-crop {
  font-size: 19rpx;
  color: #06a96a;
  background: #e9faf2;
  border-radius: 6rpx;
  padding: 2rpx 10rpx;
}
.sum-pub {
  font-size: 18rpx;
  color: #2f7fd0;
  background: #eaf3ff;
  border-radius: 6rpx;
  padding: 2rpx 8rpx;
}
.sum-time {
  margin-left: auto;
  font-size: 18rpx;
  color: #b3bfba;
}
.sum-title {
  display: block;
  margin-top: 10rpx;
  font-size: 29rpx;
  font-weight: 700;
  color: #16201c;
}
.msgs {
  flex: 1;
  height: 0;
}
.msgs-in {
  padding: 4rpx 24rpx 10rpx;
}
.msg {
  display: flex;
  gap: 12rpx;
  margin-bottom: 22rpx;
  align-items: flex-start;
}
.msg.user {
  flex-direction: row;
  justify-content: flex-end;
}
.m-av {
  width: 68rpx;
  height: 68rpx;
  border-radius: 20rpx;
  background: linear-gradient(150deg, #eaf3ff, #d3e5ff);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.m-av.me {
  background: linear-gradient(150deg, #e9faf2, #c9efdb);
}
.m-emoji {
  font-size: 34rpx;
}
.bubble {
  max-width: 76%;
  background: #fff;
  border-radius: 6rpx 20rpx 20rpx 20rpx;
  padding: 18rpx 20rpx 10rpx;
  box-shadow: 0 6rpx 20rpx rgba(22, 60, 45, 0.05);
}
.msg.user .bubble {
  background: #d9f7e7;
  border-radius: 20rpx 6rpx 20rpx 20rpx;
}
.b-txt {
  font-size: 25rpx;
  color: #16201c;
  line-height: 1.7;
  word-break: break-all;
  white-space: pre-wrap;
}
.b-imgs {
  display: flex;
  gap: 8rpx;
  margin-top: 10rpx;
}
.b-img {
  width: 150rpx;
  height: 150rpx;
  border-radius: 12rpx;
}
.b-foot {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-top: 8rpx;
  justify-content: flex-end;
}
.b-time {
  font-size: 17rpx;
  color: #b3bfba;
}
.b-who {
  font-size: 17rpx;
  color: #9aa7a1;
}
.waiting {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  padding: 20rpx 0 26rpx;
}
.w-dots {
  display: flex;
  gap: 8rpx;
}
.wd {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #b7e8ce;
  animation: blink 1.2s infinite;
}
.wd:nth-child(2) {
  animation-delay: 0.2s;
}
.wd:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes blink {
  0%,
  100% {
    opacity: 0.35;
  }
  50% {
    opacity: 1;
  }
}
.w-t {
  font-size: 21rpx;
  color: #7c8a84;
}
.w-s {
  font-size: 18rpx;
  color: #b3bfba;
}
.rate-entry {
  background: #fff;
  border-radius: 22rpx;
  padding: 22rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  margin-top: 8rpx;
}
.re-t {
  font-size: 25rpx;
  font-weight: 700;
  color: #16201c;
}
.re-s {
  font-size: 19rpx;
  color: #9aa7a1;
  margin-bottom: 12rpx;
}
.quick {
  width: 100%;
  white-space: nowrap;
  background: #f4f8f5;
  padding: 0 20rpx;
}
.quick-in {
  display: inline-flex;
  gap: 10rpx;
  padding: 10rpx 0;
}
.qk {
  font-size: 20rpx;
  color: #06a96a;
  background: #fff;
  border: 2rpx solid #c9efdb;
  border-radius: 30rpx;
  padding: 8rpx 18rpx;
}
.input-bar {
  background: #fff;
  padding: 14rpx 20rpx calc(14rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -6rpx 26rpx rgba(22, 60, 45, 0.06);
}
.in-box {
  background: #f6f9f7;
  border-radius: 22rpx;
  padding: 12rpx 16rpx 10rpx;
}
.in-ta {
  width: 100%;
  min-height: 60rpx;
  max-height: 200rpx;
  font-size: 25rpx;
  color: #16201c;
  line-height: 1.6;
}
.ph {
  color: #b3bfba;
  font-size: 24rpx;
}
.in-extra {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6rpx;
}
.in-ico {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.send {
  height: 58rpx;
  padding: 0 28rpx;
  border-radius: 58rpx;
  background: #0fc97a;
  color: #fff;
  font-size: 23rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
}
.send.off {
  background: #cfe8db;
}
.p-imgs {
  display: flex;
  gap: 10rpx;
  margin-top: 10rpx;
}
.p-img-box {
  width: 110rpx;
  height: 110rpx;
  border-radius: 12rpx;
  overflow: hidden;
  position: relative;
}
.p-img {
  width: 100%;
  height: 100%;
}
.p-del {
  position: absolute;
  top: 0;
  right: 0;
  width: 34rpx;
  height: 34rpx;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 0 0 0 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.rate-body {
  padding: 10rpx 0 4rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.stars {
  display: flex;
  gap: 14rpx;
}
.star {
  font-size: 56rpx;
  color: #e6ece9;
}
.star.on {
  color: #ffb021;
}
.stars-t {
  margin-top: 8rpx;
  font-size: 22rpx;
  color: #7c8a84;
}
.rate-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  justify-content: center;
  margin: 22rpx 0;
}
.rt {
  font-size: 21rpx;
  color: #7c8a84;
  background: #f4f8f5;
  border-radius: 30rpx;
  padding: 8rpx 18rpx;
  border: 2rpx solid transparent;
}
.rt.on {
  color: #06a96a;
  background: #e9faf2;
  border-color: #0fc97a;
}
.rate-ta {
  width: 100%;
  min-height: 120rpx;
  background: #f6f9f7;
  border-radius: 18rpx;
  padding: 16rpx;
  font-size: 24rpx;
  color: #16201c;
  box-sizing: border-box;
}
.miss {
  padding: 200rpx 60rpx;
  text-align: center;
}
.miss-t {
  font-size: 26rpx;
  color: #9aa7a1;
}
</style>

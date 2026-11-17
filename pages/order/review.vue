<template>
  <view class="page rv-page">
    <nav-bar title="评价晒单" />

    <scroll-view scroll-y class="body no-scrollbar" :show-scrollbar="false">
      <!-- 已评价 -->
      <view v-if="done" class="done-card">
        <text class="dc-e">✅</text>
        <text class="dc-t">这笔订单已经评过了</text>
        <text class="dc-s">{{ done.time }} 提交，感谢你的反馈</text>
        <ui-btn type="ghost" size="md" text="回到订单" @click="back" />
      </view>

      <template v-else>
        <!-- 商品 -->
        <view class="card goods">
          <view v-for="it in items" :key="it.productId" class="g-item">
            <prod-img
              :src="it.product.coverUrl"
              :emoji="it.product.emoji"
              :bg="it.product.bg"
              :h="120"
              :size="120"
              radius="16rpx"
            />
            <view class="flex1">
              <text class="g-name ellipsis-2">{{ it.product.name }}</text>
              <text class="g-spec">{{ it.product.spec }} ×{{ it.qty }}</text>
            </view>
          </view>
        </view>

        <!-- 总评 -->
        <view class="card score">
          <text class="sc-title">{{ scoreText }}</text>
          <view class="sc-stars">
            <text
              v-for="i in 5"
              :key="i"
              class="sc-star"
              :class="{ on: i <= stars }"
              @tap="setStars(i)"
            >★</text>
          </view>
          <text class="sc-tip">{{ scoreTip }}</text>
        </view>

        <!-- 细分 -->
        <view class="card subs">
          <view v-for="s in subs" :key="s.key" class="sub-row">
            <text class="sb-name">{{ s.name }}</text>
            <view class="sb-stars">
              <text
                v-for="i in 5"
                :key="i"
                class="sb-star"
                :class="{ on: i <= subScores[s.key] }"
                @tap="setSub(s.key, i)"
              >★</text>
            </view>
            <text class="sb-val">{{ subScores[s.key] }} 星</text>
          </view>
        </view>

        <!-- 标签 -->
        <view class="card tags">
          <text class="tg-title">说说好在哪</text>
          <view class="tg-wrap">
            <view
              v-for="t in REVIEW_TAGS"
              :key="t"
              class="tg"
              :class="{ on: tags.indexOf(t) > -1 }"
              @tap="toggleTag(t)"
            >{{ t }}</view>
          </view>
        </view>

        <!-- 文字 -->
        <view class="card text-card">
          <textarea
            class="ta"
            v-model="text"
            :maxlength="200"
            placeholder="菜收到怎么样？新鲜度、分量、包装都可以说说，帮后面的人少踩坑"
            placeholder-class="ta-ph"
            :show-confirm-bar="false"
            :adjust-position="true"
          />
          <view class="ta-foot">
            <text class="ta-count">{{ text.length }}/200</text>
          </view>
        </view>

        <!-- 匿名 -->
        <view class="card anon">
          <view class="flex1">
            <text class="an-t">匿名评价</text>
            <text class="an-s">开启后其他买家看不到你的昵称和头像</text>
          </view>
          <switch :checked="anonymous" color="#0FC97A" @change="onAnon" />
        </view>

        <view style="height: 180rpx" />
      </template>
    </scroll-view>

    <view v-if="!done" class="foot">
      <ui-btn
        type="primary"
        size="lg"
        block
        :loading="submitting"
        :disabled="!order"
        text="提交评价"
        @click="submit"
      />
      <view class="safe-bottom" />
    </view>
  </view>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { REVIEW_TAGS } from '@/mock/index.js'
import {
  addReview,
  orderAmount,
  orderItems,
  reviewOfOrder,
  store
} from '@/store/index.js'
import { toast } from '@/common/utils.js'

const oid = ref('')
const stars = ref(5)
const text = ref('')
const tags = ref([])
const anonymous = ref(false)
const submitting = ref(false)
const subScores = reactive({ fresh: 5, pack: 5, deliver: 5 })

const subs = [
  { key: 'fresh', name: '新鲜度' },
  { key: 'pack', name: '包装' },
  { key: 'deliver', name: '配送速度' }
]

const order = computed(() => store.orders.find((o) => o.id === oid.value) || null)
const items = computed(() => (order.value ? orderItems(order.value) : []))
const done = computed(() => (oid.value ? reviewOfOrder(oid.value) : null))

const scoreText = computed(() => {
  const m = { 1: '很差', 2: '不太满意', 3: '还行', 4: '满意', 5: '非常满意' }
  return m[stars.value] || '非常满意'
})

const scoreTip = computed(() => {
  if (stars.value >= 5) return '点一下星星就能改分，别客气'
  if (stars.value >= 4) return '哪里还能更好？写两句农场能改'
  if (stars.value >= 3) return '说具体点，农场才知道问题出在哪'
  return '分数低没关系，把问题写清楚最有用，农户能看到'
})

function setStars(i) {
  stars.value = i
}

function setSub(key, i) {
  subScores[key] = i
}

function toggleTag(t) {
  const i = tags.value.indexOf(t)
  if (i > -1) tags.value.splice(i, 1)
  else tags.value.push(t)
}

function onAnon(e) {
  anonymous.value = !!(e.detail && e.detail.value)
}

function submit() {
  if (!order.value) return toast('订单不存在')
  if (submitting.value) return
  submitting.value = true
  const res = addReview(oid.value, {
    stars: stars.value,
    scores: { ...subScores },
    text: text.value.trim(),
    tags: tags.value.slice(),
    anonymous: anonymous.value
  })
  submitting.value = false
  if (!res) {
    toast('这笔订单已经评过了')
    return
  }
  toast('评价已提交，谢谢你')
  setTimeout(() => {
    const pages = getCurrentPages()
    if (pages.length > 1) uni.navigateBack()
    else uni.reLaunch({ url: '/pages/order/list?tab=done' })
  }, 700)
}

function back() {
  const pages = getCurrentPages()
  if (pages.length > 1) return uni.navigateBack()
  uni.reLaunch({ url: '/pages/order/list?tab=done' })
}

onLoad((q) => {
  oid.value = (q && q.id) || ''
  if (!oid.value && store.orders.length) {
    // 兜底：没带 id 就找最近一笔已完成未评价的
    const target = store.orders.find((o) => o.status === 'done' && !reviewOfOrder(o.id))
    if (target) oid.value = target.id
  }
})
</script>

<style scoped>
.rv-page {
  min-height: 100vh;
  background: #f4f8f5;
  display: flex;
  flex-direction: column;
}
.body {
  flex: 1;
  height: 0;
  padding: 18rpx 24rpx 0;
}
.card {
  background: #fff;
  border-radius: 22rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}

/* 商品 */
.goods {
  padding: 8rpx 20rpx;
}
.g-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 14rpx 0;
}
.g-name {
  display: block;
  font-size: 24rpx;
  font-weight: 600;
  color: #16201c;
  line-height: 1.4;
}
.g-spec {
  display: block;
  margin-top: 6rpx;
  font-size: 19rpx;
  color: #9aa7a1;
}

/* 总评 */
.score {
  padding: 30rpx 24rpx 26rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.sc-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #16201c;
}
.sc-stars {
  display: flex;
  gap: 14rpx;
  margin-top: 18rpx;
}
.sc-star {
  font-size: 62rpx;
  color: #e2e8e5;
  line-height: 1;
  transition: transform 0.15s;
}
.sc-star.on {
  color: #ffb020;
}
.sc-star:active {
  transform: scale(0.88);
}
.sc-tip {
  margin-top: 14rpx;
  font-size: 19rpx;
  color: #9aa7a1;
  text-align: center;
  line-height: 1.5;
}

/* 细分 */
.subs {
  padding: 8rpx 20rpx;
}
.sub-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
  height: 84rpx;
  border-bottom: 2rpx solid #f4f8f5;
}
.sub-row:last-child {
  border-bottom: none;
}
.sb-name {
  width: 140rpx;
  font-size: 23rpx;
  color: #3d4a45;
}
.sb-stars {
  flex: 1;
  display: flex;
  gap: 10rpx;
}
.sb-star {
  font-size: 34rpx;
  color: #e2e8e5;
}
.sb-star.on {
  color: #ffb020;
}
.sb-val {
  font-size: 19rpx;
  color: #9aa7a1;
  width: 64rpx;
  text-align: right;
}

/* 标签 */
.tags {
  padding: 20rpx;
}
.tg-title {
  font-size: 23rpx;
  font-weight: 600;
  color: #16201c;
}
.tg-wrap {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 14rpx;
}
.tg {
  padding: 10rpx 22rpx;
  border-radius: 30rpx;
  background: #f4f8f5;
  font-size: 21rpx;
  color: #5c6a64;
  border: 2rpx solid transparent;
}
.tg.on {
  background: #e9faf2;
  border-color: #0fc97a;
  color: #06a96a;
  font-weight: 600;
}

/* 文字 */
.text-card {
  padding: 20rpx;
}
.ta {
  width: 100%;
  height: 200rpx;
  font-size: 23rpx;
  color: #16201c;
  line-height: 1.6;
}
.ta-ph {
  color: #b3bfba;
  font-size: 22rpx;
  line-height: 1.6;
}
.ta-foot {
  display: flex;
  justify-content: flex-end;
  margin-top: 8rpx;
}
.ta-count {
  font-size: 18rpx;
  color: #b3bfba;
}

/* 匿名 */
.anon {
  padding: 22rpx 20rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
}
.an-t {
  display: block;
  font-size: 23rpx;
  font-weight: 600;
  color: #16201c;
}
.an-s {
  display: block;
  margin-top: 4rpx;
  font-size: 18rpx;
  color: #9aa7a1;
}

/* 底部 */
.foot {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 16rpx 24rpx;
  background: #fff;
  box-shadow: 0 -6rpx 24rpx rgba(22, 60, 45, 0.06);
}

/* 已评价 */
.done-card {
  margin: 40rpx 0;
  padding: 50rpx 30rpx;
  background: #fff;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}
.dc-e {
  font-size: 64rpx;
}
.dc-t {
  font-size: 27rpx;
  font-weight: 700;
  color: #16201c;
}
.dc-s {
  font-size: 20rpx;
  color: #9aa7a1;
  margin-bottom: 14rpx;
}
</style>

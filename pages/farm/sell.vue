<template>
  <view class="page sell">
    <nav-bar title="卖货" bg="#F4F8F5">
      <template #right>
        <view class="nav-act" @tap="toOrders">订单</view>
      </template>
    </nav-bar>

    <view class="body">
      <!-- 概览 -->
      <view class="ov">
        <view class="ov-item">
          <text class="ov-n">{{ onCount }}</text>
          <text class="ov-l">在售商品</text>
        </view>
        <view class="ov-div" />
        <view class="ov-item">
          <text class="ov-n">{{ toShip.length }}</text>
          <text class="ov-l">待发货</text>
        </view>
        <view class="ov-div" />
        <view class="ov-item">
          <text class="ov-n">{{ income }}</text>
          <text class="ov-l">本月销售额(元)</text>
        </view>
      </view>

      <view class="seg-wrap">
        <ui-segment :options="tabs" :value="tab" @change="onTab" />
      </view>

      <!-- 商品 -->
      <template v-if="tab === 'goods'">
        <view class="hint-line">
          <text class="h-t">改价、改库存、上下架都在这里，改完立即对买家生效</text>
        </view>

        <view v-for="p in products" :key="p.id" class="goods">
          <view class="g-top">
            <view class="g-img">
              <text class="g-emoji">{{ p.emoji }}</text>
            </view>
            <view class="flex1">
              <view class="g-name-row">
                <text class="g-name">{{ p.name }}</text>
                <text class="g-st" :class="{ off: !isOn(p.id) }">{{ isOn(p.id) ? '在售' : '已下架' }}</text>
              </view>
              <text class="g-spec">{{ p.spec }} · 已售 {{ p.salesCount }}</text>
              <view class="g-meta">
                <text class="g-price">¥{{ priceOf(p) }}</text>
                <text class="g-stock">库存 {{ stockOf(p) }} 份</text>
              </view>
            </view>
          </view>
          <view class="g-acts">
            <view class="ga" @tap="editPrice(p)">改价</view>
            <view class="ga" @tap="editStock(p)">改库存</view>
            <view class="ga" @tap="toggle(p)">{{ isOn(p.id) ? '下架' : '上架' }}</view>
            <view class="ga main" @tap="preview(p)">看详情</view>
          </view>
        </view>

        <view class="add-goods" @tap="addGoods">
          <text class="ag-plus">＋</text>
          <view class="flex1">
            <text class="ag-t">上架新商品</text>
            <text class="ag-s">拍张照片，填价格和库存，发布到产地直采</text>
          </view>
          <icon-svg name="right" :size="22" color="#C3CCC8" />
        </view>
      </template>

      <!-- 订单 -->
      <template v-else>
        <view v-if="!toShip.length && !shipped.length" class="empty">
          <text class="e-e">📦</text>
          <text class="e-t">还没有订单</text>
          <text class="e-s">有买家下单后会出现在这里，记得 48 小时内发出</text>
        </view>

        <view v-if="toShip.length" class="grp-t">待发货 {{ toShip.length }}</view>
        <view v-for="o in toShip" :key="o.id" class="order">
          <view class="o-head">
            <text class="o-id">{{ o.id }}</text>
            <text class="o-st warn">待发货</text>
          </view>
          <view class="o-body">
            <view v-for="it in itemsOf(o)" :key="it.productId" class="oi">
              <text class="oi-e">{{ it.product.emoji }}</text>
              <text class="oi-n">{{ it.product.name }}</text>
              <text class="oi-q">×{{ it.qty }}</text>
            </view>
          </view>
          <text class="o-addr">收货：{{ addressOf(o) }}</text>
          <view class="o-foot">
            <text class="o-amount">¥{{ amountOf(o) }}</text>
            <view class="o-btn" @tap="ship(o)">填单号发货</view>
          </view>
        </view>

        <view v-if="shipped.length" class="grp-t">已发货 {{ shipped.length }}</view>
        <view v-for="o in shipped" :key="o.id" class="order">
          <view class="o-head">
            <text class="o-id">{{ o.id }}</text>
            <text class="o-st ok">{{ o.status === 'done' ? '已完成' : '运输中' }}</text>
          </view>
          <view class="o-body">
            <view v-for="it in itemsOf(o)" :key="it.productId" class="oi">
              <text class="oi-e">{{ it.product.emoji }}</text>
              <text class="oi-n">{{ it.product.name }}</text>
              <text class="oi-q">×{{ it.qty }}</text>
            </view>
          </view>
          <text v-if="o.express" class="o-addr">{{ o.express.company }} · {{ o.express.no }}</text>
        </view>
      </template>

      <view style="height: 160rpx" />
    </view>

    <tab-bar active="sell" />

    <!-- 改价 / 改库存 -->
    <ui-sheet :visible="editOn" :title="editTitle" @close="editOn = false">
      <view class="edit-body">
        <text class="ed-s">{{ editSub }}</text>
        <view class="ed-field">
          <text class="ed-unit">{{ editType === 'price' ? '¥' : '份' }}</text>
          <input v-model="editValue" class="ed-in" type="digit" :placeholder="editType === 'price' ? '如 5.8' : '如 120'" placeholder-class="ph" />
        </view>
      </view>
      <template #footer>
        <ui-btn type="primary" block text="保存" @click="saveEdit" />
      </template>
    </ui-sheet>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { orderItems, shipOrder, store } from '@/store/index.js'
import {
  isOn,
  myProducts,
  persistSell,
  priceOf,
  setPrice,
  setStock,
  stockOf,
  toggleOn
} from '@/store/sell.js'
import { toast } from '@/common/utils.js'

const tab = ref('goods')
const tick = ref(0)
const editOn = ref(false)
const editType = ref('price')
const editValue = ref('')
const editing = ref(null)

const tabs = [
  { key: 'goods', label: '商品' },
  { key: 'order', label: '订单' }
]

const products = computed(() => {
  void tick.value
  return myProducts()
})
const onCount = computed(() => products.value.filter((p) => isOn(p.id)).length)

const toShip = computed(() => {
  void tick.value
  return store.orders.filter((o) => o.status === 'unshipped')
})
const shipped = computed(() => {
  void tick.value
  return store.orders.filter((o) => o.status === 'shipping' || o.status === 'done')
})
const income = computed(() =>
  Math.round(
    store.orders
      .filter((o) => o.status !== 'unpaid')
      .reduce((s, o) => s + orderItems(o).reduce((x, i) => x + (i.product ? i.product.price * i.qty : 0), 0), 0)
  )
)

const editTitle = computed(() => (editType.value === 'price' ? '修改售价' : '修改库存'))
const editSub = computed(() => (editing.value ? editing.value.name + ' · ' + editing.value.spec : ''))

onLoad((q) => {
  if (q && q.tab) tab.value = q.tab
})
onShow(() => {
  tick.value++
})

function onTab(v) {
  tab.value = v
}

function itemsOf(o) {
  return orderItems(o)
}

function amountOf(o) {
  return orderItems(o)
    .reduce((s, i) => s + (i.product ? i.product.price * i.qty : 0), 0)
    .toFixed(2)
}

function addressOf(o) {
  const a = store.addresses.find((x) => x.id === o.addressId) || store.addresses[0]
  if (!a) return '未填写地址'
  return (a.region || '') + ' ' + (a.detailAddress || '')
}

function toggle(p) {
  const nowOn = toggleOn(p.id)
  tick.value++
  toast(nowOn ? '已上架' : '已下架')
}

function editPrice(p) {
  editing.value = p
  editType.value = 'price'
  editValue.value = String(priceOf(p))
  editOn.value = true
}

function editStock(p) {
  editing.value = p
  editType.value = 'stock'
  editValue.value = String(stockOf(p))
  editOn.value = true
}

function saveEdit() {
  if (!editing.value) return
  const ok =
    editType.value === 'price'
      ? setPrice(editing.value.id, editValue.value)
      : setStock(editing.value.id, editValue.value)
  if (!ok) return toast('请输入有效数字')
  editOn.value = false
  tick.value++
  toast('已保存')
}

function preview(p) {
  uni.navigateTo({ url: '/pages/product/detail?id=' + p.id })
}

function addGoods() {
  uni.showModal({
    title: '上架新商品',
    content: '演示版暂未开放新建商品表单，接入后端后走「拍照 → 填价格库存 → 提交审核」。',
    showCancel: false
  })
}

function ship(o) {
  uni.showModal({
    title: '确认发货',
    content: '将生成一条冷链运单并通知买家。演示环境不产生真实物流。',
    success: (r) => {
      if (!r.confirm) return
      shipOrder(o.id)
      tick.value++
      toast('已发货')
    }
  })
}

function toOrders() {
  tab.value = 'order'
}
</script>

<style scoped>
.sell {
  min-height: 100vh;
}
.body {
  padding: 6rpx 28rpx 0;
}
.nav-act {
  font-size: 23rpx;
  color: #e08a2b;
  padding: 0 6rpx;
}
.ov {
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, #fff4e4, #ffe9cd);
  border-radius: 24rpx;
  padding: 22rpx 0;
}
.ov-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2rpx;
}
.ov-n {
  font-size: 36rpx;
  font-weight: 800;
  color: #a9660f;
}
.ov-l {
  font-size: 18rpx;
  color: #b99a52;
}
.ov-div {
  width: 2rpx;
  height: 40rpx;
  background: rgba(169, 102, 15, 0.14);
}
.seg-wrap {
  margin: 20rpx 0 8rpx;
}
.hint-line {
  padding: 8rpx 4rpx 16rpx;
}
.h-t {
  font-size: 19rpx;
  color: #9aa7a1;
  line-height: 1.5;
}
.goods {
  background: #fff;
  border-radius: 24rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}
.g-top {
  display: flex;
  gap: 16rpx;
}
.g-img {
  width: 120rpx;
  height: 120rpx;
  border-radius: 18rpx;
  background: linear-gradient(150deg, #fff1e4, #ffd9bc);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.g-emoji {
  font-size: 54rpx;
}
.g-name-row {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.g-name {
  font-size: 26rpx;
  font-weight: 700;
  color: #16201c;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.g-st {
  font-size: 17rpx;
  color: #06a96a;
  background: #e9faf2;
  border-radius: 6rpx;
  padding: 2rpx 8rpx;
  flex-shrink: 0;
}
.g-st.off {
  color: #9aa7a1;
  background: #f3f6f4;
}
.g-spec {
  display: block;
  margin-top: 6rpx;
  font-size: 19rpx;
  color: #9aa7a1;
}
.g-meta {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  margin-top: 10rpx;
}
.g-price {
  font-size: 30rpx;
  font-weight: 800;
  color: #ff4b3a;
}
.g-stock {
  font-size: 19rpx;
  color: #9aa7a1;
}
.g-acts {
  display: flex;
  gap: 10rpx;
  margin-top: 16rpx;
  padding-top: 14rpx;
  border-top: 2rpx solid #f4f8f5;
}
.ga {
  flex: 1;
  height: 60rpx;
  border-radius: 60rpx;
  background: #f6f9f7;
  color: #3d4a45;
  font-size: 21rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ga.main {
  background: #fff4e4;
  color: #b07a00;
  font-weight: 700;
}
.add-goods {
  display: flex;
  align-items: center;
  gap: 14rpx;
  background: #fffdfa;
  border: 2rpx dashed #f0ddc2;
  border-radius: 24rpx;
  padding: 22rpx;
  margin-top: 4rpx;
}
.ag-plus {
  font-size: 44rpx;
  color: #d9b98c;
}
.ag-t {
  display: block;
  font-size: 24rpx;
  font-weight: 700;
  color: #a9660f;
}
.ag-s {
  display: block;
  margin-top: 4rpx;
  font-size: 19rpx;
  color: #b99a52;
}
.grp-t {
  font-size: 21rpx;
  color: #9aa7a1;
  padding: 12rpx 4rpx 10rpx;
}
.order {
  background: #fff;
  border-radius: 24rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}
.o-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.o-id {
  font-size: 19rpx;
  color: #9aa7a1;
}
.o-st {
  font-size: 18rpx;
  border-radius: 6rpx;
  padding: 2rpx 10rpx;
}
.o-st.warn {
  color: #b07a00;
  background: #fff8e6;
}
.o-st.ok {
  color: #06a96a;
  background: #e9faf2;
}
.o-body {
  margin-top: 12rpx;
}
.oi {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 4rpx 0;
}
.oi-e {
  font-size: 24rpx;
}
.oi-n {
  flex: 1;
  font-size: 22rpx;
  color: #3d4a45;
}
.oi-q {
  font-size: 20rpx;
  color: #9aa7a1;
}
.o-addr {
  display: block;
  margin-top: 10rpx;
  font-size: 19rpx;
  color: #9aa7a1;
  line-height: 1.5;
}
.o-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14rpx;
  padding-top: 14rpx;
  border-top: 2rpx solid #f4f8f5;
}
.o-amount {
  font-size: 26rpx;
  font-weight: 800;
  color: #ff4b3a;
}
.o-btn {
  height: 58rpx;
  padding: 0 24rpx;
  border-radius: 58rpx;
  background: #e08a2b;
  color: #fff;
  font-size: 21rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
}
.empty {
  background: #fff;
  border-radius: 24rpx;
  padding: 70rpx 36rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}
.e-e {
  font-size: 56rpx;
}
.e-t {
  font-size: 26rpx;
  font-weight: 700;
  color: #3d4a45;
}
.e-s {
  font-size: 20rpx;
  color: #9aa7a1;
  text-align: center;
  line-height: 1.6;
}
.edit-body {
  padding: 10rpx 0 6rpx;
}
.ed-s {
  display: block;
  font-size: 21rpx;
  color: #9aa7a1;
  margin-bottom: 16rpx;
}
.ed-field {
  display: flex;
  align-items: center;
  gap: 10rpx;
  background: #f6f9f7;
  border-radius: 18rpx;
  padding: 0 20rpx;
  height: 96rpx;
}
.ed-unit {
  font-size: 26rpx;
  color: #7c8a84;
}
.ed-in {
  flex: 1;
  font-size: 32rpx;
  font-weight: 700;
  color: #16201c;
}
.ph {
  color: #c3ccc8;
  font-weight: 400;
  font-size: 26rpx;
}
</style>

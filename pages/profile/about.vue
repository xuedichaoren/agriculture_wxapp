<template>
  <view class="page about-page">
    <nav-bar title="关于湘农汇" />

    <scroll-view scroll-y class="body no-scrollbar" :show-scrollbar="false">
      <!-- 头部 -->
      <view class="hero">
        <view class="logo">🌾</view>
        <text class="app-name">湘农汇</text>
        <text class="app-ver">v{{ version }}</text>
        <text class="app-slogan">从武陵山到餐桌，中间只隔一次采摘</text>
      </view>

      <!-- 分段 -->
      <view class="seg">
        <view
          v-for="t in TABS"
          :key="t.key"
          class="seg-item"
          :class="{ on: tab === t.key }"
          @tap="tab = t.key"
        >{{ t.name }}</view>
      </view>

      <!-- 关于我们 -->
      <template v-if="tab === 'about'">
        <view class="card">
          <text class="c-title">我们在做什么</text>
          <text class="c-text">湘农汇做的是产地直采：农户把当天摘的菜、当天挖的山货放上来，买家下单后直接从地里发出，不经过中间批发环节。</text>
          <text class="c-text">认养是另一条线。买家认养一块地，农户按方案帮你种、帮你管、定期把产出寄给你，中间的长势和农事记录都能看到。</text>
          <text class="c-text">我们还把农技力量接了进来：拍照识病、专家问诊、农事天气，让种地这件事少走点弯路。</text>
        </view>

        <view class="card">
          <text class="c-title">三种身份，一个账号</text>
          <view v-for="r in ROLES" :key="r.key" class="role-row">
            <text class="role-e">{{ r.emoji }}</text>
            <view class="flex1">
              <text class="role-n">{{ r.name }}</text>
              <text class="role-s">{{ r.desc }}</text>
            </view>
          </view>
        </view>

        <view class="card">
          <view class="row-item" @tap="checkUpdate">
            <icon-svg name="refresh" :size="30" color="#3D4A45" :stroke="1.7" />
            <text class="ri-name">检查更新</text>
            <text class="ri-value">v{{ version }}</text>
            <icon-svg name="right" :size="22" color="#C3CCC8" />
          </view>
          <view class="row-item" @tap="contact">
            <icon-svg name="phone" :size="30" color="#3D4A45" :stroke="1.7" />
            <text class="ri-name">联系我们</text>
            <text class="ri-value">400-100-2233</text>
            <icon-svg name="right" :size="22" color="#C3CCC8" />
          </view>
          <view class="row-item" @tap="go('/pages/profile/help')">
            <icon-svg name="comment" :size="30" color="#3D4A45" :stroke="1.7" />
            <text class="ri-name">帮助与反馈</text>
            <icon-svg name="right" :size="22" color="#C3CCC8" />
          </view>
        </view>
      </template>

      <!-- 用户协议 -->
      <view v-if="tab === 'terms'" class="card doc">
        <text class="doc-h">湘农汇用户协议</text>
        <text class="doc-upd">更新日期：2026 年 11 月 1 日</text>
        <view v-for="(sec, i) in TERMS" :key="i" class="doc-sec">
          <text class="doc-t">{{ i + 1 }}. {{ sec.h }}</text>
          <text class="doc-p">{{ sec.p }}</text>
        </view>
        <text class="doc-end">如对条款有异议，请通过「帮助与反馈」联系我们。</text>
      </view>

      <!-- 隐私政策 -->
      <view v-if="tab === 'privacy'" class="card doc">
        <text class="doc-h">湘农汇隐私政策</text>
        <text class="doc-upd">更新日期：2026 年 11 月 1 日</text>
        <view v-for="(sec, i) in PRIVACY" :key="i" class="doc-sec">
          <text class="doc-t">{{ i + 1 }}. {{ sec.h }}</text>
          <text class="doc-p">{{ sec.p }}</text>
        </view>
        <text class="doc-end">我们不会把你的信息卖给任何第三方。</text>
      </view>

      <view class="foot-tip">
        <text class="ft-t">湘农汇 · 湖南湘农汇农业科技有限公司</text>
        <text class="ft-s">演示版本，数据均为本地模拟</text>
      </view>
      <view style="height: 40rpx" />
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { ROLE_LIST } from '@/common/roles.js'
import { toast } from '@/common/utils.js'

const version = '1.0.0'
const ROLES = ROLE_LIST
const TABS = [
  { key: 'about', name: '关于' },
  { key: 'terms', name: '用户协议' },
  { key: 'privacy', name: '隐私政策' }
]

const tab = ref('about')

const TERMS = [
  { h: '服务内容', p: '本平台提供农户与买家之间的农产品展示、交易撮合，以及地块认养、识图诊断、专家问诊等辅助服务。平台不是交易的一方，商品的品质与履约由农户负责。' },
  { h: '账号与身份', p: '一个账号可申请多个身份（买家、农户、农业专家），各身份的数据相互独立。提交的资料需真实有效，冒用他人信息或虚构产地，平台有权封停账号。' },
  { h: '下单与支付', p: '下单即视为向农户发出购买要约，支付成功后合同成立。生鲜商品因自然损耗存在合理误差，误差范围见商品说明。' },
  { h: '发货与验收', p: '农户应在承诺时间内发货。买家收到后应及时验收；发现坏果、少件的，应在 48 小时内通过订单发起反馈，逾期视为验收合格。' },
  { h: '认养规则', p: '认养按方案约定的品种、数量、周期履约。农户需按约定推送长势与农事记录。因自然灾害导致减产的，双方协商补发或退款。' },
  { h: '识图与问诊的边界', p: '识图诊断与专家问诊的结果仅供参考，不构成农技服务承诺。涉及用药的，以农药标签登记信息为准，因误用造成的损失由使用者承担。' },
  { h: '禁止行为', p: '禁止发布虚假商品、刷单炒信、诱导线下交易、发布违法违规内容。违规内容平台可直接下架，情节严重者移交有关部门。' },
  { h: '协议变更', p: '平台可能根据业务调整修订本协议，修订后会在应用内公示。继续使用即视为接受修订后的条款。' }
]

const PRIVACY = [
  { h: '我们收集哪些信息', p: '登录所需的微信授权标识；下单所需的收货人姓名、电话、地址；申请农户身份时提交的姓名、联系方式、地块位置与基地照片；你主动上传的图片与填写的反馈内容。' },
  { h: '我们为什么收集', p: '用于完成交易与履约、核验身份真实性、处理售后与纠纷、改进产品体验。不做与本服务无关的用途。' },
  { h: '位置信息', p: '仅在获取天气与附近产地时使用，可在系统设置里随时关闭。关闭后天气会回落到农场所在区域的数据。' },
  { h: '照片与相机', p: '仅在拍照识病、发布商品、上传反馈时调用。图片只用于你发起的这项功能，不会在后台读取相册。' },
  { h: '信息共享', p: '为完成配送，会把收货信息提供给对应的农户与快递公司；除此之外不向第三方提供你的个人信息，法律法规另有要求的除外。' },
  { h: '存储与保护', p: '数据存储于境内服务器，传输过程加密。演示版本的数据保存在本机，卸载应用即清除。' },
  { h: '你的权利', p: '你可以查询、更正、删除自己的信息，也可以注销账号。在「我的 → 意见反馈」里提交，我们会在 15 个工作日内处理。' },
  { h: '未成年人', p: '本服务面向成年用户。若你是未成年人，请在监护人陪同下使用，并由监护人代为下单。' }
]

function checkUpdate() {
  uni.showLoading({ title: '检查中', mask: true })
  setTimeout(() => {
    uni.hideLoading()
    toast('已是最新版本 v' + version)
  }, 600)
}

function contact() {
  uni.showModal({
    title: '联系我们',
    content: '客服电话 400-100-2233\n工作时间 9:00–21:00\n邮箱 service@xnonghui.example',
    confirmText: '复制邮箱',
    success: (r) => {
      if (!r.confirm) return
      uni.setClipboardData({ data: 'service@xnonghui.example' })
    }
  })
}

function go(url) {
  uni.navigateTo({ url })
}

onLoad((q) => {
  const t = q && q.tab
  if (t && ['about', 'terms', 'privacy'].indexOf(t) > -1) tab.value = t
})
</script>

<style scoped>
.about-page {
  min-height: 100vh;
  background: #f4f8f5;
}
.body {
  padding: 0 24rpx;
}

/* 头部 */
.hero {
  padding: 40rpx 0 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.logo {
  width: 132rpx;
  height: 132rpx;
  border-radius: 32rpx;
  background: linear-gradient(150deg, #eaf9f1, #cff3e0);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 66rpx;
  box-shadow: 0 10rpx 30rpx rgba(6, 169, 106, 0.14);
}
.app-name {
  margin-top: 18rpx;
  font-size: 34rpx;
  font-weight: 800;
  color: #16201c;
  letter-spacing: 2rpx;
}
.app-ver {
  margin-top: 6rpx;
  font-size: 19rpx;
  color: #9aa7a1;
}
.app-slogan {
  margin-top: 14rpx;
  font-size: 20rpx;
  color: #7c8a84;
}

/* 分段 */
.seg {
  display: flex;
  background: #fff;
  border-radius: 40rpx;
  padding: 6rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}
.seg-item {
  flex: 1;
  height: 64rpx;
  border-radius: 34rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  color: #7c8a84;
}
.seg-item.on {
  background: #e9faf2;
  color: #06a96a;
  font-weight: 700;
}

.card {
  background: #fff;
  border-radius: 22rpx;
  padding: 24rpx 20rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}
.c-title {
  display: block;
  font-size: 26rpx;
  font-weight: 700;
  color: #16201c;
  margin-bottom: 12rpx;
}
.c-text {
  display: block;
  font-size: 21rpx;
  color: #5c6a64;
  line-height: 1.8;
  margin-bottom: 10rpx;
}

/* 角色 */
.role-row {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
  padding: 12rpx 0;
  border-bottom: 2rpx solid #f4f8f5;
}
.role-row:last-child {
  border-bottom: none;
}
.role-e {
  font-size: 32rpx;
}
.role-n {
  display: block;
  font-size: 23rpx;
  font-weight: 600;
  color: #16201c;
}
.role-s {
  display: block;
  margin-top: 4rpx;
  font-size: 19rpx;
  color: #9aa7a1;
  line-height: 1.5;
}

/* 行 */
.row-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  height: 92rpx;
  border-bottom: 2rpx solid #f4f8f5;
}
.row-item:last-child {
  border-bottom: none;
}
.ri-name {
  flex: 1;
  font-size: 23rpx;
  color: #16201c;
}
.ri-value {
  font-size: 20rpx;
  color: #9aa7a1;
}

/* 文档 */
.doc-h {
  display: block;
  font-size: 30rpx;
  font-weight: 800;
  color: #16201c;
}
.doc-upd {
  display: block;
  margin-top: 8rpx;
  font-size: 18rpx;
  color: #b3bfba;
}
.doc-sec {
  margin-top: 20rpx;
}
.doc-t {
  display: block;
  font-size: 23rpx;
  font-weight: 700;
  color: #16201c;
  margin-bottom: 6rpx;
}
.doc-p {
  display: block;
  font-size: 21rpx;
  color: #5c6a64;
  line-height: 1.8;
}
.doc-end {
  display: block;
  margin-top: 24rpx;
  font-size: 19rpx;
  color: #9aa7a1;
  text-align: center;
}

.foot-tip {
  padding: 30rpx 0 10rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}
.ft-t {
  font-size: 18rpx;
  color: #b3bfba;
}
.ft-s {
  font-size: 17rpx;
  color: #c3ccc8;
}
</style>

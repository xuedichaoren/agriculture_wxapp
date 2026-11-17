<template>
  <view class="page cert-page">
    <nav-bar title="认养证书" bg="#F4F8F5">
      <template #right>
        <view class="nav-btn" @tap="onShare">
          <icon-svg name="share" :size="30" color="#16201C" :stroke="1.8" />
        </view>
      </template>
    </nav-bar>

    <view v-if="cert" class="body">
      <!-- 状态条 -->
      <view class="status" :class="'tone-' + cert.tone">
        <icon-svg :name="cert.valid ? 'checkCircle' : 'warning'" :size="28" :color="validColor" :stroke="1.7" />
        <text class="status-txt">{{ summary }}</text>
      </view>

      <!-- 证书 -->
      <view class="paper-wrap" @longpress="onSave">
        <view class="paper">
          <view class="frame" />

          <view class="p-top">
            <text class="p-brand">湘 农 汇</text>
            <text class="p-no">NO. {{ cert.no }}</text>
          </view>
          <view class="p-hair" />

          <text class="p-title">土地认养证书</text>
          <text class="p-en">LAND ADOPTION CERTIFICATE</text>

          <view class="p-orn">
            <view class="orn-line" />
            <view class="orn-dot" />
            <view class="orn-line" />
          </view>

          <text class="p-zh">兹 证 明</text>
          <text class="p-owner">{{ cert.owner }}</text>
          <text class="p-para">
            于 {{ cert.startDate }} 认养 {{ cert.farmName }} 的 {{ cert.plotLabel }}（{{ cert.area }}㎡）。认养期内该地块产出归认养人所有，农场按约定标准管护并同步农事记录。
          </text>

          <view class="p-rows">
            <view class="p-row">
              <text class="pr-l">地块</text>
              <text class="pr-v">{{ cert.plotLabel }} · {{ cert.area }}㎡</text>
            </view>
            <view class="p-row">
              <text class="pr-l">农场</text>
              <text class="pr-v">{{ cert.farmName }}</text>
            </view>
            <view class="p-row">
              <text class="pr-l">作物</text>
              <text class="pr-v">{{ cert.crops }}</text>
            </view>
            <view class="p-row">
              <text class="pr-l">方式</text>
              <text class="pr-v">{{ cert.planName }} · {{ cert.cycleName }}</text>
            </view>
            <view class="p-row">
              <text class="pr-l">期限</text>
              <text class="pr-v">{{ cert.term }}</text>
            </view>
            <view class="p-row">
              <text class="pr-l">金额</text>
              <text class="pr-v">￥{{ cert.total }}</text>
            </view>
          </view>

          <text class="p-note">
            本证书为电子凭证，凭证书编号与验真码可在「湘农汇」小程序内查询认养与配送记录。
          </text>

          <view class="p-foot">
            <view class="p-sign">
              <text class="ps-farm">{{ cert.farmName }}</text>
              <text class="ps-date">签发日期 {{ cert.issueDate }}</text>
            </view>
            <view class="p-seal">
              <text class="seal-brand">湘农汇</text>
              <text class="seal-sub">认养专用章</text>
              <text class="seal-en">{{ cert.valid ? 'ADOPTION' : 'VOID' }}</text>
            </view>
          </view>

          <view class="p-hair foot" />
          <view class="p-foot-row">
            <text class="pf-verify">验真码 {{ cert.verify }}</text>
            <text class="pf-brand">湘农汇 · 电子认养证书</text>
          </view>

          <view v-if="!cert.valid" class="p-void">
            <text class="p-void-txt">{{ cert.sealText }}</text>
          </view>
        </view>
      </view>

      <!-- 验真 -->
      <view class="card sec">
        <view class="row between sec-head">
          <text class="sec-title">证书验真</text>
          <text class="sec-action" @tap="copyVerify">复制验真码</text>
        </view>
        <view class="vf-row">
          <text class="vf-l">证书编号</text>
          <text class="vf-v mono">{{ cert.no }}</text>
        </view>
        <view class="vf-row">
          <text class="vf-l">验真码</text>
          <text class="vf-v mono strong">{{ cert.verify }}</text>
        </view>
        <view class="vf-row">
          <text class="vf-l">认养状态</text>
          <text class="vf-v">{{ cert.statusText }} · {{ cert.startDate }} 起</text>
        </view>
        <view class="vf-tip">
          <icon-svg name="scan" :size="26" color="#8C7A50" :stroke="1.6" />
          <text class="vf-tip-txt">
            编号与验真码一一对应，报给客服即可核验真伪；纸质打印件同样有效。
          </text>
        </view>
      </view>

      <!-- 用途 -->
      <view class="card sec">
        <text class="sec-title">这张证书能做什么</text>
        <view class="use">
          <view class="use-item">
            <text class="use-idx">1</text>
            <text class="use-txt">作为认养凭证：地块、作物、期限都写在上面，随时可查</text>
          </view>
          <view class="use-item">
            <text class="use-idx">2</text>
            <text class="use-txt">保存成图片发给家人，或打印出来贴在冰箱上</text>
          </view>
          <view class="use-item">
            <text class="use-idx">3</text>
            <text class="use-txt">认养结束后证书仍然有效，可留作纪念</text>
          </view>
        </view>
      </view>

      <view class="actions">
        <view class="btn btn-primary" :class="{ 'btn-disabled': busy }" @tap="onSave">
          保存证书到相册
        </view>
        <view class="btn btn-ghost mt" @tap="onShare">分享证书图片</view>
      </view>

      <view class="foot">
        <text class="foot-txt">长按证书也可以保存 · 证书长期有效</text>
      </view>
      <view style="height: 60rpx" />
    </view>

    <view v-else class="empty-wrap">
      <empty-box
        emoji="🌾"
        :text="emptyText"
        :sub="emptySub"
        btn-text="去认养大厅"
        @action="toAdopt"
      />
    </view>

    <!-- 导出兜底画布：只在保存/分享时插入，尺寸压到 2rpx，不会挡住页面 -->
    <canvas v-if="posterOn" type="2d" id="certPoster" class="poster-canvas" />
  </view>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { certificateOf, certSummaryOf } from '@/api/adopt-cert.js'
import { findAdoption } from '@/store/index.js'
import { renderPoster, savePoster, sharePoster } from '@/common/cert-poster.js'
import { copyText, toast } from '@/common/utils.js'

const busy = ref(false)
// 离屏画布不可用时才挂出来的兜底画布
const posterOn = ref(false)

const certId = ref('')

// 参数优先从 onLoad 拿（uni-app 的标准入口，最稳）
onLoad((query) => {
  if (query && query.id) certId.value = query.id
})

// 兜底：直接读页面栈里的 options，防止某些基础库 onLoad 时机差异
try {
  const pages = getCurrentPages()
  const cur = pages[pages.length - 1]
  if (!certId.value && cur && cur.options && cur.options.id) certId.value = cur.options.id
} catch (e) {}

const cert = computed(() => {
  try {
    return certificateOf(findAdoption(certId.value))
  } catch (e) {
    // 数据缺字段时宁可落到空态，也不要让整页渲染失败变白屏
    console.error('[cert] 派生证书失败', e)
    return null
  }
})

const summary = computed(() => certSummaryOf(cert.value))
const emptyText = computed(() => (certId.value ? '没找到这张证书' : '没有拿到认养单号'))
const emptySub = computed(() =>
  certId.value ? '可能已经退养，或本地数据被清理' : '请回「我的认养」里重新点开'
)
const validColor = computed(() => (cert.value && cert.value.valid ? '#06A96A' : '#B5754A'))

function failText(e) {
  const msg = String((e && e.message) || '')
  if (!msg || msg === 'cancel') return ''
  if (/auth|deny|permission|authorize/i.test(msg)) return '没有相册权限，请在设置里开启'
  if (/fail/.test(msg)) return '操作失败，请再试一次'
  return msg
}

async function mountCanvas() {
  posterOn.value = true
  await nextTick()
}

function unmountCanvas() {
  posterOn.value = false
}

async function build() {
  return renderPoster(cert.value, {
    mount: mountCanvas,
    unmount: unmountCanvas
  })
}

async function onSave() {
  if (!cert.value || busy.value) return
  busy.value = true
  uni.showLoading({ title: '生成证书…', mask: true })
  let path = ''
  try {
    path = await build()
  } catch (e) {
    busy.value = false
    uni.hideLoading()
    toast(failText(e) || '生成失败，请稍后再试')
    return
  }
  uni.hideLoading()
  try {
    await savePoster(path)
    toast('已保存到相册')
  } catch (e) {
    const t = failText(e)
    if (t) toast(t)
  } finally {
    busy.value = false
  }
}

async function onShare() {
  if (!cert.value || busy.value) return
  busy.value = true
  uni.showLoading({ title: '生成图片…', mask: true })
  let path = ''
  try {
    path = await build()
  } catch (e) {
    busy.value = false
    uni.hideLoading()
    toast(failText(e) || '生成失败，请稍后再试')
    return
  }
  uni.hideLoading()
  try {
    await sharePoster(path)
  } catch (e) {
    const t = failText(e)
    if (t) toast(t)
  } finally {
    busy.value = false
  }
}

function copyVerify() {
  if (cert.value) copyText(cert.value.verify)
}

function toAdopt() {
  uni.redirectTo({ url: '/pages/farm/adopt' })
}
</script>

<style scoped>
.cert-page {
  padding-bottom: 20rpx;
}
.body {
  padding-bottom: 10rpx;
}
.nav-btn {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 状态条 */
.status {
  margin: 8rpx 24rpx 0;
  padding: 14rpx 20rpx;
  border-radius: 16rpx;
  background: #eafaf1;
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.status.tone-done {
  background: #f1f5f3;
}
.status.tone-void {
  background: #fdf3ec;
}
.status-txt {
  flex: 1;
  font-size: 20rpx;
  color: #4a5a52;
  line-height: 1.5;
}

/* 证书纸面 */
.paper-wrap {
  margin: 20rpx 24rpx 0;
  padding: 8rpx;
  border-radius: 26rpx;
  background: linear-gradient(135deg, #e3cd9b, #c6a15b 45%, #efe1bf);
  box-shadow: 0 18rpx 44rpx rgba(120, 95, 40, 0.16);
}
.paper {
  position: relative;
  background: #fffdf6;
  border-radius: 20rpx;
  padding: 30rpx 34rpx 26rpx;
  overflow: hidden;
}
.frame {
  position: absolute;
  left: 12rpx;
  right: 12rpx;
  top: 12rpx;
  bottom: 12rpx;
  border: 2rpx solid #dfcb9c;
  border-radius: 12rpx;
}
.p-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}
.p-brand {
  font-size: 22rpx;
  font-weight: 700;
  color: #8c7a50;
  letter-spacing: 2rpx;
}
.p-no {
  font-size: 17rpx;
  color: #b9a97f;
}
.p-hair {
  height: 2rpx;
  background: #e7d9b8;
  margin-top: 14rpx;
}
.p-hair.foot {
  margin-top: 22rpx;
}
.p-title {
  display: block;
  text-align: center;
  font-size: 42rpx;
  font-weight: 800;
  color: #1c3a2c;
  letter-spacing: 10rpx;
  margin-top: 22rpx;
}
.p-en {
  display: block;
  text-align: center;
  font-size: 15rpx;
  color: #b49a63;
  letter-spacing: 4rpx;
  margin-top: 10rpx;
}
.p-orn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14rpx;
  margin-top: 18rpx;
}
.orn-line {
  width: 120rpx;
  height: 2rpx;
  background: #e0d2ac;
}
.orn-dot {
  width: 10rpx;
  height: 10rpx;
  background: #c6a15b;
  transform: rotate(45deg);
}
.p-zh {
  display: block;
  text-align: center;
  font-size: 20rpx;
  color: #8c7a50;
  letter-spacing: 8rpx;
  margin-top: 22rpx;
}
.p-owner {
  display: block;
  text-align: center;
  font-size: 44rpx;
  font-weight: 800;
  color: #0a7f52;
  letter-spacing: 6rpx;
  margin-top: 10rpx;
}
.p-para {
  display: block;
  font-size: 20rpx;
  color: #4a5a52;
  line-height: 1.85;
  margin-top: 14rpx;
}
.p-rows {
  margin-top: 18rpx;
  border-top: 2rpx solid #f1e8d3;
}
.p-row {
  display: flex;
  align-items: flex-start;
  padding: 12rpx 0;
  border-bottom: 2rpx solid #f8f2e2;
}
.pr-l {
  width: 88rpx;
  flex-shrink: 0;
  font-size: 19rpx;
  color: #a08b52;
}
.pr-v {
  flex: 1;
  font-size: 21rpx;
  color: #2a3b33;
  word-break: break-all;
}
.p-note {
  display: block;
  font-size: 17rpx;
  color: #9a8a63;
  line-height: 1.7;
  margin-top: 16rpx;
}
.p-foot {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-top: 20rpx;
}
.p-sign {
  display: flex;
  flex-direction: column;
  padding-bottom: 10rpx;
}
.ps-farm {
  font-size: 22rpx;
  font-weight: 700;
  color: #1c3a2c;
}
.ps-date {
  font-size: 17rpx;
  color: #a08b52;
  margin-top: 6rpx;
}
.p-seal {
  width: 128rpx;
  height: 128rpx;
  border-radius: 50%;
  border: 4rpx solid rgba(198, 60, 50, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transform: rotate(-12deg);
  flex-shrink: 0;
  margin-right: 6rpx;
}
.seal-brand {
  font-size: 22rpx;
  font-weight: 800;
  color: rgba(198, 60, 50, 0.78);
  letter-spacing: 1rpx;
}
.seal-sub {
  font-size: 13rpx;
  color: rgba(198, 60, 50, 0.62);
  margin-top: 4rpx;
}
.seal-en {
  font-size: 11rpx;
  color: rgba(198, 60, 50, 0.45);
  margin-top: 2rpx;
  letter-spacing: 1rpx;
}
.p-foot-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14rpx;
}
.pf-verify {
  font-size: 17rpx;
  color: #8c7a50;
}
.pf-brand {
  font-size: 15rpx;
  color: #c0ae84;
}
.p-void {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}
.p-void-txt {
  font-size: 110rpx;
  font-weight: 800;
  color: rgba(198, 60, 50, 0.12);
  letter-spacing: 10rpx;
  transform: rotate(-18deg);
}

/* 通用卡片 */
.sec {
  margin: 20rpx 24rpx 0;
  padding: 24rpx;
}
.sec-head {
  margin-bottom: 12rpx;
}
.sec-title {
  display: block;
  font-size: 27rpx;
  font-weight: 700;
}
.sec-action {
  font-size: 20rpx;
  color: #0a8f5c;
}
.vf-row {
  display: flex;
  align-items: baseline;
  padding: 12rpx 0;
  border-bottom: 2rpx solid #f6f9f7;
}
.vf-l {
  width: 150rpx;
  flex-shrink: 0;
  font-size: 21rpx;
  color: #9aa7a1;
}
.vf-v {
  flex: 1;
  font-size: 22rpx;
  color: #263330;
  word-break: break-all;
}
.vf-v.strong {
  font-weight: 700;
  color: #0a7f52;
}
.mono {
  letter-spacing: 1rpx;
}
.vf-tip {
  display: flex;
  align-items: flex-start;
  gap: 10rpx;
  margin-top: 16rpx;
  padding: 16rpx;
  background: #faf6ec;
  border-radius: 16rpx;
}
.vf-tip-txt {
  flex: 1;
  font-size: 19rpx;
  color: #8c7a50;
  line-height: 1.6;
}

.use {
  margin-top: 6rpx;
}
.use-item {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  padding: 10rpx 0;
}
.use-idx {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background: #e9faf2;
  color: #0a8f5c;
  font-size: 18rpx;
  font-weight: 700;
  text-align: center;
  line-height: 32rpx;
  flex-shrink: 0;
  margin-top: 2rpx;
}
.use-txt {
  flex: 1;
  font-size: 21rpx;
  color: #5c6a64;
  line-height: 1.6;
}

.actions {
  margin: 28rpx 24rpx 0;
}
.mt {
  margin-top: 16rpx;
}
.foot {
  margin-top: 22rpx;
  text-align: center;
}
.foot-txt {
  font-size: 19rpx;
  color: #b3bfba;
}
.empty-wrap {
  padding-top: 40rpx;
}

/* 画布只用来出图，尺寸压到 2rpx 并贴着屏幕左下角，任何情况下都挡不住内容 */
.poster-canvas {
  position: fixed;
  left: 0;
  bottom: 0;
  width: 2rpx;
  height: 2rpx;
  opacity: 0;
  pointer-events: none;
}
</style>

<template>
  <view class="page help-page">
    <nav-bar title="帮助与反馈" />
    <scroll-view scroll-y class="body no-scrollbar" :show-scrollbar="false" :scroll-into-view="scrollTo">
      <!-- 快捷入口 -->
      <view class="quick3">
        <view class="q3" @tap="callService">
          <text class="q3-e">☎️</text>
          <text class="q3-n">电话客服</text>
          <text class="q3-s">9:00–21:00</text>
        </view>
        <view class="q3" @tap="chatService">
          <text class="q3-e">💬</text>
          <text class="q3-n">在线客服</text>
          <text class="q3-s">一般 5 分钟内回</text>
        </view>
        <view class="q3" @tap="scrollToForm">
          <text class="q3-e">📝</text>
          <text class="q3-n">意见反馈</text>
          <text class="q3-s">改得快</text>
        </view>
      </view>

      <!-- FAQ -->
      <view class="card faq">
        <view class="f-head">
          <text class="f-title">常见问题</text>
          <text class="f-sub">{{ FAQ.length }} 条</text>
        </view>

        <view v-for="g in FAQ" :key="g.group" class="f-group">
          <text class="f-gname">{{ g.group }}</text>
          <view v-for="(q, qi) in g.items" :key="qi" class="f-item">
            <view class="f-q" @tap="toggle(g.group, qi)">
              <text class="f-qt">{{ q.q }}</text>
              <icon-svg
                :name="isOpen(g.group, qi) ? 'up' : 'down'"
                :size="22"
                color="#9AA7A1"
                :stroke="2"
              />
            </view>
            <view v-if="isOpen(g.group, qi)" class="f-a">
              <text class="f-at">{{ q.a }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 反馈 -->
      <view id="feedback" class="card fb">
        <text class="fb-title">意见反馈</text>
        <text class="fb-sub">说不清也没关系，写你遇到的问题就行，我们会看</text>

        <view class="fb-types">
          <view
            v-for="t in TYPES"
            :key="t"
            class="fb-type"
            :class="{ on: type === t }"
            @tap="type = t"
          >{{ t }}</view>
        </view>

        <textarea
          class="fb-ta"
          v-model="text"
          :maxlength="300"
          placeholder="具体一点更好定位：在哪个页面、点了什么、出现什么"
          placeholder-class="fb-ph"
          :show-confirm-bar="false"
        />
        <view class="fb-count">{{ text.length }}/300</view>

        <input
          class="fb-input"
          v-model="contact"
          placeholder="留个联系方式（选填），方便回访"
          placeholder-class="fb-ph"
        />

        <ui-btn
          type="primary"
          size="lg"
          block
          :loading="sending"
          :disabled="!text.trim()"
          text="提交反馈"
          @click="submit"
        />
      </view>

      <!-- 已提交记录 -->
      <view v-if="history.length" class="card his">
        <text class="his-title">我提交过的</text>
        <view v-for="h in history" :key="h.id" class="his-item">
          <view class="row between">
            <text class="his-type">{{ h.type }}</text>
            <text class="his-time">{{ h.time }}</text>
          </view>
          <text class="his-text">{{ h.text }}</text>
          <text class="his-reply">{{ h.reply }}</text>
        </view>
      </view>

      <view style="height: 40rpx" />
    </scroll-view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { toast } from '@/common/utils.js'

const KEY = 'nh_feedback_v1'

const TYPES = ['功能异常', '体验建议', '内容有误', '其他']

const FAQ = [
  {
    group: '买菜与订单',
    items: [
      { q: '菜什么时候发货？多久能到？', a: '农场一般在下单后 24 小时内采摘发出，省内顺丰冷链次日达，偏远地区 2–3 天。叶菜类会尽量安排当天的班次。' },
      { q: '收到坏果、少件怎么办？', a: '在订单详情里点「联系客服」，把坏的部分拍照发过来。生鲜类坏果包赔，核实后按比例退款或补发，不需要寄回。' },
      { q: '可以修改收货地址吗？', a: '未发货前可以在订单详情里改；已发货只能联系客服尝试拦截。地址在「我的 → 收货地址」里维护，下单时可以直接选。' },
      { q: '为什么实际重量和标注有差别？', a: '生鲜按份售卖，会有 ±5% 的自然误差。如果差得明显，拍照反馈，我们按差价补。' }
    ]
  },
  {
    group: '认养',
    items: [
      { q: '认养之后我能得到什么？', a: '按认养方案定期收到这块地当季产出的菜，能在「我的认养」里看长势动态、农事记录，还能收到采收提醒。' },
      { q: '认养人可以随时去看地吗？', a: '可以预约到访，在认养详情里点「预约到访」，农户确认后按约定时间去。远程的话看云监工和长势推送。' },
      { q: '中途能退养吗？', a: '开始履约前可以全额退；已开始履约的按已配送次数结算后退剩余部分。具体在认养协议的退养条款里。' },
      { q: '认养证书是什么？', a: '认养成功后自动生成，在「我的认养 → 证书」里查看和保存，含地块编号、周期、认养人名字。' }
    ]
  },
  {
    group: '识图诊断',
    items: [
      { q: '为什么一定要先选作物？', a: '同一种病在不同作物上表现不一样，用药和浓度也差很多。先确认作物再判断病害，比让它猜准得多。' },
      { q: '识别结果能直接照着用药吗？', a: '结果只是参考，不能替代农技人员的判断。用药前看清标签上的适用作物和安全间隔期，拿不准就在「专家问诊」里问一句。' },
      { q: '拍什么部位最好？', a: '优先拍病斑特写 + 整株环境两张。果腐、茎基腐、根腐这类问题拍叶子是看不出来的，先选对部位。' }
    ]
  },
  {
    group: '身份与账号',
    items: [
      { q: '三种身份能同时有吗？', a: '可以。同一个账号能申请成为农户或农业专家，通过后随时在「我的 → 身份与权限」里切换，数据和订单各自独立。' },
      { q: '申请农户要多久？', a: '一般 1–2 个工作日。需要核验姓名、电话、地块位置，基地照片能加快审核。' },
      { q: '换手机号了怎么办？', a: '当前版本登录走微信授权，换手机号不影响登录。需要更新联系方式的话在意见反馈里说明。' }
    ]
  }
]

const openMap = ref({})
const type = ref('功能异常')
const text = ref('')
const contact = ref('')
const sending = ref(false)
const history = ref([])
const scrollTo = ref('')

function isOpen(g, i) {
  return !!openMap.value[g + '-' + i]
}

function toggle(g, i) {
  const k = g + '-' + i
  openMap.value[k] = !openMap.value[k]
}

function loadHistory() {
  try {
    const raw = uni.getStorageSync(KEY)
    history.value = Array.isArray(raw) ? raw : []
  } catch (e) {
    history.value = []
  }
}

function saveHistory() {
  try {
    uni.setStorageSync(KEY, history.value)
  } catch (e) {}
}

function submit() {
  const t = text.value.trim()
  if (!t) return toast('先写两句吧')
  if (sending.value) return
  sending.value = true
  const d = new Date()
  const p = (x) => (x < 10 ? '0' + x : '' + x)
  const item = {
    id: 'fb' + Date.now(),
    type: type.value,
    text: t,
    contact: contact.value.trim(),
    time: `${d.getMonth() + 1}-${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`,
    reply: '已收到，1–2 个工作日内会在站内消息回复你'
  }
  history.value.unshift(item)
  saveHistory()
  text.value = ''
  contact.value = ''
  sending.value = false
  toast('已提交，谢谢你')
}

function scrollToForm() {
  // 页面本身不滚动，锚点要交给 scroll-view
  scrollTo.value = ''
  setTimeout(() => {
    scrollTo.value = 'feedback'
  }, 40)
}

function callService() {
  uni.makePhoneCall({
    phoneNumber: '4001002233',
    fail: () => toast('演示环境无法拨号')
  })
}

function chatService() {
  uni.navigateTo({
    url: '/pages/message/chat?id=service',
    fail: () => toast('客服会话正在接入')
  })
}

onShow(() => {
  loadHistory()
})
</script>

<style scoped>
.help-page {
  min-height: 100vh;
  background: #f4f8f5;
}
.body {
  padding: 18rpx 24rpx 0;
}
.card {
  background: #fff;
  border-radius: 22rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}

/* 快捷三宫格 */
.quick3 {
  display: flex;
  gap: 14rpx;
  margin-bottom: 16rpx;
}
.q3 {
  flex: 1;
  background: #fff;
  border-radius: 20rpx;
  padding: 22rpx 10rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  box-shadow: 0 8rpx 26rpx rgba(22, 60, 45, 0.05);
}
.q3-e {
  font-size: 38rpx;
}
.q3-n {
  font-size: 22rpx;
  font-weight: 600;
  color: #16201c;
}
.q3-s {
  font-size: 16rpx;
  color: #9aa7a1;
}

/* FAQ */
.faq {
  padding: 22rpx 20rpx 10rpx;
}
.f-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
}
.f-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #16201c;
}
.f-sub {
  font-size: 19rpx;
  color: #9aa7a1;
}
.f-group {
  margin-top: 18rpx;
}
.f-gname {
  display: block;
  font-size: 19rpx;
  color: #06a96a;
  font-weight: 600;
  margin-bottom: 6rpx;
}
.f-item {
  border-bottom: 2rpx solid #f4f8f5;
}
.f-item:last-child {
  border-bottom: none;
}
.f-q {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14rpx;
  padding: 18rpx 0;
}
.f-qt {
  flex: 1;
  font-size: 23rpx;
  color: #3d4a45;
  line-height: 1.5;
}
.f-a {
  background: #f8fbf9;
  border-radius: 14rpx;
  padding: 16rpx;
  margin-bottom: 12rpx;
}
.f-at {
  font-size: 21rpx;
  color: #5c6a64;
  line-height: 1.75;
}

/* 反馈 */
.fb {
  padding: 24rpx 20rpx;
}
.fb-title {
  display: block;
  font-size: 28rpx;
  font-weight: 700;
  color: #16201c;
}
.fb-sub {
  display: block;
  margin-top: 6rpx;
  font-size: 19rpx;
  color: #9aa7a1;
}
.fb-types {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin: 16rpx 0;
}
.fb-type {
  padding: 10rpx 22rpx;
  border-radius: 30rpx;
  background: #f4f8f5;
  font-size: 21rpx;
  color: #5c6a64;
  border: 2rpx solid transparent;
}
.fb-type.on {
  background: #e9faf2;
  border-color: #0fc97a;
  color: #06a96a;
  font-weight: 600;
}
.fb-ta {
  width: 100%;
  height: 180rpx;
  background: #f8fbf9;
  border-radius: 16rpx;
  padding: 16rpx;
  font-size: 22rpx;
  color: #16201c;
  line-height: 1.6;
  box-sizing: border-box;
}
.fb-ph {
  color: #b3bfba;
  font-size: 21rpx;
  line-height: 1.6;
}
.fb-count {
  text-align: right;
  font-size: 17rpx;
  color: #b3bfba;
  margin: 6rpx 0 14rpx;
}
.fb-input {
  height: 80rpx;
  background: #f8fbf9;
  border-radius: 16rpx;
  padding: 0 16rpx;
  font-size: 22rpx;
  color: #16201c;
  margin-bottom: 20rpx;
}

/* 历史 */
.his {
  padding: 22rpx 20rpx;
}
.his-title {
  display: block;
  font-size: 25rpx;
  font-weight: 700;
  color: #16201c;
  margin-bottom: 8rpx;
}
.his-item {
  padding: 14rpx 0;
  border-bottom: 2rpx solid #f4f8f5;
}
.his-item:last-child {
  border-bottom: none;
}
.his-type {
  font-size: 18rpx;
  color: #06a96a;
  background: #e9faf2;
  padding: 3rpx 12rpx;
  border-radius: 8rpx;
}
.his-time {
  font-size: 17rpx;
  color: #b3bfba;
}
.his-text {
  display: block;
  margin-top: 8rpx;
  font-size: 21rpx;
  color: #3d4a45;
  line-height: 1.6;
}
.his-reply {
  display: block;
  margin-top: 6rpx;
  font-size: 18rpx;
  color: #9aa7a1;
}
</style>

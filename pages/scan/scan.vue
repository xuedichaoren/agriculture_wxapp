<template>
  <view class="page scan">
    <nav-bar title="识图诊断" bg="#F4F8F5">
      <template #right>
        <view class="nav-act" @tap="toHistory">
          <icon-svg name="clock" :size="30" color="#16201C" :stroke="1.8" />
        </view>
      </template>
    </nav-bar>

    <view class="body">
      <!-- 说明 -->
      <view class="intro">
        <text class="i-title">拍一张叶子，先看是什么病</text>
        <text class="i-sub">先认作物，再判病虫害；叶面干净时会告诉你长势哪里不对</text>
        <view class="i-seg">
          <ui-segment :options="modes" :value="mode" @change="onMode" />
        </view>
      </view>

      <!-- 部位 -->
      <view class="organ">
        <view class="crop-head">
          <text class="crop-t">拍哪个部位</text>
          <text class="crop-s">{{ organTip }}</text>
        </view>
        <view class="organs">
          <view
            v-for="o in ORGAN_TYPES"
            :key="o.key"
            class="chip org"
            :class="{ on: organ === o.key }"
            @tap="onOrgan(o.key)"
          >
            <text class="chip-t">{{ o.label }}</text>
          </view>
        </view>
      </view>

      <!-- 拍照区 -->
      <view class="shot" @tap="pick">
        <image v-if="preview" class="shot-img" :src="preview" mode="aspectFill" />
        <ui-image v-else name="scan.guide" :h="352" radius="26rpx" />
        <view class="shot-ov">
          <view class="shot-btn">
            <icon-svg name="camera" :size="34" color="#FFFFFF" :stroke="1.9" />
            <text class="shot-t">{{ preview ? '换一张' : '拍照 / 从相册选' }}</text>
          </view>
          <text class="shot-s">叶片占画面 70%，病斑拍清楚</text>
        </view>
        <view v-if="analyzing" class="scan-line" />
      </view>

      <!-- 作物 -->
      <view class="crop">
        <view class="crop-head">
          <text class="crop-t">作物</text>
          <text class="crop-s">{{ cropText }}</text>
          <view class="crop-act" @tap="doIdentify">
            <text class="crop-act-t">{{ identifying ? '识别中…' : 'AI 识别' }}</text>
          </view>
        </view>

        <!-- 识别候选：认不准时让用户点一下，而不是硬给一个结论 -->
        <view v-if="cands.length" class="cands">
          <view
            v-for="(c, i) in cands"
            :key="c.key || c.name + i"
            class="cand"
            :class="{ on: crop === c.key }"
            @tap="confirmCrop(c)"
          >
            <text class="cand-e">{{ c.emoji }}</text>
            <view class="cand-mid">
              <text class="cand-n">{{ c.name }}</text>
              <text v-if="c.latin" class="cand-l">{{ c.latin }}</text>
            </view>
            <text v-if="c.confidence" class="cand-c">{{ c.confidence }}%</text>
            <text v-else class="cand-c gray">待确认</text>
          </view>
          <text v-if="idNote" class="cands-note">{{ idNote }}</text>
        </view>

        <scroll-view scroll-x class="chips no-scrollbar" :show-scrollbar="false">
          <view class="chips-in">
            <view
              v-for="p in PLANTS"
              :key="p.key"
              class="chip"
              :class="{ on: crop === p.key }"
              @tap="chooseCrop(p.key)"
            >
              <text class="chip-e">{{ p.emoji }}</text>
              <text class="chip-t">{{ p.name }}</text>
            </view>
          </view>
        </scroll-view>
        <text v-if="cropHint" class="crop-hint">{{ cropHint }}</text>
      </view>

      <!-- 拍照要点 -->
      <view class="tips card">
        <view class="tip-row">
          <text class="tip-n">1</text>
          <text class="tip-t">拍病变最明显的那片叶，正面一张、背面一张更好</text>
        </view>
        <view class="tip-row">
          <text class="tip-n">2</text>
          <text class="tip-t">顺光拍，别开美颜、别加滤镜，颜色准才好判断</text>
        </view>
        <view class="tip-row">
          <text class="tip-n">3</text>
          <text class="tip-t">带上茎基部或果实症状，能提高准确率</text>
        </view>
      </view>

      <view class="demo" @tap="demo">
        <text class="demo-t">没有照片？用演示样张跑一遍流程</text>
      </view>

      <!-- 最近记录 -->
      <ui-section title="最近识别" :sub="recent.length ? '' : '还没有记录'" more="全部记录" top="12" @more="toHistory" />
      <view v-if="recent.length" class="card rec">
        <view v-for="(r, i) in recent" :key="r.id" class="rec-row" :class="{ last: i === recent.length - 1 }" @tap="open(r.id)">
          <view class="rec-ico" :style="{ background: sevSoft(r.severityLevel) }">
            <text class="rec-emoji">{{ r.plantEmoji }}</text>
          </view>
          <view class="flex1">
            <view class="rec-top">
              <text class="rec-name">{{ r.diseaseName || '未识别' }}</text>
              <text v-if="r.confidence" class="rec-conf">{{ r.confidence }}%</text>
            </view>
            <text class="rec-sub">{{ r.plantName }} · {{ r.severity }} · {{ fmt(r.at) }}</text>
          </view>
          <icon-svg name="right" :size="22" color="#C3CCC8" />
        </view>
      </view>
      <view v-else class="empty-mini">
        <text class="em-emoji">📷</text>
        <text class="em-t">识别过的结果会留在这里，方便复诊对比</text>
      </view>

      <view style="height: 40rpx" />
    </view>

    <!-- 分析中 -->
    <view v-if="analyzing" class="mask">
      <view class="ana">
        <view class="ana-ring">
          <view class="ana-spin" />
          <text class="ana-emoji">🔬</text>
        </view>
        <text class="ana-t">{{ stepText }}</text>
        <view class="ana-steps">
          <view v-for="(s, i) in steps" :key="s" class="ana-step" :class="{ on: i <= step, done: i < step }">
            <view class="as-dot" />
            <text class="as-t">{{ s }}</text>
          </view>
        </view>
        <text class="ana-s">本地分析，照片不上传（接入云端模型后除外）</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { computed, onUnmounted, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { PLANTS } from '@/common/disease-kb.js'
import { diagnose } from '@/api/diagnose.js'
import { identifyPlant, ORGAN_TYPES, organOf, PLANT_HINT } from '@/api/plant-id.js'
import { recentRecords, saveResult } from '@/store/diagnose.js'
import { toast } from '@/common/utils.js'

const modes = [
  { key: 'auto', label: '智能识别' },
  { key: 'disease', label: '查病虫害' },
  { key: 'growth', label: '查长势' }
]

/** 记住上次选的作物：第二次进来不用再点 */
const CROP_KEY = 'nh_scan_crop_v1'

const mode = ref('auto')
const crop = ref('')
const organ = ref('auto')
const preview = ref('')
const analyzing = ref(false)
const identifying = ref(false)
/** 作物识别的候选（第一层判断结果） */
const cands = ref([])
const idNote = ref('')
/** 拍好但还没确认作物的图片，确认后立刻诊断 */
const pendingPath = ref('')
const step = ref(0)
const steps = ['识别作物', '匹配病害与长势', '整理成因与方案', '生成处置建议']
let timer = null

const recent = computed(() => recentRecords(3))
const stepText = computed(() => steps[Math.min(step.value, steps.length - 1)])
const organTip = computed(() => organOf(organ.value).tip)

const cropText = computed(() => {
  if (!crop.value) return '必选，认不准会请你确认'
  const p = PLANTS.find((x) => x.key === crop.value)
  return p ? '已确认：' + p.name : '已确认'
})

const cropHint = computed(() => {
  const h = PLANT_HINT[crop.value]
  return h ? h.shoot : ''
})

function onMode(v) {
  mode.value = v
}

function onOrgan(v) {
  organ.value = v
  // 换了部位，之前的候选就不作数了
  cands.value = []
  idNote.value = ''
}

function fmt(ts) {
  const d = new Date(ts)
  const p = (n) => (n < 10 ? '0' + n : '' + n)
  return p(d.getMonth() + 1) + '-' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes())
}

function sevSoft(level) {
  if (level >= 4) return '#FFECEA'
  if (level === 3) return '#FFF4E4'
  return '#E9FAF2'
}

function open(id) {
  uni.navigateTo({ url: '/pages/scan/result?id=' + id })
}

function toHistory() {
  uni.navigateTo({ url: '/pages/scan/history' })
}

/* ---------------- 第一层：认作物 ---------------- */

async function doIdentify() {
  if (identifying.value) return
  if (!preview.value) {
    toast('先拍一张，或从相册选一张')
    return
  }
  await identifyAt(preview.value)
}

async function identifyAt(path) {
  identifying.value = true
  cands.value = []
  idNote.value = ''
  let auto = ''
  try {
    const r = await identifyPlant({ filePath: path, organ: organ.value })
    cands.value = r.candidates || []
    idNote.value = r.note || ''
    // 只有「识别服务给出高置信结果」时才自动往下走，否则一律等用户点确认
    if (r.top && r.top.known && !r.needConfirm) auto = r.top.key
  } catch (e) {
    idNote.value = '识别服务没响应，请手动选作物'
  }
  identifying.value = false
  if (auto) {
    remember(auto)
    analyze(path)
  }
}

function confirmCrop(c) {
  if (!c.key) {
    toast('这种作物暂未收录，可以先问专家')
    return
  }
  remember(c.key)
  if (pendingPath.value) analyze(pendingPath.value)
}

function chooseCrop(key) {
  remember(key)
  if (pendingPath.value) analyze(pendingPath.value)
}

/** 选定即记住；换作物时自动覆盖 */
function remember(key) {
  crop.value = key
  try {
    uni.setStorageSync(CROP_KEY, key)
  } catch (e) {
    // 存储失败不影响主流程
  }
}

/* ---------------- 第二层：判病害 / 长势 ---------------- */

async function analyze(path) {
  preview.value = path.indexOf('demo://') === 0 ? '' : path
  analyzing.value = true
  step.value = 0
  timer = setInterval(() => {
    if (step.value < steps.length - 1) step.value++
  }, 420)
  try {
    const result = await diagnose({
      filePath: path,
      plantKey: crop.value,
      mode: mode.value,
      organ: organ.value
    })
    saveResult(result)
    if (timer) clearInterval(timer)
    pendingPath.value = ''
    setTimeout(() => {
      analyzing.value = false
      uni.navigateTo({ url: '/pages/scan/result?id=' + result.id })
    }, 260)
  } catch (e) {
    if (timer) clearInterval(timer)
    analyzing.value = false
    toast((e && e.message) || '识别失败，换张清晰点的照片')
  }
}

/* ---------------- 取图 ---------------- */

async function handleImage(path) {
  pendingPath.value = path
  // 作物已经确认过，直接诊断，不用再认一遍
  if (crop.value) {
    analyze(path)
    return
  }
  await identifyAt(path)
}

function pick() {
  if (analyzing.value || identifying.value) return
  uni.showActionSheet({
    itemList: ['拍照', '从相册选择'],
    success: (res) => {
      const source = res.tapIndex === 0 ? 'camera' : 'album'
      uni.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: [source],
        success: (r) => {
          const path = r.tempFilePaths && r.tempFilePaths[0]
          if (path) handleImage(path)
        }
      })
    }
  })
}

function demo() {
  if (analyzing.value || identifying.value) return
  // 演示样张没有真实文件，不会调外部服务，只走候选确认，流程与真图一致
  handleImage('demo://leaf/' + organ.value + '/' + Date.now())
}

onLoad(() => {
  let saved = ''
  try {
    saved = uni.getStorageSync(CROP_KEY) || ''
  } catch (e) {
    saved = ''
  }
  if (saved && PLANTS.some((x) => x.key === saved)) crop.value = saved
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.scan {
  min-height: 100vh;
}
.body {
  padding: 6rpx 28rpx 0;
}
.nav-act {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.intro {
  padding: 8rpx 4rpx 22rpx;
}
.i-title {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  color: #16201c;
  letter-spacing: -0.8rpx;
}
.i-sub {
  display: block;
  margin-top: 10rpx;
  font-size: 22rpx;
  color: #7c8a84;
  line-height: 1.6;
}
.i-seg {
  margin-top: 20rpx;
}
.shot {
  position: relative;
  border-radius: 26rpx;
  overflow: hidden;
  background: #eef4f0;
  box-shadow: 0 10rpx 30rpx rgba(22, 60, 45, 0.08);
}
.shot-img {
  width: 100%;
  height: 352rpx;
  display: block;
}
.shot-ov {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 3;
  padding: 20rpx 0 18rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  background: linear-gradient(180deg, rgba(10, 40, 28, 0) 0%, rgba(10, 40, 28, 0.52) 100%);
}
.shot-btn {
  display: flex;
  align-items: center;
  gap: 10rpx;
  height: 72rpx;
  padding: 0 30rpx;
  border-radius: 72rpx;
  background: rgba(255, 255, 255, 0.18);
  border: 2rpx solid rgba(255, 255, 255, 0.5);
}
.shot-t {
  font-size: 26rpx;
  color: #fff;
  font-weight: 700;
}
.shot-s {
  font-size: 19rpx;
  color: rgba(255, 255, 255, 0.78);
}
.scan-line {
  position: absolute;
  left: 0;
  right: 0;
  height: 4rpx;
  background: linear-gradient(90deg, rgba(15, 201, 122, 0), #0fc97a, rgba(15, 201, 122, 0));
  animation: scan 1.4s ease-in-out infinite;
  z-index: 2;
}
@keyframes scan {
  0% {
    top: 6%;
    opacity: 0.2;
  }
  50% {
    top: 88%;
    opacity: 1;
  }
  100% {
    top: 6%;
    opacity: 0.2;
  }
}
.crop {
  margin-top: 24rpx;
}
.crop-head {
  display: flex;
  align-items: baseline;
  gap: 10rpx;
  margin-bottom: 12rpx;
}
.crop-t {
  font-size: 24rpx;
  font-weight: 700;
  color: #3d4a45;
}
.crop-s {
  font-size: 19rpx;
  color: #b3bfba;
}
.chips {
  width: 100%;
  white-space: nowrap;
}
.chips-in {
  display: inline-flex;
  gap: 12rpx;
  padding: 2rpx 0 6rpx;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  height: 66rpx;
  padding: 0 22rpx;
  border-radius: 66rpx;
  background: #fff;
  border: 2rpx solid #edf1ef;
}
.chip.on {
  background: #e9faf2;
  border-color: #0fc97a;
}
.chip-e {
  font-size: 24rpx;
}
.chip-t {
  font-size: 23rpx;
  color: #3d4a45;
}
.chip.on .chip-t {
  color: #06a96a;
  font-weight: 700;
}
.tips {
  margin-top: 24rpx;
  background: #fff;
  border-radius: 26rpx;
  padding: 22rpx 24rpx;
  box-shadow: 0 8rpx 30rpx rgba(22, 60, 45, 0.05);
}
.tip-row {
  display: flex;
  align-items: flex-start;
  gap: 14rpx;
  padding: 8rpx 0;
}
.tip-n {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  background: #e9faf2;
  color: #06a96a;
  font-size: 19rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2rpx;
}
.tip-t {
  flex: 1;
  font-size: 22rpx;
  color: #7c8a84;
  line-height: 1.6;
}
.demo {
  margin-top: 18rpx;
  text-align: center;
  padding: 16rpx;
}
.demo-t {
  font-size: 21rpx;
  color: #06a96a;
  text-decoration: underline;
}
.rec {
  background: #fff;
  border-radius: 26rpx;
  padding: 6rpx 22rpx;
  box-shadow: 0 8rpx 30rpx rgba(22, 60, 45, 0.05);
}
.rec-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx 0;
  border-bottom: 2rpx solid #f4f8f5;
}
.rec-row.last {
  border-bottom: none;
}
.rec-ico {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.rec-emoji {
  font-size: 36rpx;
}
.rec-top {
  display: flex;
  align-items: center;
  gap: 10rpx;
}
.rec-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #16201c;
}
.rec-conf {
  font-size: 18rpx;
  color: #06a96a;
  background: #e9faf2;
  border-radius: 6rpx;
  padding: 2rpx 8rpx;
}
.rec-sub {
  display: block;
  margin-top: 6rpx;
  font-size: 20rpx;
  color: #9aa7a1;
}
.empty-mini {
  background: #fff;
  border-radius: 26rpx;
  padding: 46rpx 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}
.em-emoji {
  font-size: 54rpx;
}
.em-t {
  font-size: 21rpx;
  color: #9aa7a1;
  text-align: center;
}

/* 分析浮层 */
.mask {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(10, 26, 20, 0.62);
  z-index: 800;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ana {
  width: 560rpx;
  background: #fff;
  border-radius: 32rpx;
  padding: 40rpx 34rpx 34rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.ana-ring {
  width: 150rpx;
  height: 150rpx;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}
.ana-spin {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  border-radius: 50%;
  border: 5rpx solid #e4f5ec;
  border-top-color: #0fc97a;
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
.ana-emoji {
  font-size: 58rpx;
}
.ana-t {
  font-size: 30rpx;
  font-weight: 800;
  color: #16201c;
}
.ana-steps {
  margin-top: 22rpx;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}
.ana-step {
  display: flex;
  align-items: center;
  gap: 12rpx;
  opacity: 0.4;
}
.ana-step.on {
  opacity: 1;
}
.as-dot {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  background: #cfdad5;
}
.ana-step.on .as-dot {
  background: #0fc97a;
}
.as-t {
  font-size: 22rpx;
  color: #3d4a45;
}
.ana-step.done .as-t {
  color: #9aa7a1;
}
.ana-s {
  margin-top: 22rpx;
  font-size: 18rpx;
  color: #b3bfba;
  text-align: center;
}

.crop-head {
  justify-content: flex-start;
}
.crop-act {
  margin-left: auto;
  height: 48rpx;
  padding: 0 18rpx;
  border-radius: 24rpx;
  background: #e9faf2;
  display: flex;
  align-items: center;
}
.crop-act-t {
  font-size: 20rpx;
  color: #06a96a;
  font-weight: 700;
}
.organ {
  margin-top: 18rpx;
}
.organs {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}
.org {
  height: 56rpx;
  padding: 0 22rpx;
}
.cands {
  background: #fff;
  border-radius: 22rpx;
  padding: 6rpx 16rpx;
  margin-bottom: 16rpx;
  border: 2rpx solid #edf1ef;
}
.cand {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 14rpx 8rpx;
  border-bottom: 2rpx solid #f4f8f5;
}
.cand.on {
  background: #e9faf2;
  border-radius: 14rpx;
}
.cand-e {
  font-size: 34rpx;
}
.cand-mid {
  flex: 1;
  min-width: 0;
}
.cand-n {
  display: block;
  font-size: 24rpx;
  font-weight: 600;
  color: #16201c;
}
.cand-l {
  display: block;
  font-size: 18rpx;
  color: #b3bfba;
}
.cand-c {
  font-size: 20rpx;
  color: #06a96a;
  font-weight: 700;
}
.cand-c.gray {
  color: #b3bfba;
  font-weight: 400;
}
.cands-note {
  display: block;
  padding: 10rpx 8rpx 6rpx;
  font-size: 19rpx;
  color: #9aa7a1;
  line-height: 1.5;
}
.crop-hint {
  display: block;
  margin-top: 12rpx;
  font-size: 19rpx;
  color: #9aa7a1;
  line-height: 1.55;
}
</style>

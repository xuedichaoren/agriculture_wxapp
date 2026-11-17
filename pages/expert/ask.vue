<template>
  <view class="page ask">
    <nav-bar title="发起问诊" bg="#F4F8F5" />

    <view class="body">
      <!-- 选专家 -->
      <view class="card sec">
        <view class="row between">
          <text class="sec-t">问谁</text>
          <text class="sec-s">{{ isPublic ? '公开提问，农友都能看到' : '指定专家，只有你和他能看到' }}</text>
        </view>
        <scroll-view scroll-x class="exps no-scrollbar" :show-scrollbar="false">
          <view class="exps-in">
            <view class="exp" :class="{ on: isPublic }" @tap="pickPublic">
              <view class="exp-av pub">💬</view>
              <text class="exp-n">公开提问</text>
              <text class="exp-m">免费</text>
            </view>
            <view
              v-for="e in EXPERTS"
              :key="e.id"
              class="exp"
              :class="{ on: expertId === e.id }"
              @tap="pickExpert(e)"
            >
              <view class="exp-av">
                <text class="exp-e">{{ e.emoji }}</text>
                <view v-if="e.online" class="exp-dot" />
              </view>
              <text class="exp-n">{{ e.name }}</text>
              <text class="exp-m">{{ e.price ? '¥' + e.price : '免费' }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 作物 -->
      <view class="card sec">
        <text class="sec-t">作物<text class="req">*</text></text>
        <view class="crops">
          <view v-for="p in PLANTS" :key="p.key" class="crop" :class="{ on: crop === p.key }" @tap="crop = p.key">
            <text class="crop-e">{{ p.emoji }}</text>
            <text class="crop-t">{{ p.name }}</text>
          </view>
        </view>
      </view>

      <!-- 描述 -->
      <view class="card sec">
        <view class="row between">
          <text class="sec-t">哪里不对<text class="req">*</text></text>
          <text class="sec-s">{{ desc.length }}/300</text>
        </view>

        <scroll-view scroll-x class="tpls no-scrollbar" :show-scrollbar="false">
          <view class="tpls-in">
            <view v-for="t in ASK_TEMPLATES" :key="t.key" class="tpl" @tap="useTpl(t)">{{ t.label }}</view>
          </view>
        </scroll-view>

        <input v-model="title" class="in-title" placeholder="一句话标题，如「辣椒果实烂尖有黑点」" placeholder-class="ph" maxlength="30" />
        <textarea
          v-model="desc"
          class="ta"
          placeholder="说清楚：种在哪（大棚/露地）、多少亩、什么时候开始、有没有打过药、最近天气如何"
          placeholder-class="ph"
          :maxlength="300"
          auto-height
        />

        <!-- 图片 -->
        <view class="imgs">
          <view v-for="(p, i) in images" :key="i" class="img-box" @tap="previewImg(i)">
            <image :src="p" mode="aspectFill" class="img" />
            <view class="img-del" @tap.stop="delImg(i)">
              <icon-svg name="close" :size="18" color="#FFFFFF" :stroke="2.6" />
            </view>
          </view>
          <view v-if="images.length < 3" class="img-add" @tap="addImg">
            <icon-svg name="camera" :size="38" color="#9AA7A1" :stroke="1.7" />
            <text class="ia-t">加照片</text>
            <text class="ia-s">{{ images.length }}/3</text>
          </view>
        </view>
        <text class="img-tip">病叶正面 + 背面各一张最好；带上茎基部、果实症状更准。</text>
      </view>

      <!-- 可见性 -->
      <view class="card sec">
        <view class="row between vis" @tap="toggleVis">
          <view class="flex1">
            <text class="vis-t">{{ isPublic ? '公开提问' : '仅专家可见' }}</text>
            <text class="vis-s">{{ isPublic ? '会展示在农友圈，其他农友也能参考' : '包括追问在内，只有你和专家能看到' }}</text>
          </view>
          <view class="switch" :class="{ on: isPublic }">
            <view class="knob" />
          </view>
        </view>
      </view>

      <view class="fee">
        <text class="fee-t">{{ feeText }}</text>
        <text class="fee-s">演示环境不产生真实支付；接入后端后走微信支付</text>
      </view>

      <ui-btn type="primary" size="lg" block :loading="submitting" text="提交问诊" @click="submit" />
      <view style="height: 40rpx" />
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { ASK_TEMPLATES, EXPERTS, expertOf } from '@/api/expert.js'
import { PLANTS } from '@/common/disease-kb.js'
import { resultToQuestion } from '@/api/diagnose.js'
import { findResult } from '@/store/diagnose.js'
import { addQuestion } from '@/store/expert.js'
import { toast } from '@/common/utils.js'

const expertId = ref('')
const isPublic = ref(false)
const crop = ref('')
const title = ref('')
const desc = ref('')
const images = ref([])
const submitting = ref(false)

const feeText = computed(() => {
  if (isPublic.value) return '公开提问：免费'
  const e = expertOf(expertId.value)
  if (!e) return '未选择专家时按公开提问处理'
  return e.price ? '图文问诊：¥' + e.price + ' / 次' : '图文问诊：免费'
})

onLoad((q) => {
  const mode = (q && q.mode) || ''
  if (q && q.expert) {
    expertId.value = q.expert
    const e = expertOf(q.expert)
    if (e && e.crops.length) crop.value = plantKeyOf(e.crops[0])
  }
  if (mode === 'public') isPublic.value = true

  // 从识图结果跳过来：把诊断结论填进描述，专家不用再问一遍
  if (q && q.r) {
    const r = findResult(q.r)
    if (r) {
      desc.value = resultToQuestion(r)
      if (r.plant) crop.value = r.plant.key
      if (r.filePath && !r.filePath.startsWith('demo://')) images.value = [r.filePath]
      title.value = r.healthy ? '请帮我看下长势' : (r.disease ? r.disease.name + '，请确认' : '帮我看看这是什么问题')
    }
  }
  if (q && q.crop) crop.value = q.crop
})

function plantKeyOf(name) {
  const p = PLANTS.find((x) => x.name === name)
  return p ? p.key : ''
}

function pickExpert(e) {
  expertId.value = e.id
  isPublic.value = false
  if (!crop.value && e.crops.length) crop.value = plantKeyOf(e.crops[0])
}

function pickPublic() {
  isPublic.value = true
  expertId.value = ''
}

function toggleVis() {
  isPublic.value = !isPublic.value
  if (isPublic.value) expertId.value = ''
}

function useTpl(t) {
  const prefix = desc.value ? desc.value + '\n' : ''
  desc.value = (prefix + t.text).slice(0, 300)
  if (!title.value) title.value = t.text.slice(0, 18)
}

function addImg() {
  uni.chooseImage({
    count: 3 - images.value.length,
    sizeType: ['compressed'],
    sourceType: ['camera', 'album'],
    success: (r) => {
      const list = (r.tempFilePaths || []).slice(0, 3 - images.value.length)
      images.value = images.value.concat(list)
    }
  })
}

function delImg(i) {
  images.value.splice(i, 1)
}

function previewImg(i) {
  uni.previewImage({ urls: images.value, current: i })
}

function submit() {
  if (submitting.value) return
  if (!crop.value) return toast('请选择作物')
  if (String(desc.value).trim().length < 8) return toast('描述太短了，多说两句')
  if (!isPublic.value && !expertId.value) return toast('请选择要问的专家')

  submitting.value = true
  const e = expertOf(expertId.value)
  const q = addQuestion({
    expertId: isPublic.value ? '' : expertId.value,
    expertName: isPublic.value ? '公开提问' : e ? e.name : '',
    crop: PLANTS.find((p) => p.key === crop.value) ? PLANTS.find((p) => p.key === crop.value).name : '',
    title: title.value || String(desc.value).slice(0, 18),
    desc: desc.value,
    images: images.value,
    visibility: isPublic.value ? 'public' : 'expert'
  })
  setTimeout(() => {
    submitting.value = false
    toast('已提交')
    uni.redirectTo({ url: '/pages/expert/chat?id=' + q.id })
  }, 400)
}
</script>

<style scoped>
.ask {
  min-height: 100vh;
}
.body {
  padding: 6rpx 28rpx 0;
}
.card {
  background: #fff;
  border-radius: 26rpx;
  box-shadow: 0 8rpx 30rpx rgba(22, 60, 45, 0.05);
}
.sec {
  padding: 22rpx 24rpx;
  margin-bottom: 18rpx;
}
.sec-t {
  font-size: 27rpx;
  font-weight: 700;
  color: #16201c;
}
.sec-s {
  font-size: 19rpx;
  color: #b3bfba;
}
.req {
  color: #ff5a4e;
  margin-left: 4rpx;
}
.exps {
  width: 100%;
  white-space: nowrap;
  margin-top: 16rpx;
}
.exps-in {
  display: inline-flex;
  gap: 14rpx;
  padding: 2rpx 0 4rpx;
}
.exp {
  width: 132rpx;
  padding: 16rpx 8rpx;
  border-radius: 20rpx;
  border: 2rpx solid #edf1ef;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}
.exp.on {
  border-color: #0fc97a;
  background: #f2fcf7;
}
.exp-av {
  width: 72rpx;
  height: 72rpx;
  border-radius: 22rpx;
  background: linear-gradient(150deg, #e9faf2, #c9efdb);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.exp-av.pub {
  background: linear-gradient(150deg, #eaf3ff, #d3e5ff);
  font-size: 34rpx;
}
.exp-e {
  font-size: 38rpx;
}
.exp-dot {
  position: absolute;
  right: -2rpx;
  bottom: -2rpx;
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
  background: #20c46b;
  border: 3rpx solid #fff;
}
.exp-n {
  font-size: 21rpx;
  color: #16201c;
  font-weight: 600;
}
.exp-m {
  font-size: 17rpx;
  color: #06a96a;
}
.crops {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 16rpx;
}
.crop {
  display: flex;
  align-items: center;
  gap: 8rpx;
  height: 62rpx;
  padding: 0 18rpx;
  border-radius: 62rpx;
  background: #f6f9f7;
  border: 2rpx solid transparent;
}
.crop.on {
  background: #e9faf2;
  border-color: #0fc97a;
}
.crop-e {
  font-size: 22rpx;
}
.crop-t {
  font-size: 22rpx;
  color: #3d4a45;
}
.crop.on .crop-t {
  color: #06a96a;
  font-weight: 700;
}
.tpls {
  width: 100%;
  white-space: nowrap;
  margin: 16rpx 0 8rpx;
}
.tpls-in {
  display: inline-flex;
  gap: 10rpx;
}
.tpl {
  font-size: 20rpx;
  color: #4a8cff;
  background: #eaf3ff;
  border-radius: 30rpx;
  padding: 8rpx 18rpx;
}
.in-title {
  height: 80rpx;
  font-size: 27rpx;
  color: #16201c;
  border-bottom: 2rpx solid #f4f8f5;
}
.ta {
  width: 100%;
  min-height: 160rpx;
  padding: 18rpx 0;
  font-size: 25rpx;
  color: #16201c;
  line-height: 1.7;
}
.ph {
  color: #c3ccc8;
  font-size: 24rpx;
}
.imgs {
  display: flex;
  gap: 14rpx;
  flex-wrap: wrap;
}
.img-box {
  width: 150rpx;
  height: 150rpx;
  border-radius: 18rpx;
  overflow: hidden;
  position: relative;
}
.img {
  width: 100%;
  height: 100%;
  display: block;
}
.img-del {
  position: absolute;
  top: 0;
  right: 0;
  width: 40rpx;
  height: 40rpx;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 0 0 0 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.img-add {
  width: 150rpx;
  height: 150rpx;
  border-radius: 18rpx;
  border: 2rpx dashed #d8e2dc;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
}
.ia-t {
  font-size: 19rpx;
  color: #9aa7a1;
}
.ia-s {
  font-size: 16rpx;
  color: #c3ccc8;
}
.img-tip {
  display: block;
  margin-top: 12rpx;
  font-size: 19rpx;
  color: #b3bfba;
  line-height: 1.5;
}
.vis {
  padding: 2rpx 0;
}
.vis-t {
  font-size: 25rpx;
  font-weight: 600;
  color: #16201c;
}
.vis-s {
  display: block;
  margin-top: 4rpx;
  font-size: 19rpx;
  color: #9aa7a1;
  line-height: 1.5;
}
.switch {
  width: 84rpx;
  height: 48rpx;
  border-radius: 48rpx;
  background: #e6ece9;
  position: relative;
  flex-shrink: 0;
  transition: background 0.2s;
}
.switch.on {
  background: #0fc97a;
}
.knob {
  position: absolute;
  top: 4rpx;
  left: 4rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.15);
  transition: left 0.2s;
}
.switch.on .knob {
  left: 40rpx;
}
.fee {
  padding: 6rpx 6rpx 20rpx;
}
.fee-t {
  display: block;
  font-size: 23rpx;
  color: #06a96a;
  font-weight: 700;
}
.fee-s {
  display: block;
  margin-top: 4rpx;
  font-size: 19rpx;
  color: #b3bfba;
}
</style>

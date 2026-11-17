/**
 * 端侧图像特征提取
 *
 * 作用：把一张叶片照片变成一组「色块占比 + 纹理密度」的数字，
 * 供 api/diagnose.js 匹配病虫害知识库。
 *
 * 为什么不用神经网络在端上跑：
 *   微信小程序没有官方 TFLite / ONNX Runtime，硬塞 wasm 推理引擎体积和首屏都受不了。
 *   当前做法是「可解释的像素统计」，好处是零依赖、几百毫秒、结果稳定；
 *   真模型接进来时只替换 api/diagnose.js 的判断层，这个文件作为辅助特征保留
 *   （用来算严重度、生成条纹/斑点描述）。
 *
 * 注意：小程序端要用离屏画布（uni.createOffscreenCanvas），
 * 不支持时返回 ok:false，由上层退化为「按图片指纹生成的稳定演示特征」。
 */

const MAX_SIDE = 240 // 采样画布上限，越小越快，240 足够统计占比

function getImageInfo(path) {
  return new Promise((resolve, reject) => {
    uni.getImageInfo({
      src: path,
      success: resolve,
      fail: (e) => reject(new Error((e && e.errMsg) || '读不到图片'))
    })
  })
}

function loadImage(canvas, path) {
  return new Promise((resolve, reject) => {
    const img = canvas.createImage()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('图片解码失败'))
    img.src = path
  })
}

/** RGB → HSV（h 0~360，s/v 0~1） */
function hsv(r, g, b) {
  const rr = r / 255
  const gg = g / 255
  const bb = b / 255
  const max = Math.max(rr, gg, bb)
  const min = Math.min(rr, gg, bb)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === rr) h = ((gg - bb) / d) % 6
    else if (max === gg) h = (bb - rr) / d + 2
    else h = (rr - gg) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  return { h, s: max === 0 ? 0 : d / max, v: max }
}

/** 简单的字符串哈希，用于生成稳定的演示特征 */
function hashStr(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

/** 没有画布时的兜底：同一张图每次得到同一组特征，保证结果不跳变 */
export function pseudoFeatures(seedStr) {
  const h = hashStr(String(seedStr || 'leaf'))
  const rnd = (i) => {
    const x = Math.sin(h + i * 97.13) * 10000
    return x - Math.floor(x)
  }
  const green = 0.45 + rnd(1) * 0.3
  const yellow = 0.05 + rnd(2) * 0.22
  const brown = 0.02 + rnd(3) * 0.2
  const white = rnd(4) * 0.12
  const dark = 0.02 + rnd(5) * 0.12
  const sum = green + yellow + brown + white + dark
  return {
    ok: false,
    provider: 'demo',
    width: 0,
    height: 0,
    total: 0,
    green: green / sum,
    yellow: yellow / sum,
    brown: brown / sum,
    white: white / sum,
    dark: dark / sum,
    bright: 0.45 + rnd(6) * 0.3,
    sat: 0.35 + rnd(7) * 0.3,
    edge: 0.2 + rnd(8) * 0.3,
    spot: 0.2 + rnd(9) * 0.5,
    note: '当前环境没有离屏画布，使用稳定演示特征'
  }
}

/**
 * 分析一张图片
 * @param {string} path 本地路径（chooseImage 的 tempFilePath）
 * @returns {Promise<object>} 特征对象
 */
export async function analyseImage(path) {
  let info
  try {
    info = await getImageInfo(path)
  } catch (e) {
    return pseudoFeatures(path)
  }

  if (typeof uni.createOffscreenCanvas !== 'function') {
    return pseudoFeatures(path)
  }

  let canvas
  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(info.width || 1, info.height || 1))
    const w = Math.max(24, Math.round((info.width || MAX_SIDE) * scale))
    const h = Math.max(24, Math.round((info.height || MAX_SIDE) * scale))
    canvas = uni.createOffscreenCanvas({ type: '2d', width: w, height: h })
    if (!canvas || typeof canvas.getContext !== 'function') return pseudoFeatures(path)
    const ctx = canvas.getContext('2d')
    const img = await loadImage(canvas, path)
    ctx.drawImage(img, 0, 0, w, h)
    const imgData = ctx.getImageData(0, 0, w, h)
    const data = (imgData && imgData.data) || []
    if (!data.length) return pseudoFeatures(path)

    let green = 0
    let yellow = 0
    let brown = 0
    let white = 0
    let dark = 0
    let other = 0
    let sumV = 0
    let sumS = 0
    let samples = 0

    // 隔行隔列采样，50k 像素降到 12k，够统计
    const step = 2
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        const i = (y * w + x) * 4
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        const { h: hue, s, v } = hsv(r, g, b)
        samples++
        sumV += v
        sumS += s

        if (v < 0.17) dark++
        else if (s < 0.13 && v > 0.76) white++
        else if (hue >= 58 && hue <= 180 && s > 0.14) green++
        else if (hue >= 36 && hue < 58 && s > 0.2) yellow++
        else if (hue >= 8 && hue < 36 && s > 0.22) brown++
        else other++
      }
    }

    // 纹理密度：相邻像素亮度差超过阈值即算一条边，斑点越密边越多
    let edges = 0
    let pairs = 0
    for (let y = 0; y < h - step; y += step) {
      for (let x = 0; x < w - step; x += step) {
        const i = (y * w + x) * 4
        const j = (y * w + x + step) * 4
        const k = ((y + step) * w + x) * 4
        const l1 = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114
        const l2 = data[j] * 0.299 + data[j + 1] * 0.587 + data[j + 2] * 0.114
        const l3 = data[k] * 0.299 + data[k + 1] * 0.587 + data[k + 2] * 0.114
        pairs++
        if (Math.abs(l1 - l2) > 26) edges++
        if (Math.abs(l1 - l3) > 26) edges++
      }
    }

    const n = Math.max(1, samples)
    return {
      ok: true,
      provider: 'device',
      width: info.width || w,
      height: info.height || h,
      total: samples,
      green: green / n,
      yellow: yellow / n,
      brown: brown / n,
      white: white / n,
      dark: dark / n,
      other: other / n,
      bright: sumV / n,
      sat: sumS / n,
      edge: Math.min(1, edges / Math.max(1, pairs * 1.4)),
      spot: Math.min(1, (brown + dark + white) * 2.2 + Math.min(0.35, edges / Math.max(1, pairs)))
    }
  } catch (e) {
    return pseudoFeatures(path)
  }
}

/** 特征 → 一句人话，结果页展示用 */
export function describeFeatures(f) {
  if (!f) return ''
  const pct = (v) => Math.round((v || 0) * 100) + '%'
  const parts = []
  parts.push('黄化 ' + pct(f.yellow))
  parts.push('褐斑 ' + pct(f.brown))
  parts.push('白斑/白粉 ' + pct(f.white))
  parts.push('黑褐坏死 ' + pct(f.dark))
  parts.push('斑点密度 ' + pct(f.spot))
  return parts.join(' · ')
}

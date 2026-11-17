/**
 * 认养证书海报 · canvas 绘制与导出
 *
 * 为什么不用 HTML 截图：小程序没有 DOM 快照能力，证书要「保存到相册 / 发给好友」
 * 只能走 canvas → 临时图片这条路。页面上那张证书是 DOM 排的好看的展示件，
 * 这个文件负责再画一张同样版式的图片版，两者版式保持一致（改版时两边一起改）。
 *
 * 坐标系：750 × 1120 的逻辑画布，按 rpx 设计稿习惯写死数值，导出时 ×2 提清晰度。
 * 目标环境是微信小程序（canvas type="2d"）；H5 下没有 2d 节点，直接提示不支持。
 */

export const POSTER_W = 750
export const POSTER_H = 1120

/** 导出放大倍数：2 倍 → 1500×2240，证书上的小字放大看也清楚，体积可控 */
const SCALE = 2

const GOLD = '#C6A15B'
const GOLD_LIGHT = '#DFCB9C'
const INK = '#1C3A2C'
const INK_2 = '#2A3B33'
const SUB = '#8C7A50'
const GREEN = '#0A7F52'
const RED = 'rgba(198, 60, 50, 0.72)'

/* ---------------- 绘制小工具 ---------------- */

function font(size, bold) {
  return (bold ? 'bold ' : '') + size + 'px "PingFang SC", "Helvetica Neue", sans-serif'
}

/** 带字距的文字（canvas 没有 letter-spacing，只能逐字画） */
function fillSpaced(ctx, text, x, y, spacing, align) {
  const chars = String(text == null ? '' : text).split('')
  let total = 0
  for (let i = 0; i < chars.length; i++) total += ctx.measureText(chars[i]).width + spacing
  total -= spacing
  let cx = x
  if (align === 'center') cx = x - total / 2
  else if (align === 'right') cx = x - total
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i], cx, y)
    cx += ctx.measureText(chars[i]).width + spacing
  }
  return total
}

/** 按最大宽度折行（中文逐字判断即可，英文单词会被拆，但证书里都是中文短句） */
function wrapLines(ctx, text, maxWidth) {
  const chars = String(text == null ? '' : text).split('')
  const lines = []
  let line = ''
  for (let i = 0; i < chars.length; i++) {
    const next = line + chars[i]
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line)
      line = chars[i]
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

/** 单行超长时截断加省略号 */
function clip(ctx, text, maxWidth) {
  const str = String(text == null ? '' : text)
  if (ctx.measureText(str).width <= maxWidth) return str
  let out = str
  while (out.length > 1 && ctx.measureText(out + '…').width > maxWidth) out = out.slice(0, -1)
  return out + '…'
}

function rule(ctx, x1, y, x2, color, width) {
  ctx.beginPath()
  ctx.moveTo(x1, y)
  ctx.lineTo(x2, y)
  ctx.strokeStyle = color
  ctx.lineWidth = width || 1
  ctx.stroke()
}

function seal(ctx, cx, cy, r, cert) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(-0.12)
  ctx.strokeStyle = RED
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(0, 0, r, 0, Math.PI * 2)
  ctx.stroke()
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(0, 0, r - 9, 0, Math.PI * 2)
  ctx.stroke()

  ctx.fillStyle = RED
  ctx.textAlign = 'center'
  ctx.font = font(26, true)
  ctx.fillText('湘农汇', 0, -2)
  ctx.font = font(15)
  ctx.fillText('认养专用章', 0, 22)
  ctx.font = font(13)
  ctx.fillText(cert.valid ? 'ADOPTION' : 'VOID', 0, 42)
  ctx.restore()
  ctx.textAlign = 'left'
}

/* ---------------- 主绘制 ---------------- */

/**
 * 在 750×1120 的逻辑坐标里画完整证书
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} cert certificateOf() 的返回值
 */
export function drawPoster(ctx, cert) {
  const c = cert || {}
  const W = POSTER_W
  const H = POSTER_H

  // 底纸 + 内页
  ctx.fillStyle = '#EFE7D3'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#FFFDF6'
  ctx.fillRect(26, 26, W - 52, H - 52)

  // 金色双框
  ctx.strokeStyle = GOLD
  ctx.lineWidth = 3
  ctx.strokeRect(52, 52, W - 104, H - 104)
  ctx.strokeStyle = GOLD_LIGHT
  ctx.lineWidth = 1
  ctx.strokeRect(64, 64, W - 128, H - 128)

  // 页眉
  ctx.fillStyle = SUB
  ctx.font = font(24, true)
  fillSpaced(ctx, '湘 农 汇', 96, 122, 1, 'left')
  ctx.font = font(18)
  ctx.textAlign = 'right'
  ctx.fillText('NO. ' + (c.no || ''), W - 96, 122)
  ctx.textAlign = 'left'
  rule(ctx, 96, 146, W - 96, '#E7D9B8', 1)

  // 标题
  ctx.fillStyle = INK
  ctx.font = font(58, true)
  fillSpaced(ctx, '土地认养证书', W / 2, 228, 10, 'center')

  ctx.fillStyle = '#B49A63'
  ctx.font = font(16)
  fillSpaced(ctx, 'LAND ADOPTION CERTIFICATE', W / 2, 262, 5, 'center')

  // 装饰线：两端细线 + 中间菱形
  rule(ctx, W / 2 - 150, 296, W / 2 - 20, '#E0D2AC', 1)
  rule(ctx, W / 2 + 20, 296, W / 2 + 150, '#E0D2AC', 1)
  ctx.fillStyle = GOLD
  ctx.save()
  ctx.translate(W / 2, 296)
  ctx.rotate(Math.PI / 4)
  ctx.fillRect(-5, -5, 10, 10)
  ctx.restore()

  // 正文
  ctx.fillStyle = SUB
  ctx.font = font(22)
  fillSpaced(ctx, '兹 证 明', W / 2, 356, 2, 'center')

  ctx.fillStyle = GREEN
  ctx.font = font(44, true)
  fillSpaced(ctx, c.owner || '认养人', W / 2, 414, 6, 'center')

  ctx.fillStyle = '#4A5A52'
  ctx.font = font(21)
  const para =
    '于 ' + (c.startDate || '') + ' 认养 ' + (c.farmName || '') + ' 的 ' +
    (c.plotLabel || '') + '（' + (c.area || '--') + '㎡）。认养期内该地块产出归认养人所有，' +
    '农场按约定标准管护并同步农事记录。'
  const plines = wrapLines(ctx, para, W - 220)
  let py = 466
  for (let i = 0; i < plines.length; i++) {
    ctx.fillText(plines[i], 110, py)
    py += 38
  }

  // 明细
  const rows = [
    ['地块', (c.plotLabel || '') + ' · ' + (c.area || '--') + '㎡'],
    ['农场', c.farmName || ''],
    ['作物', c.crops || ''],
    ['方式', (c.planName || '') + ' · ' + (c.cycleName || '')],
    ['期限', c.term || ''],
    ['金额', '￥' + (c.total == null ? '--' : c.total)]
  ]
  let ry = Math.max(py + 24, 604)
  for (let i = 0; i < rows.length; i++) {
    const y = ry + i * 48
    ctx.fillStyle = SUB
    ctx.font = font(20)
    ctx.fillText(rows[i][0], 110, y)
    ctx.fillStyle = INK_2
    ctx.font = font(22)
    ctx.fillText(clip(ctx, rows[i][1], W - 340), 200, y)
    rule(ctx, 110, y + 17, W - 110, '#F1E8D3', 1)
  }

  // 说明
  ctx.fillStyle = '#9A8A63'
  ctx.font = font(18)
  const note = '本证书为电子凭证，凭证书编号与验真码可在「湘农汇」小程序内查询认养与配送记录。'
  const nlines = wrapLines(ctx, note, 380)
  for (let i = 0; i < nlines.length; i++) ctx.fillText(nlines[i], 110, 902 + i * 30)

  // 落款
  ctx.fillStyle = INK
  ctx.font = font(24, true)
  ctx.fillText(clip(ctx, c.farmName || '', 360), 110, 986)
  ctx.fillStyle = SUB
  ctx.font = font(18)
  ctx.fillText('签发日期 ' + (c.issueDate || ''), 110, 1016)

  // 印章
  seal(ctx, 560, 970, 66, c)

  // 页脚
  rule(ctx, 96, 1048, W - 96, '#E7D9B8', 1)
  ctx.fillStyle = SUB
  ctx.font = font(17)
  fillSpaced(ctx, '验真码 ' + (c.verify || ''), 96, 1078, 2, 'left')
  ctx.fillStyle = '#C0AE84'
  ctx.font = font(15)
  ctx.textAlign = 'right'
  ctx.fillText('湘农汇 · 电子认养证书', W - 96, 1078)
  ctx.textAlign = 'left'

  // 失效水印
  if (!c.valid) {
    ctx.save()
    ctx.translate(W / 2, H / 2)
    ctx.rotate(-Math.PI / 9)
    ctx.fillStyle = 'rgba(198, 60, 50, 0.12)'
    ctx.font = font(132, true)
    ctx.textAlign = 'center'
    ctx.fillText(c.sealText || '已作废', 0, 0)
    ctx.restore()
    ctx.textAlign = 'left'
  }
}

/* ---------------- 导出 ---------------- */

/** 创建离屏画布：不往页面里塞 canvas，避免原生组件参与页面渲染 */
function createOffscreen() {
  try {
    if (typeof uni === 'undefined' || typeof uni.createOffscreenCanvas !== 'function') return null
    const c = uni.createOffscreenCanvas({
      type: '2d',
      width: POSTER_W * SCALE,
      height: POSTER_H * SCALE
    })
    return c && typeof c.getContext === 'function' ? c : null
  } catch (e) {
    return null
  }
}

/** 在给定画布上画证书（离屏与页面内 canvas 共用） */
function paint(canvas, cert) {
  canvas.width = POSTER_W * SCALE
  canvas.height = POSTER_H * SCALE
  const ctx = canvas.getContext('2d')
  ctx.scale(SCALE, SCALE)
  ctx.clearRect(0, 0, POSTER_W, POSTER_H)
  drawPoster(ctx, cert)
}

/**
 * 画布 → 临时图片
 * @param {object} canvas 画布节点
 * @param {number} [timeout] 超时毫秒数：个别基础库对离屏画布不回调，超时就当失败降级
 */
function toTempFile(canvas, timeout) {
  return new Promise((resolve, reject) => {
    let done = false
    let timer = null
    if (timeout) {
      timer = setTimeout(() => {
        if (done) return
        done = true
        reject(new Error('导出超时'))
      }, timeout)
    }
    uni.canvasToTempFilePath({
      canvas,
      x: 0,
      y: 0,
      width: POSTER_W * SCALE,
      height: POSTER_H * SCALE,
      destWidth: POSTER_W * SCALE,
      destHeight: POSTER_H * SCALE,
      fileType: 'png',
      success: (r) => {
        if (done) return
        done = true
        if (timer) clearTimeout(timer)
        resolve(r.tempFilePath)
      },
      fail: (e) => {
        if (done) return
        done = true
        if (timer) clearTimeout(timer)
        reject(new Error((e && e.errMsg) || '导出失败'))
      }
    })
  })
}

/**
 * 等页面里的 #certPoster 挂载完成
 *
 * 画布是按需挂载的（保存/分享时才插入），插入后到节点可查询之间有延迟，
 * 所以这里轮询几次，而不是等一个固定的 nextTick。
 */
function waitCanvasNode(retry = 8) {
  return new Promise((resolve, reject) => {
    const run = (left) => {
      // 页面级查询即可：画布就在页面根节点下，不依赖组件实例
      const query = uni.createSelectorQuery()
      query
        .select('#certPoster')
        .fields({ node: true, size: true }, (res) => {
          if (res && res.node) return resolve(res.node)
          if (left <= 0) return reject(new Error('当前环境不支持导出证书'))
          setTimeout(() => run(left - 1), 60)
        })
        .exec()
    }
    run(retry)
  })
}

/**
 * 渲染证书图片
 *
 * 优先走离屏画布：页面里不需要常驻 <canvas>，也就不会有原生组件挡在内容上面。
 * 离屏不可用时，再让页面按需挂一张 2rpx 的画布兜底（hooks.mount / hooks.unmount）。
 *
 * @param {object} cert certificateOf() 的返回值
 * @param {{mount?:Function, unmount?:Function}} [hooks] 页面内兜底画布的挂载/卸载
 * @returns {Promise<string>} 临时文件路径
 */
export async function renderPoster(cert, hooks = {}) {
  const offscreen = createOffscreen()
  if (offscreen) {
    try {
      paint(offscreen, cert)
      return await toTempFile(offscreen, 3000)
    } catch (e) {
      // 离屏导出失败（个别基础库不支持导出离屏画布）时继续走页面内兜底
    }
  }

  if (typeof hooks.mount !== 'function') {
    throw new Error('当前环境不支持导出证书，请在微信小程序中使用')
  }
  await hooks.mount()
  try {
    const node = await waitCanvasNode()
    paint(node, cert)
    return await toTempFile(node)
  } finally {
    if (typeof hooks.unmount === 'function') hooks.unmount()
  }
}

/** 保存到相册（先确认授权，被拒时引导去设置） */
export function savePoster(filePath) {
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject) => {
    uni.getSetting({
      success: (res) => {
        const denied = res && res.authSetting && res.authSetting['scope.writePhotosAlbum'] === false
        if (!denied) return doSave()
        uni.showModal({
          title: '需要相册权限',
          content: '保存证书需要访问相册，请在设置里允许「保存到相册」',
          confirmText: '去设置',
          success: (m) => {
            if (!m.confirm) return reject(new Error('cancel'))
            uni.openSetting({
              success: (s) => {
                const ok = s && s.authSetting && s.authSetting['scope.writePhotosAlbum']
                ok ? doSave() : reject(new Error('未授权相册权限'))
              },
              fail: () => reject(new Error('未授权相册权限'))
            })
          }
        })
      },
      fail: () => doSave()
    })

    function doSave() {
      uni.saveImageToPhotosAlbum({
        filePath,
        success: resolve,
        fail: (e) => reject(new Error((e && e.errMsg) || '保存失败'))
      })
    }
  })
  // #endif
  // #ifndef MP-WEIXIN
  return Promise.reject(new Error('请在微信小程序中保存到相册'))
  // #endif
}

/** 分享证书图片（微信会拉起「发送给朋友」面板） */
export function sharePoster(filePath) {
  // #ifdef MP-WEIXIN
  return new Promise((resolve, reject) => {
    if (typeof uni.showShareImageMenu !== 'function') {
      uni.previewImage({ urls: [filePath] })
      return resolve()
    }
    uni.showShareImageMenu({
      path: filePath,
      success: resolve,
      fail: (e) => reject(new Error((e && e.errMsg) || '分享失败'))
    })
  })
  // #endif
  // #ifndef MP-WEIXIN
  return new Promise((resolve) => uni.previewImage({ urls: [filePath], success: resolve, fail: resolve }))
  // #endif
}

/**
 * 数据访问层 · 天气预报
 *
 * 农户最需要看的不是「今天几度」，而是「今天能不能打药、要不要浇水」。
 * 所以这里除了拿天气，还多算一层农事指数与农事建议。
 *
 * 四档 provider，按配置切换（weatherConfig.provider）：
 *   seniverse   心知天气（默认）。国内数据源，乡镇级定位准、中文文案细。
 *               实测 29.45:109.44 直接落到「龙山, 湘西, 湖南」，比按城市名猜靠得住。
 *               免费版：now + daily 3 天，1000 次/天。
 *               注意接口只认「私钥」直连（key=私钥），公钥签名认证是付费版能力
 *               （实测返回 AP010004 signature invalid，几种签名串构造都试过）。
 *   open-meteo  免 key，直接可用。作为 seniverse 失败时的自动兜底，7 日预报更全。
 *   qweather    和风天气，需要 key。
 *   mock        本地兜底。全挂了才落到这里，用日期做种子生成稳定假数据，
 *               页面上会明确标注「演示数据」。
 *
 * 降级链：seniverse → open-meteo → mock。
 * key 过期、配额用完、域名没加白名单，都不会让页面空着；
 * 降级原因记在 result.error 里，页面能在来源行下面提示。
 *
 * ⚠️ 私钥在端上：小程序没有后端时只能直连，key 会跟着代码包一起发出去。
 *    上线前请把 weatherConfig.proxy 配成自己的服务端地址，key 收到服务端，
 *    端上只认代理返回的归一化结构（{ now, days }）。
 *
 * 小程序后台需要把下面域名加入 request 合法域名：
 *   https://api.seniverse.com       （心知天气）
 *   https://api.open-meteo.com      （open-meteo）
 *   https://devapi.qweather.com     （和风天气）
 *
 * 心知免费版要求数据展示页注明来源，天气页已带这行。
 */

const CACHE_KEY = 'nh_weather_v2'
const CACHE_TTL = 20 * 60 * 1000 // 20 分钟，天气不需要秒级新鲜

/** 默认位置：湖南湘西龙山（项目里农场所在地），拿不到定位时用它 */
export const DEFAULT_PLACE = { name: '湖南 · 湘西龙山', lat: 29.4528, lon: 109.4439 }

export const weatherConfig = {
  provider: 'seniverse',
  /** 心知天气私钥（控制台 · 产品管理里的 key）。免费版只能用私钥直连 */
  key: 'SppuqZrtfC9I215nM',
  /** 心知天气公钥。签名认证 / 以后把调用挪到服务端时用得上，端上不参与请求 */
  publicKey: 'PVWO5-i0uW7Pp_gwQ',
  /** 预报天数：心知免费版最长 3 天，付费版可到 15 天 */
  days: 3,
  /** 和风天气 key（provider = qweather 时用） */
  qweatherKey: '',
  /** 服务端代理地址。配了就优先走它，端上不碰 key */
  proxy: '',
  place: DEFAULT_PLACE.name,
  lat: DEFAULT_PLACE.lat,
  lon: DEFAULT_PLACE.lon,
  /** 是否允许调用 uni.getLocation 拿真实位置 */
  useLocation: true
}

export function setWeatherConfig(patch = {}) {
  Object.assign(weatherConfig, patch)
  const touched = ['lat', 'lon', 'place', 'provider', 'key', 'qweatherKey', 'proxy', 'days']
  if (touched.some((k) => k in patch)) clearWeatherCache()
}

export function clearWeatherCache() {
  try {
    uni.removeStorageSync(CACHE_KEY)
  } catch (e) {}
}

/* ---------------- 天气码映射 ---------------- */

/**
 * WMO 天气码（Open-Meteo 用这套）→ 中文 + emoji + 色调
 * 色调只取 brand / info / warn / gold / gray 五种，和设计令牌对得上。
 */
export const WMO = {
  0: { text: '晴', emoji: '☀️', tone: 'gold' },
  1: { text: '晴间多云', emoji: '🌤️', tone: 'gold' },
  2: { text: '多云', emoji: '⛅', tone: 'info' },
  3: { text: '阴', emoji: '☁️', tone: 'gray' },
  45: { text: '有雾', emoji: '🌫️', tone: 'gray' },
  48: { text: '雾凇', emoji: '🌫️', tone: 'gray' },
  51: { text: '小毛毛雨', emoji: '🌦️', tone: 'info' },
  53: { text: '毛毛雨', emoji: '🌦️', tone: 'info' },
  55: { text: '密毛毛雨', emoji: '🌧️', tone: 'info' },
  56: { text: '冻毛毛雨', emoji: '🌧️', tone: 'warn' },
  57: { text: '强冻毛毛雨', emoji: '🌧️', tone: 'warn' },
  61: { text: '小雨', emoji: '🌦️', tone: 'info' },
  63: { text: '中雨', emoji: '🌧️', tone: 'info' },
  65: { text: '大雨', emoji: '🌧️', tone: 'danger' },
  66: { text: '冻雨', emoji: '🌧️', tone: 'danger' },
  67: { text: '强冻雨', emoji: '🌧️', tone: 'danger' },
  71: { text: '小雪', emoji: '🌨️', tone: 'info' },
  73: { text: '中雪', emoji: '🌨️', tone: 'info' },
  75: { text: '大雪', emoji: '❄️', tone: 'danger' },
  77: { text: '雪粒', emoji: '🌨️', tone: 'info' },
  80: { text: '阵雨', emoji: '🌦️', tone: 'info' },
  81: { text: '强阵雨', emoji: '🌧️', tone: 'info' },
  82: { text: '暴雨', emoji: '⛈️', tone: 'danger' },
  85: { text: '阵雪', emoji: '🌨️', tone: 'info' },
  86: { text: '强阵雪', emoji: '❄️', tone: 'danger' },
  95: { text: '雷阵雨', emoji: '⛈️', tone: 'danger' },
  96: { text: '雷阵雨伴冰雹', emoji: '⛈️', tone: 'danger' },
  99: { text: '强雷暴伴冰雹', emoji: '⛈️', tone: 'danger' }
}

export function wmoOf(code) {
  return WMO[Number(code)] || { text: '未知', emoji: '🌡️', tone: 'gray' }
}

/** 和风天气图标码 → 归一到 WMO 的思路：按区间粗分，够展示用 */
export function qweatherCodeToWmo(code) {
  const n = Number(code)
  if (n === 100 || n === 150) return 0
  if (n === 101 || n === 102 || n === 103 || n === 151 || n === 152 || n === 153) return 2
  if (n === 104) return 3
  if (n >= 300 && n <= 304) return 95
  if (n === 305 || n === 309) return 61
  if (n === 306 || n === 314) return 63
  if (n === 307 || n === 308 || n === 310 || n === 315 || n === 316 || n === 317 || n === 318) return 65
  if (n === 313) return 66
  if (n === 350 || n === 351 || n === 399) return 80
  if (n >= 400 && n <= 402 || n === 407 || n === 408 || n === 409 || n === 410) return 71
  if (n === 403 || n === 404 || n === 405 || n === 406 || n === 456 || n === 457) return 73
  if (n >= 500 && n <= 515) return 45
  if (n === 900) return 0
  if (n === 901) return 3
  return 3
}

/* ---------------- 心知天气：天气现象 ---------------- */

/**
 * 心知的现象码有 100 个值，而且不同版本文档的码值对不上
 * （实测 code 4 = 多云、9 = 阴、13 = 小雨，和网上流传的旧码表不一致）。
 * 所以这里不硬编码码表，认接口返回的中文 text，码值只用来兜底。
 * 顺序有讲究：「晴间多云」必须先于「多云」，「小到中雨」必须在「中雨」之前命中同一档。
 */
const SENIVERSE_RULES = [
  [/冰雹|雷/, '⛈️', 'danger'],
  [/暴雨/, '⛈️', 'danger'],
  [/冻雨/, '🌧️', 'danger'],
  [/大雨|中到大雨/, '🌧️', 'info'],
  [/中雨|小到中雨/, '🌧️', 'info'],
  [/雨夹雪/, '🌨️', 'warn'],
  [/阵雨|小雨|毛毛雨/, '🌦️', 'info'],
  [/暴雪|大雪/, '❄️', 'danger'],
  [/雪/, '🌨️', 'info'],
  [/雾/, '🌫️', 'gray'],
  [/霾/, '🌫️', 'warn'],
  [/沙尘|浮尘|扬沙/, '🌬️', 'warn'],
  [/大风|飓风|台风/, '🌬️', 'danger'],
  [/阴/, '☁️', 'gray'],
  [/晴间多云/, '🌤️', 'gold'],
  [/多云/, '⛅', 'info'],
  [/晴/, '☀️', 'gold']
]

/** 心知中文天气 → { text, emoji, tone } */
export function seniverseText(text, code) {
  const t = String(text || '').trim()
  for (const [re, emoji, tone] of SENIVERSE_RULES) {
    if (re.test(t)) return { text: t, emoji, tone }
  }
  // text 缺失时退回码值：心知 0 晴 / 4 多云 / 9 阴 / 13 小雨，其余按区间粗分
  const n = Number(code)
  if (Number.isFinite(n)) {
    if (n === 0) return { text: t || '晴', emoji: '☀️', tone: 'gold' }
    if (n === 4 || n === 3) return { text: t || '多云', emoji: '⛅', tone: 'info' }
    if (n === 9 || n === 10) return { text: t || '阴', emoji: '☁️', tone: 'gray' }
    if (n >= 11 && n <= 12) return { text: t || '阴', emoji: '☁️', tone: 'gray' }
    if (n >= 13 && n <= 19) return { text: t || '小雨', emoji: '🌦️', tone: 'info' }
  }
  return { text: t || '未知', emoji: '🌡️', tone: 'gray' }
}

/* ---------------- 体感与昼夜 ---------------- */

/**
 * 体感温度估算。心知免费版的 now 只回温度和现象，没有体感，
 * 所以用温度 + 湿度 + 风速按经验公式折算，页面上标的是「体感」不是实测。
 */
function feelsLike(temp, humidity, wind) {
  const t = num(temp)
  const h = num(humidity, 60)
  const v = num(wind)
  if (t >= 27) return Math.round(t + Math.max(0, (h - 60) * 0.12))
  if (t <= 12) return Math.round(t - v * 0.45)
  return Math.round(t)
}

function isDayNow(sunrise, sunset) {
  const d = new Date()
  const cur = `${pad(d.getHours())}:${pad(d.getMinutes())}`
  if (sunrise && sunset) return cur >= sunrise && cur < sunset
  const h = d.getHours()
  return h >= 6 && h < 18
}

/**
 * 日出日落：NOAA 简化算法 + 均时差修正。
 * 心知免费版的 daily 不带日出日落，但「日照时长」对农事有用（决定光照积累、放风时间），
 * 所以本地算，不额外请求。北纬 30° 附近误差 1~2 分钟，够用。
 *
 * 北京时间正午 = 12 + (120 - 经度)/15 - 均时差
 * 龙山经度 109.44，太阳正午比北京时间晚 42 分钟，再被均时差拉回 15 分钟，
 * 算下来 11 月中旬日出 07:10 / 日落 17:46，与实际基本吻合。
 */
export function sunTimes(lat, lon, dateStr) {
  const m = String(dateStr || '').match(/(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return { sunrise: '', sunset: '' }
  const y = Number(m[1])
  const mo = Number(m[2])
  const da = Number(m[3])
  const doy = Math.floor((Date.UTC(y, mo - 1, da) - Date.UTC(y, 0, 1)) / 86400000) + 1
  const rad = Math.PI / 180
  // 赤纬
  const decl = -23.44 * Math.cos(rad * (360 / 365) * (doy + 10))
  // 均时差（分钟）
  const B = (2 * Math.PI * (doy - 81)) / 364
  const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)
  // 日出时太阳中心在地平线下 0.833°（大气折射 + 视半径）
  const cosH =
    (Math.cos(90.833 * rad) - Math.sin(lat * rad) * Math.sin(decl * rad)) /
    (Math.cos(lat * rad) * Math.cos(decl * rad))
  if (cosH >= 1 || cosH <= -1) return { sunrise: '', sunset: '' } // 极昼 / 极夜
  const halfDay = Math.acos(cosH) / rad / 15 // 半昼长，小时
  const noon = 12 + (120 - Number(lon)) / 15 - eot / 60
  const fmt = (h) => {
    let mins = Math.round(h * 60)
    mins = ((mins % 1440) + 1440) % 1440
    return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`
  }
  return { sunrise: fmt(noon - halfDay), sunset: fmt(noon + halfDay) }
}

/* ---------------- 工具 ---------------- */

function pad(n) {
  return n < 10 ? '0' + n : '' + n
}

function fmtDate(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

const WEEK = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

export function weekOf(dateStr) {
  const m = String(dateStr || '').match(/(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return ''
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  const today = fmtDate(new Date())
  if (String(dateStr) === today) return '今天'
  return WEEK[d.getDay()]
}

/** 毫秒时间戳 → HH:mm */
export function hhmm(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function num(v, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export function round1(v) {
  return Math.round(num(v) * 10) / 10
}

/* ---------------- 定位 ---------------- */

/**
 * 拿当前位置，失败就用配置里的位置。
 * 这里刻意不弹授权失败的 toast：天气是辅助信息，不该打断主流程。
 */
export function locate() {
  return new Promise((resolve) => {
    const fallback = {
      name: weatherConfig.place || DEFAULT_PLACE.name,
      lat: num(weatherConfig.lat, DEFAULT_PLACE.lat),
      lon: num(weatherConfig.lon, DEFAULT_PLACE.lon),
      precise: false
    }
    if (!weatherConfig.useLocation) return resolve(fallback)
    try {
      uni.getLocation({
        type: 'gcj02',
        success: (res) => {
          if (!res || !res.latitude) return resolve(fallback)
          resolve({
            name: '当前位置',
            lat: round1(res.latitude),
            lon: round1(res.longitude),
            precise: true
          })
        },
        fail: () => resolve(fallback)
      })
    } catch (e) {
      resolve(fallback)
    }
  })
}

/* ---------------- 各 provider ---------------- */

function request(url, timeout = 8000) {
  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: 'GET',
      timeout,
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data)
        else reject(new Error('HTTP ' + res.statusCode))
      },
      fail: (err) => reject(new Error((err && err.errMsg) || 'network error'))
    })
  })
}

async function fromOpenMeteo(pos) {
  const q = [
    `latitude=${pos.lat}`,
    `longitude=${pos.lon}`,
    'current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m',
    'daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,relative_humidity_2m_max,sunrise,sunset,uv_index_max',
    'timezone=Asia%2FShanghai',
    'forecast_days=7',
    'wind_speed_unit=ms'
  ].join('&')
  const data = await request(`https://api.open-meteo.com/v1/forecast?${q}`)
  const cur = data.current || {}
  const d = data.daily || {}
  const days = (d.time || []).map((date, i) => {
    const w = wmoOf(d.weather_code ? d.weather_code[i] : 0)
    return {
      date,
      week: weekOf(date),
      text: w.text,
      emoji: w.emoji,
      tone: w.tone,
      max: Math.round(num(d.temperature_2m_max ? d.temperature_2m_max[i] : 0)),
      min: Math.round(num(d.temperature_2m_min ? d.temperature_2m_min[i] : 0)),
      rainProb: Math.round(num(d.precipitation_probability_max ? d.precipitation_probability_max[i] : 0)),
      rainMm: round1(d.precipitation_sum ? d.precipitation_sum[i] : 0),
      windMax: round1(d.wind_speed_10m_max ? d.wind_speed_10m_max[i] : 0),
      humidity: Math.round(num(d.relative_humidity_2m_max ? d.relative_humidity_2m_max[i] : 0)),
      sunrise: (d.sunrise && d.sunrise[i] ? String(d.sunrise[i]).slice(11, 16) : ''),
      sunset: (d.sunset && d.sunset[i] ? String(d.sunset[i]).slice(11, 16) : ''),
      uv: round1(d.uv_index_max ? d.uv_index_max[i] : 0)
    }
  })
  const w = wmoOf(cur.weather_code)
  return {
    source: 'Open-Meteo',
    now: {
      temp: Math.round(num(cur.temperature_2m)),
      feels: Math.round(num(cur.apparent_temperature)),
      humidity: Math.round(num(cur.relative_humidity_2m)),
      wind: round1(cur.wind_speed_10m),
      windDir: degToDir(num(cur.wind_direction_10m)),
      rain: round1(cur.precipitation),
      isDay: Number(cur.is_day) === 1,
      text: w.text,
      emoji: w.emoji,
      tone: w.tone
    },
    days
  }
}

async function fromQWeather(pos) {
  const key = weatherConfig.qweatherKey
  if (!key) throw new Error('缺少和风天气 key')
  const loc = `${pos.lon},${pos.lat}`
  const [nowRes, dayRes] = await Promise.all([
    request(`https://devapi.qweather.com/v7/weather/now?location=${loc}&key=${key}`),
    request(`https://devapi.qweather.com/v7/weather/7d?location=${loc}&key=${key}`)
  ])
  if (!nowRes || nowRes.code !== '200') throw new Error('和风天气返回 ' + (nowRes && nowRes.code))
  if (!dayRes || dayRes.code !== '200') throw new Error('和风天气返回 ' + (dayRes && dayRes.code))
  const n = nowRes.now || {}
  const nw = wmoOf(qweatherCodeToWmo(n.icon))
  const days = (dayRes.daily || []).map((d) => {
    const w = wmoOf(qweatherCodeToWmo(d.iconDay))
    return {
      date: d.fxDate,
      week: weekOf(d.fxDate),
      text: d.textDay || w.text,
      emoji: w.emoji,
      tone: w.tone,
      max: Math.round(num(d.tempMax)),
      min: Math.round(num(d.tempMin)),
      rainProb: Math.round(num(d.precip)),
      rainMm: round1(d.precip),
      windMax: round1(num(String(d.windScaleDay || '').split('-').pop()) * 1.2),
      humidity: Math.round(num(d.humidity)),
      sunrise: d.sunrise || '',
      sunset: d.sunset || '',
      uv: round1(d.uvIndex)
    }
  })
  return {
    source: '和风天气',
    now: {
      temp: Math.round(num(n.temp)),
      feels: Math.round(num(n.feelsLike)),
      humidity: Math.round(num(n.humidity)),
      wind: round1(num(n.windSpeed)),
      windDir: n.windDir || '',
      rain: round1(n.precip),
      isDay: true,
      text: n.text || nw.text,
      emoji: nw.emoji,
      tone: nw.tone
    },
    days
  }
}

/**
 * 心知的 precip 是 0~1 的降水概率比值（实测：广州小雨 0.37、上海阴天 0.49），
 * 不是百分数也不是毫米数。>1 的少数情况按已经是百分数处理，别算成 3000%。
 */
function probPct(v) {
  const n = num(v)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.min(100, Math.round(n <= 1 ? n * 100 : n))
}

/**
 * 心知天气
 * 用坐标调用（location=纬度:经度），心知会自己反查最近的地名，
 * 实测 29.45:109.44 → 「龙山, 湘西, 湖南」，正好是农场所在地。
 *
 * 免费版能力边界（实测确认）：
 *   now.json       只有 text / code / temperature，没有湿度、风、降水
 *   daily.json     3 天，含 high/low/precip(0~1 降水概率)/rainfall(降水mm)/wind_speed(km/h)/humidity
 *                  不含日出日落、紫外线
 * 所以：风、湿度、降水从今天的 daily 取；体感按公式折算；日出日落本地算。
 */
async function fromSeniverse(pos) {
  const key = weatherConfig.key
  if (!key) throw new Error('缺少心知天气私钥')
  const loc = `${pos.lat}:${pos.lon}`
  const days = Math.max(1, Math.min(num(weatherConfig.days, 3), 15))
  const base = 'https://api.seniverse.com/v3/weather'
  const qs = `key=${key}&location=${loc}&language=zh-Hans&unit=c`

  const [nowRes, dayRes] = await Promise.all([
    request(`${base}/now.json?${qs}`),
    request(`${base}/daily.json?${qs}&start=0&days=${days}`)
  ])

  if (!nowRes || !nowRes.results || !nowRes.results.length) {
    throw new Error('心知返回 ' + ((nowRes && nowRes.status) || '空数据'))
  }
  if (!dayRes || !dayRes.results || !dayRes.results.length) {
    throw new Error('心知返回 ' + ((dayRes && dayRes.status) || '空数据'))
  }

  const n = (nowRes.results[0] && nowRes.results[0].now) || {}
  const list = (dayRes.results[0].daily || []).map((d) => {
    const w = seniverseText(d.text_day, d.code_day)
    const sun = sunTimes(pos.lat, pos.lon, d.date)
    return {
      date: d.date,
      week: weekOf(d.date),
      text: d.text_day || w.text,
      night: d.text_night || '',
      emoji: w.emoji,
      tone: w.tone,
      max: Math.round(num(d.high)),
      min: Math.round(num(d.low)),
      rainProb: probPct(d.precip),
      rainMm: round1(d.rainfall),
      // 心知给的是 km/h，全项目统一用 m/s；缺了就按风力等级反推
      windMax: d.wind_speed ? round1(num(d.wind_speed) / 3.6) : round1(num(d.wind_scale) * 1.2),
      windDir: d.wind_direction ? d.wind_direction + '风' : '',
      humidity: Math.round(num(d.humidity)),
      sunrise: sun.sunrise,
      sunset: sun.sunset,
      uv: 0
    }
  })
  if (!list.length) throw new Error('心知未返回日预报')

  const today = list[0]
  const nw = seniverseText(n.text, n.code)
  return {
    source: '心知天气',
    days: list,
    now: {
      temp: Math.round(num(n.temperature)),
      feels: feelsLike(n.temperature, today.humidity, today.windMax),
      humidity: Math.round(num(today.humidity)),
      wind: round1(num(today.windMax)),
      windDir: today.windDir || '',
      rain: round1(num(today.rainMm)),
      isDay: isDayNow(today.sunrise, today.sunset),
      text: n.text || today.text,
      emoji: nw.emoji,
      tone: nw.tone
    }
  }
}

/**
 * 服务端代理。配了 weatherConfig.proxy 就优先走它：
 * 端上只发坐标，key 留在服务端，返回结构保持 { source?, now, days }。
 * 代理挂了不报错，继续走端上的 provider 链。
 */
async function fromProxy(pos) {
  const sep = weatherConfig.proxy.indexOf('?') >= 0 ? '&' : '?'
  const data = await request(`${weatherConfig.proxy}${sep}lat=${pos.lat}&lon=${pos.lon}`)
  if (!data || !data.now || !Array.isArray(data.days) || !data.days.length) {
    throw new Error('代理返回结构不对')
  }
  return { source: data.source || '服务端代理', now: data.now, days: data.days }
}

/**
 * 本地兜底：用日期做种子，同一天多次打开结果一致，不会每次刷新都跳。
 * 数据只是"像那么回事"，会在页面上明确标注「演示数据」。
 */
function fromMock(pos) {
  const today = new Date()
  const seedBase = today.getFullYear() * 1000 + (today.getMonth() + 1) * 40 + today.getDate()
  const rand = (i) => {
    const x = Math.sin(seedBase * 12.9898 + i * 78.233) * 43758.5453
    return x - Math.floor(x)
  }
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(today.getTime() + i * 86400000)
    const r = rand(i)
    const code = r < 0.32 ? 0 : r < 0.52 ? 2 : r < 0.68 ? 3 : r < 0.86 ? 61 : 80
    const w = wmoOf(code)
    const base = 19 + Math.round(rand(i + 20) * 5)
    days.push({
      date: fmtDate(d),
      week: weekOf(fmtDate(d)),
      text: w.text,
      emoji: w.emoji,
      tone: w.tone,
      max: base + Math.round(rand(i + 40) * 5),
      min: base - 6 + Math.round(rand(i + 60) * 3),
      rainProb: code >= 61 ? 60 + Math.round(rand(i + 80) * 30) : Math.round(rand(i + 80) * 25),
      rainMm: code >= 61 ? round1(rand(i + 90) * 8) : 0,
      windMax: round1(1.5 + rand(i + 100) * 4),
      humidity: Math.round(55 + rand(i + 110) * 35),
      sunrise: '06:42',
      sunset: '17:58',
      uv: round1(2 + rand(i + 120) * 5)
    })
  }
  const t = days[0]
  return {
    source: '演示数据',
    mock: true,
    now: {
      temp: Math.round((t.max + t.min) / 2),
      feels: Math.round((t.max + t.min) / 2) + 1,
      humidity: t.humidity,
      wind: t.windMax,
      windDir: '东北风',
      rain: t.rainMm,
      isDay: new Date().getHours() >= 6 && new Date().getHours() < 18,
      text: t.text,
      emoji: t.emoji,
      tone: t.tone
    },
    days
  }
}

function degToDir(deg) {
  const n = Number(deg) || 0
  const dirs = ['北风', '东北风', '东风', '东南风', '南风', '西南风', '西风', '西北风']
  return dirs[Math.round(n / 45) % 8]
}

/* ---------------- 农事指数 ---------------- */

/**
 * 四个指数，0~100，越高越适合。
 * 规则不追求气象学严谨，追求「农户看得懂、能照着做」。
 */
export function farmIndex(w) {
  if (!w || !w.now || !w.days || !w.days.length) return []
  const now = w.now
  const t = w.days[0]
  const next2 = w.days.slice(1, 3)
  const rainSoon = Math.max(t.rainProb, ...next2.map((d) => d.rainProb))
  const wind = Math.max(now.wind, t.windMax)

  // 打药：怕风、怕雨、怕高温。这是安全项，宁可保守 —— 分数高一点让农户
  // 打了药结果被雨冲掉，比让他今天别打损失大得多。
  let spray = 100
  if (rainSoon >= 70) spray -= 55
  else if (rainSoon >= 40) spray -= 30
  if (t.rainMm >= 10) spray -= 25
  else if (t.rainMm >= 3) spray -= 10
  if (wind >= 6) spray -= 45
  else if (wind >= 4) spray -= 25
  else if (wind >= 3) spray -= 12
  if (t.max >= 35) spray -= 35
  else if (t.max >= 33) spray -= 22
  if (now.temp < 8) spray -= 20
  if (now.humidity > 90) spray -= 10

  // 灌溉：连续无雨 + 温度高
  const dryDays = w.days.slice(0, 3).filter((d) => d.rainProb < 30).length
  let irrigate = 25 + dryDays * 18
  if (t.max >= 33) irrigate += 15
  if (t.rainMm >= 5) irrigate -= 40

  // 采收：晴天、无雨最合适
  let harvest = 100
  if (t.rainProb >= 60) harvest -= 45
  else if (t.rainProb >= 30) harvest -= 20
  if (now.humidity > 90) harvest -= 15
  if (t.max >= 35) harvest -= 10

  // 晾晒：晴 + 湿度低 + 有风
  let dry = 20
  if (t.rainProb < 20) dry += 40
  if (t.max >= 26) dry += 15
  if (t.humidity < 70) dry += 15
  if (wind >= 2) dry += 10
  if (t.rainProb >= 50) dry -= 50

  const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)))
  return [
    { key: 'spray', name: '打药', score: clamp(spray), emoji: '🧴' },
    { key: 'irrigate', name: '灌溉', score: clamp(irrigate), emoji: '💧' },
    { key: 'harvest', name: '采收', score: clamp(harvest), emoji: '🧺' },
    { key: 'dry', name: '晾晒', score: clamp(dry), emoji: '🌞' }
  ]
}

export function indexLevel(score) {
  if (score >= 80) return { text: '适宜', tone: 'brand' }
  if (score >= 60) return { text: '可以做', tone: 'info' }
  if (score >= 40) return { text: '不太合适', tone: 'warn' }
  return { text: '别做', tone: 'danger' }
}

/* ---------------- 农事建议 ---------------- */

/**
 * 规则引擎：从未来三天里挑出会影响农活的点，翻成人话。
 * 每条都带「为什么」，因为农户信的不是结论，是理由。
 */
export function farmTips(w) {
  if (!w || !w.days || !w.days.length) return []
  const tips = []
  const t = w.days[0]
  const tomorrow = w.days[1] || t
  const next3 = w.days.slice(0, 3)
  const rainSoon = next3.some((d) => d.rainProb >= 60)
  const drySpell = next3.every((d) => d.rainProb < 25)
  const hot = next3.some((d) => d.max >= 33)
  const cold = next3.some((d) => d.min <= 5)
  const windy = Math.max(...next3.map((d) => d.windMax)) >= 6
  const humid = t.humidity >= 85 || t.rainProb >= 60

  if (t.rainProb >= 70) {
    tips.push({
      key: 'rain-today',
      level: 'warn',
      emoji: '🌧️',
      title: '今天有雨，别打药',
      desc: `降雨概率 ${t.rainProb}%，药液会被冲掉，等于白打一遍还增加药害风险。把排水沟先清一遍更划算。`
    })
  } else if (rainSoon) {
    tips.push({
      key: 'rain-soon',
      level: 'warn',
      emoji: '⛅',
      title: '未来两天有雨，打药赶在雨前',
      desc: '雨前 6 小时以上打完，让药液干透成膜。雨前 2 小时以内打，基本白费。'
    })
  }

  if (drySpell) {
    tips.push({
      key: 'dry',
      level: 'info',
      emoji: '💧',
      title: '近三天基本无雨，盯着浇水',
      desc: '清晨 5-8 点浇最好，地温还没上来，根系不激。中午浇冷水容易炸根。'
    })
  }

  if (hot) {
    tips.push({
      key: 'hot',
      level: 'danger',
      emoji: '🔥',
      title: '最高温 33℃ 以上，避开中午用药',
      desc: '11 点到 15 点打药，蒸发快、浓度骤升，叶片容易烧边。棚内要放风降温，别闷着。'
    })
  }

  if (cold) {
    tips.push({
      key: 'cold',
      level: 'danger',
      emoji: '❄️',
      title: '夜间低温 5℃ 以下，注意防冻',
      desc: '露地菜盖膜或稻草，棚室夜间加一层内保温。冻前别浇大水，湿冷比干冷更伤根。'
    })
  }

  if (windy) {
    tips.push({
      key: 'wind',
      level: 'warn',
      emoji: '🌬️',
      title: '风力偏大，喷药会飘移',
      desc: '风大时药剂飘到隔壁地块容易出药害纠纷，等风小再打。高秆作物顺手扶一下苗。'
    })
  }

  if (humid && t.max > 15) {
    tips.push({
      key: 'disease',
      level: 'warn',
      emoji: '🍄',
      title: '湿度大，灰霉、霜霉要提前防',
      desc: '连续高湿是这两种病最爱的条件。雨前打一次保护性药剂（代森锰锌一类），比发病后再治省一半钱。'
    })
  }

  if (t.max - t.min >= 10) {
    tips.push({
      key: 'dtr',
      level: 'info',
      emoji: '🌡️',
      title: `昼夜温差 ${t.max - t.min}℃，适合积累糖分`,
      desc: '果实转色期遇到大温差是好事，糖度上得快。这时候补一次钾肥，口感差别很明显。'
    })
  }

  if (!tips.length) {
    tips.push({
      key: 'good',
      level: 'brand',
      emoji: '✅',
      title: '这几天天气平稳，适合按计划干活',
      desc: '没有明显的高温、低温、大风和强降雨，打药、追肥、整枝都可以按农事日历推进。'
    })
  }

  return tips
}

/** 一行话摘要，工作台卡片用 */
export function weatherSummary(w) {
  if (!w || !w.now) return '天气加载中…'
  const t = w.days[0]
  const tips = farmTips(w)
  const first = tips[0] || {}
  return `${w.now.text} ${t.min}~${t.max}℃ · ${first.title || '按计划干活'}`
}

/* ---------------- 主入口 ---------------- */

function readCache() {
  try {
    const raw = uni.getStorageSync(CACHE_KEY)
    if (raw && raw.at && Date.now() - raw.at < CACHE_TTL) return raw.data
  } catch (e) {}
  return null
}

function writeCache(data) {
  try {
    uni.setStorageSync(CACHE_KEY, { at: Date.now(), data })
  } catch (e) {}
}

/**
 * 取天气
 * @param {{force?:boolean}} opts force=true 跳过缓存
 * @returns {Promise<object>} { place, lat, lon, provider, source, mock, now, days, tips, indexes, updatedAt }
 */
/**
 * 取天气
 * @param {{force?:boolean}} opts force=true 跳过缓存
 * @returns {Promise<object>} { place, lat, lon, provider, source, mock, error, now, days, tips, indexes, updatedAt }
 */
export async function fetchWeather(opts = {}) {
  const { force = false } = opts
  if (!force) {
    const cached = readCache()
    if (cached) return cached
  }

  const pos = await locate()
  let raw = null
  let error = ''
  let hit = ''
  let via = ''

  // 服务端代理优先：配了就端上不碰 key
  if (weatherConfig.proxy) {
    try {
      raw = await fromProxy(pos)
      hit = 'proxy'
      via = raw.source
    } catch (e) {
      error = (e && e.message) || '代理请求失败'
    }
  }

  if (!raw) {
    // 降级链：主 provider 失败就换下一个，最后一定落到 mock，页面不会空着
    const p = weatherConfig.provider
    const tries = []
    if (p === 'seniverse' && weatherConfig.key) {
      tries.push({ name: 'seniverse', fn: () => fromSeniverse(pos) })
    }
    if (p === 'qweather' && weatherConfig.qweatherKey) {
      tries.push({ name: 'qweather', fn: () => fromQWeather(pos) })
    }
    if (p !== 'mock') {
      tries.push({ name: 'open-meteo', fn: () => fromOpenMeteo(pos) })
    }
    tries.push({ name: 'mock', fn: () => fromMock(pos) })

    for (const t of tries) {
      try {
        raw = await t.fn()
        hit = t.name
        via = raw.source
        break
      } catch (e) {
        // 只记第一条失败原因，那才是根因；后面的是兜底尝试
        if (!error) error = (e && e.message) || '天气请求失败'
      }
    }
  }

  const out = {
    place: pos.name,
    lat: pos.lat,
    lon: pos.lon,
    precise: pos.precise,
    provider: hit || 'mock',
    source: via || (raw && raw.source) || '',
    mock: !!(raw && raw.mock),
    error: error || '',
    // 主 provider 没用上、但拿到了真数据 —— 页面可以提一句「已自动切换数据源」
    degraded: !!error && !(raw && raw.mock),
    now: raw.now,
    days: raw.days,
    updatedAt: Date.now()
  }
  out.indexes = farmIndex(out)
  out.tips = farmTips(out)
  writeCache(out)
  return out
}

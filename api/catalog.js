/**
 * 数据访问层 · 商品目录（分类 / 农场 / 商品 / 运营位）
 *
 * 现在读的是本地演示数据（src/mock），字段与未来的 shop_products / farm_farms
 * 表一致。后端接口就绪后，只需要把本文件改成 async 请求，页面补一处 await 即可，
 * 数据结构不变 —— 这就是前后端并行的分界线。
 *
 * ProductVM 关键字段：
 *   id, name, spec, price, originalPrice, unit,
 *   categoryId, farmId, coverUrl, emoji, bg,
 *   salesCount, stockCount, tags, summary, detailText
 */
import {
  CATEGORIES,
  FARMS,
  PRODUCTS,
  BANNERS,
  QUICK_ENTRIES,
  findProduct,
  findFarm,
  findCategory
} from '@/mock/index.js'

export { CATEGORIES, FARMS, PRODUCTS, BANNERS, QUICK_ENTRIES, findProduct, findFarm, findCategory }

/** 按分类取商品；categoryId 传 'all' 或空表示全部 */
export function listProducts(categoryId = 'all') {
  return !categoryId || categoryId === 'all' ? PRODUCTS : PRODUCTS.filter((p) => p.categoryId === categoryId)
}

/** 特价商品（有划线价即视为特价） */
export function listFlashProducts(limit = 6) {
  return PRODUCTS.filter((p) => p.originalPrice > p.price).slice(0, limit)
}

/** 某农场的在售商品 */
export function listFarmProducts(farmId) {
  return PRODUCTS.filter((p) => p.farmId === farmId)
}

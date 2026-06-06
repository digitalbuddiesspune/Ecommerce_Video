import { PRICING_MODES } from '../constants/pricingModes.js'
import {
  getListingPrice,
  resolveImageSizes,
  serializeResolutionPricing,
} from './resolveImageSizes.js'

const formatProduct = (product, categoryMap = {}) => {
  const category = categoryMap[product.categorySlug]
  const pricingMode = product.pricingMode || PRICING_MODES.UNIFORM
  const imageSizes = resolveImageSizes(product)

  return {
    id: product._id.toString(),
    mediaType: product.mediaType || 'video',
    pricingMode,
    resolutionPricing: serializeResolutionPricing(product.resolutionPricing),
    imageSizes,
    name: product.name,
    category: category?.breadcrumb || product.categorySlug,
    categorySlug: product.categorySlug,
    subCategory: product.subCategorySlug,
    brand: product.brand,
    price: getListingPrice(product),
    rating: product.rating,
    description: product.description,
    images: product.images,
    demoVideo: product.demoVideo,
    videoPoster: product.videoPoster,
    videoInfo: product.videoInfo,
    isActive: product.isActive,
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  }
}

export const buildCategoryMap = (categories) =>
  Object.fromEntries(categories.map((category) => [category.slug, category]))

export default formatProduct

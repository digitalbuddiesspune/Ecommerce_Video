import mongoose from 'mongoose'
import { MEDIA_TYPE_LIST, MEDIA_TYPES } from '../constants/mediaTypes.js'
import { PRICING_MODE_LIST, PRICING_MODES } from '../constants/pricingModes.js'

const resolutionTierSchema = new mongoose.Schema(
  {
    price: { type: Number, min: 0 },
    resolution: { type: String, default: '' },
    size: { type: String, default: '' },
  },
  { _id: false },
)

const videoInfoSchema = new mongoose.Schema(
  {
    quality: { type: String, default: '' },
    fps: { type: String, default: '' },
    size: { type: String, default: '' },
    duration: { type: String, default: '' },
    format: { type: String, default: '' },
  },
  { _id: false },
)

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mediaType: {
      type: String,
      enum: MEDIA_TYPE_LIST,
      default: MEDIA_TYPES.VIDEO,
      required: true,
    },
    categorySlug: { type: String, required: true, lowercase: true, trim: true },
    subCategorySlug: { type: String, default: '', trim: true },
    brand: { type: String, default: '', trim: true },
    pricingMode: {
      type: String,
      enum: PRICING_MODE_LIST,
      default: PRICING_MODES.UNIFORM,
    },
    price: { type: Number, required: true, min: 0 },
    resolutionPricing: {
      type: Map,
      of: resolutionTierSchema,
      default: () => new Map(),
    },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    description: { type: String, default: '' },
    images: { type: [String], default: [] },
    demoVideo: { type: String, default: '' },
    videoPoster: { type: String, default: '' },
    videoInfo: { type: videoInfoSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export default mongoose.model('Product', productSchema)

import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createProduct,
  fetchCategories,
  fetchProduct,
  updateProduct,
} from '../api/client'
import FormStep from '../components/FormStep'
import MediaTypeSelector from '../components/MediaTypeSelector'
import AvailableTierSelector from '../components/AvailableTierSelector'
import PricingModeSelector from '../components/PricingModeSelector'
import ResolutionTierEditor from '../components/ResolutionTierEditor'
import DeliveryTierEditor from '../components/DeliveryTierEditor'
import MediaUpload from '../components/MediaUpload'
import VideoPreview from '../components/VideoPreview'
import {
  compactFormClass,
  inputClass,
  primaryBtnClass,
  secondaryBtnClass,
} from '../components/ui/adminUi'
import { MEDIA_TYPES } from '../constants/mediaTypes'
import { PRICING_MODES } from '../constants/pricingModes'
import {
  RESOLUTION_ORDER,
  RESOLUTION_TIERS,
  buildDefaultTierConfig,
  isStandardTier,
  sortTierList,
} from '../constants/resolutionTiers'

const buildEmptyDeliveryFiles = () =>
  Object.fromEntries(
    RESOLUTION_ORDER.map((tier) => [
      tier,
      {
        videoKey: '',
        videoFilename: '',
        imageKeys: ['', '', ''],
        imageFilenames: ['', '', ''],
      },
    ])
  )

const mergeDeliveryFiles = (product = {}) => {
  const source = product.deliveryFiles || {}
  return Object.fromEntries(
    RESOLUTION_ORDER.map((tier) => {
      const stored = source[tier] || {}
      const imageKeys = [...(stored.imageKeys || [])]
      const imageFilenames = [...(stored.imageFilenames || [])]
      while (imageKeys.length < 3) imageKeys.push('')
      while (imageFilenames.length < 3) imageFilenames.push('')
      return [
        tier,
        {
          videoKey: stored.videoKey || '',
          videoFilename: stored.videoFilename || '',
          imageKeys,
          imageFilenames,
        },
      ]
    })
  )
}

const mergeTierConfig = (product = {}) => {
  const source = product.imageSizes || product.resolutionPricing
  const basePrice = Number(product.price) || 499

  const tierList = mergeAvailableTiers(product)

  return Object.fromEntries(
    tierList.map((tier) => {
      const stored = source?.[tier] || {}
      const defaults = RESOLUTION_TIERS[tier] || {}
      const scaled = buildDefaultTierConfig(basePrice)[tier]

      return [
        tier,
        {
          resolution: stored.resolution || defaults.resolution || '',
          size: stored.size || defaults.size || '',
          price: stored.price ?? scaled?.price ?? basePrice,
        },
      ]
    })
  )
}

const emptyDeliveryTier = () => ({
  videoKey: '',
  videoFilename: '',
  imageKeys: ['', '', ''],
  imageFilenames: ['', '', ''],
})

const mergeAvailableTiers = (product = {}) => {
  const stored = product.availableTiers || []
  return stored.length ? sortTierList(stored) : [...RESOLUTION_ORDER]
}

const emptyForm = (mediaType = MEDIA_TYPES.VIDEO) => ({
  mediaType,
  pricingMode: PRICING_MODES.UNIFORM,
  name: '',
  categorySlug: '',
  subCategorySlug: '',
  brand: '',
  price: 499,
  availableTiers: [...RESOLUTION_ORDER],
  resolutionPricing: buildDefaultTierConfig(499),
  rating: 4.5,
  description: '',
  images: ['', '', ''],
  demoVideo: '',
  videoPoster: '',
  deliveryFiles: buildEmptyDeliveryFiles(),
  isActive: true,
  videoInfo: {
    quality: '4K UHD (3840×2160)',
    fps: mediaType === MEDIA_TYPES.VIDEO ? '30 fps' : '',
    size: mediaType === MEDIA_TYPES.VIDEO ? '200 MB' : '18 MB',
    duration: mediaType === MEDIA_TYPES.VIDEO ? '0:15' : '',
    format: mediaType === MEDIA_TYPES.VIDEO ? 'MP4 / H.264' : 'JPEG / PNG',
  },
})

const ProductForm = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [categories, setCategories] = useState([])
  const [form, setForm] = useState(emptyForm())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        const categoriesRes = await fetchCategories()
        setCategories(categoriesRes.data)

        if (isEdit) {
          const productRes = await fetchProduct(id)
          const product = productRes.data
          const mediaType = product.mediaType || MEDIA_TYPES.VIDEO

          setForm({
            mediaType,
            pricingMode: product.pricingMode || PRICING_MODES.UNIFORM,
            name: product.name,
            categorySlug: product.categorySlug,
            subCategorySlug: product.subCategory || '',
            brand: product.brand || '',
            price: product.price,
            availableTiers: mergeAvailableTiers(product),
            resolutionPricing: mergeTierConfig(product),
            rating: product.rating || 0,
            description: product.description || '',
            images: [
              product.images?.[0] || '',
              product.images?.[1] || '',
              product.images?.[2] || '',
            ],
            demoVideo: product.demoVideo || '',
            videoPoster: product.videoPoster || '',
            deliveryFiles: mergeDeliveryFiles(product),
            isActive: product.isActive ?? true,
            videoInfo: {
              quality: product.videoInfo?.quality || '',
              fps: product.videoInfo?.fps || '',
              size: product.videoInfo?.size || '',
              duration: product.videoInfo?.duration || '',
              format: product.videoInfo?.format || '',
            },
          })
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, isEdit])

  const isVideo = form.mediaType === MEDIA_TYPES.VIDEO
  const isUniformPricing = form.pricingMode === PRICING_MODES.UNIFORM
  const selectedTiers = useMemo(
    () => sortTierList(form.availableTiers),
    [form.availableTiers]
  )

  const selectedCategory = useMemo(
    () => categories.find((category) => category.slug === form.categorySlug),
    [categories, form.categorySlug]
  )

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const updatePricingMode = (pricingMode) => {
    setForm((current) => ({
      ...current,
      pricingMode,
      resolutionPricing:
        pricingMode === PRICING_MODES.CUSTOM
          ? mergeTierConfig({
              price: current.price,
              imageSizes: current.resolutionPricing,
            })
          : current.resolutionPricing,
    }))
  }

  const toggleAvailableTier = (tier) => {
    setForm((current) => {
      const isSelected = current.availableTiers.includes(tier)
      const next = isSelected
        ? current.availableTiers.filter((item) => item !== tier)
        : [...current.availableTiers, tier]

      if (next.length === 0) return current

      return {
        ...current,
        availableTiers: sortTierList(next),
      }
    })
  }

  const addCustomTier = (name, resolution) => {
    setForm((current) => ({
      ...current,
      availableTiers: sortTierList([...current.availableTiers, name]),
      resolutionPricing: {
        ...current.resolutionPricing,
        [name]: {
          resolution,
          size: '',
          price: current.price,
        },
      },
      deliveryFiles: {
        ...current.deliveryFiles,
        [name]: current.deliveryFiles?.[name] || emptyDeliveryTier(),
      },
    }))
  }

  const removeCustomTier = (tier) => {
    if (isStandardTier(tier)) return

    setForm((current) => {
      const { [tier]: _removedPricing, ...resolutionPricing } = current.resolutionPricing
      const { [tier]: _removedDelivery, ...deliveryFiles } = current.deliveryFiles

      return {
        ...current,
        availableTiers: current.availableTiers.filter((item) => item !== tier),
        resolutionPricing,
        deliveryFiles,
      }
    })
  }

  const updateTierField = (tier, field, value) => {
    setForm((current) => ({
      ...current,
      resolutionPricing: {
        ...current.resolutionPricing,
        [tier]: {
          ...current.resolutionPricing[tier],
          [field]: value,
        },
      },
    }))
  }

  const updateMediaType = (mediaType) => {
    setForm((current) => ({
      ...emptyForm(mediaType),
      mediaType,
      name: current.name,
      categorySlug: current.categorySlug,
      subCategorySlug: current.subCategorySlug,
      brand: current.brand,
      price: current.price,
      rating: current.rating,
      description: current.description,
      images: current.images,
      isActive: current.isActive,
      demoVideo: mediaType === MEDIA_TYPES.VIDEO ? current.demoVideo : '',
      videoPoster: mediaType === MEDIA_TYPES.VIDEO ? current.videoPoster : current.images[0] || '',
      deliveryFiles: current.deliveryFiles,
    }))
  }

  const updateVideoInfo = (field, value) => {
    setForm((current) => ({
      ...current,
      videoInfo: { ...current.videoInfo, [field]: value },
    }))
  }

  const updateDeliveryFile = (tier, data) => {
    setForm((current) => ({
      ...current,
      deliveryFiles: {
        ...current.deliveryFiles,
        [tier]: data,
      },
    }))
  }

  const updateImage = (index, value) => {
    setForm((current) => ({
      ...current,
      images: current.images.map((image, imageIndex) =>
        imageIndex === index ? value : image
      ),
      videoPoster:
        current.mediaType === MEDIA_TYPES.VIDEO && index === 0 && !current.videoPoster
          ? value
          : current.videoPoster,
    }))
  }

  const validateClient = () => {
    const imageCount = form.images.filter(Boolean).length
    if (!form.name.trim()) return 'Product name is required'
    if (!form.categorySlug) return 'Category is required'
    if (!imageCount) return 'At least one preview image is required'
    if (isVideo && !form.demoVideo.trim()) return 'Demo video URL is required for video products'
    if (!selectedTiers.length) return 'Select at least one quality tier'

    const missingSize = selectedTiers.find((tier) => {
      const tierData = form.resolutionPricing?.[tier] || {}
      return !tierData.size?.trim()
    })
    if (missingSize) return `Set file size for ${missingSize}`

    const missingResolution = selectedTiers.find((tier) => {
      if (isStandardTier(tier)) return false
      const tierData = form.resolutionPricing?.[tier] || {}
      return !tierData.resolution?.trim()
    })
    if (missingResolution) return `Set dimensions for custom tier ${missingResolution}`

    if (form.pricingMode === PRICING_MODES.UNIFORM) {
      if (!Number(form.price) || Number(form.price) < 0) return 'Valid price is required'
    } else {
      const missingPrice = selectedTiers.find(
        (tier) => !Number(form.resolutionPricing?.[tier]?.price)
      )
      if (missingPrice) return `Enter a price for ${missingPrice}`
    }
    return ''
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const clientError = validateClient()
    if (clientError) {
      setError(clientError)
      return
    }

    setSaving(true)
    setError('')

    const payload = {
      ...form,
      images: form.images.filter(Boolean),
      price: Number(form.price),
      rating: Number(form.rating),
      availableTiers: selectedTiers,
      resolutionPricing: Object.fromEntries(
        selectedTiers.map((tier) => {
          const tierData = form.resolutionPricing[tier] || {}
          return [
            tier,
            {
              resolution: tierData.resolution?.trim() || RESOLUTION_TIERS[tier].resolution,
              size: tierData.size?.trim() || RESOLUTION_TIERS[tier].size,
              price: isUniformPricing
                ? Number(form.price)
                : Number(tierData.price),
            },
          ]
        })
      ),
      videoPoster: isVideo
        ? form.videoPoster || form.images.find(Boolean) || ''
        : form.images.find(Boolean) || '',
      deliveryFiles: Object.fromEntries(
        selectedTiers.map((tier) => {
          const tierData = form.deliveryFiles?.[tier] || {}
          const imageKeys = []
          const imageFilenames = []
          ;(tierData.imageKeys || []).forEach((key, index) => {
            const trimmedKey = key?.trim()
            if (!trimmedKey) return
            imageKeys.push(trimmedKey)
            imageFilenames.push(tierData.imageFilenames?.[index]?.trim() || '')
          })
          return [
            tier,
            {
              videoKey: tierData.videoKey?.trim() || '',
              videoFilename: tierData.videoFilename?.trim() || '',
              imageKeys,
              imageFilenames,
            },
          ]
        })
      ),
    }

    try {
      if (isEdit) {
        await updateProduct(id, payload)
      } else {
        await createProduct(payload)
      }
      navigate('/products')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading product...</p>
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Products</p>
          <h1 className="text-2xl font-bold text-slate-900">
            {isEdit ? 'Edit Product' : 'Add Product'}
          </h1>
        </div>
        <Link to="/products" className={secondaryBtnClass}>
          Back
        </Link>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className={compactFormClass}>
        <FormStep
          step="1"
          title="What are you selling?"
          hint="Video includes demo clip. Image sells still files only."
          tone="slate"
        >
          <MediaTypeSelector
            value={form.mediaType}
            onChange={updateMediaType}
            disabled={isEdit}
          />
          {isEdit && (
            <p className="mt-2 text-xs text-slate-500">
              Media type cannot be changed after creation.
            </p>
          )}
        </FormStep>

        <FormStep step="2" title="Product details" tone="sky">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium text-slate-700">Product Name</span>
              <input required value={form.name} onChange={(e) => updateField('name', e.target.value)} className={inputClass} />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Category</span>
              <select
                required
                value={form.categorySlug}
                onChange={(e) => {
                  updateField('categorySlug', e.target.value)
                  updateField('subCategorySlug', '')
                }}
                className={inputClass}
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category.slug}>{category.navLabel}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Subcategory</span>
              <select value={form.subCategorySlug} onChange={(e) => updateField('subCategorySlug', e.target.value)} className={inputClass}>
                <option value="">None</option>
                {selectedCategory?.subCategories?.map((subCategory) => (
                  <option key={subCategory.slug} value={subCategory.slug}>{subCategory.name}</option>
                ))}
              </select>
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Brand</span>
              <input value={form.brand} onChange={(e) => updateField('brand', e.target.value)} className={inputClass} />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Rating</span>
              <input type="number" min="0" max="5" step="0.1" value={form.rating} onChange={(e) => updateField('rating', e.target.value)} className={inputClass} />
            </label>

            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
              <input type="checkbox" checked={form.isActive} onChange={(e) => updateField('isActive', e.target.checked)} />
              Visible on storefront
            </label>

            <label className="block text-sm sm:col-span-2">
              <span className="font-medium text-slate-700">Description</span>
              <textarea rows={2} value={form.description} onChange={(e) => updateField('description', e.target.value)} className={inputClass} />
            </label>
          </div>
        </FormStep>

        <FormStep
          step="3"
          title="Video & image resolution"
          hint="Choose qualities first, then set file size and price for each selected tier."
          tone="violet"
        >
          <AvailableTierSelector
            selected={form.availableTiers}
            onToggle={toggleAvailableTier}
            onAddCustom={addCustomTier}
            onRemoveCustom={removeCustomTier}
          />

          <div className="mt-4">
            <PricingModeSelector value={form.pricingMode} onChange={updatePricingMode} />
          </div>

          {isUniformPricing && (
            <label className="mt-3 block max-w-xs text-sm">
              <span className="font-medium text-slate-700">Price for all resolutions (₹)</span>
              <input
                type="number"
                required
                min="0"
                value={form.price}
                onChange={(e) => updateField('price', e.target.value)}
                className={inputClass}
              />
            </label>
          )}

          <ResolutionTierEditor
            order={selectedTiers}
            tiers={form.resolutionPricing}
            showPrice={!isUniformPricing}
            uniformPrice={form.price}
            onFieldChange={updateTierField}
          />
        </FormStep>

        <FormStep
          step="4"
          title={isVideo ? 'Preview images + demo video' : 'Preview images'}
          hint={isVideo ? 'Watermarked previews shown to customers on the storefront.' : 'Customer preview images.'}
          tone="emerald"
        >
          <div className="grid gap-2 sm:grid-cols-3">
            {form.images.map((image, index) => (
              <MediaUpload
                key={index}
                label={`Preview Image ${index + 1}`}
                accept="image/jpeg,image/png,image/webp"
                uploadType="preview-image"
                value={image}
                onChange={(url) => updateImage(index, url)}
                valueKind="url"
                placeholder={`Image URL ${index + 1}`}
              />
            ))}
          </div>

          {isVideo && (
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <MediaUpload
                label="Demo Video *"
                accept="video/mp4,video/webm,video/quicktime"
                uploadType="preview-video"
                value={form.demoVideo}
                onChange={(url) => updateField('demoVideo', url)}
                valueKind="url"
                placeholder="https://..."
              />
              <MediaUpload
                label="Video Poster"
                accept="image/jpeg,image/png,image/webp"
                uploadType="preview-image"
                value={form.videoPoster}
                onChange={(url) => updateField('videoPoster', url)}
                valueKind="url"
                placeholder="Defaults to image 1"
              />
              <div className="lg:col-span-2">
                <p className="mb-1 text-xs font-medium text-slate-600">Preview</p>
                <VideoPreview src={form.demoVideo} poster={form.videoPoster || form.images[0]} />
              </div>
            </div>
          )}
        </FormStep>

        <FormStep
          step="5"
          title="Original delivery files"
          hint="Private files per resolution. Customers download these after purchase — not shown on storefront."
          tone="amber"
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {selectedTiers.map((tier) => (
              <DeliveryTierEditor
                key={tier}
                tier={tier}
                data={form.deliveryFiles?.[tier]}
                isVideo={isVideo}
                onChange={updateDeliveryFile}
              />
            ))}
          </div>
        </FormStep>

        <FormStep
          step="6"
          title={isVideo ? 'Video file info' : 'Image file info'}
          tone="slate"
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Max Quality</span>
              <input value={form.videoInfo.quality} onChange={(e) => updateVideoInfo('quality', e.target.value)} className={inputClass} />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">File Size</span>
              <input value={form.videoInfo.size} onChange={(e) => updateVideoInfo('size', e.target.value)} className={inputClass} />
            </label>
            {isVideo && (
              <>
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">FPS</span>
                  <input value={form.videoInfo.fps} onChange={(e) => updateVideoInfo('fps', e.target.value)} className={inputClass} />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Duration</span>
                  <input value={form.videoInfo.duration} onChange={(e) => updateVideoInfo('duration', e.target.value)} className={inputClass} />
                </label>
              </>
            )}
            <label className="block text-sm sm:col-span-2">
              <span className="font-medium text-slate-700">Format</span>
              <input value={form.videoInfo.format} onChange={(e) => updateVideoInfo('format', e.target.value)} className={inputClass} />
            </label>
          </div>
        </FormStep>

        <div className="flex gap-3 bg-slate-100 px-5 py-3">
          <button type="submit" disabled={saving} className={`${primaryBtnClass} disabled:opacity-60`}>
            {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
          <Link to="/products" className={secondaryBtnClass}>Cancel</Link>
        </div>
      </form>
    </div>
  )
}

export default ProductForm

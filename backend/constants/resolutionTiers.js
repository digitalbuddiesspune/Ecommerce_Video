export const RESOLUTION_TIERS = {
  SD: { resolution: '854×480', size: '2 MB' },
  HD: { resolution: '1280×720', size: '4 MB' },
  'Full HD': { resolution: '1920×1080', size: '6 MB' },
  '2K': { resolution: '2048×1080', size: '12 MB' },
  '4K': { resolution: '3840×2160', size: '48 MB' },
  '6K': { resolution: '6144×3456', size: '72 MB' },
  '8K': { resolution: '7680×4320', size: '96 MB' },
}

export const RESOLUTION_ORDER = Object.keys(RESOLUTION_TIERS)

export const isStandardTier = (tier) => RESOLUTION_ORDER.includes(tier)

export const sortTierList = (tiers = []) => {
  const unique = [...new Set(tiers.map((tier) => tier?.trim()).filter(Boolean))]
  const standard = RESOLUTION_ORDER.filter((tier) => unique.includes(tier))
  const custom = unique.filter((tier) => !isStandardTier(tier))
  return [...standard, ...custom]
}

export const getAvailableTiers = (productOrBody = {}) => {
  const selected = sortTierList(productOrBody.availableTiers || [])
  return selected.length ? selected : [...RESOLUTION_ORDER]
}

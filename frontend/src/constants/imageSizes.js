export const IMAGE_SIZE_TIERS = {
  SD: { resolution: '854×480', size: '2 MB', priceFactor: 0.15 },
  HD: { resolution: '1280×720', size: '4 MB', priceFactor: 0.25 },
  'Full HD': { resolution: '1920×1080', size: '6 MB', priceFactor: 0.4 },
  '2K': { resolution: '2048×1080', size: '12 MB', priceFactor: 0.6 },
  '4K': { resolution: '3840×2160', size: '48 MB', priceFactor: 1 },
  '6K': { resolution: '6144×3456', size: '72 MB', priceFactor: 1.4 },
  '8K': { resolution: '7680×4320', size: '96 MB', priceFactor: 1.8 },
};

export const IMAGE_SIZE_ORDER = Object.keys(IMAGE_SIZE_TIERS);

export const buildScaledImageSizes = (base4kPrice) =>
  Object.fromEntries(
    IMAGE_SIZE_ORDER.map((key) => {
      const tier = IMAGE_SIZE_TIERS[key];
      return [
        key,
        {
          resolution: tier.resolution,
          size: tier.size,
          price: Math.max(49, Math.round(base4kPrice * tier.priceFactor)),
        },
      ];
    })
  );

export const buildUniformImageSizes = (uniformPrice) =>
  Object.fromEntries(
    IMAGE_SIZE_ORDER.map((key) => {
      const tier = IMAGE_SIZE_TIERS[key];
      return [
        key,
        {
          resolution: tier.resolution,
          size: tier.size,
          price: uniformPrice,
        },
      ];
    })
  );

export const resolveProductImageSizes = (product) => {
  if (product?.imageSizes && Object.keys(product.imageSizes).length) {
    return product.imageSizes;
  }

  if (product?.pricingMode === 'custom' && product?.resolutionPricing) {
    return Object.fromEntries(
      IMAGE_SIZE_ORDER.map((key) => {
        const stored = product.resolutionPricing[key] || {};
        const tier = IMAGE_SIZE_TIERS[key];
        return [
          key,
          {
            resolution: stored.resolution || tier.resolution,
            size: stored.size || tier.size,
            price: Number(stored.price ?? product.price),
          },
        ];
      })
    );
  }

  if (product?.pricingMode === 'uniform') {
    const storedTiers = product?.resolutionPricing || {};
    return Object.fromEntries(
      IMAGE_SIZE_ORDER.map((key) => {
        const stored = storedTiers[key] || {};
        const tier = IMAGE_SIZE_TIERS[key];
        return [
          key,
          {
            resolution: stored.resolution || tier.resolution,
            size: stored.size || tier.size,
            price: Number(product.price),
          },
        ];
      })
    );
  }

  return buildScaledImageSizes(product?.price ?? 0);
};

/** @deprecated alias */
export const buildImageSizes = buildScaledImageSizes;

export const sortImageSizeEntries = (imageSizes = {}) =>
  IMAGE_SIZE_ORDER.filter((key) => imageSizes[key]).map((key) => [
    key,
    imageSizes[key],
  ]);

export const getDefaultImageSize = (imageSizes = {}) => {
  if (imageSizes['4K']) return '4K';
  const available = sortImageSizeEntries(imageSizes);
  return available[available.length - 1]?.[0] ?? IMAGE_SIZE_ORDER[0];
};

export const formatImageSizeList = (imageSizes = {}) =>
  sortImageSizeEntries(imageSizes)
    .map(([key]) => key)
    .join(', ');

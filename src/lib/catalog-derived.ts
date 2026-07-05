import type { ProductAggregateInput } from '#/services/schemas/admin'
import type { Product } from '#/types/catalog'

export const LOW_STOCK_THRESHOLD = 5

export function isLowStock(stockQty: number, inStock: boolean) {
  return inStock && stockQty <= LOW_STOCK_THRESHOLD
}

export function deriveProduct({
  product,
  colorways,
  skus,
  images,
}: ProductAggregateInput): Product {
  const defaultColorway =
    colorways.find((colorway) => colorway.isDefault) ?? colorways[0]
  const prices = colorways.map((colorway) => colorway.price)
  const sizes = [...new Set(skus.map((sku) => sku.size))]
  const badges = colorways.some((colorway) => colorway.onSale) ? ['Sale'] : []
  const coverImages = images.filter(
    (image) =>
      image.colorwayId === defaultColorway.id || image.colorwayId === null,
  )
  const relevant = coverImages.length > 0 ? coverImages : images

  return {
    ...product,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    badges,
    colorwayCount: colorways.length,
    colorFamilies: [...new Set(colorways.map((colorway) => colorway.name))],
    swatches: colorways.map((colorway) => ({
      styleColor: colorway.styleColor,
      hex: colorway.swatchHex,
    })),
    thumbnailUrl: relevant[0].url,
    hoverImageUrl: (relevant[1] ?? relevant[0]).url,
    defaultColorwayId: defaultColorway.id,
    sizes,
  }
}

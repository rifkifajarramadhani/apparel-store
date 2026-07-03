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
}: ProductAggregateInput): Product {
  const defaultColorway =
    colorways.find((colorway) => colorway.isDefault) ?? colorways[0]
  const prices = colorways.map((colorway) => colorway.price)
  const sizes = [...new Set(skus.map((sku) => sku.size))]
  const badges = colorways.some((colorway) => colorway.onSale) ? ['Sale'] : []

  return {
    ...product,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    badges,
    colorwayCount: colorways.length,
    colorFamilies: [
      ...new Set(colorways.map((colorway) => colorway.colorFamily)),
    ],
    swatches: colorways.map((colorway) => ({
      styleColor: colorway.styleColor,
      hex: colorway.swatchHex,
    })),
    thumbnailUrl: defaultColorway.images[0],
    hoverImageUrl: defaultColorway.images[1] ?? defaultColorway.images[0],
    defaultColorwayId: defaultColorway.id,
    sizes,
  }
}

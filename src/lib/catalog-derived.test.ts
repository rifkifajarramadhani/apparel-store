import { describe, expect, it } from 'vitest'
import { deriveProduct, isLowStock } from './catalog-derived'
import type { ProductAggregateInput } from '#/services/schemas/admin'

const aggregate: ProductAggregateInput = {
  product: {
    id: 'AX-1', slug: 'test-product', name: 'Test Product', subtitle: 'Test subtitle', brand: 'AXIS',
    gender: 'men', type: 'Top', categoryId: 'men-tees', categorySlug: 'men-tees', collectionIds: [],
    sizeScale: 'apparel-alpha', basePrice: 1000, description: 'A long enough test description.', publishedAt: '2026-01-01',
  },
  colorways: [
    { id: 'AX1-010', productId: 'AX-1', styleColor: 'AX1-010', name: 'Black', swatchHex: '#111111', price: 1000, isDefault: true, onSale: false },
    { id: 'AX1-100', productId: 'AX-1', styleColor: 'AX1-100', name: 'White', swatchHex: '#ffffff', price: 800, isDefault: false, onSale: true },
  ],
  skus: [
    { id: 'AX1-010-S', colorwayId: 'AX1-010', productId: 'AX-1', size: 'S', sizeLabel: 'S', sizeScale: 'apparel-alpha', inStock: true, stockQty: 4, price: 1000 },
    { id: 'AX1-100-M', colorwayId: 'AX1-100', productId: 'AX-1', size: 'M', sizeLabel: 'M', sizeScale: 'apparel-alpha', inStock: true, stockQty: 8, price: 800 },
  ],
  images: [
    { url: 'https://example.com/black.jpg', colorwayId: 'AX1-010' },
    { url: 'https://example.com/white.jpg', colorwayId: 'AX1-100' },
  ],
}

describe('catalog derivation', () => {
  it('recomputes storefront projections from colorways and SKUs', () => {
    const product = deriveProduct(aggregate)
    expect(product).toMatchObject({ minPrice: 800, maxPrice: 1000, colorwayCount: 2, defaultColorwayId: 'AX1-010', badges: ['Sale'], sizes: ['S', 'M'] })
  })

  it('classifies low stock without treating unavailable SKUs as low', () => {
    expect(isLowStock(5, true)).toBe(true)
    expect(isLowStock(6, true)).toBe(false)
    expect(isLowStock(0, false)).toBe(false)
  })
})


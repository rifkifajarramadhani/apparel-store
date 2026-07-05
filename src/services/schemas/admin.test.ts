import { describe, expect, it } from 'vitest'
import { ProductAggregateInputSchema } from './admin'
import type { ProductAggregateInput } from './admin'

function validAggregate(): ProductAggregateInput {
  return {
    product: { id: 'AX-1', slug: 'test', name: 'Test', subtitle: 'Test subtitle', brand: 'AXIS', gender: 'men', type: 'Top', categoryId: 'men-tees', categorySlug: 'men-tees', collectionIds: [], sizeScale: 'apparel-alpha', basePrice: 1000, description: 'A valid product description.', publishedAt: '2026-01-01' },
    colorways: [{ id: 'AX1-010', productId: 'AX-1', styleColor: 'AX1-010', name: 'Black', swatchHex: '#111111', price: 1000, isDefault: true, onSale: false }],
    skus: [{ id: 'AX1-010-S', colorwayId: 'AX1-010', productId: 'AX-1', size: 'S', sizeLabel: 'S', sizeScale: 'apparel-alpha', inStock: true, stockQty: 1, price: 1000 }],
    images: [{ url: 'https://example.com/image.jpg', colorwayId: 'AX1-010' }],
  }
}

describe('ProductAggregateInputSchema', () => {
  it('accepts a linked aggregate', () => expect(ProductAggregateInputSchema.safeParse(validAggregate()).success).toBe(true))
  it('rejects aggregates without exactly one default colorway', () => {
    const aggregate = validAggregate()
    aggregate.colorways[0].isDefault = false
    expect(ProductAggregateInputSchema.safeParse(aggregate).success).toBe(false)
  })
  it('rejects SKUs linked to an unknown colorway', () => {
    const aggregate = validAggregate()
    aggregate.skus[0].colorwayId = 'missing'
    expect(ProductAggregateInputSchema.safeParse(aggregate).success).toBe(false)
  })
  it('accepts an image shared across all colorways', () => {
    const aggregate = validAggregate()
    aggregate.images[0].colorwayId = null
    expect(ProductAggregateInputSchema.safeParse(aggregate).success).toBe(true)
  })
  it('rejects images linked to an unknown colorway', () => {
    const aggregate = validAggregate()
    aggregate.images[0].colorwayId = 'missing'
    expect(ProductAggregateInputSchema.safeParse(aggregate).success).toBe(false)
  })
})

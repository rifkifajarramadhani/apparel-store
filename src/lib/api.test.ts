import { describe, expect, it } from 'vitest'
import { assetsForColourway } from './api'
import type { Asset, ProductRecord } from '#/services/schemas/catalog'

function asset(overrides: Partial<Asset>): Asset {
  return {
    id: overrides.id ?? 'a1',
    mediaType: 'image',
    url: 'https://cdn.example.com/a1.jpg',
    role: 'gallery',
    sortOrder: 0,
    ...overrides,
  }
}

function record(assets: Asset[]): ProductRecord {
  return { assets } as ProductRecord
}

describe('assetsForColourway', () => {
  it('includes shared (untagged) assets alongside colourway-scoped ones', () => {
    const black = asset({ id: 'black', url: 'black.jpg', colourwayId: 'blk' })
    const shared = asset({ id: 'shared', url: 'shared.jpg' })
    const white = asset({ id: 'white', url: 'white.jpg', colourwayId: 'wht' })

    expect(assetsForColourway(record([black, shared, white]), 'blk')).toEqual([
      'black.jpg',
      'shared.jpg',
    ])
  })

  it('falls back to shared assets only when the colourway has none of its own', () => {
    const shared = asset({ id: 'shared', url: 'shared.jpg' })
    const white = asset({ id: 'white', url: 'white.jpg', colourwayId: 'wht' })

    expect(assetsForColourway(record([shared, white]), 'blk')).toEqual([
      'shared.jpg',
    ])
  })
})

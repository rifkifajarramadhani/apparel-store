import { describe, expect, it } from 'vitest'
import { buildColourwayGallery } from './pdp-gallery'
import type { Colorway } from '#/types/catalog'

function colorway(styleColor: string, images: string[]): Colorway {
  return {
    id: styleColor,
    productId: 'product',
    styleColor,
    name: styleColor,
    swatchHex: '#000000',
    price: 100,
    isDefault: false,
    onSale: false,
    images,
  }
}

describe('buildColourwayGallery', () => {
  it('keeps colourway and image order while removing duplicate URLs', () => {
    expect(
      buildColourwayGallery([
        colorway('BLACK', ['black-front.jpg', 'black-back.jpg']),
        colorway('GREY', ['grey-front.jpg']),
      ]),
    ).toEqual([
      { src: 'black-front.jpg', styleColor: 'BLACK' },
      { src: 'black-back.jpg', styleColor: 'BLACK' },
      { src: 'grey-front.jpg', styleColor: 'GREY' },
    ])
  })

  it('marks an image belonging to multiple colourways as shared', () => {
    expect(
      buildColourwayGallery([
        colorway('BLACK', ['black.jpg', 'shared.jpg']),
        colorway('GREY', ['grey.jpg', 'shared.jpg']),
      ]),
    ).toEqual([
      { src: 'black.jpg', styleColor: 'BLACK' },
      { src: 'shared.jpg', styleColor: null },
      { src: 'grey.jpg', styleColor: 'GREY' },
    ])
  })

  it('ignores empty image URLs', () => {
    expect(
      buildColourwayGallery([colorway('BLACK', ['', 'black.jpg'])]),
    ).toEqual([{ src: 'black.jpg', styleColor: 'BLACK' }])
  })
})

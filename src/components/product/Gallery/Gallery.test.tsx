// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Gallery } from './Gallery'
import type { GalleryImage } from '#/lib/pdp-gallery'

const images: GalleryImage[] = [
  { src: 'black.jpg', styleColor: 'BLACK' },
  { src: 'shared.jpg', styleColor: null },
  { src: 'grey.jpg', styleColor: 'GREY' },
]

afterEach(cleanup)

describe('Gallery', () => {
  it('shows every image and selects the colourway owned by a thumbnail', () => {
    const onSelectStyleColor = vi.fn()
    render(
      <Gallery
        images={images}
        alt="Tech Fleece Jogger"
        activeStyleColor="BLACK"
        onSelectStyleColor={onSelectStyleColor}
      />,
    )

    expect(screen.getAllByRole('button')).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: 'View image 3' }))

    expect(onSelectStyleColor).toHaveBeenCalledWith('GREY')
    expect(screen.getByAltText('Tech Fleece Jogger').getAttribute('src')).toBe(
      'grey.jpg',
    )
  })

  it('does not change colour when a shared thumbnail is selected', () => {
    const onSelectStyleColor = vi.fn()
    render(
      <Gallery
        images={images}
        alt="Tech Fleece Jogger"
        activeStyleColor="BLACK"
        onSelectStyleColor={onSelectStyleColor}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'View image 2' }))

    expect(onSelectStyleColor).not.toHaveBeenCalled()
    expect(screen.getByAltText('Tech Fleece Jogger').getAttribute('src')).toBe(
      'shared.jpg',
    )
  })

  it('focuses the first matching image when the selected colour changes', () => {
    const props = {
      images,
      alt: 'Tech Fleece Jogger',
      onSelectStyleColor: vi.fn(),
    }
    const { rerender } = render(<Gallery {...props} activeStyleColor="BLACK" />)

    rerender(<Gallery {...props} activeStyleColor="GREY" />)

    expect(screen.getByAltText('Tech Fleece Jogger').getAttribute('src')).toBe(
      'grey.jpg',
    )
  })

  it('renders an unavailable state instead of an image with an empty source', () => {
    render(
      <Gallery
        images={[]}
        alt="Tech Fleece Jogger"
        activeStyleColor="BLACK"
        onSelectStyleColor={vi.fn()}
      />,
    )

    expect(screen.getByText('Image unavailable')).toBeTruthy()
    expect(screen.queryByRole('img')).toBeNull()
  })
})

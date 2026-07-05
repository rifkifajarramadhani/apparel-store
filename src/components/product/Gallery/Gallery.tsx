import { useEffect, useState } from 'react'
import { cn } from '#/lib/utils'
import type { GalleryImage } from '#/lib/pdp-gallery'

interface GalleryProps {
  images: GalleryImage[]
  alt: string
  activeStyleColor: string
  onSelectStyleColor: (styleColor: string) => void
}

export function Gallery({
  images,
  alt,
  activeStyleColor,
  onSelectStyleColor,
}: GalleryProps) {
  const [activeSrc, setActiveSrc] = useState(() => images[0]?.src ?? null)

  useEffect(() => {
    const colourwayImage = images.find(
      (image) => image.styleColor === activeStyleColor,
    )
    setActiveSrc((current) => {
      if (colourwayImage) return colourwayImage.src
      if (current && images.some((image) => image.src === current))
        return current
      return images[0]?.src ?? null
    })
  }, [activeStyleColor, images])

  const selectImage = (image: GalleryImage) => {
    setActiveSrc(image.src)
    if (image.styleColor && image.styleColor !== activeStyleColor) {
      onSelectStyleColor(image.styleColor)
    }
  }

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center bg-secondary text-sm text-muted-foreground">
        Image unavailable
      </div>
    )
  }

  return (
    <div className="flex gap-3">
      <div className="flex flex-col gap-3">
        {images.map((image, index) => (
          <button
            key={image.src}
            type="button"
            onClick={() => selectImage(image)}
            aria-label={`View image ${index + 1}`}
            aria-current={image.src === activeSrc}
            className={cn(
              'h-16 w-16 overflow-hidden border',
              image.src === activeSrc ? 'border-foreground' : 'border-border',
            )}
          >
            <img
              src={image.src}
              alt=""
              className="h-full w-full object-cover"
            />
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden bg-secondary">
        <img
          src={activeSrc || images[0].src}
          alt={alt}
          className="aspect-square w-full object-cover"
        />
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { cn } from '#/lib/utils'

// Thumbnail column + large image. Resets to first image when the colourway changes.
export function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0)
  useEffect(() => setActive(0), [images])

  return (
    <div className="flex gap-3">
      <div className="flex flex-col gap-3">
        {images.map((src, i) => (
          <button
            key={src}
            onClick={() => setActive(i)}
            aria-label={`View image ${i + 1}`}
            aria-current={i === active}
            className={cn(
              'h-16 w-16 overflow-hidden border',
              i === active ? 'border-foreground' : 'border-border',
            )}
          >
            <img src={src} alt="" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden bg-secondary">
        <img
          src={images[active]}
          alt={alt}
          className="aspect-square w-full object-cover"
        />
      </div>
    </div>
  )
}

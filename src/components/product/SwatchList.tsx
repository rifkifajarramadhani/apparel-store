import { Link } from '@tanstack/react-router'
import { cn } from '#/lib/utils'
import type { Colorway } from '#/types/catalog'

// Each swatch is a navigation to that colourway's deep link.
export function SwatchList({
  colorways,
  slug,
  activeStyleColor,
}: {
  colorways: Colorway[]
  slug: string
  activeStyleColor: string
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {colorways.map((cw) => (
        <Link
          key={cw.id}
          to="/t/$slug/$styleColor"
          params={{ slug, styleColor: cw.styleColor }}
          aria-label={cw.name}
          aria-current={cw.styleColor === activeStyleColor}
          className={cn(
            'h-12 w-12 overflow-hidden rounded border-2',
            cw.styleColor === activeStyleColor
              ? 'border-foreground'
              : 'border-transparent hover:border-border',
          )}
        >
          <img src={cw.images[0]} alt="" className="h-full w-full object-cover" />
        </Link>
      ))}
    </div>
  )
}

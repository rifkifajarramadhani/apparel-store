import { cn } from '#/lib/utils'
import type { Colorway } from '#/types/catalog'

export function SwatchList({
  colorways,
  activeStyleColor,
  onSelect,
}: {
  colorways: Colorway[]
  activeStyleColor: string
  onSelect: (colorway: Colorway) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {colorways.map((cw) => (
        <button
          key={cw.id}
          type="button"
          onClick={() => onSelect(cw)}
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
        </button>
      ))}
    </div>
  )
}

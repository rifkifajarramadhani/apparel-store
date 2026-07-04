import { cn } from '#/lib/utils'
import type { Sku } from '#/types/catalog'

// Out-of-stock sizes are struck through and unselectable.
export function SizeGrid({
  skus,
  selected,
  onSelect,
}: {
  skus: Sku[]
  selected: string | null
  onSelect: (skuId: string) => void
}) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {skus.map((sku) => (
        <button
          key={sku.id}
          disabled={!sku.inStock}
          aria-pressed={selected === sku.id}
          onClick={() => onSelect(sku.id)}
          className={cn(
            'border py-2.5 text-sm',
            !sku.inStock && 'cursor-not-allowed text-muted-foreground line-through opacity-50',
            selected === sku.id
              ? 'border-foreground bg-foreground text-background'
              : 'border-border hover:border-foreground',
          )}
        >
          {sku.sizeLabel}
        </button>
      ))}
    </div>
  )
}

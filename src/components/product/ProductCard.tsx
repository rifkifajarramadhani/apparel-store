import { Link } from '@tanstack/react-router'
import { Heart } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Price } from '#/components/ui/price'
import { cn } from '#/lib/utils'
import { useFavorites, useIsFavorite } from '#/stores/favorites'
import type { Product } from '#/types/catalog'

export function ProductCard({ product }: { product: Product }) {
  const styleColor = product.defaultColorwayId
  const isFav = useIsFavorite(styleColor)
  const toggleFav = useFavorites((s) => s.toggle)
  const onSale = product.badges.includes('Sale')
  const soldOut = product.badges.includes('Sold Out')
  const badge = product.badges.find((b) => b !== 'Sale')

  return (
    <div className="group relative">
      <button
        aria-label={isFav ? 'Remove from favourites' : 'Add to favourites'}
        aria-pressed={isFav}
        onClick={() => toggleFav(styleColor)}
        className="absolute right-3 top-3 z-10 rounded-full bg-background/80 p-2 backdrop-blur transition hover:scale-110"
      >
        <Heart className={cn('h-4 w-4', isFav && 'fill-foreground')} />
      </button>

      <Link
        to="/t/$slug/$styleColor"
        params={{ slug: product.slug, styleColor }}
        className="block"
      >
        <div className="relative aspect-square overflow-hidden bg-secondary">
          <img
            src={product.thumbnailUrl}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300 group-hover:opacity-0"
          />
          <img
            src={product.hoverImageUrl}
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          />
          {badge && (
            <div className="absolute left-3 top-3">
              <Badge variant={soldOut ? 'muted' : 'default'}>{badge}</Badge>
            </div>
          )}
        </div>

        <div className="mt-3 space-y-1">
          <div className="flex gap-1.5">
            {product.swatches.slice(0, 5).map((s) => (
              <span
                key={s.styleColor}
                className="h-3 w-3 rounded-full border border-border"
                style={{ backgroundColor: s.hex }}
              />
            ))}
          </div>
          <p className="font-semibold leading-tight">{product.name}</p>
          <p className="text-sm text-muted-foreground">{product.subtitle}</p>
          <p className="text-sm text-muted-foreground">
            {product.colorwayCount} Colour{product.colorwayCount > 1 ? 's' : ''}
          </p>
          <Price
            className="pt-1 text-sm"
            amount={product.minPrice}
            max={product.maxPrice}
            compareAt={onSale ? product.basePrice : undefined}
          />
        </div>
      </Link>
    </div>
  )
}

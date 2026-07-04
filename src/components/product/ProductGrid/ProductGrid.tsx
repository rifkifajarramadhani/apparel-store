import { ProductCard } from '../ProductCard/ProductCard'
import type { Product } from '#/types/catalog'

export function ProductGrid({
  products,
  empty = 'No products match your filters.',
}: {
  products: Product[]
  empty?: string
}) {
  if (products.length === 0)
    return (
      <p className="py-24 text-center text-muted-foreground">{empty}</p>
    )
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}

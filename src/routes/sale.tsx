import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { productsQuery } from '#/lib/query'
import { ProductGrid } from '#/components/product/ProductGrid'

export const Route = createFileRoute('/sale')({
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery()),
  component: Sale,
})

function Sale() {
  const all = useSuspenseQuery(productsQuery()).data.items
  // A product is "on sale" when the seed marked one of its colourways discounted.
  const onSale = all.filter((p) => p.badges.includes('Sale'))

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8">
      <p className="eyebrow text-sale">Sale</p>
      <h1 className="display text-3xl">
        Up to 20% Off{' '}
        <span className="text-muted-foreground">({onSale.length})</span>
      </h1>
      <div className="mt-8">
        <ProductGrid products={onSale} empty="No sale items right now." />
      </div>
    </div>
  )
}

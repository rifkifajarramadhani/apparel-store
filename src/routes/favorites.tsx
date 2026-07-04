import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { productsQuery } from '#/lib/query'
import { ProductGrid } from '#/components/product/ProductGrid/ProductGrid'
import { useFavorites } from '#/stores/favorites'
import { useHydrated } from '#/hooks/use-hydrated'

export const Route = createFileRoute('/favorites')({
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery()),
  component: Favorites,
})

function Favorites() {
  const all = useSuspenseQuery(productsQuery()).data.items
  const ids = useFavorites((s) => s.ids)
  const hydrated = useHydrated()

  // Favourites live in localStorage — only trust them post-hydration.
  const favProducts = hydrated
    ? all.filter((p) => p.swatches.some((sw) => ids.includes(sw.styleColor)))
    : []

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8">
      <h1 className="display mb-6 text-3xl">Favourites</h1>
      {!hydrated ? (
        <p className="py-24 text-center text-muted-foreground">Loading…</p>
      ) : favProducts.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-muted-foreground">You have no favourites yet.</p>
          <Link
            to="/c/$categorySlug"
            params={{ categorySlug: 'women' }}
            className="mt-6 inline-block rounded-full bg-foreground px-8 py-3 font-semibold text-background"
          >
            Explore products
          </Link>
        </div>
      ) : (
        <ProductGrid products={favProducts} />
      )}
    </div>
  )
}

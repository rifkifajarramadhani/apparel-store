import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { productsQuery } from '#/lib/query'
import { ProductCard } from '#/components/product/ProductCard'

export const Route = createFileRoute('/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(productsQuery()),
  component: Home,
})

const TILES = [
  { label: 'Men', slug: 'men' },
  { label: 'Women', slug: 'women' },
  { label: 'Kids', slug: 'kids' },
] as const

function Home() {
  const products = useSuspenseQuery(productsQuery()).data.items
  const justIn = [...products]
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
    .slice(0, 4)

  return (
    <div>
      {/* Hero — the most characteristic thing: a bold statement + entry point. */}
      <section className="border-b border-border bg-foreground text-background">
        <div className="mx-auto flex min-h-[70vh] max-w-[1400px] flex-col justify-end px-4 py-16 md:px-8">
          <p className="eyebrow opacity-70">New Season</p>
          <h1 className="display mt-2 max-w-3xl text-5xl md:text-7xl">
            ENGINEERED FOR EVERY MOVE
          </h1>
          <div className="mt-8 flex gap-3">
            <Link
              to="/c/$categorySlug"
              params={{ categorySlug: 'men' }}
              className="rounded-full bg-background px-8 py-3 font-semibold text-foreground"
            >
              Shop Men
            </Link>
            <Link
              to="/c/$categorySlug"
              params={{ categorySlug: 'women' }}
              className="rounded-full border border-background/40 px-8 py-3 font-semibold"
            >
              Shop Women
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 py-16 md:px-8">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="display text-3xl">Just In</h2>
          <Link
            to="/c/$categorySlug"
            params={{ categorySlug: 'men' }}
            className="text-sm font-semibold hover:opacity-60"
          >
            Shop All
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          {justIn.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-4 pb-16 md:px-8">
        <div className="grid gap-4 sm:grid-cols-3">
          {TILES.map((t) => (
            <Link
              key={t.slug}
              to="/c/$categorySlug"
              params={{ categorySlug: t.slug }}
              className="group relative flex aspect-4/5 items-end overflow-hidden bg-secondary p-6"
            >
              <span className="display text-3xl transition-transform group-hover:translate-x-1">
                {t.label}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}

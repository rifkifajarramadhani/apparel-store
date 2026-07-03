import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { searchQuery } from '#/lib/query'
import { ProductGrid } from '#/components/product/ProductGrid'

const searchSchema = z.object({ q: z.string().catch('').default('') })

export const Route = createFileRoute('/search')({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(searchQuery(deps.q)),
  component: Search,
})

function Search() {
  const { q } = Route.useSearch()
  const { data: results } = useSuspenseQuery(searchQuery(q))

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-10 md:px-8">
      <p className="eyebrow text-muted-foreground">Search results for</p>
      <h1 className="display text-3xl">
        “{q}” <span className="text-muted-foreground">({results.length})</span>
      </h1>
      <div className="mt-8">
        <ProductGrid
          products={results}
          empty={q ? `No results for “${q}”.` : 'Type something to search.'}
        />
      </div>
    </div>
  )
}

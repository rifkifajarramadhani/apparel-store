import { createFileRoute, Link } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { z } from 'zod'
import { categoriesQuery, productsQuery } from '#/lib/query'
import { ProductGrid } from '#/components/product/ProductGrid'
import { cn } from '#/lib/utils'
import type { Product, ProductFilters } from '#/types/catalog'

const PAGE_SIZE = 12

// All optional (via .default) so Links to this route don't need to pass filters;
// .catch keeps a hand-edited/garbage URL from throwing.
const searchSchema = z.object({
  color: z.array(z.string()).catch([]).default([]),
  size: z.array(z.string()).catch([]).default([]),
  collection: z.array(z.string()).catch([]).default([]),
  sort: z.enum(['newest', 'price-asc', 'price-desc']).catch('newest').default('newest'),
  page: z.coerce.number().int().min(1).catch(1).default(1),
})
type PlpSearch = z.infer<typeof searchSchema>

// Colour-family → representative swatch hex, for the filter dots.
const FAMILY_HEX: Record<string, string> = {
  Black: '#111111', White: '#f5f5f5', Grey: '#9ca3af', Blue: '#2563eb',
  Red: '#dc2626', Green: '#16a34a', Neutral: '#d6c7a1', Pink: '#ec4899',
  Orange: '#ea580c', Purple: '#7c3aed',
}
const titleize = (s: string) =>
  s.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())

export const Route = createFileRoute('/c/$categorySlug')({
  validateSearch: searchSchema,
  loader: async ({ context, params }) => {
    const cats = await context.queryClient.ensureQueryData(categoriesQuery())
    const cat = cats.find((c) => c.slug === params.categorySlug)
    const filter: ProductFilters =
      cat && cat.level === 0
        ? { gender: cat.gender }
        : { categorySlug: params.categorySlug }
    await context.queryClient.ensureQueryData(productsQuery(filter))
    return { filter, categoryName: cat?.name ?? titleize(params.categorySlug) }
  },
  head: ({ loaderData }) => ({
    meta: loaderData ? [{ title: `${loaderData.categoryName} — AXIS` }] : [],
  }),
  component: Plp,
})

function facet(products: Product[], s: PlpSearch): Product[] {
  let out = products
  if (s.color.length)
    out = out.filter((p) => p.colorFamilies.some((f) => s.color.includes(f)))
  if (s.size.length)
    out = out.filter((p) => p.sizes.some((sz) => s.size.includes(sz)))
  if (s.collection.length)
    out = out.filter((p) => p.collectionIds.some((c) => s.collection.includes(c)))
  const sorted = [...out]
  if (s.sort === 'price-asc') sorted.sort((a, b) => a.minPrice - b.minPrice)
  else if (s.sort === 'price-desc') sorted.sort((a, b) => b.maxPrice - a.maxPrice)
  else sorted.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
  return sorted
}

function Plp() {
  const { filter, categoryName } = Route.useLoaderData()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data } = useSuspenseQuery(productsQuery(filter))
  const all = data.items

  const filtered = useMemo(() => facet(all, search), [all, search])
  const pageItems = filtered.slice(
    (search.page - 1) * PAGE_SIZE,
    search.page * PAGE_SIZE,
  )
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))

  // Facet options derived from the category set.
  const colorOpts = [...new Set(all.flatMap((p) => p.colorFamilies))].sort()
  const sizeOpts = [...new Set(all.flatMap((p) => p.sizes))]
  const collectionOpts = [...new Set(all.flatMap((p) => p.collectionIds))].sort()

  const toggle = (key: 'color' | 'size' | 'collection', v: string) =>
    navigate({
      search: (prev) => {
        const cur = prev[key]
        const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]
        return { ...prev, [key]: next, page: 1 }
      },
    })

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-8">
      <nav className="text-xs text-muted-foreground">
        <Link to="/">Home</Link> / <span>{categoryName}</span>
      </nav>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <h1 className="display text-3xl">
          {categoryName}{' '}
          <span className="text-muted-foreground">({filtered.length})</span>
        </h1>
        <label className="flex items-center gap-2 text-sm">
          Sort By
          <select
            value={search.sort}
            onChange={(e) =>
              navigate({
                search: (p) => ({
                  ...p,
                  sort: e.target.value as PlpSearch['sort'],
                  page: 1,
                }),
              })
            }
            className="border border-border bg-background px-2 py-1"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: Low–High</option>
            <option value="price-desc">Price: High–Low</option>
          </select>
        </label>
      </div>

      <div className="mt-6 flex gap-8">
        <aside className="hidden w-56 shrink-0 md:block">
          <FacetGroup title="Colour">
            {colorOpts.map((c) => (
              <FacetRow
                key={c}
                checked={search.color.includes(c)}
                onChange={() => toggle('color', c)}
              >
                <span
                  className="h-4 w-4 rounded-full border border-border"
                  style={{ backgroundColor: FAMILY_HEX[c] ?? '#ccc' }}
                />
                {c}
              </FacetRow>
            ))}
          </FacetGroup>
          <FacetGroup title="Size">
            <div className="flex flex-wrap gap-2">
              {sizeOpts.map((sz) => (
                <button
                  key={sz}
                  aria-pressed={search.size.includes(sz)}
                  onClick={() => toggle('size', sz)}
                  className={cn(
                    'min-w-10 border border-border px-2 py-1 text-sm',
                    search.size.includes(sz) &&
                      'border-foreground bg-foreground text-background',
                  )}
                >
                  {sz}
                </button>
              ))}
            </div>
          </FacetGroup>
          {collectionOpts.length > 0 && (
            <FacetGroup title="Collection">
              {collectionOpts.map((c) => (
                <FacetRow
                  key={c}
                  checked={search.collection.includes(c)}
                  onChange={() => toggle('collection', c)}
                >
                  {titleize(c)}
                </FacetRow>
              ))}
            </FacetGroup>
          )}
        </aside>

        <div className="flex-1">
          <ProductGrid products={pageItems} />
          {pages > 1 && (
            <div className="mt-10 flex justify-center gap-2">
              {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => navigate({ search: (p) => ({ ...p, page: n }) })}
                  className={cn(
                    'h-9 w-9 border border-border text-sm',
                    n === search.page &&
                      'border-foreground bg-foreground text-background',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FacetGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="border-b border-border py-4">
      <p className="eyebrow mb-3">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function FacetRow({
  checked,
  onChange,
  children,
}: {
  checked: boolean
  onChange: () => void
  children: React.ReactNode
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" checked={checked} onChange={onChange} />
      {children}
    </label>
  )
}

import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Heart } from 'lucide-react'
import { colorwaysQuery, productBySlugQuery, productsQuery } from '#/lib/query'
import { Gallery } from '#/components/product/Gallery/Gallery'
import { SwatchList } from '#/components/product/SwatchList/SwatchList'
import { SizeGrid } from '#/components/product/SizeGrid/SizeGrid'
import { ProductGrid } from '#/components/product/ProductGrid/ProductGrid'
import { Price } from '#/components/ui/price'
import { cn } from '#/lib/utils'
import { buildColourwayGallery } from '#/lib/pdp-gallery'
import { useCart } from '#/stores/cart'
import { useFavorites, useIsFavorite } from '#/stores/favorites'

export const Route = createFileRoute('/t/$slug')({
  loader: async ({ context, params }) => {
    const product = await context.queryClient.ensureQueryData(
      productBySlugQuery(params.slug),
    )
    if (!product) throw notFound()
    await Promise.all([
      context.queryClient.ensureQueryData(colorwaysQuery(product.id)),
      context.queryClient.ensureQueryData(
        productsQuery({ gender: product.gender }),
      ),
    ])
    return {
      productId: product.id,
      title: product.name,
      description: product.subtitle,
    }
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — AXIS` },
          { name: 'description', content: loaderData.description },
        ]
      : [],
  }),
  component: Pdp,
})

function Pdp() {
  const { slug } = Route.useParams()
  const product = useSuspenseQuery(productBySlugQuery(slug)).data!
  const colorways = useSuspenseQuery(colorwaysQuery(product.id)).data
  const related = useSuspenseQuery(productsQuery({ gender: product.gender }))
    .data.items.filter((p) => p.id !== product.id)
    .slice(0, 4)

  const [active, setActive] = useState(
    () => colorways.find((cw) => cw.isDefault) ?? colorways[0],
  )
  const galleryImages = useMemo(
    () => buildColourwayGallery(colorways),
    [colorways],
  )
  const selectStyleColor = (styleColor: string) => {
    const colorway = colorways.find((item) => item.styleColor === styleColor)
    if (colorway) setActive(colorway)
  }
  const skus = active.skus ?? []

  // Show the full, backend-sorted size range for every colourway; sizes the
  // active colourway doesn't carry render as disabled placeholders instead
  // of disappearing from the grid.
  const sizeLabels = new Map(
    colorways.flatMap((cw) => cw.skus ?? []).map((s) => [s.size, s.sizeLabel]),
  )
  const sizes = product.sizes.map(
    (code) =>
      skus.find((s) => s.size === code) ?? {
        id: `oos-${active.id}-${code}`,
        code: '',
        colorwayId: active.styleColor,
        productId: product.id,
        size: code,
        sizeLabel: sizeLabels.get(code) ?? code,
        sizeScale: product.sizeScale,
        inStock: false,
        stockQty: 0,
        price: active.price,
      },
  )

  const [selected, setSelected] = useState<string | null>(null)
  useEffect(() => setSelected(null), [active.id])

  const addToCart = useCart((s) => s.add)
  const isFav = useIsFavorite(active.styleColor)
  const toggleFav = useFavorites((s) => s.toggle)

  const add = () => {
    const sku = skus.find((s) => s.id === selected)
    if (!sku) return
    addToCart({
      skuId: sku.id,
      productId: product.id,
      styleColor: active.styleColor,
      slug: product.slug,
      size: sku.sizeLabel,
      name: active.name,
      price: sku.price,
      image: active.images[0],
    })
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-6 md:px-8">
      <nav className="mb-4 text-xs text-muted-foreground">
        <Link to="/">Home</Link> /{' '}
        <Link
          to="/c/$categorySlug"
          params={{ categorySlug: product.categorySlug }}
        >
          {product.type}
        </Link>{' '}
        / <span>{product.name}</span>
      </nav>

      <div className="grid items-start gap-8 md:grid-cols-2">
        <Gallery
          images={galleryImages}
          alt={product.name}
          activeStyleColor={active.styleColor}
          onSelectStyleColor={selectStyleColor}
        />

        <div className="md:sticky md:top-20 md:self-start">
          <h1 className="display text-3xl">{product.name}</h1>
          <p className="mt-1 text-muted-foreground">{product.subtitle}</p>
          <Price
            className="mt-4 text-lg"
            amount={active.price}
            compareAt={active.onSale ? product.basePrice : undefined}
          />

          <div className="mt-6">
            <p className="eyebrow mb-2">Colour — {active.name}</p>
            <SwatchList
              colorways={colorways}
              activeStyleColor={active.styleColor}
              onSelect={setActive}
            />
          </div>

          <div className="mt-6">
            <p className="eyebrow mb-2">Select Size</p>
            <SizeGrid skus={sizes} selected={selected} onSelect={setSelected} />
          </div>

          <div className="mt-6 space-y-3">
            <button
              onClick={add}
              disabled={!selected}
              className={cn(
                'w-full rounded-full py-4 font-semibold',
                selected
                  ? 'bg-foreground text-background hover:opacity-90'
                  : 'cursor-not-allowed bg-secondary text-muted-foreground',
              )}
            >
              {selected ? 'Add to Bag' : 'Select a Size'}
            </button>
            <button
              onClick={() => toggleFav(active.styleColor)}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-border py-4 font-semibold hover:border-foreground"
            >
              {isFav ? 'Favourited' : 'Favourite'}
              <Heart className={cn('h-4 w-4', isFav && 'fill-foreground')} />
            </button>
          </div>

          <details className="mt-8 border-t border-border py-4" open>
            <summary className="cursor-pointer font-semibold">
              Product Details
            </summary>
            <p className="mt-2 text-sm text-muted-foreground">
              {product.description}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Style: {active.name}
            </p>
          </details>
          <details className="border-t border-border py-4">
            <summary className="cursor-pointer font-semibold">
              Shipping & Returns
            </summary>
            <p className="mt-2 text-sm text-muted-foreground">
              Free standard shipping and 30-day returns on all orders.
            </p>
          </details>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="display mb-6 text-2xl">You Might Also Like</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  )
}

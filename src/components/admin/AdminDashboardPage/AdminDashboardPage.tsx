import { Link } from '@tanstack/react-router'
import { Plus } from 'lucide-react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { AdminPageHeader } from '#/components/admin/AdminPageHeader/AdminPageHeader'
import { ProductTable } from '#/components/admin/ProductTable/ProductTable'
import { Button } from '#/components/ui/button'
import { categoriesQuery, productsQuery, skusQuery } from '#/lib/query'
import { isLowStock } from '#/lib/catalog-derived'

export function AdminDashboardPage() {
  const products = useSuspenseQuery(productsQuery()).data.items
  const categories = useSuspenseQuery(categoriesQuery()).data
  const skus = useSuspenseQuery(skusQuery()).data
  const lowStock = skus.filter((sku) => isLowStock(sku.stockQty, sku.inStock))
  const productNames = new Map(
    products.map((product) => [product.id, product.name]),
  )
  const colorwayCount = products.reduce(
    (total, product) => total + product.colorwayCount,
    0,
  )

  return (
    <div>
      <AdminPageHeader
        title="Catalog overview"
        description="Monitor products, variants, and stock across the AXIS storefront."
        actions={
          <Button asChild>
            <Link to="/admin/products/new" search={{ tab: 'details' }}>
              <Plus data-icon="inline-start" /> Add product
            </Link>
          </Button>
        }
      />
      <div className="grid xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 p-4 md:p-7">
          <dl className="mb-7 grid grid-cols-2 border-y md:grid-cols-4">
            {[
              ['Products', products.length],
              ['Colorways', colorwayCount],
              ['SKUs', skus.length],
              ['Low stock', lowStock.length],
            ].map(([label, value], index) => (
              <div
                key={String(label)}
                className={`py-5 text-center ${index ? 'border-l' : ''}`}
              >
                <dd
                  className={
                    label === 'Low stock'
                      ? 'text-2xl text-destructive'
                      : 'text-2xl'
                  }
                >
                  {value}
                </dd>
                <dt className="mt-1 text-xs text-muted-foreground">{label}</dt>
              </div>
            ))}
          </dl>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Products</h2>
            <Button variant="outline" asChild>
              <Link
                to="/admin/products"
                search={{ q: '', category: 'all', sort: 'newest', page: 1 }}
              >
                View all
              </Link>
            </Button>
          </div>
          <ProductTable
            products={products.slice(0, 8)}
            categories={categories}
            skus={skus}
          />
        </div>
        <aside className="border-t p-5 xl:border-t-0 xl:border-l">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Low stock</h2>
              <p className="text-xs text-destructive">
                {lowStock.length} items
              </p>
            </div>
            <Link
              to="/admin/inventory"
              search={{ q: '', stock: 'low', page: 1 }}
              className="text-xs underline"
            >
              View all
            </Link>
          </div>
          <div className="flex flex-col divide-y">
            {lowStock.slice(0, 8).map((sku) => (
              <Link
                key={sku.id}
                to="/admin/products/$productId"
                params={{ productId: sku.productId }}
                search={{ tab: 'inventory', colorwayId: sku.colorwayId }}
                className="flex items-center justify-between gap-4 py-4 text-sm hover:bg-muted"
              >
                <span>
                  <strong className="block line-clamp-1">
                    {productNames.get(sku.productId)}
                  </strong>
                  <span className="text-xs text-muted-foreground">
                    {sku.sizeLabel} · {sku.id}
                  </span>
                </span>
                <span className="text-destructive">{sku.stockQty}</span>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </div>
  )
}

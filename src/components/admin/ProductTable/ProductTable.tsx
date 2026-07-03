import { Link } from '@tanstack/react-router'
import { MoreHorizontal } from 'lucide-react'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { formatIDR } from '#/lib/money'
import type { Category, Product, Sku } from '#/types/catalog'

export function ProductTable({
  products,
  categories,
  skus = [],
}: {
  products: Product[]
  categories: Category[]
  skus?: Sku[]
}) {
  const categoryNames = new Map(
    categories.map((category) => [category.id, category.name]),
  )
  const stockByProduct = new Map<string, number>()
  for (const sku of skus)
    stockByProduct.set(
      sku.productId,
      (stockByProduct.get(sku.productId) ?? 0) + sku.stockQty,
    )

  return (
    <div className="overflow-x-auto border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-72">Product</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Colorways</TableHead>
            <TableHead>Status</TableHead>
            {skus.length ? <TableHead>Stock</TableHead> : null}
            <TableHead className="w-14">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <Link
                  to="/admin/products/$productId"
                  params={{ productId: product.id }}
                  search={{ tab: 'details' }}
                  className="flex items-center gap-3 font-semibold hover:underline"
                >
                  <img
                    src={product.thumbnailUrl}
                    alt=""
                    className="size-12 bg-muted object-cover"
                  />
                  <span className="max-w-52 leading-tight">{product.name}</span>
                </Link>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {product.id}
              </TableCell>
              <TableCell>
                {categoryNames.get(product.categoryId) ?? product.categoryId}
              </TableCell>
              <TableCell>{formatIDR(product.minPrice)}</TableCell>
              <TableCell>
                <div
                  className="flex items-center gap-1.5"
                  aria-label={`${product.colorwayCount} colorways`}
                >
                  {product.swatches.slice(0, 5).map((swatch) => (
                    <span
                      key={swatch.styleColor}
                      className="size-3 rounded-full border"
                      style={{ background: swatch.hex }}
                    />
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <Badge>Published</Badge>
              </TableCell>
              {skus.length ? (
                <TableCell>{stockByProduct.get(product.id) ?? 0}</TableCell>
              ) : null}
              <TableCell>
                <Button variant="ghost" size="icon" asChild>
                  <Link
                    to="/admin/products/$productId"
                    params={{ productId: product.id }}
                    search={{ tab: 'details' }}
                    aria-label={`Edit ${product.name}`}
                  >
                    <MoreHorizontal />
                  </Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {products.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="h-32 text-center text-muted-foreground"
              >
                No products match these filters.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  )
}

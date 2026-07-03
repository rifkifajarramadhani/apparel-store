import { Link, useNavigate } from '@tanstack/react-router'
import { Search } from 'lucide-react'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { AdminPageHeader } from '#/components/admin/AdminPageHeader/AdminPageHeader'
import { Badge } from '#/components/ui/badge'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Switch } from '#/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import { updateSku } from '#/lib/api'
import { productsQuery, skusQuery } from '#/lib/query'
import { Route } from '#/routes/admin.inventory'
import type { Sku } from '#/types/catalog'

const PAGE_SIZE = 25

export function AdminInventoryPage() {
  const skus = useSuspenseQuery(skusQuery()).data
  const products = useSuspenseQuery(productsQuery()).data.items
  const productNames = new Map(
    products.map((product) => [product.id, product.name]),
  )
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/admin/inventory' })
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: updateSku,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['skus'] })
      toast.success('Inventory updated')
    },
    onError: (error) => toast.error(error.message),
  })
  const filtered = skus.filter((sku) => {
    const matchesText =
      !search.q ||
      `${sku.id} ${productNames.get(sku.productId)}`
        .toLowerCase()
        .includes(search.q.toLowerCase())
    const matchesStock =
      search.stock === 'all' ||
      (search.stock === 'out'
        ? !sku.inStock || sku.stockQty === 0
        : sku.inStock && sku.stockQty <= 5)
    return matchesText && matchesStock
  })
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(search.page, pages)
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const updateSearch = (next: Partial<typeof search>) =>
    navigate({ search: (previous) => ({ ...previous, ...next }) })
  const save = (sku: Sku, next: Partial<Sku>) =>
    mutation.mutate({ ...sku, ...next })

  return (
    <div>
      <AdminPageHeader
        title="Inventory"
        description={`${filtered.length} stock keeping units`}
      />
      <div className="p-4 md:p-7">
        <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search product or SKU…"
              value={search.q}
              onChange={(event) =>
                updateSearch({ q: event.target.value, page: 1 })
              }
            />
            <span className="sr-only">Search inventory</span>
          </label>
          <Select
            value={search.stock}
            onValueChange={(stock: typeof search.stock) =>
              updateSearch({ stock, page: 1 })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All stock</SelectItem>
                <SelectItem value="low">Low stock</SelectItem>
                <SelectItem value="out">Out of stock</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>In stock</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((sku) => (
                <TableRow key={sku.id}>
                  <TableCell>
                    <Link
                      to="/admin/products/$productId"
                      params={{ productId: sku.productId }}
                      search={{ tab: 'inventory', colorwayId: sku.colorwayId }}
                      className="font-semibold hover:underline"
                    >
                      {productNames.get(sku.productId)}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {sku.id}
                  </TableCell>
                  <TableCell>{sku.sizeLabel}</TableCell>
                  <TableCell>
                    <Input
                      className="w-24"
                      type="number"
                      min="0"
                      defaultValue={sku.stockQty}
                      onBlur={(event) => {
                        const stockQty = event.target.valueAsNumber || 0
                        if (stockQty !== sku.stockQty)
                          save(sku, { stockQty, inStock: stockQty > 0 })
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={sku.inStock}
                      onCheckedChange={(inStock) => save(sku, { inStock })}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-32"
                      type="number"
                      min="0"
                      defaultValue={sku.price}
                      onBlur={(event) => {
                        const price = event.target.valueAsNumber || 0
                        if (price !== sku.price) save(sku, { price })
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {!sku.inStock || sku.stockQty === 0 ? (
                      <Badge variant="sale">Out</Badge>
                    ) : sku.stockQty <= 5 ? (
                      <Badge variant="sale">Low</Badge>
                    ) : (
                      <Badge>Available</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => updateSearch({ page: page - 1 })}
            >
              Previous
            </button>
            <button
              disabled={page >= pages}
              onClick={() => updateSearch({ page: page + 1 })}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

import { Link, useNavigate } from '@tanstack/react-router'
import { Plus, Search } from 'lucide-react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { AdminPageHeader } from '#/components/admin/AdminPageHeader/AdminPageHeader'
import { ProductTable } from '#/components/admin/ProductTable/ProductTable'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { categoriesQuery, productsQuery } from '#/lib/query'
import { Route } from '#/routes/admin.products.index'

const PAGE_SIZE = 10

export function AdminProductsPage() {
  const products = useSuspenseQuery(productsQuery()).data.items
  const categories = useSuspenseQuery(categoriesQuery()).data
  const search = Route.useSearch()
  const navigate = useNavigate({ from: '/admin/products/' })

  const filtered = products
    .filter(
      (product) =>
        !search.q ||
        `${product.name} ${product.id}`
          .toLowerCase()
          .includes(search.q.toLowerCase()),
    )
    .filter(
      (product) =>
        search.category === 'all' || product.categoryId === search.category,
    )
    .sort((a, b) => {
      if (search.sort === 'name') return a.name.localeCompare(b.name)
      if (search.sort === 'price-asc') return a.minPrice - b.minPrice
      if (search.sort === 'price-desc') return b.minPrice - a.minPrice
      return b.publishedAt.localeCompare(a.publishedAt)
    })
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const page = Math.min(search.page, pages)
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const updateSearch = (next: Partial<typeof search>) =>
    navigate({ search: (previous) => ({ ...previous, ...next }) })

  return (
    <div>
      <AdminPageHeader
        title="Products"
        description={`${filtered.length} catalog products`}
        actions={
          <Button asChild>
            <Link to="/admin/products/new" search={{ tab: 'details' }}>
              <Plus data-icon="inline-start" /> Add product
            </Link>
          </Button>
        }
      />
      <div className="p-4 md:p-7">
        <div className="mb-4 grid gap-3 md:grid-cols-[minmax(260px,1fr)_220px_180px]">
          <label className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              value={search.q}
              onChange={(event) =>
                updateSearch({ q: event.target.value, page: 1 })
              }
              placeholder="Search products…"
            />
            <span className="sr-only">Search products</span>
          </label>
          <Select
            value={search.category}
            onValueChange={(category) => updateSearch({ category, page: 1 })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Select
            value={search.sort}
            onValueChange={(sort: typeof search.sort) => updateSearch({ sort })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price-asc">Price: low</SelectItem>
                <SelectItem value="price-desc">Price: high</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <ProductTable products={visible} categories={categories} />
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page <= 1}
              onClick={() => updateSearch({ page: page - 1 })}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={page >= pages}
              onClick={() => updateSearch({ page: page + 1 })}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Query keys + option factories. Loaders call ensureQueryData; components useQuery.
import { queryOptions } from '@tanstack/react-query'
import {
  getCategoryTree,
  getColorways,
  getProductBySlug,
  getProducts,
  search,
} from '#/lib/api'
import type { ProductFilters } from '#/types/catalog'

export const queryKeys = {
  products: (f: ProductFilters) => ['products', f] as const,
  productBySlug: (slug: string) => ['product', 'slug', slug] as const,
  colorways: (productId: string) => ['colorways', productId] as const,
  categories: ['categories'] as const,
  search: (q: string) => ['search', q] as const,
}

export const productsQuery = (f: ProductFilters = {}) =>
  queryOptions({ queryKey: queryKeys.products(f), queryFn: () => getProducts(f) })

export const productBySlugQuery = (slug: string) =>
  queryOptions({
    queryKey: queryKeys.productBySlug(slug),
    queryFn: () => getProductBySlug(slug),
  })

export const colorwaysQuery = (productId: string) =>
  queryOptions({
    queryKey: queryKeys.colorways(productId),
    queryFn: () => getColorways(productId),
  })

export const categoriesQuery = () =>
  queryOptions({ queryKey: queryKeys.categories, queryFn: getCategoryTree })

export const searchQuery = (q: string) =>
  queryOptions({ queryKey: queryKeys.search(q), queryFn: () => search(q) })

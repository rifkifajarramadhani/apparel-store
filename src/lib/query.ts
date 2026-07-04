// Query keys + option factories. Loaders call ensureQueryData; components useQuery.
import { queryOptions } from '@tanstack/react-query'
import {
  getCategoryTree,
  getColorways,
  getCollections,
  getOrders,
  getProductAggregate,
  getProductBySlug,
  getProducts,
  getSizeScales,
  getSkus,
  search,
} from '#/lib/api'
import type { ProductFilters } from '#/types/catalog'

export const queryKeys = {
  products: (f: ProductFilters) => ['products', f] as const,
  productBySlug: (slug: string) => ['product', 'slug', slug] as const,
  colorways: (productId: string) => ['colorways', productId] as const,
  categories: ['categories'] as const,
  collections: ['collections'] as const,
  sizeScales: ['size-scales'] as const,
  skus: (filters: { productId?: string; colorwayId?: string } = {}) =>
    ['skus', filters] as const,
  productAggregate: (id: string) => ['admin', 'product', id] as const,
  search: (q: string) => ['search', q] as const,
  orders: ['orders'] as const,
}

export const productsQuery = (f: ProductFilters = {}) =>
  queryOptions({
    queryKey: queryKeys.products(f),
    queryFn: () => getProducts(f),
  })

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

export const collectionsQuery = () =>
  queryOptions({ queryKey: queryKeys.collections, queryFn: getCollections })

export const sizeScalesQuery = () =>
  queryOptions({ queryKey: queryKeys.sizeScales, queryFn: getSizeScales })

export const skusQuery = (
  filters: { productId?: string; colorwayId?: string } = {},
) =>
  queryOptions({
    queryKey: queryKeys.skus(filters),
    queryFn: () => getSkus(filters),
  })

export const productAggregateQuery = (id: string) =>
  queryOptions({
    queryKey: queryKeys.productAggregate(id),
    queryFn: () => getProductAggregate(id),
  })

export const searchQuery = (q: string) =>
  queryOptions({ queryKey: queryKeys.search(q), queryFn: () => search(q) })

export const ordersQuery = () =>
  queryOptions({ queryKey: queryKeys.orders, queryFn: getOrders })

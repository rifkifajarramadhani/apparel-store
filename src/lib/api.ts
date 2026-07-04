// The ONLY module that knows the API URL and backend contract. Talks to the
// Go backend (apparel-store-be): JWT bearer auth with refresh-on-401, catalog
// reads with json-server-style query params, and user-scoped orders.
import { useAuth } from '#/stores/auth'
import type { Session, User } from '#/types/auth'
import type {
  Category,
  Colorway,
  Collection,
  Paged,
  Product,
  ProductFilters,
  SizeScale,
  Sku,
} from '#/types/catalog'
import type { Order, OrderLineInput } from '#/types/order'
import type {
  CategoryInput,
  CollectionInput,
  ProductAggregateInput,
  SkuInput,
} from '#/services/schemas/admin'
import {
  BrandSchema,
  CategoryRecordSchema,
  ColourwaySchema,
  ProductRecordSchema,
  SizeRecordSchema,
  SKUSchema,
  cursorPageSchema,
} from '#/services/schemas/catalog'
import type {
  Brand,
  CategoryRecord,
  Colourway,
  ProductRecord,
  SizeRecord,
  SKU,
} from '#/services/schemas/catalog'

const BASE = import.meta.env.SSR
  ? (process.env.SERVER_API_URL ?? 'http://localhost:8080/api')
  : (import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api')

function authHeader(token: string | null): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Raw auth-token response from /auth/login and /auth/refresh.
interface TokenResponse {
  access_token: string
  refresh_token: string
}

// Backend GET /auth/me shape (snake_case) → mapped to our User.
interface MeResponse {
  id: number
  username: string
  email: string
  role: 'user' | 'admin'
  email_verified: boolean
  pending_email: string
}

function toUser(me: MeResponse): User {
  return {
    id: me.id,
    email: me.email,
    username: me.username || undefined,
    role: me.role,
    emailVerified: me.email_verified,
    pendingEmail: me.pending_email || undefined,
  }
}

async function errorMessage(res: Response): Promise<string> {
  const data: unknown = await res.json().catch(() => null)
  if (
    typeof data === 'object' &&
    data !== null &&
    'error' in data &&
    typeof data.error === 'string'
  ) {
    return data.error
  }
  return `API ${res.status}`
}

// Attempt a one-time access-token refresh using the stored refresh token.
// Returns the new access token, or null if refresh is impossible/failed.
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = useAuth.getState().refreshToken
  if (!refreshToken) return null
  const res = await fetch(`${BASE}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  })
  if (!res.ok) {
    useAuth.getState().logout()
    return null
  }
  const tokens = (await res.json()) as TokenResponse
  useAuth.setState({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
  })
  return tokens.access_token
}

// fetch with the bearer token; on a 401 it refreshes once and retries.
async function authedFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const send = (token: string | null) =>
    fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        ...authHeader(token),
        ...(init.body && !(init.body instanceof FormData)
          ? { 'Content-Type': 'application/json' }
          : {}),
        ...init.headers,
      },
    })

  let res = await send(useAuth.getState().accessToken)
  if (res.status === 401 && useAuth.getState().refreshToken) {
    const next = await refreshAccessToken()
    if (next) res = await send(next)
  }
  return res
}

async function get<T>(path: string): Promise<{ data: T; total: number }> {
  const res = await authedFetch(path)
  if (!res.ok) throw new Error(`API ${res.status} on ${path}`)
  const total = Number(res.headers.get('X-Total-Count') ?? 0)
  return { data: (await res.json()) as T, total }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await authedFetch(path, init)
  if (!res.ok) throw new Error(await errorMessage(res))
  return (await res.json().catch(() => null)) as T
}

// ── auth ────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string): Promise<Session> {
  const res = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  const tokens = (await res.json()) as TokenResponse
  const meRes = await fetch(`${BASE}/auth/me`, {
    headers: authHeader(tokens.access_token),
  })
  if (!meRes.ok) throw new Error('Failed to load account')
  const user = toUser((await meRes.json()) as MeResponse)
  return {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    user,
  }
}

// Registration does not sign the user in: the backend requires email
// verification first. Returns the message the caller should surface.
export async function register(input: {
  email: string
  password: string
  username: string
}): Promise<{ message: string }> {
  const res = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(await errorMessage(res))
  const data = (await res.json()) as { message?: string }
  return { message: data.message ?? 'Check your email to verify your account.' }
}

// ── catalog reads ─────────────────────────────────────────────────────────────

function toQuery(f: ProductFilters): string {
  const p = new URLSearchParams()
  if (f.categorySlug) p.set('category', f.categorySlug)
  if (f.q) p.set('q', f.q)
  if (f.limit) p.set('limit', String(f.limit))
  const s = p.toString()
  return s ? `?${s}` : ''
}

function colourwayBusinessId(slug: string) {
  return slug.toUpperCase()
}

function toProduct(record: ProductRecord): Product {
  const primary = record.categories.at(0)
  const images = record.assets.filter((asset) => asset.mediaType === 'image')
  const minPrice = record.minPrice?.amount ?? 0
  const maxPrice = record.maxPrice?.amount ?? minPrice
  const defaultColourway = record.colourways.at(0)
  return {
    id: record.styleCode,
    publicId: record.id,
    slug: record.slug,
    name: record.name,
    subtitle: record.subtitle,
    brand: record.brand.name,
    gender:
      record.gender === 'women' || record.gender === 'kids'
        ? record.gender
        : 'men',
    type: record.productType ?? '',
    categoryId: primary?.slug ?? '',
    categorySlug: primary?.slug ?? '',
    collectionIds: [],
    sizeScale: record.sizes.at(0)?.scaleCode ?? '',
    basePrice: minPrice,
    minPrice,
    maxPrice,
    badges: [],
    colorwayCount: record.colourways.length,
    colorFamilies: [
      ...new Set(
        record.colourways.flatMap((item) =>
          item.colourFamily ? [item.colourFamily] : [],
        ),
      ),
    ],
    swatches: record.colourways.map((item) => ({
      styleColor: colourwayBusinessId(item.slug),
      hex: item.hexCode,
    })),
    thumbnailUrl: images.at(0)?.url ?? '',
    hoverImageUrl: images.at(1)?.url ?? images.at(0)?.url ?? '',
    defaultColorwayId: defaultColourway
      ? colourwayBusinessId(defaultColourway.slug)
      : '',
    sizes: record.sizes.map((size) => size.code),
    description: record.description ?? '',
    publishedAt: '',
  }
}

export async function getProducts(
  f: ProductFilters = {},
): Promise<Paged<Product>> {
  const { data } = await get<unknown>(`/products${toQuery(f)}`)
  const page = cursorPageSchema(ProductRecordSchema).parse(data)
  const items = page.items.map(toProduct)
  return { items, total: items.length }
}

export async function getProduct(id: string): Promise<Product> {
  return toProduct(await getProductRecord(id))
}

// Resolve a product by its slug (routes carry the slug, not the style code).
export async function getProductBySlug(
  slug: string,
): Promise<Product | undefined> {
  try {
    return toProduct(await getProductRecord(slug))
  } catch {
    return undefined
  }
}

export async function getColorways(productId: string): Promise<Colorway[]> {
  const [product, skuPage] = await Promise.all([
    getProductRecord(productId),
    getCatalogSKUs({ productId, limit: 100 }),
  ])
  const images = productImages(product)
  return product.colourways.map((colourway, index) => {
    const styleColor = colourwayBusinessId(colourway.slug)
    const colourwaySkus = skuPage.items.filter(
      (sku) => sku.colourway.id === colourway.id,
    )
    return {
      id: styleColor,
      productId: product.styleCode,
      styleColor,
      name: colourway.name,
      colorFamily: colourway.colourFamily ?? '',
      swatchHex: colourway.hexCode,
      price:
        skuPage.items.find((sku) => sku.colourway.id === colourway.id)?.price
          .amount ??
        product.minPrice?.amount ??
        0,
      isDefault: index === 0,
      onSale: false,
      images,
      skus: colourwaySkus.map(toSKU),
    }
  })
}

export async function getCategoryTree(): Promise<Category[]> {
  const records = await getCatalogCategories()
  return records.map((item) => ({
    id: item.slug,
    slug: item.slug,
    name: item.name,
    parentId: item.parentId ?? null,
    gender: '',
    level: item.parentId ? 1 : 0,
  }))
}

export async function getCollections(): Promise<Collection[]> {
  const { data } = await get<Collection[]>('/collections')
  return data
}

export async function getSizeScales(): Promise<SizeScale[]> {
  const sizes = await getSizes()
  const grouped = new Map<string, string[]>()
  for (const size of sizes)
    grouped.set(size.scaleCode, [
      ...(grouped.get(size.scaleCode) ?? []),
      size.code,
    ])
  return [...grouped].map(([id, values]) => ({ id, sizes: values }))
}

export async function getSkus(
  filters: { productId?: string; colorwayId?: string } = {},
): Promise<Sku[]> {
  const page = await getCatalogSKUs({
    productId: filters.productId,
    colourwayId: filters.colorwayId,
    limit: 100,
  })
  return page.items.map(toSKU)
}

function toSKU(sku: SKU): Sku {
  return {
    id: sku.id,
    code: sku.code,
    colorwayId: colourwayBusinessId(sku.colourway.slug),
    productId: sku.productId,
    size: sku.size.code,
    sizeLabel: sku.size.name,
    sizeScale: sku.size.scaleCode,
    inStock: sku.available > 0,
    stockQty: sku.onHand,
    price: sku.price.amount,
  }
}

// Images are stored product-level; all colourways share them.
// Backend already orders record.assets by role, sortOrder.
function productImages(record: ProductRecord): string[] {
  return record.assets
    .filter((asset) => asset.mediaType === 'image')
    .map((asset) => asset.url)
}

export async function search(q: string): Promise<Product[]> {
  return (await getProducts({ q })).items
}

// ── normalized catalog ───────────────────────────────────────────────────

interface CatalogFilters {
  category?: string
  brand?: string
  q?: string
  currency?: string
  cursor?: string
  limit?: number
}

function catalogQuery(filters: CatalogFilters): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, String(value))
  }
  return params.size ? `?${params}` : ''
}

export async function getCatalogProducts(filters: CatalogFilters = {}) {
  const { data } = await get<unknown>(`/products${catalogQuery(filters)}`)
  return cursorPageSchema(ProductRecordSchema).parse(data)
}

export async function getProductRecord(
  id: string,
  currency = 'IDR',
): Promise<ProductRecord> {
  const { data } = await get<unknown>(
    `/products/${encodeURIComponent(id)}?currency=${currency}`,
  )
  return ProductRecordSchema.parse(data)
}

export async function getCatalogSKUs(
  filters: CatalogFilters & { productId?: string; colourwayId?: string } = {},
) {
  const { data } = await get<unknown>(`/skus${catalogQuery(filters)}`)
  return cursorPageSchema(SKUSchema).parse(data)
}

async function getCatalogLookup<T>(
  path: string,
  schema: { parse: (value: unknown) => T },
) {
  const { data } = await get<unknown>(path)
  return schema.parse(data)
}

export const getBrands = (): Promise<Brand[]> =>
  getCatalogLookup('/brands', BrandSchema.array())
export const getCatalogCategories = (): Promise<CategoryRecord[]> =>
  getCatalogLookup('/categories', CategoryRecordSchema.array())
export const getColourways = (): Promise<Colourway[]> =>
  getCatalogLookup('/colourways', ColourwaySchema.array())
export const getSizes = (): Promise<SizeRecord[]> =>
  getCatalogLookup('/sizes', SizeRecordSchema.array())

export const setInventory = (input: {
  skuId: string
  onHand: number
  reserved: number
}): Promise<SKU | null> =>
  request('/inventory', { method: 'PUT', body: JSON.stringify(input) })

// ── admin catalog writes ──────────────────────────────────────────────────────

async function buildProductAggregate(
  productId: string,
): Promise<ProductAggregateInput> {
  const [record, skuPage] = await Promise.all([
    getProductRecord(productId),
    getCatalogSKUs({ productId, limit: 500 }),
  ])
  const styleCode = record.styleCode
  const primary = record.categories.at(0)

  const images = productImages(record)
  const colorways = record.colourways.map((colourway, index) => {
    const styleColor = colourwayBusinessId(colourway.slug)
    const colourwaySkus = skuPage.items.filter(
      (sku) => sku.colourway.id === colourway.id,
    )
    const price =
      colourwaySkus.at(0)?.price.amount ?? record.minPrice?.amount ?? 0
    return {
      id: styleColor,
      productId: styleCode,
      styleColor,
      name: colourway.name,
      colorFamily: colourway.colourFamily ?? '',
      swatchHex: colourway.hexCode,
      price,
      isDefault: index === 0,
      onSale: false,
      images:
        images.length > 0
          ? images
          : ['https://placehold.co/800x800/png?text=No+Image'],
    }
  })

  const skus = skuPage.items.map((sku) => ({
    id: sku.code,
    colorwayId: colourwayBusinessId(sku.colourway.slug),
    productId: styleCode,
    size: sku.size.code,
    sizeLabel: sku.size.name,
    sizeScale: sku.size.scaleCode,
    inStock: sku.available > 0,
    stockQty: sku.onHand,
    price: sku.price.amount,
  }))

  return {
    product: {
      id: styleCode,
      slug: record.slug,
      name: record.name,
      subtitle: record.subtitle,
      brand: record.brand.name,
      gender:
        record.gender === 'women' || record.gender === 'kids'
          ? record.gender
          : 'men',
      type: record.productType ?? 'Apparel',
      categoryId: primary?.slug ?? '',
      categorySlug: primary?.slug ?? '',
      collectionIds: [],
      sizeScale: record.sizes.at(0)?.scaleCode ?? '',
      basePrice: record.minPrice?.amount ?? 0,
      description: record.description ?? 'No description provided.',
      publishedAt: new Date().toISOString().slice(0, 10),
    },
    colorways,
    skus,
  }
}

export const getProductAggregate = (productId: string) =>
  buildProductAggregate(productId)

export const createProductAggregate = (input: ProductAggregateInput) =>
  request<ProductAggregateInput>('/admin/products', {
    method: 'POST',
    body: JSON.stringify(input),
  })

export const updateProductAggregate = (input: ProductAggregateInput) =>
  request<ProductAggregateInput>(
    `/admin/products/${encodeURIComponent(input.product.id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(input),
    },
  )

export interface PendingImageUpload {
  clientId: string
  file: File
}

export interface UploadedImage {
  clientId: string
  key: string
  url: string
}

// Uploads all files selected in the editor as one authenticated backend batch.
// The backend owns the UploadThing token and returns the durable CDN URLs.
export async function uploadProductImages(
  images: PendingImageUpload[],
): Promise<UploadedImage[]> {
  const body = new FormData()
  body.append(
    'metadata',
    JSON.stringify(images.map(({ clientId }) => ({ clientId }))),
  )
  for (const { file } of images) body.append('files', file)

  const result = await request<{ files: UploadedImage[] }>(
    '/admin/products/assets/batch',
    { method: 'POST', body },
  )
  return result.files
}

export const deleteProduct = (productId: string) =>
  request<{ success: boolean }>(
    `/admin/products/${encodeURIComponent(productId)}`,
    { method: 'DELETE' },
  )

export const updateSku = (sku: SkuInput) =>
  request<Sku>(`/skus/${encodeURIComponent(sku.id)}`, {
    method: 'PUT',
    body: JSON.stringify(sku),
  })

export const createCategory = (category: CategoryInput) =>
  request<Category>('/categories', {
    method: 'POST',
    body: JSON.stringify(category),
  })

export const updateCategory = (category: CategoryInput) =>
  request<Category>(`/categories/${encodeURIComponent(category.id)}`, {
    method: 'PUT',
    body: JSON.stringify(category),
  })

export const deleteCategory = (id: string) =>
  request<{ success: boolean }>(`/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })

export const createCollection = (collection: CollectionInput) =>
  request<Collection>('/collections', {
    method: 'POST',
    body: JSON.stringify(collection),
  })

export const updateCollection = (collection: CollectionInput) =>
  request<Collection>(`/collections/${encodeURIComponent(collection.id)}`, {
    method: 'PUT',
    body: JSON.stringify(collection),
  })

export const deleteCollection = (id: string) =>
  request<{ success: boolean }>(`/collections/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })

// ── orders ────────────────────────────────────────────────────────────────────

export const createOrder = (items: OrderLineInput[]) =>
  request<Order>('/orders', {
    method: 'POST',
    body: JSON.stringify({ items }),
  })

export async function getOrders(): Promise<Order[]> {
  const { data } = await get<Order[]>('/orders')
  return data
}

export const getOrder = (id: number) => request<Order>(`/orders/${id}`)

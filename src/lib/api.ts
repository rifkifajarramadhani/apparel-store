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
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
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

const SORT_MAP: Record<string, [string, 'asc' | 'desc']> = {
  newest: ['publishedAt', 'desc'],
  'price-asc': ['minPrice', 'asc'],
  'price-desc': ['minPrice', 'desc'],
}

function toQuery(f: ProductFilters): string {
  const p = new URLSearchParams()
  if (f.categoryId) p.set('categoryId', f.categoryId)
  if (f.categorySlug) p.set('categorySlug', f.categorySlug)
  if (f.gender) p.set('gender', f.gender)
  if (f.minPrice != null) p.set('minPrice_gte', String(f.minPrice))
  if (f.maxPrice != null) p.set('maxPrice_lte', String(f.maxPrice))
  if (f.q) p.set('q', f.q)
  if (f.sort) {
    const [by, order] = SORT_MAP[f.sort]
    p.set('_sort', by)
    p.set('_order', order)
  }
  if (f.page) p.set('_page', String(f.page))
  if (f.limit) p.set('_limit', String(f.limit))
  const s = p.toString()
  return s ? `?${s}` : ''
}

export async function getProducts(
  f: ProductFilters = {},
): Promise<Paged<Product>> {
  const { data, total } = await get<Product[]>(`/products${toQuery(f)}`)
  return { items: data, total: f.limit ? total : data.length }
}

export async function getProduct(id: string): Promise<Product> {
  const { data } = await get<Product>(`/products/${id}`)
  return data
}

// Resolve a product by its slug (routes carry the slug, not the style code).
export async function getProductBySlug(
  slug: string,
): Promise<Product | undefined> {
  const { data } = await get<Product[]>(
    `/products?slug=${encodeURIComponent(slug)}`,
  )
  return data[0]
}

export async function getColorways(productId: string): Promise<Colorway[]> {
  const { data } = await get<Colorway[]>(
    `/colorways?productId=${productId}&_embed=skus`,
  )
  return data
}

export async function getCategoryTree(): Promise<Category[]> {
  const { data } = await get<Category[]>('/categories')
  return data
}

export async function getCollections(): Promise<Collection[]> {
  const { data } = await get<Collection[]>('/collections')
  return data
}

export async function getSizeScales(): Promise<SizeScale[]> {
  const { data } = await get<SizeScale[]>('/sizeScales')
  return data
}

export async function getSkus(
  filters: { productId?: string; colorwayId?: string } = {},
): Promise<Sku[]> {
  const params = new URLSearchParams()
  if (filters.productId) params.set('productId', filters.productId)
  if (filters.colorwayId) params.set('colorwayId', filters.colorwayId)
  const suffix = params.size ? `?${params}` : ''
  const { data } = await get<Sku[]>(`/skus${suffix}`)
  return data
}

export async function search(q: string): Promise<Product[]> {
  const { data } = await get<Product[]>(`/products?q=${encodeURIComponent(q)}`)
  return data
}

// ── admin catalog writes ──────────────────────────────────────────────────────

export const getProductAggregate = (productId: string) =>
  request<ProductAggregateInput>(
    `/admin/products/${encodeURIComponent(productId)}`,
  )

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

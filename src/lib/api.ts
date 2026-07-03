// The ONLY module that knows the API URL. Swap this to hit a real backend later
// without touching the UI. Talks json-server @0.17.x query syntax.
import { useAuth } from '#/stores/auth'
import type { Session } from '#/types/auth'
import type {
  Category,
  Colorway,
  Paged,
  Product,
  ProductFilters,
} from '#/types/catalog'

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

// Bearer header when signed in. getState() reads the store outside React.
function authHeaders(): Record<string, string> {
  const token = useAuth.getState().accessToken
  return token ? { Authorization: `Bearer ${token}` } : {}
}

const SORT_MAP: Record<string, [string, 'asc' | 'desc']> = {
  newest: ['publishedAt', 'desc'],
  'price-asc': ['minPrice', 'asc'],
  'price-desc': ['minPrice', 'desc'],
}

async function get<T>(path: string): Promise<{ data: T; total: number }> {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() })
  if (!res.ok) throw new Error(`API ${res.status} on ${path}`)
  const total = Number(res.headers.get('X-Total-Count') ?? 0)
  return { data: (await res.json()) as T, total }
}

// Auth: json-server-auth returns { accessToken, user } on success, else 4xx with a message.
async function authPost(path: string, body: unknown): Promise<Session> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(typeof data === 'string' ? data : 'Authentication failed')
  return data as Session
}

export const login = (email: string, password: string) =>
  authPost('/login', { email, password })

export const register = (input: {
  email: string
  password: string
  username?: string
}) => authPost('/register', input)

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

export async function getProducts(f: ProductFilters = {}): Promise<Paged<Product>> {
  const { data, total } = await get<Product[]>(`/products${toQuery(f)}`)
  // json-server only sends X-Total-Count when paginated; else total = list length.
  return { items: data, total: f.limit ? total : data.length }
}

export async function getProduct(id: string): Promise<Product> {
  const { data } = await get<Product>(`/products/${id}`)
  return data
}

// Resolve a product by its slug (routes carry the slug, not the style code).
export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const { data } = await get<Product[]>(`/products?slug=${encodeURIComponent(slug)}`)
  return data[0]
}

export async function getColorways(productId: string): Promise<Colorway[]> {
  const { data } = await get<Colorway[]>(`/colorways?productId=${productId}&_embed=skus`)
  return data
}

export async function getCategoryTree(): Promise<Category[]> {
  const { data } = await get<Category[]>('/categories')
  return data
}

export async function search(q: string): Promise<Product[]> {
  const { data } = await get<Product[]>(`/products?q=${encodeURIComponent(q)}`)
  return data
}

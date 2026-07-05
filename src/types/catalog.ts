// Mirrors the catalog entities served by the backend (apparel-store-be).

export interface Swatch {
  styleColor: string
  hex: string
}

export interface Product {
  id: string // style code, e.g. AX-1001
  publicId?: string // catalog public_id for API lookups when needed
  slug: string
  name: string
  subtitle: string
  brand: string
  gender: 'men' | 'women' | 'kids'
  type: string
  categoryId: string
  categorySlug: string
  collectionIds: string[]
  sizeScale: string
  basePrice: number
  minPrice: number
  maxPrice: number
  badges: string[]
  colorwayCount: number
  colorFamilies: string[]
  swatches: Swatch[]
  thumbnailUrl: string
  hoverImageUrl: string
  defaultColorwayId: string
  sizes: string[]
  description: string
  publishedAt: string
}

export interface Colorway {
  id: string // colourway public_id (global, shared across products)
  productId: string
  styleColor: string // same as id; kept for call-site compatibility
  name: string
  swatchHex: string
  price: number
  isDefault: boolean
  onSale: boolean
  images: string[]
  skus?: Sku[] // present when fetched with ?_embed=skus
}

export interface Sku {
  id: string // catalog public_id (checkout / inventory API)
  code: string // business sku code, e.g. AX1001-010-M
  colorwayId: string
  productId: string
  size: string
  sizeLabel: string
  sizeScale: string
  inStock: boolean
  stockQty: number
  price: number
}

export interface Category {
  id: string
  slug: string
  name: string
  parentId: string | null
  gender: string
  level: number
}

export interface Collection {
  id: string
  slug: string
  name: string
}

export interface SizeScale {
  id: string
  sizes: string[]
}

// Coarse (server-side) product filters. Fine faceting is done client-side.
export interface ProductFilters {
  categoryId?: string
  categorySlug?: string
  gender?: string
  minPrice?: number
  maxPrice?: number
  sort?: 'newest' | 'price-asc' | 'price-desc'
  page?: number
  limit?: number
  q?: string
}

export interface Paged<T> {
  items: T[]
  total: number
}

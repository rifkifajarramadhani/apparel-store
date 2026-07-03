import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Cart item keyed by SKU id (style+colour+size) — the only buyable unit.
export interface CartItem {
  skuId: string
  productId: string
  styleColor: string
  slug: string
  size: string
  name: string
  price: number
  image: string
  qty: number
}

interface CartState {
  items: CartItem[]
  hasHydrated: boolean
  add: (item: Omit<CartItem, 'qty'>, qty?: number) => void
  remove: (skuId: string) => void
  setQty: (skuId: string, qty: number) => void
  clear: () => void
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      hasHydrated: false,
      add: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.skuId === item.skuId)
          if (existing)
            return {
              items: s.items.map((i) =>
                i.skuId === item.skuId ? { ...i, qty: i.qty + qty } : i,
              ),
            }
          return { items: [...s.items, { ...item, qty }] }
        }),
      remove: (skuId) =>
        set((s) => ({ items: s.items.filter((i) => i.skuId !== skuId) })),
      setQty: (skuId, qty) =>
        set((s) => ({
          items:
            qty <= 0
              ? s.items.filter((i) => i.skuId !== skuId)
              : s.items.map((i) => (i.skuId === skuId ? { ...i, qty } : i)),
        })),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'cart',
      onRehydrateStorage: () => (state) => {
        if (state) state.hasHydrated = true
      },
    },
  ),
)

// SSR-safe count: 0 until hydrated so server HTML and first client render agree.
export const useCartCount = () =>
  useCart((s) => (s.hasHydrated ? s.items.reduce((n, i) => n + i.qty, 0) : 0))

export const useCartSubtotal = () =>
  useCart((s) => s.items.reduce((n, i) => n + i.price * i.qty, 0))

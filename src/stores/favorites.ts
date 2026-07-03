import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Favourites keyed on styleColor (a colour of a style) — matches the heart on cards/PDP.
interface FavState {
  ids: string[]
  hasHydrated: boolean
  toggle: (styleColor: string) => void
  has: (styleColor: string) => boolean
}

export const useFavorites = create<FavState>()(
  persist(
    (set, get) => ({
      ids: [],
      hasHydrated: false,
      toggle: (styleColor) =>
        set((s) => ({
          ids: s.ids.includes(styleColor)
            ? s.ids.filter((id) => id !== styleColor)
            : [...s.ids, styleColor],
        })),
      has: (styleColor) => get().ids.includes(styleColor),
    }),
    {
      name: 'favorites',
      onRehydrateStorage: () => (state) => {
        if (state) state.hasHydrated = true
      },
    },
  ),
)

// SSR-safe membership check for rendering the filled/empty heart.
export const useIsFavorite = (styleColor: string) =>
  useFavorites((s) => s.hasHydrated && s.ids.includes(styleColor))

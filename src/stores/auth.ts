import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Session, User } from '#/types/auth'

// Session from json-server-auth. hasHydrated gates SSR-safe reads (see favorites.ts).
interface AuthState {
  accessToken: string | null
  user: User | null
  hasHydrated: boolean
  setSession: (s: Session) => void
  logout: () => void
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      hasHydrated: false,
      setSession: ({ accessToken, user }) => set({ accessToken, user }),
      logout: () => set({ accessToken: null, user: null }),
    }),
    {
      name: 'auth',
      partialize: (s) => ({ accessToken: s.accessToken, user: s.user }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hasHydrated = true
      },
    },
  ),
)

// SSR-safe: null until client hydration, so server and first client render match.
export const useCurrentUser = () =>
  useAuth((s) => (s.hasHydrated ? s.user : null))

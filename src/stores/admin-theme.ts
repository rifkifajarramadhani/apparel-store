import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type AdminTheme = 'light' | 'dark' | 'system'

interface AdminThemeState {
  theme: AdminTheme
  setTheme: (theme: AdminTheme) => void
}

export const useAdminTheme = create<AdminThemeState>()(
  persist((set) => ({ theme: 'system', setTheme: (theme) => set({ theme }) }), {
    name: 'axis-admin-theme',
  }),
)

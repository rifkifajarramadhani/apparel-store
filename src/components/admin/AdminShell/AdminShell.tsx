import { useEffect, useState } from 'react'
import {
  Link,
  Outlet,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router'
import {
  Boxes,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PackageSearch,
  Search,
  Sun,
  Tags,
} from 'lucide-react'
import { useAuth } from '#/stores/auth'
import { useHydrated } from '#/hooks/use-hydrated'
import { useAdminTheme } from '#/stores/admin-theme'
import { Button } from '#/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '#/components/ui/sheet'
import { cn } from '#/lib/utils'

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  {
    to: '/admin/products',
    label: 'Products',
    icon: PackageSearch,
    exact: false,
  },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes, exact: false },
  {
    to: '/admin/categories',
    label: 'Categories',
    icon: FolderTree,
    exact: false,
  },
  { to: '/admin/collections', label: 'Collections', icon: Tags, exact: false },
] as const

function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const logout = useAuth((state) => state.logout)
  const navigate = useNavigate()

  return (
    <div className="flex h-full flex-col border-r bg-background">
      <div className="flex h-20 items-center border-b px-6">
        <Link
          to="/admin"
          onClick={onNavigate}
          className="font-display text-3xl tracking-wide"
        >
          AXIS{' '}
          <span className="font-sans text-xs font-semibold tracking-normal">
            CMS
          </span>
        </Link>
      </div>
      <nav className="flex flex-col gap-1 p-3" aria-label="CMS navigation">
        {NAV.map(({ to, label, icon: Icon, exact }) => {
          const active = exact ? pathname === to : pathname.startsWith(to)
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavigate}
              className={cn(
                'flex h-11 items-center gap-3 rounded-sm px-3 text-sm font-medium transition-colors hover:bg-muted',
                active && 'bg-foreground text-background hover:bg-foreground',
              )}
            >
              <Icon className="size-[18px]" strokeWidth={1.75} />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="mt-auto border-t p-3">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => {
            logout()
            navigate({ to: '/' })
          }}
        >
          <LogOut data-icon="inline-start" /> Log out
        </Button>
      </div>
    </div>
  )
}

export function AdminShell() {
  const hydrated = useHydrated()
  const user = useAuth((state) => state.user)
  const pathname = useRouterState({ select: (state) => state.location.href })
  const navigate = useNavigate()
  const { theme, setTheme } = useAdminTheme()
  const [systemDark, setSystemDark] = useState(false)
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-color-scheme: dark)')
    const sync = () => setSystemDark(query.matches)
    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (!user) {
      navigate({ to: '/login', search: { redirect: pathname }, replace: true })
    } else if (user.role !== 'admin') {
      navigate({ to: '/account', replace: true })
    }
  }, [hydrated, navigate, pathname, user])

  const dark = theme === 'dark' || (theme === 'system' && systemDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    return () => document.documentElement.classList.remove('dark')
  }, [dark])

  if (!hydrated || !user || user.role !== 'admin') {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
        Loading CMS…
      </div>
    )
  }

  return (
    <div
      className={cn(
        'min-h-screen bg-background text-foreground',
        dark && 'dark',
      )}
    >
      <aside className="fixed inset-y-0 left-0 hidden w-52 lg:block">
        <AdminNav />
      </aside>
      <div className="lg:pl-52">
        <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background/95 px-4 backdrop-blur md:px-6">
          <Sheet open={navOpen} onOpenChange={setNavOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className={cn('w-64 p-0', dark && 'dark')}
            >
              <SheetHeader className="sr-only">
                <SheetTitle>CMS navigation</SheetTitle>
                <SheetDescription>
                  Navigate the catalog administration area.
                </SheetDescription>
              </SheetHeader>
              <AdminNav onNavigate={() => setNavOpen(false)} />
            </SheetContent>
          </Sheet>
          <form
            className="ml-3 hidden w-full max-w-xl md:block lg:ml-0"
            onSubmit={(event) => {
              event.preventDefault()
              const data = new FormData(event.currentTarget)
              navigate({
                to: '/admin/products',
                search: {
                  q: String(data.get('catalog-search') ?? ''),
                  category: 'all',
                  sort: 'newest',
                  page: 1,
                },
              })
            }}
          >
            <label className="relative block">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                name="catalog-search"
                className="h-10 w-full border bg-background pr-3 pl-9 text-sm outline-none focus:ring-2 focus:ring-ring/20"
                placeholder="Search catalog…"
              />
              <span className="sr-only">Search catalog</span>
            </label>
          </form>
          <div className="ml-auto flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              aria-label={dark ? 'Use light theme' : 'Use dark theme'}
              onClick={() => setTheme(dark ? 'light' : 'dark')}
            >
              {dark ? <Sun /> : <Moon />}
            </Button>
            <div className="hidden border-l pl-4 text-right sm:block">
              <p className="text-sm font-semibold">
                {user.username ?? 'Admin'}
              </p>
              <p className="text-xs text-muted-foreground">Administrator</p>
            </div>
            <div className="grid size-9 place-items-center rounded-full bg-foreground text-xs font-semibold text-background">
              {(user.username ?? 'AD').slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="min-h-[calc(100vh-4rem)]">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Heart, Menu, Search, ShoppingBag, User, X } from 'lucide-react'
import { categoriesQuery } from '#/lib/query'
import { useCartCount } from '#/stores/cart'
import { useCurrentUser } from '#/stores/auth'
import { MegaMenu } from '../MegaMenu/MegaMenu'
import { CartDrawer } from '../CartDrawer/CartDrawer'
import type { Category } from '#/types/catalog'

export function Header() {
  const { data: categories } = useSuspenseQuery(categoriesQuery())
  const roots = categories.filter((c) => c.level === 0)
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id)

  const [mobileOpen, setMobileOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const cartCount = useCartCount()
  const user = useCurrentUser()

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (q.trim()) navigate({ to: '/search', search: { q: q.trim() } })
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-4 px-4 md:px-8">
        {/* mobile menu button */}
        <button
          className="md:hidden"
          aria-label="Open menu"
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>

        <Link to="/" className="display text-2xl tracking-tight">
          AXIS
        </Link>

        <nav className="ml-6 hidden items-center gap-6 md:flex">
          {roots.map((root) => (
            <MegaMenu key={root.id} root={root} children={childrenOf(root.id)} />
          ))}
          <Link
            to="/sale"
            className="py-4 text-sm font-semibold text-sale hover:opacity-60"
          >
            Sale
          </Link>
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden md:block">
          <label className="flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search"
              className="w-32 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              aria-label="Search products"
            />
          </label>
        </form>

        <div className="ml-auto flex items-center gap-4 md:ml-4">
          <Link
            to={user ? '/account' : '/login'}
            aria-label={user ? 'Account' : 'Sign in'}
          >
            <User className="h-5 w-5" />
          </Link>
          <Link to="/favorites" aria-label="Favourites">
            <Heart className="h-5 w-5" />
          </Link>
          <button
            onClick={() => setCartOpen(true)}
            aria-label="Open bag"
            className="relative"
          >
            <ShoppingBag className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-bold text-background">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />

      {mobileOpen && (
        <MobileNav
          roots={roots}
          childrenOf={childrenOf}
          onClose={() => setMobileOpen(false)}
        />
      )}
    </header>
  )
}

function MobileNav({
  roots,
  childrenOf,
  onClose,
}: {
  roots: Category[]
  childrenOf: (id: string) => Category[]
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 bg-background md:hidden">
      <div className="flex h-14 items-center justify-between border-b border-border px-4">
        <span className="display text-xl">AXIS</span>
        <button aria-label="Close menu" onClick={onClose}>
          <X className="h-6 w-6" />
        </button>
      </div>
      <nav className="overflow-y-auto p-4">
        {roots.map((root) => (
          <div key={root.id} className="border-b border-border py-4">
            <Link
              to="/c/$categorySlug"
              params={{ categorySlug: root.slug }}
              onClick={onClose}
              className="display block text-xl"
            >
              {root.name}
            </Link>
            <ul className="mt-2 space-y-2">
              {childrenOf(root.id).map((c) => (
                <li key={c.id}>
                  <Link
                    to="/c/$categorySlug"
                    params={{ categorySlug: c.slug }}
                    onClick={onClose}
                    className="text-sm text-muted-foreground"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
        <Link
          to="/sale"
          onClick={onClose}
          className="display mt-4 block text-xl text-sale"
        >
          Sale
        </Link>
      </nav>
    </div>
  )
}

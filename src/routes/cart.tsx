import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Minus, Plus, X } from 'lucide-react'
import { Price } from '#/components/ui/price'
import { useCart, useCartSubtotal } from '#/stores/cart'
import { useHydrated } from '#/stores/useHydrated'
import { useCurrentUser } from '#/stores/auth'
import { createOrder } from '#/lib/api'
import { queryKeys } from '#/lib/query'

export const Route = createFileRoute('/cart')({ component: Cart })

function Cart() {
  const items = useCart((s) => s.items)
  const hydrated = useHydrated()
  const setQty = useCart((s) => s.setQty)
  const remove = useCart((s) => s.remove)
  const clear = useCart((s) => s.clear)
  const subtotal = useCartSubtotal()
  const user = useCurrentUser()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const checkout = useMutation({
    mutationFn: () =>
      createOrder(items.map((i) => ({ skuId: i.skuId, qty: i.qty }))),
    onSuccess: () => {
      clear()
      void queryClient.invalidateQueries({ queryKey: queryKeys.orders })
      navigate({ to: '/account' })
    },
  })

  const onCheckout = () => {
    if (!user) {
      navigate({ to: '/login', search: { redirect: '/cart' } })
      return
    }
    checkout.mutate()
  }

  // Client-only state: render nothing definitive until hydrated (avoids mismatch).
  if (!hydrated)
    return <div className="mx-auto max-w-3xl px-4 py-16">Loading your bag…</div>

  if (items.length === 0)
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="display text-3xl">Your bag is empty</h1>
        <Link
          to="/c/$categorySlug"
          params={{ categorySlug: 'men' }}
          className="mt-6 inline-block rounded-full bg-foreground px-8 py-3 font-semibold text-background"
        >
          Start shopping
        </Link>
      </div>
    )

  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 md:grid-cols-3 md:px-8">
      <div className="md:col-span-2">
        <h1 className="display mb-6 text-3xl">Bag</h1>
        <ul>
          {items.map((i) => (
            <li
              key={i.skuId}
              className="flex gap-4 border-b border-border py-5"
            >
              <Link
                to="/t/$slug/$styleColor"
                params={{ slug: i.slug, styleColor: i.styleColor }}
              >
                <img src={i.image} alt="" className="h-28 w-28 object-cover" />
              </Link>
              <div className="flex-1">
                <div className="flex justify-between">
                  <p className="font-medium">{i.name}</p>
                  <button
                    aria-label="Remove item"
                    onClick={() => remove(i.skuId)}
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">Size {i.size}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 rounded-full border border-border px-3 py-1">
                    <button
                      aria-label="Decrease quantity"
                      onClick={() => setQty(i.skuId, i.qty - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-4 text-center text-sm">{i.qty}</span>
                    <button
                      aria-label="Increase quantity"
                      onClick={() => setQty(i.skuId, i.qty + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <Price amount={i.price * i.qty} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <aside className="md:col-span-1">
        <h2 className="display mb-4 text-xl">Summary</h2>
        <div className="flex justify-between border-b border-border py-2 text-sm">
          <span>Subtotal</span>
          <Price amount={subtotal} />
        </div>
        <div className="flex justify-between py-2 text-sm text-muted-foreground">
          <span>Shipping</span>
          <span>Free</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-border py-3 font-semibold">
          <span>Total</span>
          <Price amount={subtotal} />
        </div>
        <button
          onClick={onCheckout}
          disabled={checkout.isPending}
          className="mt-4 w-full rounded-full bg-foreground py-4 font-semibold text-background disabled:opacity-60"
        >
          {checkout.isPending
            ? 'Placing order…'
            : user
              ? 'Checkout'
              : 'Sign in to checkout'}
        </button>
        {checkout.isError && (
          <p className="mt-2 text-center text-xs text-destructive">
            {checkout.error.message}
          </p>
        )}
      </aside>
    </div>
  )
}

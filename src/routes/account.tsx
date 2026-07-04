import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '#/stores/auth'
import { useHydrated } from '#/hooks/use-hydrated'
import { Button } from '#/components/ui/button'
import { Price } from '#/components/ui/price'
import { ordersQuery } from '#/lib/query'

export const Route = createFileRoute('/account')({
  component: Account,
})

function Account() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const hydrated = useHydrated()
  const navigate = useNavigate()
  const orders = useQuery({ ...ordersQuery(), enabled: hydrated && !!user })

  // Session lives in localStorage — only trust it post-hydration.
  if (!hydrated) {
    return <p className="py-24 text-center text-muted-foreground">Loading…</p>
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-sm px-4 py-24 text-center">
        <p className="text-muted-foreground">You are not signed in.</p>
        <Link
          to="/login"
          className="mt-6 inline-block rounded-full bg-foreground px-8 py-3 font-semibold text-background"
        >
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="display mb-6 text-3xl">Account</h1>
      <dl className="space-y-3 text-sm">
        {user.username && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Username</dt>
            <dd>{user.username}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Email</dt>
          <dd>{user.email}</dd>
        </div>
        {user.role && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Role</dt>
            <dd>{user.role}</dd>
          </div>
        )}
      </dl>

      <section className="mt-10">
        <h2 className="display mb-4 text-xl">Orders</h2>
        {orders.isLoading && (
          <p className="text-sm text-muted-foreground">Loading orders…</p>
        )}
        {orders.data && orders.data.length === 0 && (
          <p className="text-sm text-muted-foreground">No orders yet.</p>
        )}
        <ul className="space-y-4">
          {orders.data?.map((order) => (
            <li key={order.id} className="border-b border-border pb-4">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Order #{order.id}</span>
                <Price amount={order.total} />
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(order.createdAt).toLocaleDateString()} ·{' '}
                {order.status}
              </p>
              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                {order.items.map((item) => (
                  <li key={item.skuId} className="flex justify-between">
                    <span>
                      {item.name} · Size {item.size} × {item.qty}
                    </span>
                    <Price amount={item.unitPrice * item.qty} />
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <Button
        variant="outline"
        className="mt-8 w-full"
        onClick={() => {
          logout()
          navigate({ to: '/' })
        }}
      >
        Log out
      </Button>
    </div>
  )
}

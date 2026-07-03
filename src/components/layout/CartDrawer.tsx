import { Link } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { Price } from '#/components/ui/price'
import { useCart, useCartSubtotal } from '#/stores/cart'

// Slide-over bag. Opened from the header; "View Bag" goes to the full /cart page.
export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const items = useCart((s) => s.items)
  const hydrated = useCart((s) => s.hasHydrated)
  const remove = useCart((s) => s.remove)
  const subtotal = useCartSubtotal()
  const shown = hydrated ? items : []

  return (
    <div
      className={open ? 'fixed inset-0 z-[60]' : 'pointer-events-none fixed inset-0 z-[60]'}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-label="Shopping bag"
        className={`absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-background shadow-xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <p className="font-semibold">Bag ({shown.reduce((n, i) => n + i.qty, 0)})</p>
          <button aria-label="Close bag" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {shown.length === 0 ? (
          <p className="flex-1 px-5 py-10 text-center text-muted-foreground">
            Your bag is empty.
          </p>
        ) : (
          <ul className="flex-1 overflow-y-auto px-5">
            {shown.map((i) => (
              <li key={i.skuId} className="flex gap-3 border-b border-border py-4">
                <img src={i.image} alt="" className="h-20 w-20 object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{i.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Size {i.size} · Qty {i.qty}
                  </p>
                  <Price className="text-sm" amount={i.price * i.qty} />
                </div>
                <button
                  className="text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => remove(i.skuId)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-border px-5 py-4">
          <div className="mb-3 flex justify-between font-semibold">
            <span>Subtotal</span>
            <Price amount={subtotal} />
          </div>
          <Link
            to="/cart"
            onClick={onClose}
            className="block rounded-full bg-foreground py-3 text-center font-semibold text-background"
          >
            View Bag
          </Link>
        </div>
      </aside>
    </div>
  )
}

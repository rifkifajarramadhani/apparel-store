import { cn } from '#/lib/utils'

// Card badge: "Just In" / "Bestseller" / "Sale" / "Sold Out".
export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode
  variant?: 'default' | 'sale' | 'muted'
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-block rounded-full px-3 py-1 text-xs font-semibold tracking-wide',
        // badge-promo: white pill w/ hairline border
        variant === 'default' && 'border border-hairline bg-background text-foreground',
        // badge-sale-text: red text only, no container
        variant === 'sale' && 'px-0 text-sale',
        variant === 'muted' && 'bg-secondary text-muted-foreground',
        className,
      )}
    >
      {children}
    </span>
  )
}

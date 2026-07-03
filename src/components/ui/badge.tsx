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
        'inline-block px-2 py-0.5 text-xs font-bold uppercase tracking-wide',
        variant === 'default' && 'bg-foreground text-background',
        variant === 'sale' && 'bg-sale text-white',
        variant === 'muted' && 'bg-secondary text-muted-foreground',
        className,
      )}
    >
      {children}
    </span>
  )
}

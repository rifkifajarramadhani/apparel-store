import { formatIDR } from '#/lib/money'
import { cn } from '#/lib/utils'

// Shows a single price, a range (min–max), or a struck original beside a sale price.
export function Price({
  amount,
  max,
  compareAt,
  className,
}: {
  amount: number
  max?: number
  compareAt?: number
  className?: string
}) {
  const onSale = compareAt != null && compareAt > amount
  return (
    <span className={cn('inline-flex items-baseline gap-2', className)}>
      <span className={onSale ? 'price-sale font-medium' : ''}>
        {formatIDR(amount)}
        {max != null && max !== amount ? `–${formatIDR(max)}` : ''}
      </span>
      {onSale && (
        <span className="text-sm text-muted-foreground line-through">
          {formatIDR(compareAt)}
        </span>
      )}
    </span>
  )
}

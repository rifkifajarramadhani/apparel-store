import { Link } from '@tanstack/react-router'
import type { Category } from '#/types/catalog'

// Desktop hover/focus panel of a root category's children.
export function MegaMenu({
  root,
  children,
}: {
  root: Category
  children: Category[]
}) {
  return (
    <div className="group relative">
      <Link
        to="/c/$categorySlug"
        params={{ categorySlug: root.slug }}
        className="inline-block py-4 text-sm font-semibold hover:opacity-60"
        activeProps={{ className: 'underline underline-offset-8 decoration-2' }}
      >
        {root.name}
      </Link>
      <div className="invisible absolute left-1/2 top-full z-40 w-64 -translate-x-1/2 border-t border-border bg-background opacity-0 shadow-lg transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <div className="p-6">
          <p className="eyebrow mb-3 text-muted-foreground">{root.name}</p>
          <ul className="space-y-2">
            {children.map((c) => (
              <li key={c.id}>
                <Link
                  to="/c/$categorySlug"
                  params={{ categorySlug: c.slug }}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

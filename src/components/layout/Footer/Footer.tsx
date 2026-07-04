import { Link } from '@tanstack/react-router'

const COLS = [
  { title: 'Shop', links: [['Men', 'men'], ['Women', 'women'], ['Kids', 'kids']] as const },
  { title: 'Collections', links: [['Tech Fleece', 'men-hoodies'], ['Pro Training', 'men-shoes']] as const },
]

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto grid max-w-[1400px] gap-8 px-4 py-12 sm:grid-cols-3 md:px-8">
        <div>
          <p className="display text-2xl">AXIS</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Engineered apparel for everyday performance.
          </p>
        </div>
        {COLS.map((col) => (
          <div key={col.title}>
            <p className="eyebrow mb-3 text-muted-foreground">{col.title}</p>
            <ul className="space-y-2">
              {col.links.map(([label, slug]) => (
                <li key={slug}>
                  <Link
                    to="/c/$categorySlug"
                    params={{ categorySlug: slug }}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} AXIS. A demo storefront.
      </div>
    </footer>
  )
}

import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import { Header } from '#/components/layout/Header'
import { Footer } from '#/components/layout/Footer'
import { categoriesQuery } from '#/lib/query'

import appCss from '../styles.css?url'

import type { QueryClient } from '@tanstack/react-query'

interface MyRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'AXIS — Apparel' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  // Categories power the header/mega-menu on every route — ensure for SSR.
  loader: ({ context }) => context.queryClient.ensureQueryData(categoriesQuery()),
  notFoundComponent: NotFound,
  errorComponent: ErrorBoundary,
  shellComponent: RootDocument,
})

function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-32 text-center">
      <p className="display text-6xl">404</p>
      <p className="mt-4 text-muted-foreground">We couldn’t find that page.</p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-full bg-foreground px-8 py-3 font-semibold text-background"
      >
        Back home
      </Link>
    </div>
  )
}

function ErrorBoundary({ error }: { error: Error }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-32 text-center">
      <p className="display text-3xl">Something went wrong</p>
      <p className="mt-4 text-sm text-muted-foreground">{error.message}</p>
      <Link
        to="/"
        className="mt-6 inline-block rounded-full bg-foreground px-8 py-3 font-semibold text-background"
      >
        Back home
      </Link>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children ?? <Outlet />}</main>
        <Footer />
        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            { name: 'Tanstack Router', render: <TanStackRouterDevtoolsPanel /> },
            TanStackQueryDevtools,
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}

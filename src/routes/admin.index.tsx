import { createFileRoute } from '@tanstack/react-router'
import { AdminDashboardPage } from '#/components/admin/AdminDashboardPage/AdminDashboardPage'
import { categoriesQuery, productsQuery, skusQuery } from '#/lib/query'

export const Route = createFileRoute('/admin/')({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(productsQuery()),
      context.queryClient.ensureQueryData(categoriesQuery()),
      context.queryClient.ensureQueryData(skusQuery()),
    ]),
  component: AdminDashboardPage,
})

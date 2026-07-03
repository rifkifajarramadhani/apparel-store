import { createFileRoute } from '@tanstack/react-router'
import { AdminProductsPage } from '#/components/admin/AdminProductsPage/AdminProductsPage'
import { AdminSearchSchema } from '#/services/schemas/admin'
import { categoriesQuery, productsQuery } from '#/lib/query'

export const Route = createFileRoute('/admin/products/')({
  validateSearch: AdminSearchSchema,
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(productsQuery()),
      context.queryClient.ensureQueryData(categoriesQuery()),
    ]),
  component: AdminProductsPage,
})

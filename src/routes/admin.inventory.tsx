import { createFileRoute } from '@tanstack/react-router'
import { AdminInventoryPage } from '#/components/admin/AdminInventoryPage/AdminInventoryPage'
import { InventorySearchSchema } from '#/services/schemas/admin'
import { productsQuery, skusQuery } from '#/lib/query'

export const Route = createFileRoute('/admin/inventory')({
  validateSearch: InventorySearchSchema,
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(productsQuery()),
      context.queryClient.ensureQueryData(skusQuery()),
    ]),
  component: AdminInventoryPage,
})

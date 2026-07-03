import { createFileRoute } from '@tanstack/react-router'
import { AdminCategoriesPage } from '#/components/admin/AdminTaxonomyPage/AdminTaxonomyPage'
import { categoriesQuery } from '#/lib/query'

export const Route = createFileRoute('/admin/categories')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(categoriesQuery()),
  component: AdminCategoriesPage,
})

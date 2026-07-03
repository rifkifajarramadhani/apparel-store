import { createFileRoute } from '@tanstack/react-router'
import { AdminCollectionsPage } from '#/components/admin/AdminTaxonomyPage/AdminTaxonomyPage'
import { collectionsQuery } from '#/lib/query'

export const Route = createFileRoute('/admin/collections')({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(collectionsQuery()),
  component: AdminCollectionsPage,
})

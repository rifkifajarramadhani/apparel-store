import { createFileRoute } from '@tanstack/react-router'
import { NewProductEditorPage } from '#/components/admin/ProductEditorPage/ProductEditorPage'
import { ProductEditorSearchSchema } from '#/services/schemas/admin'
import { categoriesQuery, collectionsQuery, sizeScalesQuery } from '#/lib/query'

export const Route = createFileRoute('/admin/products/new')({
  validateSearch: ProductEditorSearchSchema,
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery()),
      context.queryClient.ensureQueryData(collectionsQuery()),
      context.queryClient.ensureQueryData(sizeScalesQuery()),
    ]),
  component: () => {
    const { tab, colorwayId } = Route.useSearch()
    return <NewProductEditorPage tab={tab} colorwayId={colorwayId} />
  },
})

import { createFileRoute } from '@tanstack/react-router'
import { ExistingProductEditorPage } from '#/components/admin/ProductEditorPage/ProductEditorPage'
import { ProductEditorSearchSchema } from '#/services/schemas/admin'
import { categoriesQuery, collectionsQuery, sizeScalesQuery } from '#/lib/query'

export const Route = createFileRoute('/admin/products/$productId')({
  validateSearch: ProductEditorSearchSchema,
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(categoriesQuery()),
      context.queryClient.ensureQueryData(collectionsQuery()),
      context.queryClient.ensureQueryData(sizeScalesQuery()),
    ]),
  component: () => {
    const { productId } = Route.useParams()
    const { tab, colorwayId } = Route.useSearch()
    return (
      <ExistingProductEditorPage
        productId={productId}
        tab={tab}
        colorwayId={colorwayId}
      />
    )
  },
})

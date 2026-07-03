import { z } from 'zod'

const id = z.string().trim().min(1).max(80)
const url = z.url()

export const AdminSearchSchema = z.object({
  q: z.string().catch(''),
  category: z.string().catch('all'),
  sort: z.enum(['newest', 'name', 'price-asc', 'price-desc']).catch('newest'),
  page: z.coerce.number().int().positive().catch(1),
})

export const InventorySearchSchema = z.object({
  q: z.string().catch(''),
  stock: z.enum(['all', 'low', 'out']).catch('all'),
  page: z.coerce.number().int().positive().catch(1),
})

export const ProductEditorSearchSchema = z.object({
  tab: z.enum(['details', 'media', 'inventory']).catch('details'),
  colorwayId: z.string().optional(),
})

export const ColorwayInputSchema = z.object({
  id,
  productId: id,
  styleColor: id,
  name: z.string().trim().min(2).max(160),
  colorFamily: z.string().trim().min(2).max(40),
  swatchHex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  price: z.coerce.number().int().nonnegative(),
  isDefault: z.boolean(),
  onSale: z.boolean(),
  images: z.array(url).min(1).max(8),
})

export const SkuInputSchema = z.object({
  id,
  colorwayId: id,
  productId: id,
  size: z.string().trim().min(1),
  sizeLabel: z.string().trim().min(1),
  sizeScale: id,
  inStock: z.boolean(),
  stockQty: z.coerce.number().int().nonnegative(),
  price: z.coerce.number().int().nonnegative(),
})

export const ProductInputSchema = z.object({
  id,
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(2).max(160),
  subtitle: z.string().trim().min(2).max(160),
  brand: z.string().trim().min(1).max(80),
  gender: z.enum(['men', 'women', 'kids']),
  type: z.string().trim().min(2).max(80),
  categoryId: id,
  categorySlug: id,
  collectionIds: z.array(id),
  sizeScale: id,
  basePrice: z.coerce.number().int().nonnegative(),
  description: z.string().trim().min(10).max(2000),
  publishedAt: z.iso.date(),
})

export const ProductAggregateInputSchema = z
  .object({
    product: ProductInputSchema,
    colorways: z.array(ColorwayInputSchema).min(1),
    skus: z.array(SkuInputSchema).min(1),
  })
  .superRefine(({ product, colorways, skus }, ctx) => {
    if (colorways.filter((colorway) => colorway.isDefault).length !== 1) {
      ctx.addIssue({
        code: 'custom',
        message: 'Exactly one colorway must be the default',
      })
    }
    if (colorways.some((colorway) => colorway.productId !== product.id)) {
      ctx.addIssue({
        code: 'custom',
        message: 'Colorways must belong to the product',
      })
    }
    const colorwayIds = new Set(colorways.map((colorway) => colorway.id))
    if (
      skus.some(
        (sku) =>
          sku.productId !== product.id || !colorwayIds.has(sku.colorwayId),
      )
    ) {
      ctx.addIssue({
        code: 'custom',
        message: 'SKUs must belong to a submitted colorway',
      })
    }
  })

export const CategoryInputSchema = z.object({
  id,
  slug: id,
  name: z.string().trim().min(2).max(80),
  parentId: id.nullable(),
  gender: z.enum(['men', 'women', 'kids']),
  level: z.coerce.number().int().min(0).max(1),
})

export const CollectionInputSchema = z.object({
  id,
  slug: id,
  name: z.string().trim().min(2).max(80),
})

export type ProductAggregateInput = z.infer<typeof ProductAggregateInputSchema>
export type ProductInput = z.infer<typeof ProductInputSchema>
export type ColorwayInput = z.infer<typeof ColorwayInputSchema>
export type SkuInput = z.infer<typeof SkuInputSchema>
export type CategoryInput = z.infer<typeof CategoryInputSchema>
export type CollectionInput = z.infer<typeof CollectionInputSchema>

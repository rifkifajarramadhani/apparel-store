import { z } from 'zod'

export const PublicIDSchema = z.string().length(26)

export const MoneySchema = z.object({
  currency: z.string().length(3),
  amount: z.number().int().nonnegative(),
  compareAtAmount: z.number().int().nonnegative().nullable().optional(),
})

export const BrandSchema = z.object({
  id: PublicIDSchema,
  slug: z.string(),
  name: z.string(),
})

export const CategoryRecordSchema = z.object({
  id: PublicIDSchema,
  parentId: PublicIDSchema.nullable().optional(),
  slug: z.string(),
  name: z.string(),
})

export const ColourwaySchema = z.object({
  id: PublicIDSchema,
  slug: z.string(),
  name: z.string(),
  colourFamily: z.string().optional(),
  hexCode: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})

export const SizeRecordSchema = z.object({
  id: PublicIDSchema,
  scaleCode: z.string(),
  code: z.string(),
  name: z.string(),
  sortOrder: z.number().int().nonnegative(),
})

export const AssetSchema = z.object({
  id: PublicIDSchema,
  mediaType: z.enum(['image', 'video', 'document']),
  url: z.url(),
  altText: z.string().optional(),
  role: z.string(),
  sortOrder: z.number().int().nonnegative(),
})

export const SKUSchema = z.object({
  id: PublicIDSchema,
  code: z.string(),
  barcode: z.string().optional(),
  productId: z.string().min(1),
  colourway: ColourwaySchema,
  size: SizeRecordSchema,
  price: MoneySchema,
  onHand: z.number().int().nonnegative(),
  reserved: z.number().int().nonnegative(),
  available: z.number().int().nonnegative(),
  assets: z.array(AssetSchema),
})

export const ProductRecordSchema = z.object({
  id: PublicIDSchema,
  styleCode: z.string(),
  slug: z.string(),
  name: z.string(),
  subtitle: z.string(),
  gender: z.string().optional(),
  productType: z.string().optional(),
  description: z.string().optional(),
  brand: BrandSchema,
  categories: z.array(CategoryRecordSchema),
  colourways: z.array(ColourwaySchema),
  sizes: z.array(SizeRecordSchema),
  assets: z.array(AssetSchema),
  minPrice: MoneySchema.nullable().optional(),
  maxPrice: MoneySchema.nullable().optional(),
})

export const cursorPageSchema = <T extends z.ZodType>(item: T) =>
  z.object({ items: z.array(item), nextCursor: z.string().optional() })

export type Money = z.infer<typeof MoneySchema>
export type Brand = z.infer<typeof BrandSchema>
export type CategoryRecord = z.infer<typeof CategoryRecordSchema>
export type Colourway = z.infer<typeof ColourwaySchema>
export type SizeRecord = z.infer<typeof SizeRecordSchema>
export type Asset = z.infer<typeof AssetSchema>
export type SKU = z.infer<typeof SKUSchema>
export type ProductRecord = z.infer<typeof ProductRecordSchema>

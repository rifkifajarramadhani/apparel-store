import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ExternalLink,
  Plus,
  Save,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { AdminPageHeader } from '#/components/admin/AdminPageHeader/AdminPageHeader'
import { Badge } from '#/components/ui/badge'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Switch } from '#/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '#/components/ui/tabs'
import { Textarea } from '#/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '#/components/ui/alert-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
import {
  createProductAggregate,
  deleteProduct,
  updateProductAggregate,
} from '#/lib/api'
import {
  categoriesQuery,
  collectionsQuery,
  productAggregateQuery,
  queryKeys,
  sizeScalesQuery,
} from '#/lib/query'
import { ProductAggregateInputSchema } from '#/services/schemas/admin'
import type { ProductAggregateInput } from '#/services/schemas/admin'

type EditorTab = 'details' | 'media' | 'inventory'

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

function createInitialAggregate(): ProductAggregateInput {
  const id = `AX-${Date.now().toString().slice(-4)}`
  const styleColor = id.replace('-', '') + '-010'
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
  return {
    product: {
      id,
      slug: '',
      name: '',
      subtitle: '',
      brand: 'AXIS',
      gender: 'men',
      type: 'Apparel',
      categoryId: 'men-hoodies',
      categorySlug: 'men-hoodies',
      collectionIds: [],
      sizeScale: 'apparel-alpha',
      basePrice: 0,
      description: '',
      publishedAt: new Date().toISOString().slice(0, 10),
    },
    colorways: [
      {
        id: styleColor,
        productId: id,
        styleColor,
        name: 'Black',
        colorFamily: 'Black',
        swatchHex: '#111111',
        price: 0,
        isDefault: true,
        onSale: false,
        images: [
          'https://placehold.co/800x800/111111/ffffff/png?text=New+Product',
        ],
      },
    ],
    skus: sizes.map((size) => ({
      id: `${styleColor}-${size}`,
      colorwayId: styleColor,
      productId: id,
      size,
      sizeLabel: size,
      sizeScale: 'apparel-alpha',
      inStock: true,
      stockQty: 0,
      price: 0,
    })),
  }
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function ProductEditor({
  initial,
  isNew,
  tab,
  colorwayId,
}: {
  initial: ProductAggregateInput
  isNew: boolean
  tab: EditorTab
  colorwayId?: string
}) {
  const [draft, setDraft] = useState(initial)
  const [saved, setSaved] = useState(true)
  const [imageUrl, setImageUrl] = useState('')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const categories = useSuspenseQuery(categoriesQuery()).data
  const collections = useSuspenseQuery(collectionsQuery()).data
  const sizeScales = useSuspenseQuery(sizeScalesQuery()).data
  const selectedId =
    colorwayId && draft.colorways.some((item) => item.id === colorwayId)
      ? colorwayId
      : draft.colorways[0].id
  const selected =
    draft.colorways.find((item) => item.id === selectedId) ?? draft.colorways[0]
  const selectedIndex = draft.colorways.findIndex(
    (item) => item.id === selected.id,
  )
  const selectedSkus = draft.skus.filter(
    (sku) => sku.colorwayId === selected.id,
  )

  const commit = (next: ProductAggregateInput) => {
    setDraft(next)
    setSaved(false)
  }
  const updateProduct = (next: Partial<ProductAggregateInput['product']>) =>
    commit({ ...draft, product: { ...draft.product, ...next } })
  const updateColorway = (
    next: Partial<ProductAggregateInput['colorways'][number]>,
  ) => {
    const colorways = draft.colorways.map((item, index) =>
      index === selectedIndex ? { ...item, ...next } : item,
    )
    commit({ ...draft, colorways })
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      const parsed = ProductAggregateInputSchema.parse(draft)
      return isNew
        ? createProductAggregate(parsed)
        : updateProductAggregate(parsed)
    },
    onSuccess: async (result) => {
      setSaved(true)
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      await queryClient.invalidateQueries({ queryKey: ['skus'] })
      await queryClient.invalidateQueries({
        queryKey: queryKeys.productAggregate(result.product.id),
      })
      toast.success('Product saved')
      if (isNew)
        navigate({
          to: '/admin/products/$productId',
          params: { productId: result.product.id },
          search: { tab: 'details' },
          replace: true,
        })
    },
    onError: (error) => toast.error(error.message),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteProduct(draft.product.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] })
      toast.success('Product deleted')
      navigate({
        to: '/admin/products',
        search: { q: '', category: 'all', sort: 'newest', page: 1 },
      })
    },
    onError: (error) => toast.error(error.message),
  })

  const setTab = (next: string) =>
    navigate({
      to: isNew ? '/admin/products/new' : '/admin/products/$productId',
      ...(isNew ? {} : { params: { productId: draft.product.id } }),
      search: {
        tab: next as EditorTab,
        ...(selected.id ? { colorwayId: selected.id } : {}),
      },
    })

  const setColorway = (id: string) =>
    navigate({
      to: isNew ? '/admin/products/new' : '/admin/products/$productId',
      ...(isNew ? {} : { params: { productId: draft.product.id } }),
      search: { tab: 'inventory', colorwayId: id },
    })

  const addColorway = () => {
    const suffix = String(10 + draft.colorways.length * 10).padStart(3, '0')
    const id = `${draft.product.id.replace('-', '')}-${suffix}`
    const scale =
      sizeScales.find((item) => item.id === draft.product.sizeScale) ??
      sizeScales[0]
    const colorway = {
      id,
      productId: draft.product.id,
      styleColor: id,
      name: 'New colorway',
      colorFamily: 'Black',
      swatchHex: '#111111',
      price: draft.product.basePrice,
      isDefault: false,
      onSale: false,
      images: [
        'https://placehold.co/800x800/111111/ffffff/png?text=New+Colorway',
      ],
    }
    const skus = scale.sizes.map((size) => ({
      id: `${id}-${size}`,
      colorwayId: id,
      productId: draft.product.id,
      size,
      sizeLabel: size,
      sizeScale: scale.id,
      inStock: true,
      stockQty: 0,
      price: draft.product.basePrice,
    }))
    commit({
      ...draft,
      colorways: [...draft.colorways, colorway],
      skus: [...draft.skus, ...skus],
    })
    setColorway(id)
  }

  return (
    <div>
      <AdminPageHeader
        title={draft.product.name || 'New product'}
        description={
          isNew
            ? 'Create a product and its first sellable colorway.'
            : `${draft.product.id} · ${saved ? 'All changes saved' : 'Unsaved changes'}`
        }
        actions={
          <>
            {!isNew ? (
              <Button variant="outline" asChild>
                <Link
                  to="/t/$slug/$styleColor"
                  params={{
                    slug: draft.product.slug,
                    styleColor:
                      selected.styleColor,
                  }}
                >
                  <ExternalLink data-icon="inline-start" /> View storefront
                </Link>
              </Button>
            ) : null}
            {!isNew ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="icon"
                    aria-label="Delete product"
                  >
                    <Trash2 />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this product?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This permanently deletes the product, all colorways, and
                      every SKU.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteMutation.mutate()}>
                      Delete product
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
            <Button
              disabled={saveMutation.isPending || saved}
              onClick={() => saveMutation.mutate()}
            >
              <Save data-icon="inline-start" />{' '}
              {saveMutation.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </>
        }
      />
      <Tabs value={tab} onValueChange={setTab}>
        <div className="border-b px-4 md:px-7">
          <TabsList className="h-12 bg-transparent p-0">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="inventory">Colorways & inventory</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="details" className="m-0 p-4 md:p-7">
          <div className="grid max-w-5xl gap-5 md:grid-cols-2">
            <Field label="Product ID">
              <Input
                value={draft.product.id}
                disabled={!isNew}
                onChange={(event) => updateProduct({ id: event.target.value })}
              />
            </Field>
            <Field label="Product name">
              <Input
                value={draft.product.name}
                onChange={(event) =>
                  updateProduct({
                    name: event.target.value,
                    ...(isNew ? { slug: slugify(event.target.value) } : {}),
                  })
                }
              />
            </Field>
            <Field label="Slug">
              <Input
                value={draft.product.slug}
                onChange={(event) =>
                  updateProduct({ slug: slugify(event.target.value) })
                }
              />
            </Field>
            <Field label="Subtitle">
              <Input
                value={draft.product.subtitle}
                onChange={(event) =>
                  updateProduct({ subtitle: event.target.value })
                }
              />
            </Field>
            <Field label="Category">
              <Select
                value={draft.product.categoryId}
                onValueChange={(categoryId) => {
                  const category = categories.find(
                    (item) => item.id === categoryId,
                  )
                  if (category)
                    updateProduct({
                      categoryId,
                      categorySlug: category.slug,
                      gender:
                        category.gender === 'women'
                          ? 'women'
                          : category.gender === 'kids'
                            ? 'kids'
                            : 'men',
                    })
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {categories
                      .filter((item) => item.level === 1)
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name} · {category.gender}
                        </SelectItem>
                      ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Type">
              <Input
                value={draft.product.type}
                onChange={(event) =>
                  updateProduct({ type: event.target.value })
                }
              />
            </Field>
            <Field label="Base price (IDR)">
              <Input
                type="number"
                min="0"
                value={draft.product.basePrice}
                onChange={(event) =>
                  updateProduct({ basePrice: event.target.valueAsNumber || 0 })
                }
              />
            </Field>
            <Field label="Published date">
              <Input
                type="date"
                value={draft.product.publishedAt}
                onChange={(event) =>
                  updateProduct({ publishedAt: event.target.value })
                }
              />
            </Field>
            <Field label="Size scale">
              <Select
                value={draft.product.sizeScale}
                disabled={!isNew}
                onValueChange={(sizeScale) => updateProduct({ sizeScale })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {sizeScales.map((scale) => (
                      <SelectItem key={scale.id} value={scale.id}>
                        {scale.id}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Collections">
              <div className="flex flex-wrap gap-2">
                {collections.map((collection) => {
                  const active = draft.product.collectionIds.includes(
                    collection.id,
                  )
                  return (
                    <Button
                      key={collection.id}
                      type="button"
                      variant={active ? 'default' : 'outline'}
                      size="sm"
                      onClick={() =>
                        updateProduct({
                          collectionIds: active
                            ? draft.product.collectionIds.filter(
                                (id) => id !== collection.id,
                              )
                            : [...draft.product.collectionIds, collection.id],
                        })
                      }
                    >
                      {collection.name}
                    </Button>
                  )
                })}
              </div>
            </Field>
            <div className="md:col-span-2">
              <Field label="Description">
                <Textarea
                  rows={5}
                  value={draft.product.description}
                  onChange={(event) =>
                    updateProduct({ description: event.target.value })
                  }
                />
              </Field>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="media" className="m-0 p-4 md:p-7">
          <div className="max-w-5xl">
            <h2 className="mb-1 text-lg font-semibold">
              {selected.name} images
            </h2>
            <p className="mb-5 text-sm text-muted-foreground">
              The first image is used as the storefront cover. Add up to eight
              public image URLs.
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {selected.images.map((image, index) => (
                <div
                  key={`${image}-${index}`}
                  className="group border bg-muted"
                >
                  <img
                    src={image}
                    alt={`Product view ${index + 1}`}
                    className="aspect-square w-full object-cover"
                  />
                  <div className="flex items-center justify-between border-t p-1">
                    <Badge variant="muted">
                      {index === 0 ? 'Cover' : index + 1}
                    </Badge>
                    <div className="flex">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={index === 0}
                        onClick={() => {
                          const images = [...selected.images]
                          ;[images[index - 1], images[index]] = [
                            images[index],
                            images[index - 1],
                          ]
                          updateColorway({ images })
                        }}
                      >
                        <ArrowUp />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={index === selected.images.length - 1}
                        onClick={() => {
                          const images = [...selected.images]
                          ;[images[index], images[index + 1]] = [
                            images[index + 1],
                            images[index],
                          ]
                          updateColorway({ images })
                        }}
                      >
                        <ArrowDown />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={selected.images.length === 1}
                        onClick={() =>
                          updateColorway({
                            images: selected.images.filter(
                              (_, itemIndex) => itemIndex !== index,
                            ),
                          })
                        }
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-5 flex max-w-2xl gap-2">
              <Input
                type="url"
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://…"
              />
              <Button
                variant="outline"
                disabled={!imageUrl || selected.images.length >= 8}
                onClick={() => {
                  try {
                    new URL(imageUrl)
                    updateColorway({ images: [...selected.images, imageUrl] })
                    setImageUrl('')
                  } catch {
                    toast.error('Enter a valid image URL')
                  }
                }}
              >
                <Plus data-icon="inline-start" /> Add image
              </Button>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="inventory" className="m-0">
          <div className="grid min-h-[calc(100vh-181px)] lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="border-r p-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">Colorways</h2>
                <Button variant="outline" size="sm" onClick={addColorway}>
                  <Plus data-icon="inline-start" /> Add
                </Button>
              </div>
              <div className="flex flex-col border">
                {draft.colorways.map((colorway) => (
                  <button
                    key={colorway.id}
                    type="button"
                    onClick={() => setColorway(colorway.id)}
                    className={`flex items-center gap-3 border-b p-3 text-left last:border-0 ${selected.id === colorway.id ? 'bg-muted' : 'hover:bg-muted/50'}`}
                  >
                    <span
                      className="size-8 border"
                      style={{ background: colorway.swatchHex }}
                    />
                    <span>
                      <strong className="block text-sm">
                        {colorway.name}
                        {colorway.isDefault ? ' (Default)' : ''}
                      </strong>
                      <span className="text-xs text-muted-foreground">
                        {colorway.styleColor}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </aside>
            <section className="min-w-0 p-4 md:p-7">
              <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Field label="Colorway name">
                  <Input
                    value={selected.name}
                    onChange={(event) =>
                      updateColorway({ name: event.target.value })
                    }
                  />
                </Field>
                <Field label="Style color">
                  <Input value={selected.styleColor} disabled />
                </Field>
                <Field label="Color family">
                  <Input
                    value={selected.colorFamily}
                    onChange={(event) =>
                      updateColorway({ colorFamily: event.target.value })
                    }
                  />
                </Field>
                <Field label="Swatch hex">
                  <Input
                    value={selected.swatchHex}
                    onChange={(event) =>
                      updateColorway({ swatchHex: event.target.value })
                    }
                  />
                </Field>
                <Field label="Price (IDR)">
                  <Input
                    type="number"
                    value={selected.price}
                    onChange={(event) =>
                      updateColorway({ price: event.target.valueAsNumber || 0 })
                    }
                  />
                </Field>
                <div className="flex items-end gap-6">
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={selected.isDefault}
                      onCheckedChange={(checked) => {
                        if (!checked) return
                        commit({
                          ...draft,
                          colorways: draft.colorways.map((item) => ({
                            ...item,
                            isDefault: item.id === selected.id,
                          })),
                        })
                      }}
                    />{' '}
                    Default
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={selected.onSale}
                      onCheckedChange={(onSale) => updateColorway({ onSale })}
                    />{' '}
                    On sale
                  </label>
                </div>
              </div>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold">
                  SKU inventory{' '}
                  <span className="font-normal text-muted-foreground">
                    ({selected.styleColor})
                  </span>
                </h2>
                {saved ? (
                  <span className="flex items-center gap-1 text-xs text-success">
                    <CheckCircle2 className="size-4" /> Saved
                  </span>
                ) : null}
              </div>
              <div className="overflow-x-auto border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Size</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Stock quantity</TableHead>
                      <TableHead>In stock</TableHead>
                      <TableHead>Price (IDR)</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedSkus.map((sku) => (
                      <TableRow key={sku.id}>
                        <TableCell className="font-semibold">
                          {sku.sizeLabel}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {sku.id}
                        </TableCell>
                        <TableCell>
                          <Input
                            className="w-24"
                            type="number"
                            min="0"
                            value={sku.stockQty}
                            onChange={(event) =>
                              commit({
                                ...draft,
                                skus: draft.skus.map((item) =>
                                  item.id === sku.id
                                    ? {
                                        ...item,
                                        stockQty:
                                          event.target.valueAsNumber || 0,
                                        inStock:
                                          (event.target.valueAsNumber || 0) > 0,
                                      }
                                    : item,
                                ),
                              })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={sku.inStock}
                            onCheckedChange={(inStock) =>
                              commit({
                                ...draft,
                                skus: draft.skus.map((item) =>
                                  item.id === sku.id
                                    ? { ...item, inStock }
                                    : item,
                                ),
                              })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="w-32"
                            type="number"
                            min="0"
                            value={sku.price}
                            onChange={(event) =>
                              commit({
                                ...draft,
                                skus: draft.skus.map((item) =>
                                  item.id === sku.id
                                    ? {
                                        ...item,
                                        price: event.target.valueAsNumber || 0,
                                      }
                                    : item,
                                ),
                              })
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {sku.stockQty === 0 ? (
                            <Badge variant="sale">Out of stock</Badge>
                          ) : sku.stockQty <= 5 ? (
                            <Badge variant="sale">Low stock</Badge>
                          ) : (
                            <Badge>In stock</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </section>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function ExistingProductEditorPage({
  productId,
  tab,
  colorwayId,
}: {
  productId: string
  tab: EditorTab
  colorwayId?: string
}) {
  const query = useQuery(productAggregateQuery(productId))
  if (query.isPending)
    return (
      <div className="p-8 text-sm text-muted-foreground">Loading product…</div>
    )
  if (query.isError)
    return <div className="p-8 text-destructive">{query.error.message}</div>
  return (
    <ProductEditor
      key={productId}
      initial={query.data}
      isNew={false}
      tab={tab}
      colorwayId={colorwayId}
    />
  )
}

export function NewProductEditorPage({
  tab,
  colorwayId,
}: {
  tab: EditorTab
  colorwayId?: string
}) {
  return (
    <ProductEditor
      initial={createInitialAggregate()}
      isNew
      tab={tab}
      colorwayId={colorwayId}
    />
  )
}

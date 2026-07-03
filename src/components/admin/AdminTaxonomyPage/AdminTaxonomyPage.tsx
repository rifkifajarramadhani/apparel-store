import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { AdminPageHeader } from '#/components/admin/AdminPageHeader/AdminPageHeader'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#/components/ui/table'
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
  createCategory,
  createCollection,
  deleteCategory,
  deleteCollection,
  updateCategory,
  updateCollection,
} from '#/lib/api'
import { categoriesQuery, collectionsQuery, queryKeys } from '#/lib/query'
import {
  CategoryInputSchema,
  CollectionInputSchema,
} from '#/services/schemas/admin'
import type { Category, Collection } from '#/types/catalog'

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export function AdminCategoriesPage() {
  const categories = useSuspenseQuery(categoriesQuery()).data
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState('men')
  const queryClient = useQueryClient()
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.categories })
  const saveMutation = useMutation({
    mutationFn: (category: Category) =>
      updateCategory(CategoryInputSchema.parse(category)),
    onSuccess: async () => {
      await refresh()
      toast.success('Category updated')
    },
    onError: (error) => toast.error(error.message),
  })
  const createMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: async () => {
      setName('')
      await refresh()
      toast.success('Category created')
    },
    onError: (error) => toast.error(error.message),
  })
  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: async () => {
      await refresh()
      toast.success('Category deleted')
    },
    onError: (error) => toast.error(error.message),
  })
  const parents = categories.filter((category) => category.level === 0)
  const add = () => {
    const parent = parents.find((item) => item.id === parentId)
    if (!parent) return
    const slug = `${parent.slug}-${slugify(name)}`
    createMutation.mutate(
      CategoryInputSchema.parse({
        id: slug,
        slug,
        name,
        parentId,
        gender: parent.gender,
        level: 1,
      }),
    )
  }
  return (
    <div>
      <AdminPageHeader
        title="Categories"
        description="Organize the storefront catalog hierarchy."
        actions={
          <div className="flex gap-2">
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {parents.map((parent) => (
                    <SelectItem key={parent.id} value={parent.id}>
                      {parent.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Category name"
            />
            <Button disabled={!name.trim()} onClick={add}>
              <Plus data-icon="inline-start" /> Add
            </Button>
          </div>
        }
      />
      <div className="p-4 md:p-7">
        <div className="border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>
                    <Input
                      defaultValue={category.name}
                      onBlur={(event) => {
                        if (event.target.value !== category.name)
                          saveMutation.mutate({
                            ...category,
                            name: event.target.value,
                          })
                      }}
                    />
                  </TableCell>
                  <TableCell>{category.slug}</TableCell>
                  <TableCell>{category.parentId ?? 'Root'}</TableCell>
                  <TableCell>{category.gender}</TableCell>
                  <TableCell>
                    {category.level === 1 ? (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <Trash2 />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Delete category?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Deletion is blocked if products still reference
                              it.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(category.id)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

export function AdminCollectionsPage() {
  const collections = useSuspenseQuery(collectionsQuery()).data
  const [name, setName] = useState('')
  const queryClient = useQueryClient()
  const refresh = () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.collections })
  const saveMutation = useMutation({
    mutationFn: (collection: Collection) =>
      updateCollection(CollectionInputSchema.parse(collection)),
    onSuccess: async () => {
      await refresh()
      toast.success('Collection updated')
    },
    onError: (error) => toast.error(error.message),
  })
  const createMutation = useMutation({
    mutationFn: createCollection,
    onSuccess: async () => {
      setName('')
      await refresh()
      toast.success('Collection created')
    },
    onError: (error) => toast.error(error.message),
  })
  const deleteMutation = useMutation({
    mutationFn: deleteCollection,
    onSuccess: async () => {
      await refresh()
      toast.success('Collection deleted')
    },
    onError: (error) => toast.error(error.message),
  })
  const add = () => {
    const slug = slugify(name)
    createMutation.mutate(CollectionInputSchema.parse({ id: slug, slug, name }))
  }
  return (
    <div>
      <AdminPageHeader
        title="Collections"
        description="Curate cross-category product groupings."
        actions={
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Collection name"
            />
            <Button disabled={!name.trim()} onClick={add}>
              <Plus data-icon="inline-start" /> Add
            </Button>
          </div>
        }
      />
      <div className="p-4 md:p-7">
        <div className="border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {collections.map((collection) => (
                <TableRow key={collection.id}>
                  <TableCell>
                    <Input
                      defaultValue={collection.name}
                      onBlur={(event) => {
                        if (event.target.value !== collection.name)
                          saveMutation.mutate({
                            ...collection,
                            name: event.target.value,
                          })
                      }}
                    />
                  </TableCell>
                  <TableCell>{collection.slug}</TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete collection?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Deletion is blocked while products still use this
                            collection.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(collection.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

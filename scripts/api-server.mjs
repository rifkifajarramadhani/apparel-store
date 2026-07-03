import jsonServer from 'json-server'
import auth from 'json-server-auth'
import jwt from 'jsonwebtoken'

const PORT = Number(process.env.API_PORT ?? 3001)
const JWT_SECRET = 'json-server-auth-123456'
const CATALOG_RESOURCES = new Set([
  'products',
  'colorways',
  'skus',
  'categories',
  'collections',
])

const app = jsonServer.create()
const router = jsonServer.router('db.json')
app.db = router.db
app.use(jsonServer.defaults())
app.use(jsonServer.bodyParser)

app.use((req, res, next) => {
  const isRegistration =
    req.method === 'POST' &&
    ['/register', '/signup', '/users'].includes(req.path)
  if (isRegistration) {
    req.body.role = 'user'
    return next()
  }
  if (req.path.startsWith('/users') && req.method !== 'GET') {
    return requireAdmin(req, res, next)
  }
  next()
})

function sendError(res, status, message, details) {
  res.status(status).jsonp({ error: message, ...(details ? { details } : {}) })
}

function requireAdmin(req, res, next) {
  const [scheme, token] = String(req.headers.authorization ?? '').split(' ')
  if (scheme !== 'Bearer' || !token)
    return sendError(res, 401, 'Authentication required')
  try {
    const claims = jwt.verify(token, JWT_SECRET)
    const user = app.db.get('users').getById(Number(claims.sub)).value()
    if (!user || user.role !== 'admin')
      return sendError(res, 403, 'Administrator access required')
    req.admin = user
    next()
  } catch {
    return sendError(res, 401, 'Invalid or expired session')
  }
}

function deriveProduct(aggregate, existingProduct) {
  const { product, colorways, skus } = aggregate
  if (
    !product?.id ||
    !Array.isArray(colorways) ||
    colorways.length === 0 ||
    !Array.isArray(skus)
  ) {
    throw new Error('Product, at least one colorway, and SKUs are required')
  }
  const defaults = colorways.filter((item) => item.isDefault)
  if (defaults.length !== 1)
    throw new Error('Exactly one colorway must be the default')
  if (colorways.some((item) => item.productId !== product.id))
    throw new Error('Invalid colorway relationship')
  const colorwayIds = new Set(colorways.map((item) => item.id))
  if (
    skus.some(
      (item) =>
        item.productId !== product.id || !colorwayIds.has(item.colorwayId),
    )
  ) {
    throw new Error('Invalid SKU relationship')
  }
  const selected = defaults[0]
  const prices = colorways.map((item) => Number(item.price))
  const retainedBadges = (existingProduct?.badges ?? []).filter(
    (badge) => badge !== 'Sale',
  )
  return {
    ...product,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    badges: colorways.some((item) => item.onSale)
      ? [...retainedBadges, 'Sale']
      : retainedBadges,
    colorwayCount: colorways.length,
    colorFamilies: [...new Set(colorways.map((item) => item.colorFamily))],
    swatches: colorways.map((item) => ({
      styleColor: item.styleColor,
      hex: item.swatchHex,
    })),
    thumbnailUrl: selected.images[0],
    hoverImageUrl: selected.images[1] ?? selected.images[0],
    defaultColorwayId: selected.id,
    sizes: [...new Set(skus.map((item) => item.size))],
  }
}

app.get('/admin/products/:id', requireAdmin, (req, res) => {
  const product = app.db.get('products').getById(req.params.id).value()
  if (!product) return sendError(res, 404, 'Product not found')
  const colorways = app.db
    .get('colorways')
    .filter({ productId: req.params.id })
    .value()
  const skus = app.db.get('skus').filter({ productId: req.params.id }).value()
  res.jsonp({ product, colorways, skus })
})

app.post('/admin/products', requireAdmin, (req, res) => {
  try {
    if (app.db.get('products').getById(req.body?.product?.id).value()) {
      return sendError(res, 409, 'Product ID already exists')
    }
    const product = deriveProduct(req.body)
    app.db.get('products').push(product).write()
    app.db
      .get('colorways')
      .push(...req.body.colorways)
      .write()
    app.db
      .get('skus')
      .push(...req.body.skus)
      .write()
    res.status(201).jsonp({ ...req.body, product })
  } catch (error) {
    sendError(
      res,
      400,
      error instanceof Error ? error.message : 'Invalid product',
    )
  }
})

app.put('/admin/products/:id', requireAdmin, (req, res) => {
  try {
    if (req.params.id !== req.body?.product?.id)
      return sendError(res, 409, 'Product ID is immutable')
    if (!app.db.get('products').getById(req.params.id).value())
      return sendError(res, 404, 'Product not found')
    const existingProduct = app.db.get('products').getById(req.params.id).value()
    const product = deriveProduct(req.body, existingProduct)
    app.db.get('products').find({ id: req.params.id }).assign(product).write()
    app.db.get('colorways').remove({ productId: req.params.id }).write()
    app.db.get('skus').remove({ productId: req.params.id }).write()
    app.db
      .get('colorways')
      .push(...req.body.colorways)
      .write()
    app.db
      .get('skus')
      .push(...req.body.skus)
      .write()
    res.jsonp({ ...req.body, product })
  } catch (error) {
    sendError(
      res,
      400,
      error instanceof Error ? error.message : 'Invalid product',
    )
  }
})

app.delete('/admin/products/:id', requireAdmin, (req, res) => {
  const product = app.db.get('products').getById(req.params.id).value()
  if (!product) return sendError(res, 404, 'Product not found')
  app.db.get('skus').remove({ productId: req.params.id }).write()
  app.db.get('colorways').remove({ productId: req.params.id }).write()
  app.db.get('products').remove({ id: req.params.id }).write()
  res.jsonp({ success: true })
})

app.delete('/categories/:id', requireAdmin, (req, res, next) => {
  const products = app.db
    .get('products')
    .filter({ categoryId: req.params.id })
    .size()
    .value()
  const children = app.db
    .get('categories')
    .filter({ parentId: req.params.id })
    .size()
    .value()
  if (products || children)
    return sendError(res, 409, 'Category is still referenced', {
      products,
      children,
    })
  next()
})

app.delete('/collections/:id', requireAdmin, (req, res, next) => {
  const products = app.db
    .get('products')
    .filter((item) => item.collectionIds?.includes(req.params.id))
    .size()
    .value()
  if (products)
    return sendError(res, 409, 'Collection is still referenced', { products })
  next()
})

app.use((req, res, next) => {
  const resource = req.path.split('/').filter(Boolean)[0]
  if (req.method !== 'GET' && CATALOG_RESOURCES.has(resource))
    return requireAdmin(req, res, next)
  next()
})
app.use(auth)
app.use(router)
app.listen(PORT, () =>
  console.log(`AXIS API listening on http://localhost:${PORT}`),
)

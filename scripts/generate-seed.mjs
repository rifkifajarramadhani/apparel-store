// Single writer of db.json. Deterministic (seeded RNG), dependency-free.
// Edit CATALOG to add products; ids/slugs/skus/price-ranges/card fields derive automatically.
// Run: `npm run seed`  (also self-checks referential integrity on run).
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const BRAND = 'AXIS' // rename in one place to rebrand

// ── seeded RNG (mulberry32) — stable output across runs ─────────────────────
function rng(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = rng(20260703)
const pick = (arr) => arr[Math.floor(rand() * arr.length)]
const between = (lo, hi) => lo + Math.floor(rand() * (hi - lo + 1))
const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

// ── palette: colour name → {hex, family, code} ──────────────────────────────
const COLORS = {
  Black: { hex: '111111', family: 'Black', code: '010' },
  White: { hex: 'F5F5F5', family: 'White', code: '100' },
  Grey: { hex: '9CA3AF', family: 'Grey', code: '070' },
  Navy: { hex: '1E293B', family: 'Blue', code: '410' },
  Royal: { hex: '2563EB', family: 'Blue', code: '430' },
  Red: { hex: 'DC2626', family: 'Red', code: '600' },
  Green: { hex: '16A34A', family: 'Green', code: '300' },
  Olive: { hex: '4D7C0F', family: 'Green', code: '320' },
  Beige: { hex: 'D6C7A1', family: 'Neutral', code: '200' },
  Pink: { hex: 'EC4899', family: 'Pink', code: '650' },
  Orange: { hex: 'EA580C', family: 'Orange', code: '800' },
  Purple: { hex: '7C3AED', family: 'Purple', code: '500' },
}

// ── size scales ─────────────────────────────────────────────────────────────
const SIZE_SCALES = {
  'apparel-alpha': ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  'shoe-eu': ['38', '39', '40', '41', '42', '43', '44', '45'],
  'kids-apparel': ['XS', 'S', 'M', 'L'],
}

// ── categories (self-referential tree) ──────────────────────────────────────
const CATEGORIES = [
  ['men', 'Men', null, 'men', 0],
  ['women', 'Women', null, 'women', 0],
  ['kids', 'Kids', null, 'kids', 0],
  ['men-hoodies', 'Hoodies & Sweatshirts', 'men', 'men', 1],
  ['men-tees', 'Tops & T-Shirts', 'men', 'men', 1],
  ['men-pants', 'Trousers & Tights', 'men', 'men', 1],
  ['men-shoes', 'Shoes', 'men', 'men', 1],
  ['women-hoodies', 'Hoodies & Sweatshirts', 'women', 'women', 1],
  ['women-tees', 'Tops & T-Shirts', 'women', 'women', 1],
  ['women-leggings', 'Leggings & Tights', 'women', 'women', 1],
  ['women-shoes', 'Shoes', 'women', 'women', 1],
  ['kids-hoodies', 'Hoodies & Sweatshirts', 'kids', 'kids', 1],
  ['kids-tees', 'Tops & T-Shirts', 'kids', 'kids', 1],
  ['kids-shoes', 'Shoes', 'kids', 'kids', 1],
].map(([id, name, parentId, gender, level]) => ({
  id,
  slug: id,
  name,
  parentId,
  gender,
  level,
}))

// ── collections ─────────────────────────────────────────────────────────────
const COLLECTIONS = [
  'Tech Fleece',
  'Essentials',
  'Pro Training',
  'Heritage',
  'Windrunner',
].map((name) => ({ id: slugify(name), slug: slugify(name), name }))

// ── curated catalogue. Everything else is derived. ──────────────────────────
// [name, subtitle, type, gender, categorySlug, sizeScale, basePrice, collections[], colors[]]
const CATALOG = [
  ['Sportswear Tech Fleece Hoodie', "Men's Full-Zip Hoodie", 'Hoodie', 'men', 'men-hoodies', 'apparel-alpha', 1590000, ['tech-fleece'], ['Black', 'Grey', 'Navy', 'Olive']],
  ['Club Fleece Pullover', "Men's Hoodie", 'Hoodie', 'men', 'men-hoodies', 'apparel-alpha', 899000, ['essentials'], ['Black', 'Grey', 'Beige']],
  ['Dri-FIT Training Tee', "Men's Short-Sleeve Top", 'T-Shirt', 'men', 'men-tees', 'apparel-alpha', 449000, ['pro-training'], ['Black', 'White', 'Royal', 'Red']],
  ['Heritage Graphic Tee', "Men's T-Shirt", 'T-Shirt', 'men', 'men-tees', 'apparel-alpha', 499000, ['heritage'], ['White', 'Black', 'Olive']],
  ['Tech Fleece Jogger', "Men's Trousers", 'Trousers', 'men', 'men-pants', 'apparel-alpha', 1290000, ['tech-fleece'], ['Black', 'Grey', 'Navy']],
  ['Pro Training Tights', "Men's Tights", 'Tights', 'men', 'men-pants', 'apparel-alpha', 649000, ['pro-training'], ['Black', 'Grey']],
  ['Pegasus Trail Runner', "Men's Road Running Shoes", 'Shoes', 'men', 'men-shoes', 'shoe-eu', 1990000, ['pro-training'], ['Black', 'White', 'Royal', 'Orange']],
  ['Windrunner Jacket', "Women's Full-Zip Jacket", 'Jacket', 'women', 'women-hoodies', 'apparel-alpha', 1490000, ['windrunner'], ['Black', 'Pink', 'Beige', 'Purple']],
  ['Sportswear Essential Crew', "Women's Sweatshirt", 'Sweatshirt', 'women', 'women-hoodies', 'apparel-alpha', 849000, ['essentials'], ['Grey', 'Pink', 'White']],
  ['Dri-FIT Ribbed Tank', "Women's Training Top", 'Tank', 'women', 'women-tees', 'apparel-alpha', 399000, ['pro-training'], ['Black', 'White', 'Pink']],
  ['Heritage Boxy Tee', "Women's T-Shirt", 'T-Shirt', 'women', 'women-tees', 'apparel-alpha', 459000, ['heritage'], ['White', 'Beige', 'Purple']],
  ['Universa High-Waist Legging', "Women's Leggings", 'Leggings', 'women', 'women-leggings', 'apparel-alpha', 899000, ['pro-training'], ['Black', 'Navy', 'Olive', 'Purple']],
  ['Fast Running Legging', "Women's Tights", 'Tights', 'women', 'women-leggings', 'apparel-alpha', 749000, ['pro-training'], ['Black', 'Grey']],
  ['Air Zoom Trainer', "Women's Road Running Shoes", 'Shoes', 'women', 'women-shoes', 'shoe-eu', 1890000, ['pro-training'], ['White', 'Pink', 'Black']],
  ['Kids Tech Fleece Hoodie', "Older Kids' Hoodie", 'Hoodie', 'kids', 'kids-hoodies', 'kids-apparel', 799000, ['tech-fleece'], ['Black', 'Royal', 'Red']],
  ['Kids Sportswear Crew', "Younger Kids' Sweatshirt", 'Sweatshirt', 'kids', 'kids-hoodies', 'kids-apparel', 549000, ['essentials'], ['Grey', 'Green', 'Pink']],
  ['Kids Graphic Tee 2-Pack', "Kids' T-Shirt", 'T-Shirt', 'kids', 'kids-tees', 'kids-apparel', 349000, ['essentials'], ['White', 'Black', 'Orange']],
  ['Kids Revolution Sneaker', "Younger Kids' Shoes", 'Shoes', 'kids', 'kids-shoes', 'shoe-eu', 749000, ['pro-training'], ['Black', 'Royal', 'Pink']],
]

const BADGE_POOL = ['Just In', 'Bestseller']
const img = (hex, label) =>
  `https://placehold.co/800x800/${hex}/ffffff/png?text=${encodeURIComponent(label)}`

const products = []
const colorways = []
const skus = []

CATALOG.forEach((entry, i) => {
  const [name, subtitle, type, gender, categorySlug, sizeScale, basePrice, collectionIds, colorNames] = entry
  const style = `${BRAND.slice(0, 2).toUpperCase()}-${1001 + i}`
  const codeNoDash = style.replace('-', '')
  const slug = slugify(name)
  const sizes = SIZE_SCALES[sizeScale]
  const category = CATEGORIES.find((c) => c.slug === categorySlug)
  const publishedAt = new Date(2026, 0, 1 + between(0, 170)).toISOString().slice(0, 10)
  const onSale = rand() < 0.35 // ~1/3 of styles carry a discounted colourway

  const cwForStyle = colorNames.map((cn, ci) => {
    const c = COLORS[cn]
    const styleColor = `${codeNoDash}-${c.code}`
    // some colourways discounted → drives the Sale view
    const discounted = onSale && ci === colorNames.length - 1
    const price = discounted ? Math.round((basePrice * 0.8) / 1000) * 1000 : basePrice
    const images = [
      img(c.hex, name),
      img(c.hex, `${cn} 2`),
      img(c.hex, `${cn} 3`),
    ]
    const cw = {
      id: styleColor,
      productId: style,
      styleColor,
      name: `${name} — ${cn}`,
      colorFamily: c.family,
      swatchHex: `#${c.hex}`,
      price,
      isDefault: ci === 0,
      onSale: discounted,
      images,
    }
    colorways.push(cw)

    sizes.forEach((size) => {
      const inStock = rand() > 0.12
      skus.push({
        id: `${styleColor}-${size}`,
        colorwayId: styleColor,
        productId: style,
        size,
        sizeLabel: size,
        sizeScale,
        inStock,
        stockQty: inStock ? between(1, 40) : 0,
        price,
      })
    })
    return cw
  })

  const prices = cwForStyle.map((c) => c.price)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const colorFamilies = [...new Set(cwForStyle.map((c) => c.colorFamily))]
  const badges = []
  if (new Date(publishedAt) > new Date(2026, 3, 1)) badges.push('Just In')
  else if (rand() < 0.35) badges.push(pick(BADGE_POOL))
  if (minPrice < basePrice) badges.push('Sale')

  products.push({
    id: style,
    slug,
    name,
    subtitle,
    brand: BRAND,
    gender,
    type,
    categoryId: category.id,
    categorySlug,
    collectionIds,
    sizeScale,
    basePrice,
    minPrice,
    maxPrice,
    badges,
    colorwayCount: cwForStyle.length,
    colorFamilies,
    swatches: cwForStyle.map((c) => ({ styleColor: c.styleColor, hex: c.swatchHex })),
    thumbnailUrl: cwForStyle[0].images[0],
    hoverImageUrl: cwForStyle[0].images[1],
    defaultColorwayId: cwForStyle[0].id,
    sizes,
    description: `${name} (${subtitle}). Part of the ${BRAND} range — engineered for everyday performance and comfort.`,
    publishedAt,
  })
})

const sizeScales = Object.entries(SIZE_SCALES).map(([id, s]) => ({ id, sizes: s }))
const db = {
  products,
  colorways,
  skus,
  categories: CATEGORIES,
  collections: COLLECTIONS,
  sizeScales,
}

// ── self-check: fail loudly if the generator drifts ─────────────────────────
function selfCheck() {
  const pIds = new Set(products.map((p) => p.id))
  const cwIds = new Set(colorways.map((c) => c.id))
  for (const cw of colorways)
    if (!pIds.has(cw.productId)) throw new Error(`colorway ${cw.id} → missing product ${cw.productId}`)
  for (const s of skus) {
    if (!cwIds.has(s.colorwayId)) throw new Error(`sku ${s.id} → missing colorway ${s.colorwayId}`)
    if (!pIds.has(s.productId)) throw new Error(`sku ${s.id} → missing product ${s.productId}`)
  }
  for (const p of products) {
    const cw = colorways.filter((c) => c.productId === p.id)
    const lo = Math.min(...cw.map((c) => c.price))
    const hi = Math.max(...cw.map((c) => c.price))
    if (p.minPrice !== lo || p.maxPrice !== hi)
      throw new Error(`price range drift on ${p.id}: card ${p.minPrice}-${p.maxPrice} vs cw ${lo}-${hi}`)
    if (p.colorwayCount !== cw.length) throw new Error(`colorwayCount drift on ${p.id}`)
  }
  for (const c of CATEGORIES)
    if (c.parentId && !CATEGORIES.some((x) => x.id === c.parentId))
      throw new Error(`category ${c.id} → missing parent ${c.parentId}`)
}
selfCheck()

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'db.json')
writeFileSync(out, JSON.stringify(db, null, 2))
console.log(
  `db.json: ${products.length} products, ${colorways.length} colourways, ${skus.length} skus, ${CATEGORIES.length} categories, ${COLLECTIONS.length} collections`,
)

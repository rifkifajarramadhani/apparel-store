import { beforeEach, expect, test } from 'vitest'
import { useCart } from './cart'
import { useFavorites } from './favorites'

const sku = {
  skuId: 'AX1001-010-M',
  productId: 'AX-1001',
  styleColor: 'AX1001-010',
  slug: 'sportswear-tech-fleece-hoodie',
  size: 'M',
  name: 'Tech Fleece Hoodie — Black',
  price: 1590000,
  image: 'x',
}

beforeEach(() => {
  useCart.setState({ items: [] })
  useFavorites.setState({ ids: [] })
})

test('add dedupes by skuId and accumulates qty', () => {
  useCart.getState().add(sku)
  useCart.getState().add(sku, 2)
  const items = useCart.getState().items
  expect(items).toHaveLength(1)
  expect(items[0].qty).toBe(3)
})

test('setQty to 0 removes the line; subtotal reflects qty*price', () => {
  useCart.getState().add(sku, 2)
  expect(useCart.getState().items[0].price * useCart.getState().items[0].qty).toBe(3180000)
  useCart.getState().setQty(sku.skuId, 0)
  expect(useCart.getState().items).toHaveLength(0)
})

test('remove drops the matching sku only', () => {
  useCart.getState().add(sku)
  useCart.getState().add({ ...sku, skuId: 'AX1001-010-L', size: 'L' })
  useCart.getState().remove('AX1001-010-M')
  expect(useCart.getState().items.map((i) => i.skuId)).toEqual(['AX1001-010-L'])
})

test('favorites toggle adds then removes by styleColor', () => {
  useFavorites.getState().toggle('AX1001-010')
  expect(useFavorites.getState().ids).toContain('AX1001-010')
  useFavorites.getState().toggle('AX1001-010')
  expect(useFavorites.getState().ids).not.toContain('AX1001-010')
})

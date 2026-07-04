// Order shapes returned by the backend (POST/GET /api/orders).

export interface OrderItem {
  skuId: string
  productId: string
  name: string
  size: string
  unitPrice: number
  qty: number
}

export interface Order {
  id: number
  userId: number
  status: string
  total: number
  createdAt: string
  items: OrderItem[]
}

// A line the client sends at checkout; price is resolved server-side.
export interface OrderLineInput {
  skuId: string
  qty: number
}

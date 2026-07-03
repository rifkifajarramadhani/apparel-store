// Integer rupiah in, formatted "Rp 1.590.000" out.
const idr = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export const formatIDR = (amount: number) => idr.format(amount)

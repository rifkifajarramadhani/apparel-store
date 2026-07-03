import { describe, expect, it } from 'vitest'
import { safeAdminRedirect } from './admin-auth'

describe('safeAdminRedirect', () => {
  it('accepts only internal admin paths', () => {
    expect(safeAdminRedirect('/admin/products?tab=details')).toBe('/admin/products?tab=details')
    expect(safeAdminRedirect('//evil.example/admin')).toBe('/admin')
    expect(safeAdminRedirect('https://evil.example')).toBe('/admin')
    expect(safeAdminRedirect('/account')).toBe('/admin')
  })
})


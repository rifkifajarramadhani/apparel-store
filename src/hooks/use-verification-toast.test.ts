// @vitest-environment jsdom

import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { useVerificationToast } from './use-verification-toast'

const navigate = vi.fn()

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
}))

describe('useVerificationToast', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows success and clears the transient param', () => {
    renderHook(() => useVerificationToast('success'))

    expect(toast.success).toHaveBeenCalledWith(
      'Your email has been verified. You can now sign in.',
    )
    expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({ to: '.', replace: true }),
    )
  })

  it('shows an error for an invalid link and clears the param', () => {
    renderHook(() => useVerificationToast('invalid'))

    expect(toast.error).toHaveBeenCalledWith(
      'This verification link is invalid or expired. Please request a new one.',
    )
    expect(navigate).toHaveBeenCalledOnce()
  })

  it('does nothing without a status', () => {
    renderHook(() => useVerificationToast(undefined))

    expect(toast.success).not.toHaveBeenCalled()
    expect(toast.error).not.toHaveBeenCalled()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('drops verification but keeps other search params', () => {
    renderHook(() => useVerificationToast('invalid'))

    const updater = navigate.mock.calls[0][0].search as (
      p: Record<string, unknown>,
    ) => Record<string, unknown>
    expect(updater({ verification: 'invalid', redirect: '/admin' })).toEqual({
      redirect: '/admin',
    })
  })
})

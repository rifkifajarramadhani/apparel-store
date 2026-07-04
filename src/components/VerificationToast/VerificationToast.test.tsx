// @vitest-environment jsdom

import { render } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from 'sonner'
import { VerificationToast } from './VerificationToast'

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}))

describe('VerificationToast', () => {
  beforeEach(() => vi.clearAllMocks())

  it('shows success and consumes the transient status', () => {
    const onConsumed = vi.fn()
    render(<VerificationToast status="success" onConsumed={onConsumed} />)

    expect(toast.success).toHaveBeenCalledWith(
      'Your email has been verified. You can now sign in.',
    )
    expect(onConsumed).toHaveBeenCalledOnce()
  })

  it('shows an error for an invalid link and consumes the status', () => {
    const onConsumed = vi.fn()
    render(<VerificationToast status="invalid" onConsumed={onConsumed} />)

    expect(toast.error).toHaveBeenCalledWith(
      'This verification link is invalid or expired. Please request a new one.',
    )
    expect(onConsumed).toHaveBeenCalledOnce()
  })
})

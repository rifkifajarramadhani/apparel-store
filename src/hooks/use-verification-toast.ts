import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

export function useVerificationToast(status: 'success' | 'invalid' | undefined) {
  const navigate = useNavigate()
  useEffect(() => {
    if (!status) return
    if (status === 'success') {
      toast.success('Your email has been verified. You can now sign in.')
    } else {
      toast.error(
        'This verification link is invalid or expired. Please request a new one.',
      )
    }
    // ponytail: relative navigate drops `verification`, keeps everything else
    // (e.g. login's `redirect`). If TanStack's loose typing on `to: '.'` fights
    // the search updater, pass the route's `to` in as an arg instead.
    void navigate({
      to: '.',
      replace: true,
      search: (prev: Record<string, unknown>) => {
        const { verification: _drop, ...rest } = prev
        return rest
      },
    })
  }, [navigate, status])
}

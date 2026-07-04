import { useEffect } from 'react'
import { toast } from 'sonner'

interface VerificationToastProps {
  status: 'success' | 'invalid' | undefined
  onConsumed: () => void
}

export function VerificationToast({
  status,
  onConsumed,
}: VerificationToastProps) {
  useEffect(() => {
    if (!status) return

    if (status === 'success') {
      toast.success('Your email has been verified. You can now sign in.')
    } else {
      toast.error(
        'This verification link is invalid or expired. Please request a new one.',
      )
    }
    onConsumed()
  }, [onConsumed, status])

  return null
}

import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { login, register } from '#/lib/api'
import { useAuth } from '#/stores/auth'
import { Button } from '#/components/ui/button'
import { Input } from '#/components/ui/input'
import { Label } from '#/components/ui/label'
import { safeAdminRedirect } from '#/lib/admin-auth'
import { useVerificationToast } from '#/hooks/use-verification-toast'

export const Route = createFileRoute('/login')({
  validateSearch: z.object({
    redirect: z.string().optional(),
    verification: z.literal('invalid').optional(),
  }),
  component: LoginPage,
})

function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const setSession = useAuth((s) => s.setSession)
  const navigate = useNavigate()
  const { redirect, verification } = Route.useSearch()

  useVerificationToast(verification)

  const mutation = useMutation({
    mutationFn: async () => {
      if (mode === 'login') {
        return { kind: 'login' as const, session: await login(email, password) }
      }
      return {
        kind: 'register' as const,
        result: await register({ email, password, username }),
      }
    },
    onSuccess: (out) => {
      if (out.kind === 'register') {
        setNotice(out.result.message)
        return
      }
      setSession(out.session)
      if (redirect) {
        window.location.assign(safeAdminRedirect(redirect))
        return
      }
      navigate({ to: '/account' })
    },
  })

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="display mb-6 text-3xl">
        {mode === 'login' ? 'Sign in' : 'Create account'}
      </h1>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          mutation.mutate()
        }}
        className="space-y-4"
      >
        {mode === 'register' && (
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              required
              minLength={3}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={
              mode === 'login' ? 'current-password' : 'new-password'
            }
          />
        </div>

        {mutation.isError && (
          <p className="text-sm text-destructive">{mutation.error.message}</p>
        )}

        {notice && <p className="text-sm text-muted-foreground">{notice}</p>}

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending
            ? 'Please wait…'
            : mode === 'login'
              ? 'Sign in'
              : 'Create account'}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === 'login' ? 'register' : 'login')
          setNotice(null)
          mutation.reset()
        }}
        className="mt-6 text-sm text-muted-foreground hover:text-foreground"
      >
        {mode === 'login'
          ? "Don't have an account? Register"
          : 'Already have an account? Sign in'}
      </button>
    </div>
  )
}

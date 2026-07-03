import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { useAuth } from '#/stores/auth'
import { useHydrated } from '#/stores/useHydrated'
import { Button } from '#/components/ui/button'

export const Route = createFileRoute('/account')({
  component: Account,
})

function Account() {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const hydrated = useHydrated()
  const navigate = useNavigate()

  // Session lives in localStorage — only trust it post-hydration.
  if (!hydrated) {
    return <p className="py-24 text-center text-muted-foreground">Loading…</p>
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-sm px-4 py-24 text-center">
        <p className="text-muted-foreground">You are not signed in.</p>
        <Link
          to="/login"
          className="mt-6 inline-block rounded-full bg-foreground px-8 py-3 font-semibold text-background"
        >
          Sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="display mb-6 text-3xl">Account</h1>
      <dl className="space-y-3 text-sm">
        {user.username && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Username</dt>
            <dd>{user.username}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Email</dt>
          <dd>{user.email}</dd>
        </div>
        {user.role && (
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Role</dt>
            <dd>{user.role}</dd>
          </div>
        )}
      </dl>

      <Button
        variant="outline"
        className="mt-8 w-full"
        onClick={() => {
          logout()
          navigate({ to: '/' })
        }}
      >
        Log out
      </Button>
    </div>
  )
}

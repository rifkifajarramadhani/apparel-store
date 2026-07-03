export function safeAdminRedirect(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/admin') ||
    value.startsWith('//')
  )
    return '/admin'
  return value
}

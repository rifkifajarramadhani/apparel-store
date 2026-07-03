import { createFileRoute } from '@tanstack/react-router'
import { AdminShell } from '#/components/admin/AdminShell/AdminShell'

export const Route = createFileRoute('/admin')({ component: AdminShell })

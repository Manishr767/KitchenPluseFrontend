import { CircleAlert } from 'lucide-react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { LoadingBlock } from '@/components/common/Spinner'
import { AppLayout } from '@/layouts/AppLayout'
import { useAuth } from '@/features/auth/useAuth'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import type { Role } from '@/types'

/** Everything inside requires a valid session. */
export function ProtectedRoute() {
  const { status, restoreError, retryRestore, logout } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="flex min-h-full items-center justify-center">
        <LoadingBlock label="Restoring your session…" />
      </div>
    )
  }
  if (status === 'unavailable') {
    return (
      <div className="flex min-h-full items-center justify-center px-4">
        <div role="alert" className="max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full bg-red-50 text-red-600">
            <CircleAlert className="size-5" aria-hidden="true" />
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Can’t reach KitchenPulse</h1>
          <p className="mt-1 text-sm text-gray-500">{restoreError}</p>
          <p className="mt-1 text-sm text-gray-500">Your session is still saved. Try again once the server is back.</p>
          <div className="mt-5 flex justify-center gap-2">
            <Button onClick={retryRestore}>Try again</Button>
            <Button variant="secondary" onClick={() => logout()}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    )
  }
  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <AppLayout />
}

/**
 * Hides pages the role cannot use. This is a convenience only: the backend enforces
 * the real permissions and answers 403 regardless of what the UI shows.
 */
export function RoleRoute({ roles }: { roles: Role[] }) {
  const { user } = useAuth()
  if (!user || !roles.includes(user.role)) return <ForbiddenPage />
  return <Outlet />
}

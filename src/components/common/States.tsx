import { CircleAlert, Inbox } from 'lucide-react'
import type { ReactNode } from 'react'
import { toApiError } from '@/api/errors'
import { Button } from './Button'

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <Inbox className="size-5" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-gray-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

/** Shows the real API failure; never substitutes mock data. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const apiError = toApiError(error)
  const forbidden = apiError.status === 403
  return (
    <div role="alert" className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-red-50 text-red-600">
        <CircleAlert className="size-5" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-gray-900">
        {forbidden ? 'You don’t have access to this data' : 'Couldn’t load this data'}
      </p>
      <p className="mt-1 max-w-md text-sm text-gray-500">{apiError.message}</p>
      {onRetry && !forbidden && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

export function InlineAlert({
  tone = 'error',
  children,
}: {
  tone?: 'error' | 'info' | 'warning'
  children: ReactNode
}) {
  const tones = {
    error: 'border-red-200 bg-red-50 text-red-800',
    info: 'border-brand-200 bg-brand-50 text-brand-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
  }
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-3 py-2.5 text-sm ${tones[tone]}`}>
      {children}
    </div>
  )
}

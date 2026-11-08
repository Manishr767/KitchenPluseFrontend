import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/common/Card'
import { LoadingBlock } from '@/components/common/Spinner'
import { EmptyState, ErrorState } from '@/components/common/States'

export interface RecentRow {
  id: number
  title: string
  subtitle: string
  meta: string
  to: string
}

export function RecentList({
  title,
  description,
  viewAllTo,
  rows,
  loading,
  error,
  onRetry,
  emptyTitle,
  extra,
}: {
  title: string
  description?: string
  viewAllTo?: string
  rows: RecentRow[] | undefined
  loading: boolean
  error: unknown
  onRetry: () => void
  emptyTitle: string
  extra?: ReactNode
}) {
  return (
    <Card
      title={title}
      description={description}
      padded={false}
      action={
        viewAllTo ? (
          <Link to={viewAllTo} className="text-sm font-medium text-brand-600 hover:text-brand-700">
            View all
          </Link>
        ) : undefined
      }
    >
      {loading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : !rows || rows.length === 0 ? (
        <EmptyState title={emptyTitle} />
      ) : (
        <ul className="divide-y divide-gray-100">
          {rows.map((row) => (
            <li key={row.id}>
              <Link to={row.to} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-gray-50">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">{row.title}</p>
                  <p className="truncate text-xs text-gray-500">{row.subtitle}</p>
                </div>
                <p className="tabular shrink-0 text-xs text-gray-500">{row.meta}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {extra}
    </Card>
  )
}

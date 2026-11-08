import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Spinner } from '@/components/common/Spinner'

export function StatCard({
  label,
  value,
  footnote,
  derived = false,
  icon: Icon,
  to,
  loading,
  error,
}: {
  label: string
  value: number | undefined
  footnote?: ReactNode
  /** True when the number is counted in the browser from a full list rather than returned by the API. */
  derived?: boolean
  icon: LucideIcon
  to?: string
  loading?: boolean
  error?: boolean
}) {
  const body = (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-gray-300">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <div className="flex size-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
          <Icon className="size-4" aria-hidden="true" />
        </div>
      </div>
      <p className="tabular mt-2 text-3xl font-semibold text-gray-900">
        {loading ? <Spinner className="size-6 text-gray-300" /> : error ? '–' : value}
      </p>
      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
        {error ? <span className="text-red-600">Couldn’t load</span> : footnote}
        {derived && !loading && !error && (
          <span
            className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-600"
            title="Counted in the browser from the full list returned by the API"
          >
            derived
          </span>
        )}
      </div>
    </div>
  )
  return to ? (
    <Link to={to} className="block">
      {body}
    </Link>
  ) : (
    body
  )
}

export function SplitBar({
  label,
  active,
  inactive,
  derived = false,
}: {
  label: string
  active: number
  inactive: number
  derived?: boolean
}) {
  const total = active + inactive
  const pct = total === 0 ? 0 : Math.round((active / total) * 100)
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-sm">
        <span className="font-medium text-gray-800">
          {label}
          {derived && <span className="ml-2 text-xs font-normal text-gray-500">derived</span>}
        </span>
        <span className="tabular text-gray-500">
          {active} active · {inactive} inactive
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-gray-200"
        role="img"
        aria-label={`${label}: ${active} active of ${total}`}
      >
        <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function PendingModulesNote() {
  return (
    <p className="text-sm text-gray-500">
      Inventory levels, stock counts, requests and deliveries will appear here once the backend supports them.
    </p>
  )
}

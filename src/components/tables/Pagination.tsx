import { ChevronLeft, ChevronRight } from 'lucide-react'

/** `page` is 0-based, matching the backend. */
export function Pagination({
  page,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
}: {
  page: number
  totalPages: number
  totalElements: number
  pageSize: number
  onPageChange: (page: number) => void
}) {
  if (totalElements === 0) return null
  const from = page * pageSize + 1
  const to = Math.min((page + 1) * pageSize, totalElements)

  // Compact window: first, last and neighbours of the current page.
  const pages = new Set<number>([0, totalPages - 1, page - 1, page, page + 1])
  const visible = [...pages].filter((p) => p >= 0 && p < totalPages).sort((a, b) => a - b)

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3">
      <p className="tabular text-sm text-gray-500">
        Showing {from}–{to} of {totalElements}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          aria-label="Previous page"
          className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 disabled:text-gray-300 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="size-4" />
        </button>
        {visible.map((p, i) => (
          <span key={p} className="flex items-center">
            {i > 0 && p - visible[i - 1] > 1 && <span className="px-1 text-gray-400">…</span>}
            <button
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
              className={`tabular min-w-8 rounded-md px-2 py-1 text-sm ${
                p === page ? 'bg-brand-600 font-medium text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {p + 1}
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          aria-label="Next page"
          className="rounded-md p-1.5 text-gray-600 hover:bg-gray-100 disabled:text-gray-300 disabled:hover:bg-transparent"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>
    </nav>
  )
}

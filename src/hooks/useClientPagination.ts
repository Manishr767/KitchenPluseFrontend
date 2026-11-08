import { useMemo, useState } from 'react'

/** Client-side paging for lists the backend returns in full (branches, units, all users). */
export function useClientPagination<T>(items: T[], pageSize = 10) {
  const [requestedPage, setPage] = useState(0)
  const totalPages = Math.max(Math.ceil(items.length / pageSize), 1)
  // Derived, so filtering that shrinks the list can never leave us on a page that no longer exists.
  const page = Math.min(requestedPage, totalPages - 1)

  const pageItems = useMemo(
    () => items.slice(page * pageSize, page * pageSize + pageSize),
    [items, page, pageSize],
  )

  return { page, setPage, pageItems, totalPages, totalElements: items.length, pageSize }
}

import { Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingBlock } from '@/components/common/Spinner'
import { EmptyState, ErrorState } from '@/components/common/States'
import { SearchInput } from '@/components/forms/SearchInput'
import { Pagination } from '@/components/tables/Pagination'
import { Table, Td, Th } from '@/components/tables/Table'
import { useCurrentUser } from '@/features/auth/useAuth'
import { useClientPagination } from '@/hooks/useClientPagination'
import { UnitFormModal } from './UnitFormModal'
import { useUnits } from './queries'

export function UnitsPage() {
  const isAdmin = useCurrentUser().role === 'ADMIN'
  const { data, isLoading, error, refetch } = useUnits()
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)

  // GET /api/units returns every unit, so search and paging run in the browser.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data ?? [])
      .filter((u) => !q || u.name.toLowerCase().includes(q) || u.symbol.toLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [data, search])
  const paging = useClientPagination(filtered, 10)

  return (
    <>
      <PageHeader
        title="Units"
        description="Units of measure that ingredients are counted in."
        actions={isAdmin ? <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>New unit</Button> : undefined}
      />

      <Card padded={false}>
        <div className="border-b border-gray-100 p-4">
          <SearchInput value={search} onChange={(v) => { setSearch(v); paging.setPage(0) }} placeholder="Search name or symbol" label="Search units" />
        </div>

        {isLoading ? (
          <LoadingBlock />
        ) : error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={data?.length ? 'No units match your search' : 'No units yet'}
            description={!data?.length && isAdmin ? 'Create a unit before adding ingredients.' : undefined}
            action={!data?.length && isAdmin ? <Button onClick={() => setCreating(true)}>New unit</Button> : undefined}
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>ID</Th>
                  <Th>Name</Th>
                  <Th>Symbol</Th>
                </tr>
              </thead>
              <tbody>
                {paging.pageItems.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <Td className="tabular text-gray-500">{u.id}</Td>
                    <Td className="font-medium text-gray-900">{u.name}</Td>
                    <Td>{u.symbol}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={paging.page} totalPages={paging.totalPages} totalElements={paging.totalElements} pageSize={paging.pageSize} onPageChange={paging.setPage} />
          </>
        )}
      </Card>

      {creating && <UnitFormModal onClose={() => setCreating(false)} />}
    </>
  )
}

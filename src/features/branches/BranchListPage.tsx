import { Pencil, Plus, Power } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingBlock } from '@/components/common/Spinner'
import { EmptyState, ErrorState } from '@/components/common/States'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ToggleActiveDialog } from '@/components/common/ToggleActiveDialog'
import { FilterSelect } from '@/components/forms/Fields'
import { SearchInput } from '@/components/forms/SearchInput'
import { Pagination } from '@/components/tables/Pagination'
import { Table, Td, Th } from '@/components/tables/Table'
import { useCurrentUser } from '@/features/auth/useAuth'
import { useClientPagination } from '@/hooks/useClientPagination'
import type { Branch } from '@/types'
import { formatDateTime } from '@/utils/format'
import { BranchFormModal } from './BranchFormModal'
import { useBranches, useSetBranchActive } from './queries'

type StatusFilter = 'all' | 'active' | 'inactive'

export function BranchListPage() {
  const isAdmin = useCurrentUser().role === 'ADMIN'
  const { data, isLoading, error, refetch } = useBranches()
  const setActive = useSetBranchActive()

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Branch | null>(null)
  const [toggling, setToggling] = useState<Branch | null>(null)

  // The API returns every branch; search, filter and paging happen in the browser.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data ?? [])
      .filter((b) => (status === 'all' ? true : status === 'active' ? b.active : !b.active))
      .filter((b) => !q || [b.code, b.name, b.address].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [data, search, status])

  const paging = useClientPagination(filtered, 10)

  return (
    <>
      <PageHeader
        title="Branches"
        description={isAdmin ? 'Create and manage your restaurant branches.' : 'Restaurant branches (read-only).'}
        actions={isAdmin ? <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>New branch</Button> : undefined}
      />

      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4">
          <SearchInput value={search} onChange={(v) => { setSearch(v); paging.setPage(0) }} placeholder="Search code, name or address" label="Search branches" />
          <FilterSelect label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value as StatusFilter); paging.setPage(0) }}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </FilterSelect>
        </div>

        {isLoading ? (
          <LoadingBlock />
        ) : error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={data?.length ? 'No branches match your filters' : 'No branches yet'}
            description={data?.length ? 'Try a different search or status.' : isAdmin ? 'Create the first branch to get started.' : undefined}
            action={!data?.length && isAdmin ? <Button onClick={() => setCreating(true)}>New branch</Button> : undefined}
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Code</Th>
                  <Th>Name</Th>
                  <Th>Address</Th>
                  <Th>Status</Th>
                  <Th>Updated</Th>
                  {isAdmin && <Th className="text-right">Actions</Th>}
                </tr>
              </thead>
              <tbody>
                {paging.pageItems.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <Td className="tabular font-medium text-gray-900">{b.code}</Td>
                    <Td>
                      <Link to={`/branches/${b.id}`} className="font-medium text-brand-700 hover:underline">
                        {b.name}
                      </Link>
                    </Td>
                    <Td className="max-w-xs truncate">{b.address}</Td>
                    <Td><StatusBadge active={b.active} /></Td>
                    <Td className="tabular whitespace-nowrap text-gray-500">{formatDateTime(b.updatedAt)}</Td>
                    {isAdmin && (
                      <Td className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="sm" aria-label={`Edit ${b.name}`} title="Edit" onClick={() => setEditing(b)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" aria-label={`${b.active ? 'Deactivate' : 'Activate'} ${b.name}`} title={b.active ? 'Deactivate' : 'Activate'} onClick={() => setToggling(b)}>
                          <Power className="size-4" />
                        </Button>
                      </Td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={paging.page} totalPages={paging.totalPages} totalElements={paging.totalElements} pageSize={paging.pageSize} onPageChange={paging.setPage} />
          </>
        )}
      </Card>

      {creating && <BranchFormModal onClose={() => setCreating(false)} />}
      {editing && <BranchFormModal branch={editing} onClose={() => setEditing(null)} />}
      {toggling && (
        <ToggleActiveDialog
          noun="Branch"
          name={toggling.name}
          nextActive={!toggling.active}
          detail="You can change this again at any time."
          onConfirm={() => setActive.mutateAsync({ id: toggling.id, active: !toggling.active })}
          onClose={() => setToggling(null)}
        />
      )}
    </>
  )
}

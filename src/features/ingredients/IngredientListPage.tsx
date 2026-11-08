import { Pencil, Plus, Power } from 'lucide-react'
import { useState } from 'react'
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
import { useDebounce } from '@/hooks/useDebounce'
import type { Ingredient } from '@/types'
import { formatDateTime } from '@/utils/format'
import { IngredientFormModal } from './IngredientFormModal'
import { useIngredients, useSetIngredientActive } from './queries'

type StatusFilter = 'all' | 'active' | 'inactive'

// Only sort fields the backend accepts (Java field names). Anything else risks an HTTP 500.
const SORTS = [
  { value: 'name,asc', label: 'Name A–Z' },
  { value: 'name,desc', label: 'Name Z–A' },
  { value: 'createdAt,desc', label: 'Newest first' },
  { value: 'createdAt,asc', label: 'Oldest first' },
  { value: 'updatedAt,desc', label: 'Recently updated' },
]

const PAGE_SIZE = 10

export function IngredientListPage() {
  const isAdmin = useCurrentUser().role === 'ADMIN'
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [sort, setSort] = useState(SORTS[0].value)
  const [page, setPage] = useState(0)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Ingredient | null>(null)
  const [toggling, setToggling] = useState<Ingredient | null>(null)

  const q = useDebounce(search, 300)
  const { data, isLoading, isFetching, error, refetch } = useIngredients({
    q,
    active: status === 'all' ? undefined : status === 'active',
    page,
    size: PAGE_SIZE,
    sort,
  })
  const setActive = useSetIngredientActive()
  const filtersApplied = q.trim() !== '' || status !== 'all'

  return (
    <>
      <PageHeader
        title="Ingredient catalog"
        description={isAdmin ? 'Manage the ingredients every branch can order.' : 'Ingredients available across branches (read-only).'}
        actions={isAdmin ? <Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>New ingredient</Button> : undefined}
      />

      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4">
          <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(0) }} placeholder="Search by name" label="Search ingredients" />
          <FilterSelect label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value as StatusFilter); setPage(0) }}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </FilterSelect>
          <FilterSelect label="Sort by" value={sort} onChange={(e) => { setSort(e.target.value); setPage(0) }} className="sm:ml-auto">
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </FilterSelect>
        </div>

        {isLoading ? (
          <LoadingBlock />
        ) : error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : !data || data.content.length === 0 ? (
          <EmptyState
            title={filtersApplied ? 'No ingredients match your filters' : 'No ingredients yet'}
            description={filtersApplied ? 'Try a different search or status.' : isAdmin ? 'Add the first ingredient to start the catalog.' : undefined}
            action={!filtersApplied && isAdmin ? <Button onClick={() => setCreating(true)}>New ingredient</Button> : undefined}
          />
        ) : (
          <div className={isFetching ? 'opacity-70 transition-opacity' : ''}>
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Stock unit</Th>
                  <Th>Status</Th>
                  <Th>Updated</Th>
                  {isAdmin && <Th className="text-right">Actions</Th>}
                </tr>
              </thead>
              <tbody>
                {data.content.map((i) => (
                  <tr key={i.id} className="hover:bg-gray-50">
                    <Td>
                      <Link to={`/ingredients/${i.id}`} className="font-medium text-brand-700 hover:underline">
                        {i.name}
                      </Link>
                    </Td>
                    <Td>{i.stockUnit.name} <span className="text-gray-400">({i.stockUnit.symbol})</span></Td>
                    <Td><StatusBadge active={i.active} /></Td>
                    <Td className="tabular whitespace-nowrap text-gray-500">{formatDateTime(i.updatedAt)}</Td>
                    {isAdmin && (
                      <Td className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="sm" aria-label={`Rename ${i.name}`} title="Rename" onClick={() => setEditing(i)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" aria-label={`${i.active ? 'Deactivate' : 'Activate'} ${i.name}`} title={i.active ? 'Deactivate' : 'Activate'} onClick={() => setToggling(i)}>
                          <Power className="size-4" />
                        </Button>
                      </Td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} pageSize={data.size} onPageChange={setPage} />
          </div>
        )}
      </Card>

      {creating && <IngredientFormModal onClose={() => setCreating(false)} />}
      {editing && <IngredientFormModal ingredient={editing} onClose={() => setEditing(null)} />}
      {toggling && (
        <ToggleActiveDialog
          noun="Ingredient"
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

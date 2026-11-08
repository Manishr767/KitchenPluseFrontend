import { KeyRound, Pencil, Plus, Power } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingBlock } from '@/components/common/Spinner'
import { EmptyState, ErrorState } from '@/components/common/States'
import { Pill, StatusBadge } from '@/components/common/StatusBadge'
import { ToggleActiveDialog } from '@/components/common/ToggleActiveDialog'
import { FilterSelect } from '@/components/forms/Fields'
import { SearchInput } from '@/components/forms/SearchInput'
import { Pagination } from '@/components/tables/Pagination'
import { Table, Td, Th } from '@/components/tables/Table'
import { useCurrentUser } from '@/features/auth/useAuth'
import { useBranches } from '@/features/branches/queries'
import { useClientPagination } from '@/hooks/useClientPagination'
import { ROLES, type Role, type User } from '@/types'
import { formatDateTime, roleLabel } from '@/utils/format'
import { ResetPasswordModal } from './ResetPasswordModal'
import { UserFormModal } from './UserFormModal'
import { useAllUsers, useSetUserActive } from './queries'

type StatusFilter = 'all' | 'active' | 'inactive'
type SortKey = 'name' | 'newest' | 'role'

export function UserListPage() {
  const me = useCurrentUser()
  const { data, isLoading, error, refetch } = useAllUsers()
  const branches = useBranches()
  const setActive = useSetUserActive()

  const [search, setSearch] = useState('')
  const [role, setRole] = useState<Role | 'all'>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [branch, setBranch] = useState('all')
  const [sort, setSort] = useState<SortKey>('name')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [resetting, setResetting] = useState<User | null>(null)
  const [toggling, setToggling] = useState<User | null>(null)

  const branchById = useMemo(() => new Map((branches.data ?? []).map((b) => [b.id, b])), [branches.data])

  // GET /api/users has no search or filters, so everything below runs in the browser.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const list = (data ?? [])
      .filter((u) => role === 'all' || u.role === role)
      .filter((u) => (status === 'all' ? true : status === 'active' ? u.active : !u.active))
      .filter((u) => branch === 'all' || (branch === 'none' ? u.branchId === null : String(u.branchId) === branch))
      .filter((u) => !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    return list.sort((a, b) =>
      sort === 'newest'
        ? b.createdAt.localeCompare(a.createdAt)
        : sort === 'role'
          ? roleLabel(a.role).localeCompare(roleLabel(b.role)) || a.name.localeCompare(b.name)
          : a.name.localeCompare(b.name),
    )
  }, [data, search, role, status, branch, sort])

  const paging = useClientPagination(filtered, 10)
  const filtersApplied = search.trim() !== '' || role !== 'all' || status !== 'all' || branch !== 'all'
  const reset = (fn: () => void) => { fn(); paging.setPage(0) }

  return (
    <>
      <PageHeader
        title="Users"
        description="Create accounts, assign roles and branches, and manage access."
        actions={<Button icon={<Plus className="size-4" />} onClick={() => setCreating(true)}>New user</Button>}
      />

      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 p-4">
          <SearchInput value={search} onChange={(v) => reset(() => setSearch(v))} placeholder="Search name or email" label="Search users" />
          <FilterSelect label="Filter by role" value={role} onChange={(e) => reset(() => setRole(e.target.value as Role | 'all'))}>
            <option value="all">All roles</option>
            {ROLES.map((r) => <option key={r} value={r}>{roleLabel(r)}</option>)}
          </FilterSelect>
          <FilterSelect label="Filter by status" value={status} onChange={(e) => reset(() => setStatus(e.target.value as StatusFilter))}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </FilterSelect>
          <FilterSelect label="Filter by branch" value={branch} onChange={(e) => reset(() => setBranch(e.target.value))}>
            <option value="all">All branches</option>
            <option value="none">No branch</option>
            {(branches.data ?? []).map((b) => <option key={b.id} value={b.id}>{b.code} – {b.name}</option>)}
          </FilterSelect>
          <FilterSelect label="Sort by" value={sort} onChange={(e) => reset(() => setSort(e.target.value as SortKey))} className="sm:ml-auto">
            <option value="name">Name A–Z</option>
            <option value="newest">Newest first</option>
            <option value="role">Role</option>
          </FilterSelect>
        </div>

        {isLoading ? (
          <LoadingBlock label="Loading all users…" />
        ) : error ? (
          <ErrorState error={error} onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={filtersApplied ? 'No users match your filters' : 'No users yet'}
            description={filtersApplied ? 'Try a different search or filter.' : 'Create the first user account.'}
          />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Role</Th>
                  <Th>Branch</Th>
                  <Th>Status</Th>
                  <Th>Created</Th>
                  <Th className="text-right">Actions</Th>
                </tr>
              </thead>
              <tbody>
                {paging.pageItems.map((u) => {
                  const b = u.branchId === null ? undefined : branchById.get(u.branchId)
                  const self = u.id === me.id
                  return (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <Td>
                        <Link to={`/users/${u.id}`} className="font-medium text-brand-700 hover:underline">{u.name}</Link>
                        {self && <span className="ml-2 text-xs text-gray-500">(you)</span>}
                        <p className="text-xs text-gray-500">{u.email}</p>
                      </Td>
                      <Td><Pill>{roleLabel(u.role)}</Pill></Td>
                      <Td>{u.branchId === null ? <span className="text-gray-400">–</span> : b ? `${b.code} – ${b.name}` : `Branch #${u.branchId}`}</Td>
                      <Td><StatusBadge active={u.active} /></Td>
                      <Td className="tabular whitespace-nowrap text-gray-500">{formatDateTime(u.createdAt)}</Td>
                      <Td className="text-right whitespace-nowrap">
                        <Button variant="ghost" size="sm" aria-label={`Edit ${u.name}`} title="Edit" onClick={() => setEditing(u)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" aria-label={`Reset password for ${u.name}`} title="Reset password" onClick={() => setResetting(u)}>
                          <KeyRound className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={self && u.active}
                          aria-label={`${u.active ? 'Deactivate' : 'Activate'} ${u.name}`}
                          title={self && u.active ? 'You can’t deactivate your own account' : u.active ? 'Deactivate' : 'Activate'}
                          onClick={() => setToggling(u)}
                        >
                          <Power className="size-4" />
                        </Button>
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
            <Pagination page={paging.page} totalPages={paging.totalPages} totalElements={paging.totalElements} pageSize={paging.pageSize} onPageChange={paging.setPage} />
          </>
        )}
      </Card>

      {creating && <UserFormModal onClose={() => setCreating(false)} />}
      {editing && <UserFormModal user={editing} onClose={() => setEditing(null)} />}
      {resetting && <ResetPasswordModal user={resetting} onClose={() => setResetting(null)} />}
      {toggling && (
        <ToggleActiveDialog
          noun="User"
          name={toggling.name}
          nextActive={!toggling.active}
          detail={toggling.active ? 'They won’t be able to sign in, and any open session stops working on its next request.' : 'They will be able to sign in again.'}
          onConfirm={() => setActive.mutateAsync({ id: toggling.id, active: !toggling.active })}
          onClose={() => setToggling(null)}
        />
      )}
    </>
  )
}

import { ArrowLeft, Pencil, Power } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingBlock } from '@/components/common/Spinner'
import { ErrorState } from '@/components/common/States'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ToggleActiveDialog } from '@/components/common/ToggleActiveDialog'
import { useCurrentUser } from '@/features/auth/useAuth'
import { formatDateTime } from '@/utils/format'
import { BranchFormModal } from './BranchFormModal'
import { useBranch, useSetBranchActive } from './queries'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-3 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="col-span-2 text-gray-900">{children}</dd>
    </div>
  )
}

/** Shared by /branches/:id and /my-branch (BRANCH_STAFF may only read their own branch). */
export function BranchDetail({ id, showBack }: { id: number | null; showBack: boolean }) {
  const isAdmin = useCurrentUser().role === 'ADMIN'
  const { data, isLoading, error, refetch } = useBranch(id)
  const setActive = useSetBranchActive()
  const [editing, setEditing] = useState(false)
  const [toggling, setToggling] = useState(false)

  if (id === null) {
    return (
      <>
        <PageHeader title="My branch" />
        <Card>
          <p className="text-sm text-gray-600">Your account isn’t assigned to a branch yet. Ask an administrator.</p>
        </Card>
      </>
    )
  }

  return (
    <>
      {showBack && (
        <Link to="/branches" className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="size-4" aria-hidden="true" />
          All branches
        </Link>
      )}

      {isLoading ? (
        <LoadingBlock />
      ) : error ? (
        <Card><ErrorState error={error} onRetry={() => refetch()} /></Card>
      ) : data ? (
        <>
          <PageHeader
            title={data.name}
            description={`Branch code ${data.code}`}
            actions={
              isAdmin ? (
                <>
                  <Button variant="secondary" icon={<Pencil className="size-4" />} onClick={() => setEditing(true)}>Edit</Button>
                  <Button variant={data.active ? 'secondary' : 'primary'} icon={<Power className="size-4" />} onClick={() => setToggling(true)}>
                    {data.active ? 'Deactivate' : 'Activate'}
                  </Button>
                </>
              ) : undefined
            }
          />
          <Card title="Details">
            <dl className="divide-y divide-gray-100">
              <Row label="Code"><span className="tabular">{data.code}</span></Row>
              <Row label="Name">{data.name}</Row>
              <Row label="Address">{data.address}</Row>
              <Row label="Status"><StatusBadge active={data.active} /></Row>
              <Row label="Created">{formatDateTime(data.createdAt)}</Row>
              <Row label="Last updated">{formatDateTime(data.updatedAt)}</Row>
            </dl>
          </Card>

          {editing && <BranchFormModal branch={data} onClose={() => setEditing(false)} />}
          {toggling && (
            <ToggleActiveDialog
              noun="Branch"
              name={data.name}
              nextActive={!data.active}
              detail="You can change this again at any time."
              onConfirm={() => setActive.mutateAsync({ id: data.id, active: !data.active })}
              onClose={() => setToggling(false)}
            />
          )}
        </>
      ) : null}
    </>
  )
}

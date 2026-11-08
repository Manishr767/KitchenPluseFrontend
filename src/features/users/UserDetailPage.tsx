import { ArrowLeft, KeyRound, Pencil, Power } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingBlock } from '@/components/common/Spinner'
import { ErrorState } from '@/components/common/States'
import { Pill, StatusBadge } from '@/components/common/StatusBadge'
import { ToggleActiveDialog } from '@/components/common/ToggleActiveDialog'
import { useCurrentUser } from '@/features/auth/useAuth'
import { useBranches } from '@/features/branches/queries'
import { formatDateTime, roleLabel } from '@/utils/format'
import { ResetPasswordModal } from './ResetPasswordModal'
import { UserFormModal } from './UserFormModal'
import { useSetUserActive, useUser } from './queries'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-3 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="col-span-2 text-gray-900">{children}</dd>
    </div>
  )
}

export function UserDetailPage() {
  const id = Number(useParams().id)
  const me = useCurrentUser()
  const valid = Number.isInteger(id) && id > 0
  const { data, isLoading, error, refetch } = useUser(valid ? id : 0)
  const branches = useBranches()
  const setActive = useSetUserActive()
  const [editing, setEditing] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [toggling, setToggling] = useState(false)

  const branch = data?.branchId != null ? branches.data?.find((b) => b.id === data.branchId) : undefined
  const self = data?.id === me.id

  return (
    <>
      <Link to="/users" className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="size-4" aria-hidden="true" />
        All users
      </Link>

      {!valid ? (
        <Card><ErrorState error={new Error('That user link isn’t valid.')} /></Card>
      ) : isLoading ? (
        <LoadingBlock />
      ) : error ? (
        <Card><ErrorState error={error} onRetry={() => refetch()} /></Card>
      ) : data ? (
        <>
          <PageHeader
            title={data.name}
            description={data.email}
            actions={
              <>
                <Button variant="secondary" icon={<Pencil className="size-4" />} onClick={() => setEditing(true)}>Edit</Button>
                <Button variant="secondary" icon={<KeyRound className="size-4" />} onClick={() => setResetting(true)}>Reset password</Button>
                <Button
                  variant={data.active ? 'secondary' : 'primary'}
                  icon={<Power className="size-4" />}
                  disabled={self && data.active}
                  title={self && data.active ? 'You can’t deactivate your own account' : undefined}
                  onClick={() => setToggling(true)}
                >
                  {data.active ? 'Deactivate' : 'Activate'}
                </Button>
              </>
            }
          />
          <Card title="Details">
            <dl className="divide-y divide-gray-100">
              <Row label="Name">{data.name}{self && <span className="ml-2 text-xs text-gray-500">(you)</span>}</Row>
              <Row label="Email">{data.email}</Row>
              <Row label="Role"><Pill>{roleLabel(data.role)}</Pill></Row>
              <Row label="Branch">
                {data.branchId === null ? '–' : branch ? (
                  <Link to={`/branches/${branch.id}`} className="text-brand-700 hover:underline">{branch.code} – {branch.name}</Link>
                ) : `Branch #${data.branchId}`}
              </Row>
              <Row label="Status"><StatusBadge active={data.active} /></Row>
              <Row label="Created">{formatDateTime(data.createdAt)}</Row>
              <Row label="Last updated">{formatDateTime(data.updatedAt)}</Row>
            </dl>
          </Card>

          {editing && <UserFormModal user={data} onClose={() => setEditing(false)} />}
          {resetting && <ResetPasswordModal user={data} onClose={() => setResetting(false)} />}
          {toggling && (
            <ToggleActiveDialog
              noun="User"
              name={data.name}
              nextActive={!data.active}
              detail={data.active ? 'They won’t be able to sign in, and any open session stops working on its next request.' : 'They will be able to sign in again.'}
              onConfirm={() => setActive.mutateAsync({ id: data.id, active: !data.active })}
              onClose={() => setToggling(false)}
            />
          )}
        </>
      ) : null}
    </>
  )
}

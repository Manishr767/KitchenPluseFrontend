import { ArrowLeft, Pencil, Power } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingBlock } from '@/components/common/Spinner'
import { ErrorState } from '@/components/common/States'
import { StatusBadge } from '@/components/common/StatusBadge'
import { ToggleActiveDialog } from '@/components/common/ToggleActiveDialog'
import { useCurrentUser } from '@/features/auth/useAuth'
import { formatDateTime } from '@/utils/format'
import { IngredientFormModal } from './IngredientFormModal'
import { useIngredient, useSetIngredientActive } from './queries'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-3 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="col-span-2 text-gray-900">{children}</dd>
    </div>
  )
}

export function IngredientDetailPage() {
  const id = Number(useParams().id)
  const isAdmin = useCurrentUser().role === 'ADMIN'
  const valid = Number.isInteger(id) && id > 0
  const { data, isLoading, error, refetch } = useIngredient(valid ? id : 0)
  const setActive = useSetIngredientActive()
  const [editing, setEditing] = useState(false)
  const [toggling, setToggling] = useState(false)

  return (
    <>
      <Link to="/ingredients" className="mb-3 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="size-4" aria-hidden="true" />
        All ingredients
      </Link>

      {!valid ? (
        <Card><ErrorState error={new Error('That ingredient link isn’t valid.')} /></Card>
      ) : isLoading ? (
        <LoadingBlock />
      ) : error ? (
        <Card><ErrorState error={error} onRetry={() => refetch()} /></Card>
      ) : data ? (
        <>
          <PageHeader
            title={data.name}
            actions={
              isAdmin ? (
                <>
                  <Button variant="secondary" icon={<Pencil className="size-4" />} onClick={() => setEditing(true)}>Rename</Button>
                  <Button variant={data.active ? 'secondary' : 'primary'} icon={<Power className="size-4" />} onClick={() => setToggling(true)}>
                    {data.active ? 'Deactivate' : 'Activate'}
                  </Button>
                </>
              ) : undefined
            }
          />
          <Card title="Details">
            <dl className="divide-y divide-gray-100">
              <Row label="Name">{data.name}</Row>
              <Row label="Stock unit">{data.stockUnit.name} ({data.stockUnit.symbol})</Row>
              <Row label="Status"><StatusBadge active={data.active} /></Row>
              <Row label="Created">{formatDateTime(data.createdAt)}</Row>
              <Row label="Last updated">{formatDateTime(data.updatedAt)}</Row>
            </dl>
          </Card>

          {editing && <IngredientFormModal ingredient={data} onClose={() => setEditing(false)} />}
          {toggling && (
            <ToggleActiveDialog
              noun="Ingredient"
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

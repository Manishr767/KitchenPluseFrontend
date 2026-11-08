import { Carrot, Ruler } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/common/Card'
import { PageHeader } from '@/components/common/PageHeader'
import { LoadingBlock } from '@/components/common/Spinner'
import { ErrorState, InlineAlert } from '@/components/common/States'
import { StatusBadge } from '@/components/common/StatusBadge'
import { useBranch } from '@/features/branches/queries'
import { useIngredientCount } from '@/features/ingredients/queries'
import { useUnits } from '@/features/units/queries'
import type { User } from '@/types'
import { PendingModulesNote, StatCard } from './widgets'

export function BranchStaffDashboard({ user }: { user: User }) {
  const branch = useBranch(user.branchId)
  const ingredientsAll = useIngredientCount()
  const ingredientsActive = useIngredientCount(true)
  const units = useUnits()

  return (
    <>
      <PageHeader title={`Welcome back, ${user.name}`} description="Your branch and the ingredient catalog." />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card
            title="Your branch"
            action={
              user.branchId !== null ? (
                <Link to="/my-branch" className="text-sm font-medium text-brand-600 hover:text-brand-700">
                  View details
                </Link>
              ) : undefined
            }
          >
            {user.branchId === null ? (
              <InlineAlert tone="warning">Your account isn’t assigned to a branch yet. Ask an administrator.</InlineAlert>
            ) : branch.isLoading ? (
              <LoadingBlock />
            ) : branch.isError ? (
              <ErrorState error={branch.error} onRetry={() => branch.refetch()} />
            ) : branch.data ? (
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-lg font-semibold text-gray-900">{branch.data.name}</p>
                  <p className="tabular text-sm text-gray-500">{branch.data.code}</p>
                  <p className="mt-2 text-sm text-gray-700">{branch.data.address}</p>
                </div>
                <StatusBadge active={branch.data.active} />
              </div>
            ) : null}
          </Card>
        </div>
        <div className="grid gap-4">
          <StatCard
            label="Ingredients"
            icon={Carrot}
            to="/ingredients"
            value={ingredientsAll.data}
            loading={ingredientsAll.isLoading}
            error={ingredientsAll.isError}
            footnote={ingredientsActive.data !== undefined ? `${ingredientsActive.data} active` : undefined}
          />
          <StatCard
            label="Units"
            icon={Ruler}
            to="/units"
            value={units.data?.length}
            loading={units.isLoading}
            error={units.isError}
            derived
          />
        </div>
      </div>
      <div className="mt-6">
        <PendingModulesNote />
      </div>
    </>
  )
}

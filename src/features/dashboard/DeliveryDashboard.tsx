import { Carrot, Ruler } from 'lucide-react'
import { Card } from '@/components/common/Card'
import { PageHeader } from '@/components/common/PageHeader'
import { useIngredientCount } from '@/features/ingredients/queries'
import { useUnits } from '@/features/units/queries'
import type { User } from '@/types'
import { roleLabel } from '@/utils/format'
import { PendingModulesNote, StatCard } from './widgets'

export function DeliveryDashboard({ user }: { user: User }) {
  const ingredientsAll = useIngredientCount()
  const ingredientsActive = useIngredientCount(true)
  const units = useUnits()

  return (
    <>
      <PageHeader title={`Welcome back, ${user.name}`} description="The ingredient catalog you can view." />
      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="Your account">
          <p className="text-sm font-medium text-gray-900">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
          <p className="mt-2 text-sm text-gray-700">{roleLabel(user.role)}</p>
        </Card>
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
      <div className="mt-6">
        <PendingModulesNote />
      </div>
    </>
  )
}

import { Carrot, Ruler, Store } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { useBranches } from '@/features/branches/queries'
import { useIngredientCount, useRecentIngredients } from '@/features/ingredients/queries'
import { useUnits } from '@/features/units/queries'
import { formatDate } from '@/utils/format'
import { RecentList } from './RecentList'
import { PendingModulesNote, StatCard } from './widgets'

/** CENTRAL_OFFICE_STAFF and WAREHOUSE_MANAGER: read access to branches, ingredients and units. */
export function OfficeDashboard({ name }: { name: string }) {
  const branches = useBranches()
  const ingredientsAll = useIngredientCount()
  const ingredientsActive = useIngredientCount(true)
  const units = useUnits()
  const recentIngredients = useRecentIngredients(5)
  const activeBranches = branches.data?.filter((b) => b.active).length ?? 0

  return (
    <>
      <PageHeader title={`Welcome back, ${name}`} description="Branches and the ingredient catalog you can view." />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Branches"
          icon={Store}
          to="/branches"
          value={branches.data?.length}
          loading={branches.isLoading}
          error={branches.isError}
          derived
          footnote={branches.data && `${activeBranches} active · ${branches.data.length - activeBranches} inactive`}
        />
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

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <RecentList
          title="Branches"
          viewAllTo="/branches"
          loading={branches.isLoading}
          error={branches.error}
          onRetry={() => branches.refetch()}
          emptyTitle="No branches yet"
          rows={branches.data?.slice(0, 5).map((b) => ({
            id: b.id,
            title: b.name,
            subtitle: `${b.code} · ${b.address}`,
            meta: b.active ? 'Active' : 'Inactive',
            to: `/branches/${b.id}`,
          }))}
        />
        <RecentList
          title="Newest ingredients"
          viewAllTo="/ingredients"
          loading={recentIngredients.isLoading}
          error={recentIngredients.error}
          onRetry={() => recentIngredients.refetch()}
          emptyTitle="No ingredients yet"
          rows={recentIngredients.data?.content.map((i) => ({
            id: i.id,
            title: i.name,
            subtitle: `Counted in ${i.stockUnit.name} (${i.stockUnit.symbol})`,
            meta: formatDate(i.createdAt),
            to: `/ingredients/${i.id}`,
          }))}
        />
      </div>
      <div className="mt-6">
        <PendingModulesNote />
      </div>
    </>
  )
}

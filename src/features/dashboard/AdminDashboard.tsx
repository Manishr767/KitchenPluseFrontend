import { Carrot, Ruler, Store, Users } from 'lucide-react'
import { lazy, Suspense } from 'react'
import { Card } from '@/components/common/Card'
import { LoadingBlock } from '@/components/common/Spinner'
import { ErrorState } from '@/components/common/States'
import { PageHeader } from '@/components/common/PageHeader'
import { useBranches } from '@/features/branches/queries'
import { useIngredientCount, useRecentIngredients } from '@/features/ingredients/queries'
import { useUnits } from '@/features/units/queries'
import { useAllUsers } from '@/features/users/queries'
import { formatDate, roleLabel } from '@/utils/format'
import { PendingModulesNote, SplitBar, StatCard } from './widgets'
import { RecentList } from './RecentList'
// Recharts is large; load it only when the admin dashboard actually renders the chart.
const UsersByRoleChart = lazy(() => import('./UsersByRoleChart'))

export function AdminDashboard({ name }: { name: string }) {
  const branches = useBranches()
  const users = useAllUsers()
  const ingredientsAll = useIngredientCount()
  const ingredientsActive = useIngredientCount(true)
  const ingredientsInactive = useIngredientCount(false)
  const units = useUnits()
  const recentIngredients = useRecentIngredients(5)

  const activeBranches = branches.data?.filter((b) => b.active).length ?? 0
  const activeUsers = users.data?.filter((u) => u.active).length ?? 0
  const newestUsers = users.data
    ? [...users.data].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
    : undefined

  return (
    <>
      <PageHeader title={`Welcome back, ${name}`} description="A snapshot of your branches, people and ingredient catalog." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
          label="Users"
          icon={Users}
          to="/users"
          value={users.data?.length}
          loading={users.isLoading}
          error={users.isError}
          derived
          footnote={users.data && `${activeUsers} active · ${users.data.length - activeUsers} inactive`}
        />
        <StatCard
          label="Ingredients"
          icon={Carrot}
          to="/ingredients"
          value={ingredientsAll.data}
          loading={ingredientsAll.isLoading}
          error={ingredientsAll.isError}
          footnote={
            ingredientsActive.data !== undefined && ingredientsInactive.data !== undefined
              ? `${ingredientsActive.data} active · ${ingredientsInactive.data} inactive`
              : undefined
          }
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
        <Card title="Active and inactive" description="Share of records currently in use.">
          <div className="space-y-5">
            {branches.data && <SplitBar label="Branches" derived active={activeBranches} inactive={branches.data.length - activeBranches} />}
            {users.data && <SplitBar label="Users" derived active={activeUsers} inactive={users.data.length - activeUsers} />}
            {ingredientsActive.data !== undefined && ingredientsInactive.data !== undefined && (
              <SplitBar label="Ingredients" active={ingredientsActive.data} inactive={ingredientsInactive.data} />
            )}
            {(branches.isLoading || users.isLoading) && <LoadingBlock />}
            {(branches.isError || users.isError) && <ErrorState error={branches.error ?? users.error} />}
          </div>
        </Card>

        <Card title="Users by role" description="Counted from the full user list.">
          {users.data ? <Suspense fallback={<LoadingBlock />}><UsersByRoleChart users={users.data} /></Suspense> : users.isError ? <ErrorState error={users.error} onRetry={() => users.refetch()} /> : <LoadingBlock />}
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <RecentList
          title="Newest users"
          viewAllTo="/users"
          loading={users.isLoading}
          error={users.error}
          onRetry={() => users.refetch()}
          emptyTitle="No users yet"
          rows={newestUsers?.map((u) => ({
            id: u.id,
            title: u.name,
            subtitle: `${roleLabel(u.role)} · ${u.email}`,
            meta: formatDate(u.createdAt),
            to: `/users/${u.id}`,
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

import { Navigate, Route, Routes } from 'react-router-dom'
import { LoginPage } from '@/features/auth/LoginPage'
import { ProfilePage } from '@/features/auth/ProfilePage'
import { BranchDetailPage } from '@/features/branches/BranchDetailPage'
import { BranchListPage } from '@/features/branches/BranchListPage'
import { MyBranchPage } from '@/features/branches/MyBranchPage'
import { IngredientDetailPage } from '@/features/ingredients/IngredientDetailPage'
import { IngredientListPage } from '@/features/ingredients/IngredientListPage'
import { UnitsPage } from '@/features/units/UnitsPage'
import { UserDetailPage } from '@/features/users/UserDetailPage'
import { UserListPage } from '@/features/users/UserListPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { ComingSoonPage } from '@/pages/ComingSoonPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { RoleRoute, ProtectedRoute } from './guards'
import { ADMIN_ONLY, BRANCH_LIST_ROLES, FUTURE_NAV } from './navigation'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="profile" element={<ProfilePage />} />

        <Route element={<RoleRoute roles={BRANCH_LIST_ROLES} />}>
          <Route path="branches" element={<BranchListPage />} />
          <Route path="branches/:id" element={<BranchDetailPage />} />
        </Route>
        <Route element={<RoleRoute roles={['BRANCH_STAFF']} />}>
          <Route path="my-branch" element={<MyBranchPage />} />
        </Route>
        <Route path="ingredients" element={<IngredientListPage />} />
        <Route path="ingredients/:id" element={<IngredientDetailPage />} />
        <Route path="units" element={<UnitsPage />} />
        <Route element={<RoleRoute roles={ADMIN_ONLY} />}>
          <Route path="users" element={<UserListPage />} />
          <Route path="users/:id" element={<UserDetailPage />} />
        </Route>

        {FUTURE_NAV.map((module) => (
          <Route key={module.to} path={module.to.slice(1)} element={<ComingSoonPage module={module} />} />
        ))}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

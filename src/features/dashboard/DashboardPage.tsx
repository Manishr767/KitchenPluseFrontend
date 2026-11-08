import { useCurrentUser } from '@/features/auth/useAuth'
import { AdminDashboard } from './AdminDashboard'
import { BranchStaffDashboard } from './BranchStaffDashboard'
import { DeliveryDashboard } from './DeliveryDashboard'
import { OfficeDashboard } from './OfficeDashboard'

/** One route, four dashboards: the role from /api/users/me decides which one renders. */
export function DashboardPage() {
  const user = useCurrentUser()
  switch (user.role) {
    case 'ADMIN':
      return <AdminDashboard name={user.name} />
    case 'CENTRAL_OFFICE_STAFF':
    case 'WAREHOUSE_MANAGER':
      return <OfficeDashboard name={user.name} />
    case 'BRANCH_STAFF':
      return <BranchStaffDashboard user={user} />
    case 'DELIVERY_PERSON':
      return <DeliveryDashboard user={user} />
  }
}

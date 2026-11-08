import { useCurrentUser } from '@/features/auth/useAuth'
import { BranchDetail } from './BranchDetail'

export function MyBranchPage() {
  const user = useCurrentUser()
  return <BranchDetail id={user.branchId} showBack={false} />
}

import { useQuery } from '@tanstack/react-query'
import { getInventory } from '@/api/inventory.api'
import { useBranches } from '@/features/branches/queries'

export function useInventory(branchId: number | null) {
  return useQuery({
    queryKey: ['inventory', branchId],
    queryFn: () => getInventory(branchId as number),
    enabled: branchId !== null && Number.isInteger(branchId) && branchId > 0,
  })
}

export { useBranches }

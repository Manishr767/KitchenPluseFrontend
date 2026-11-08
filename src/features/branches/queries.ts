import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as branchesApi from '@/api/branches.api'
import type { UpdateBranchRequest } from '@/types'

export function useBranches(enabled = true) {
  return useQuery({ queryKey: ['branches', 'list'], queryFn: branchesApi.listBranches, enabled })
}

export function useBranch(id: number | null) {
  return useQuery({
    queryKey: ['branches', 'detail', id],
    queryFn: () => branchesApi.getBranch(id as number),
    enabled: id !== null,
  })
}

export function useCreateBranch() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: branchesApi.createBranch,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches'] }),
  })
}

export function useUpdateBranch(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (request: UpdateBranchRequest) => branchesApi.updateBranch(id, request),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches'] }),
  })
}

export function useSetBranchActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => branchesApi.setBranchActive(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['branches'] }),
  })
}

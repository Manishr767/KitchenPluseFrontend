import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/api/users.api'
import type { ResetPasswordRequest, UpdateUserRequest } from '@/types'

/** Every user, assembled from 100-row pages (see fetchAllUsers). ADMIN only. */
export function useAllUsers(enabled = true) {
  return useQuery({ queryKey: ['users', 'all'], queryFn: api.fetchAllUsers, enabled })
}

export function useUser(id: number) {
  return useQuery({ queryKey: ['users', 'detail', id], queryFn: () => api.getUser(id) })
}

export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useUpdateUser(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (request: UpdateUserRequest) => api.updateUser(id, request),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useSetUserActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => api.setUserActive(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  })
}

export function useResetUserPassword(id: number) {
  return useMutation({ mutationFn: (request: ResetPasswordRequest) => api.resetUserPassword(id, request) })
}

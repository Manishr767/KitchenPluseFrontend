import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/api/ingredients.api'
import type { IngredientQuery } from '@/api/ingredients.api'
import type { UpdateIngredientRequest } from '@/types'

export function useIngredients(query: IngredientQuery) {
  return useQuery({
    queryKey: ['ingredients', 'list', query],
    queryFn: () => api.listIngredients(query),
    placeholderData: keepPreviousData,
  })
}

export function useIngredient(id: number) {
  return useQuery({ queryKey: ['ingredients', 'detail', id], queryFn: () => api.getIngredient(id) })
}

export function useIngredientCount(active?: boolean) {
  return useQuery({
    queryKey: ['ingredients', 'count', active ?? 'all'],
    queryFn: () => api.countIngredients(active),
  })
}

export function useRecentIngredients(size = 5) {
  return useQuery({
    queryKey: ['ingredients', 'recent', size],
    queryFn: () => api.listIngredients({ page: 0, size, sort: 'createdAt,desc' }),
  })
}

export function useCreateIngredient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createIngredient,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredients'] }),
  })
}

export function useUpdateIngredient(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (request: UpdateIngredientRequest) => api.updateIngredient(id, request),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredients'] }),
  })
}

export function useSetIngredientActive() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => api.setIngredientActive(id, active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ingredients'] }),
  })
}

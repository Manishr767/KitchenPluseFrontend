import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/api/ingredient-requests.api'

export function useIngredientRequests() {
  return useQuery({ queryKey: ['ingredient-requests'], queryFn: api.listIngredientRequests })
}

export function useCreateAndSubmitIngredientRequest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: api.CreateIngredientRequest) => {
      const draft = await api.createIngredientRequest(body)
      return api.submitIngredientRequest(draft.id)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ingredient-requests'] }),
  })
}

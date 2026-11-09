import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getInventory, recordStockCount } from '@/api/inventory.api'
import { listIngredients } from '@/api/ingredients.api'
import type { CreateStockCountRequest, Ingredient } from '@/types'

async function getAllActiveIngredients(): Promise<Ingredient[]> {
  const firstPage = await listIngredients({ active: true, page: 0, size: 100, sort: 'name,asc' })
  const ingredients = [...firstPage.content]
  for (let page = 1; page < firstPage.totalPages; page += 1) {
    const nextPage = await listIngredients({ active: true, page, size: 100, sort: 'name,asc' })
    ingredients.push(...nextPage.content)
  }
  return ingredients
}

export function useStockCountData(branchId: number) {
  const ingredients = useQuery({ queryKey: ['stock-counting', 'ingredients'], queryFn: getAllActiveIngredients })
  const inventory = useQuery({
    queryKey: ['inventory', branchId],
    queryFn: () => getInventory(branchId),
    enabled: Number.isInteger(branchId) && branchId > 0,
  })
  return { ingredients, inventory }
}

export function useRecordStockCount(branchId: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (request: CreateStockCountRequest) => recordStockCount(request),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory', branchId] }),
  })
}

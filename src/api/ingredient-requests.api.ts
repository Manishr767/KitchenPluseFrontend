import { api } from './client'
import type { ApiDateTime } from '@/types'

export interface IngredientRequestItem {
  id: number
  ingredientId: number
  requestedQuantity: number
}

export interface IngredientRequest {
  id: number
  branchId: number
  createdByUserId: number
  status: 'DRAFT' | 'SUBMITTED'
  createdAt: ApiDateTime
  submittedAt: ApiDateTime | null
  items: IngredientRequestItem[]
}

export interface CreateIngredientRequest {
  items: { ingredientId: number; quantity: number }[]
}

export async function listIngredientRequests(): Promise<IngredientRequest[]> {
  const { data } = await api.get<IngredientRequest[]>('/api/ingredient-requests')
  return data
}

export async function createIngredientRequest(body: CreateIngredientRequest): Promise<IngredientRequest> {
  const { data } = await api.post<IngredientRequest>('/api/ingredient-requests', body)
  return data
}

export async function submitIngredientRequest(id: number): Promise<IngredientRequest> {
  const { data } = await api.post<IngredientRequest>(`/api/ingredient-requests/${id}/submit`)
  return data
}

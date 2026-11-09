import { api } from './client'
import type { ApiDateTime } from '@/types'

export interface IngredientRequestItem {
  id: number
  ingredientId: number
  requestedQuantity: number
  approvedQuantity: number | null
}

export interface IngredientRequest {
  id: number
  branchId: number
  createdByUserId: number
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PARTIALLY_APPROVED' | 'REJECTED'
  createdAt: ApiDateTime
  submittedAt: ApiDateTime | null
  reviewedByUserId: number | null
  reviewedAt: ApiDateTime | null
  reviewNote: string | null
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


export interface ReviewIngredientRequest {
  items: { ingredientId: number; approvedQuantity: number }[]
  reviewNote?: string
}

export async function reviewIngredientRequest(id: number, body: ReviewIngredientRequest): Promise<IngredientRequest> {
  const { data } = await api.post<IngredientRequest>(`/api/ingredient-requests/${id}/review`, body)
  return data
}

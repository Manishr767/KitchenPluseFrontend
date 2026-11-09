import { api } from './client'
import type { IngredientRequest } from './ingredient-requests.api'

export interface WarehouseDispatchItem {
  id: number
  ingredientId: number
  approvedQuantity: number
  dispatchedQuantity: number
}
export interface WarehouseDispatch {
  id: number
  ingredientRequestId: number
  preparedByUserId: number
  dispatchedAt: string
  note: string | null
  items: WarehouseDispatchItem[]
}
export interface CreateWarehouseDispatch {
  items: { ingredientId: number; dispatchedQuantity: number }[]
  note?: string
}
export async function listWarehouseApprovedRequests(): Promise<IngredientRequest[]> {
  const { data } = await api.get<IngredientRequest[]>('/api/warehouse/approved-requests')
  return data
}
export async function listWarehouseDispatches(): Promise<WarehouseDispatch[]> {
  const { data } = await api.get<WarehouseDispatch[]>('/api/warehouse/dispatches')
  return data
}
export async function dispatchWarehouseRequest(id: number, body: CreateWarehouseDispatch): Promise<WarehouseDispatch> {
  const { data } = await api.post<WarehouseDispatch>(`/api/warehouse/requests/${id}/dispatch`, body)
  return data
}

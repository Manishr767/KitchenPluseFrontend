import type { CreateStockCountRequest, InventoryItem, StockCountResponse } from '@/types'
import { api } from './client'

export async function getInventory(branchId: number): Promise<InventoryItem[]> {
  const { data } = await api.get<InventoryItem[]>('/api/inventory', { params: { branchId } })
  return data
}

export async function recordStockCount(request: CreateStockCountRequest): Promise<StockCountResponse> {
  const { data } = await api.post<StockCountResponse>('/api/stock-counts', request)
  return data
}

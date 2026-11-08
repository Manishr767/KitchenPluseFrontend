import type { CreateUnitRequest, Unit } from '@/types'
import { api } from './client'

// GET /api/units returns a plain array. There is no get-by-id, update or delete endpoint.
export async function listUnits(): Promise<Unit[]> {
  const { data } = await api.get<Unit[]>('/api/units')
  return data
}

export async function createUnit(request: CreateUnitRequest): Promise<Unit> {
  const { data } = await api.post<Unit>('/api/units', request)
  return data
}

import type {
  CreateIngredientRequest,
  Ingredient,
  PageResponse,
  UpdateIngredientRequest,
} from '@/types'
import { api } from './client'

export interface IngredientQuery {
  /** Name contains (case-insensitive). */
  q?: string
  active?: boolean
  page?: number
  size?: number
  /** Java field name + direction, e.g. "name,asc". Valid fields: name, createdAt, updatedAt, active. */
  sort?: string
}

export async function listIngredients(query: IngredientQuery = {}): Promise<PageResponse<Ingredient>> {
  const params: Record<string, string | number | boolean> = {}
  if (query.q?.trim()) params.q = query.q.trim()
  if (query.active !== undefined) params.active = query.active
  if (query.page !== undefined) params.page = query.page
  if (query.size !== undefined) params.size = query.size
  if (query.sort) params.sort = query.sort
  const { data } = await api.get<PageResponse<Ingredient>>('/api/ingredients', { params })
  return data
}

/** Real server-side count: asks for one row and reads totalElements. */
export async function countIngredients(active?: boolean): Promise<number> {
  const page = await listIngredients({ active, page: 0, size: 1 })
  return page.totalElements
}

export async function getIngredient(id: number): Promise<Ingredient> {
  const { data } = await api.get<Ingredient>(`/api/ingredients/${id}`)
  return data
}

export async function createIngredient(request: CreateIngredientRequest): Promise<Ingredient> {
  const { data } = await api.post<Ingredient>('/api/ingredients', request)
  return data
}

export async function updateIngredient(id: number, request: UpdateIngredientRequest): Promise<Ingredient> {
  const { data } = await api.put<Ingredient>(`/api/ingredients/${id}`, request)
  return data
}

export async function setIngredientActive(id: number, active: boolean): Promise<Ingredient> {
  const { data } = await api.post<Ingredient>(`/api/ingredients/${id}/${active ? 'activate' : 'deactivate'}`)
  return data
}

import type { Branch, CreateBranchRequest, UpdateBranchRequest } from '@/types'
import { api } from './client'

// GET /api/branches returns a plain array (no paging, search or sort on the server).
export async function listBranches(): Promise<Branch[]> {
  const { data } = await api.get<Branch[]>('/api/branches')
  return data
}

export async function getBranch(id: number): Promise<Branch> {
  const { data } = await api.get<Branch>(`/api/branches/${id}`)
  return data
}

export async function createBranch(request: CreateBranchRequest): Promise<Branch> {
  const { data } = await api.post<Branch>('/api/branches', request)
  return data
}

export async function updateBranch(id: number, request: UpdateBranchRequest): Promise<Branch> {
  const { data } = await api.put<Branch>(`/api/branches/${id}`, request)
  return data
}

export async function setBranchActive(id: number, active: boolean): Promise<Branch> {
  const { data } = await api.post<Branch>(`/api/branches/${id}/${active ? 'activate' : 'deactivate'}`)
  return data
}

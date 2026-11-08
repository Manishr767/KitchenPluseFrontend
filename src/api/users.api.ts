import type {
  CreateUserRequest,
  PageResponse,
  ResetPasswordRequest,
  UpdateUserRequest,
  User,
} from '@/types'
import { api } from './client'

/** The backend caps page size at 100 (spring.data.web.pageable.max-page-size). */
const MAX_PAGE_SIZE = 100

export async function listUsersPage(page = 0, size = MAX_PAGE_SIZE): Promise<PageResponse<User>> {
  // Sorting by id keeps page boundaries stable while we walk through every page.
  const { data } = await api.get<PageResponse<User>>('/api/users', {
    params: { page, size, sort: 'id,asc' },
  })
  return data
}

/**
 * GET /api/users has no search or filter and no "return all" option, so this walks every
 * page (100 per request) and returns the full list for client-side search, filter and paging.
 */
export async function fetchAllUsers(): Promise<User[]> {
  const first = await listUsersPage(0)
  const users = [...first.content]
  for (let page = 1; page < first.totalPages; page++) {
    const next = await listUsersPage(page)
    users.push(...next.content)
  }
  return users
}

export async function getUser(id: number): Promise<User> {
  const { data } = await api.get<User>(`/api/users/${id}`)
  return data
}

export async function createUser(request: CreateUserRequest): Promise<User> {
  const { data } = await api.post<User>('/api/users', request)
  return data
}

export async function updateUser(id: number, request: UpdateUserRequest): Promise<User> {
  const { data } = await api.put<User>(`/api/users/${id}`, request)
  return data
}

export async function setUserActive(id: number, active: boolean): Promise<User> {
  const { data } = await api.post<User>(`/api/users/${id}/${active ? 'activate' : 'deactivate'}`)
  return data
}

export async function resetUserPassword(id: number, request: ResetPasswordRequest): Promise<void> {
  await api.put(`/api/users/${id}/password`, request)
}

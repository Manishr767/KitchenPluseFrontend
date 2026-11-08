import type { ChangePasswordRequest, LoginRequest, LoginResponse, User } from '@/types'
import { api } from './client'

export async function login(request: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/api/auth/login', request)
  return data
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>('/api/users/me')
  return data
}

export async function changeOwnPassword(request: ChangePasswordRequest): Promise<void> {
  await api.post('/api/users/me/password', request)
}

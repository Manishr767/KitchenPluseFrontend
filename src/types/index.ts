// Types mirror the backend DTOs in ~/Downloads/kitchenpulse (verified against source).

export const ROLES = [
  'ADMIN',
  'BRANCH_STAFF',
  'CENTRAL_OFFICE_STAFF',
  'WAREHOUSE_MANAGER',
  'DELIVERY_PERSON',
] as const
export type Role = (typeof ROLES)[number]

/** LocalDateTime serialised by Jackson, e.g. "2026-11-04T10:15:30.123456" (UTC, no zone suffix). */
export type ApiDateTime = string

export interface User {
  id: number
  name: string
  email: string
  role: Role
  branchId: number | null
  active: boolean
  createdAt: ApiDateTime
  updatedAt: ApiDateTime
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  tokenType: string
  expiresInSeconds: number
  user: User
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}

export interface ResetPasswordRequest {
  newPassword: string
}

export interface CreateUserRequest {
  name: string
  email: string
  password: string
  role: Role
  branchId: number | null
}

export interface UpdateUserRequest {
  name: string
  role: Role
  branchId: number | null
}

export interface Branch {
  id: number
  code: string
  name: string
  address: string
  active: boolean
  createdAt: ApiDateTime
  updatedAt: ApiDateTime
}

export interface CreateBranchRequest {
  code: string
  name: string
  address: string
}

export interface UpdateBranchRequest {
  name: string
  address: string
}

export interface Unit {
  id: number
  name: string
  symbol: string
}

export interface CreateUnitRequest {
  name: string
  symbol: string
}

export interface Ingredient {
  id: number
  name: string
  stockUnit: Unit
  active: boolean
  createdAt: ApiDateTime
  updatedAt: ApiDateTime
}

export interface CreateIngredientRequest {
  name: string
  stockUnitId: number
}

export interface UpdateIngredientRequest {
  name: string
}

/** Backend PageResponse<T>. `page` is 0-based. */
export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

/** RFC 7807 problem body returned by the backend. `errors` only on HTTP 400 validation failures. */
export interface ProblemDetail {
  type?: string
  title?: string
  status?: number
  detail?: string
  errors?: Record<string, string>
}
export interface CreateStockCountRequest {
  branchId: number
  items: {
    ingredientId: number
    quantity: number
  }[]
}

export interface StockCountResponse {
  stockCountId: number
  branchId: number
  countedAt: ApiDateTime
  status: string
  itemCount: number
}

export interface InventoryItem {
  ingredientId: number
  ingredientName: string
  quantity: number
  unit: string
  countedAt: ApiDateTime
  stockCountId: number
}
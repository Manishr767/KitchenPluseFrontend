import type { ApiDateTime, Role } from '@/types'

/** The backend sends LocalDateTime written in UTC without a zone suffix; parse it as UTC. */
export function parseApiDate(value: ApiDateTime): Date | null {
  if (!value) return null
  // Trim fractional seconds to milliseconds: Java emits up to 9 digits, not all browsers parse them.
  const normalised = value.replace(/(\.\d{3})\d+/, '$1')
  const date = new Date(/[zZ]|[+-]\d{2}:?\d{2}$/.test(normalised) ? normalised : `${normalised}Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDateTime(value: ApiDateTime): string {
  const date = parseApiDate(value)
  if (!date) return value || '–'
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatDate(value: ApiDateTime): string {
  const date = parseApiDate(value)
  if (!date) return value || '–'
  return date.toLocaleDateString(undefined, { dateStyle: 'medium' })
}

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  BRANCH_STAFF: 'Branch staff',
  CENTRAL_OFFICE_STAFF: 'Central office',
  WAREHOUSE_MANAGER: 'Warehouse manager',
  DELIVERY_PERSON: 'Delivery person',
}

export function roleLabel(role: Role): string {
  return ROLE_LABELS[role] ?? role
}

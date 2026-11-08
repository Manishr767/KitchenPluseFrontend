// Validation rules copied from the backend DTOs so users get feedback before the request.
// The backend stays the authority; its field errors are shown too.

export type FieldErrors = Record<string, string>

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const isEmail = (value: string) => EMAIL.test(value.trim())

/** BCrypt only uses the first 72 BYTES of a password; the backend rejects longer ones. */
export const byteLength = (value: string) => new TextEncoder().encode(value).length

export function validatePassword(value: string, field = 'password'): FieldErrors {
  if (value.length < 8) return { [field]: 'Use at least 8 characters.' }
  if (value.length > 72 || byteLength(value) > 72) {
    return { [field]: 'Use at most 72 characters (72 bytes).' }
  }
  return {}
}

export function required(value: string, label: string, max?: number): string | undefined {
  const trimmed = value.trim()
  if (!trimmed) return `${label} is required.`
  if (max && trimmed.length > max) return `${label} must be at most ${max} characters.`
  return undefined
}

export function compact(errors: Record<string, string | undefined>): FieldErrors {
  const out: FieldErrors = {}
  for (const [key, value] of Object.entries(errors)) if (value) out[key] = value
  return out
}

import { describe, expect, it } from 'vitest'
import { formatDateTime, parseApiDate, roleLabel } from './format'
import { byteLength, isEmail, validatePassword } from './validation'

describe('dates', () => {
  it('parses backend LocalDateTime strings as UTC, including 6-digit fractions', () => {
    expect(parseApiDate('2026-11-04T10:15:30.123456')?.toISOString()).toBe('2026-11-04T10:15:30.123Z')
    expect(parseApiDate('2026-11-04T10:15:30')?.toISOString()).toBe('2026-11-04T10:15:30.000Z')
  })
  it('keeps an explicit zone if one is present', () => {
    expect(parseApiDate('2026-11-04T10:15:30+02:00')?.toISOString()).toBe('2026-11-04T08:15:30.000Z')
  })
  it('falls back to the raw value for garbage', () => {
    expect(formatDateTime('not a date')).toBe('not a date')
  })
})

describe('validation (mirrors backend DTO rules)', () => {
  it('enforces 8–72 character passwords and the 72-BYTE BCrypt limit', () => {
    expect(validatePassword('short')).toHaveProperty('password')
    expect(validatePassword('longenough')).toEqual({})
    expect(validatePassword('a'.repeat(73))).toHaveProperty('password')
    const multibyte = '€'.repeat(30) // 30 chars but 90 bytes
    expect(byteLength(multibyte)).toBe(90)
    expect(validatePassword(multibyte)).toHaveProperty('password')
  })
  it('checks email shape', () => {
    expect(isEmail('a@b.co')).toBe(true)
    expect(isEmail('nope')).toBe(false)
  })
  it('labels roles', () => {
    expect(roleLabel('DELIVERY_PERSON')).toBe('Delivery person')
  })
})

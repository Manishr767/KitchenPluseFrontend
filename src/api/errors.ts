import { AxiosError } from 'axios'
import type { ProblemDetail } from '@/types'

/** Normalised error thrown by every API call. */
export class ApiError extends Error {
  status: number
  title: string
  fieldErrors: Record<string, string>
  /** True when no usable HTTP answer came back (server down, proxy error, timeout). */
  unreachable: boolean

  constructor(init: {
    status: number
    title: string
    message: string
    fieldErrors?: Record<string, string>
    unreachable?: boolean
  }) {
    super(init.message)
    this.name = 'ApiError'
    this.status = init.status
    this.title = init.title
    this.fieldErrors = init.fieldErrors ?? {}
    this.unreachable = init.unreachable ?? false
  }
}

const UNREACHABLE_MESSAGE =
  'Cannot reach the KitchenPulse server. Check that the backend is running on port 8080 and the database is up.'

function isProblem(data: unknown): data is ProblemDetail {
  return typeof data === 'object' && data !== null && ('detail' in data || 'title' in data)
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error

  if (error instanceof AxiosError) {
    const response = error.response

    // No answer at all, or the Vite proxy failed to reach Spring Boot (empty 5xx body).
    if (!response) {
      return new ApiError({
        status: 0,
        title: 'Network error',
        message: error.code === 'ECONNABORTED' ? 'The request timed out. Please try again.' : UNREACHABLE_MESSAGE,
        unreachable: true,
      })
    }

    if (isProblem(response.data)) {
      const p = response.data
      return new ApiError({
        status: response.status,
        title: p.title ?? 'Request failed',
        message: p.detail ?? p.title ?? 'Request failed',
        fieldErrors: p.errors,
      })
    }

    if (response.status >= 500) {
      return new ApiError({
        status: response.status,
        title: 'Server unavailable',
        message: UNREACHABLE_MESSAGE,
        unreachable: true,
      })
    }

    return new ApiError({
      status: response.status,
      title: 'Request failed',
      message: `The request failed (HTTP ${response.status}).`,
    })
  }

  return new ApiError({
    status: 0,
    title: 'Unexpected error',
    message: error instanceof Error ? error.message : 'Something went wrong.',
  })
}

export function errorMessage(error: unknown): string {
  return toApiError(error).message
}

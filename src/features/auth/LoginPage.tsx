import { ChefHat, Eye, EyeOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toApiError } from '@/api/errors'
import { Button } from '@/components/common/Button'
import { InlineAlert } from '@/components/common/States'
import { TextField } from '@/components/forms/Fields'
import { compact, isEmail, required, type FieldErrors } from '@/utils/validation'
import { useAuth } from './useAuth'

export function LoginPage() {
  const { status, login, notice } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated') return <Navigate to={from} replace />

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const found = compact({
      email: required(email, 'Email') ?? (isEmail(email) ? undefined : 'Enter a valid email address.'),
      password: password ? undefined : 'Password is required.',
    })
    setErrors(found)
    setFormError(null)
    if (Object.keys(found).length > 0) return

    setSubmitting(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (error) {
      const apiError = toApiError(error)
      setErrors(apiError.fieldErrors)
      setFormError(apiError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-full lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div className="hidden flex-col justify-between bg-sidebar p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-lg bg-brand-600">
            <ChefHat className="size-5" aria-hidden="true" />
          </div>
          <span className="text-lg font-semibold tracking-tight">KitchenPulse</span>
        </div>
        <div className="max-w-md">
          <h1 className="text-3xl leading-tight font-semibold tracking-tight">
            Every branch stocked, from one place.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-gray-400">
            KitchenPulse is the supply platform for multi-branch restaurants: one catalog of ingredients, one
            view of every branch, and the people who keep them running.
          </p>
        </div>
        <p className="text-sm text-gray-500">Restaurant operations platform</p>
      </div>

      <div className="flex items-center justify-center bg-page px-4 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <ChefHat className="size-5" aria-hidden="true" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-gray-900">KitchenPulse</span>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-gray-900">Sign in</h2>
          <p className="mt-1 text-sm text-gray-500">Use the email and password for your KitchenPulse account.</p>

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            {notice && <InlineAlert tone="warning">{notice}</InlineAlert>}
            {formError && <InlineAlert>{formError}</InlineAlert>}

            <TextField
              label="Email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoFocus
            />
            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="rounded-md p-1.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              }
            />
            <Button type="submit" loading={submitting} className="w-full">
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}

import { Eye, EyeOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toApiError } from '@/api/errors'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { InlineAlert } from '@/components/common/States'
import { useToast } from '@/components/common/useToast'
import { TextField } from '@/components/forms/Fields'
import type { User } from '@/types'
import { compact, validatePassword, type FieldErrors } from '@/utils/validation'
import { useResetUserPassword } from './queries'

/** Admin sets a new password for another account (PUT /api/users/{id}/password). */
export function ResetPasswordModal({ user, onClose }: { user: User; onClose: () => void }) {
  const toast = useToast()
  const reset = useResetUserPassword(user.id)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const found = compact({
      ...validatePassword(password, 'newPassword'),
      confirm: confirm === password ? undefined : 'Passwords don’t match.',
    })
    setErrors(found)
    setFormError(null)
    if (Object.keys(found).length > 0) return
    try {
      await reset.mutateAsync({ newPassword: password })
      toast.success(`Password reset for ${user.name}.`)
      onClose()
    } catch (error) {
      const apiError = toApiError(error)
      setErrors(apiError.fieldErrors)
      setFormError(apiError.message)
    }
  }

  return (
    <Modal
      title="Reset password"
      description={`Set a new password for ${user.name}. Share it with them securely.`}
      onClose={onClose}
      width="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={reset.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="reset-form" loading={reset.isPending}>
            Reset password
          </Button>
        </>
      }
    >
      <form id="reset-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <InlineAlert>{formError}</InlineAlert>}
        <TextField
          label="New password"
          type={show ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.newPassword}
          hint="8 to 72 characters."
          autoComplete="new-password"
          autoFocus
          trailing={
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? 'Hide password' : 'Show password'}
              className="rounded-md p-1.5 text-gray-400 hover:text-gray-600"
            >
              {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          }
        />
        <TextField
          label="Confirm new password"
          type={show ? 'text' : 'password'}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          error={errors.confirm}
          autoComplete="new-password"
        />
      </form>
    </Modal>
  )
}

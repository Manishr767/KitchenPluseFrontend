import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { changeOwnPassword } from '@/api/auth.api'
import { toApiError } from '@/api/errors'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { PageHeader } from '@/components/common/PageHeader'
import { InlineAlert } from '@/components/common/States'
import { Pill, StatusBadge } from '@/components/common/StatusBadge'
import { useToast } from '@/components/common/useToast'
import { TextField } from '@/components/forms/Fields'
import { formatDateTime, roleLabel } from '@/utils/format'
import { compact, validatePassword, type FieldErrors } from '@/utils/validation'
import { useCurrentUser } from './useAuth'

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-2.5 text-sm">
      <dt className="text-gray-500">{label}</dt>
      <dd className="col-span-2 text-gray-900">{children}</dd>
    </div>
  )
}

export function ProfilePage() {
  const user = useCurrentUser()
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: changeOwnPassword,
    onSuccess: () => {
      setCurrent('')
      setNext('')
      setConfirm('')
      setErrors({})
      setFormError(null)
      toast.success('Password changed.')
    },
    onError: (error) => {
      const apiError = toApiError(error)
      setErrors(apiError.fieldErrors)
      setFormError(apiError.message)
    },
  })

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const found = compact({
      currentPassword: current ? undefined : 'Enter your current password.',
      ...validatePassword(next, 'newPassword'),
      confirm: confirm === next ? undefined : 'Passwords don’t match.',
    })
    setErrors(found)
    setFormError(null)
    if (Object.keys(found).length > 0) return
    mutation.mutate({ currentPassword: current, newPassword: next })
  }

  const toggle = (
    <button
      type="button"
      onClick={() => setShow((s) => !s)}
      aria-label={show ? 'Hide passwords' : 'Show passwords'}
      className="rounded-md p-1.5 text-gray-400 hover:text-gray-600"
    >
      {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  )

  return (
    <>
      <PageHeader title="My profile" description="Your account details and password." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Account">
          <dl className="divide-y divide-gray-100">
            <Row label="Name">{user.name}</Row>
            <Row label="Email">{user.email}</Row>
            <Row label="Role">
              <Pill>{roleLabel(user.role)}</Pill>
            </Row>
            <Row label="Branch ID">{user.branchId ?? '–'}</Row>
            <Row label="Status">
              <StatusBadge active={user.active} />
            </Row>
            <Row label="Member since">{formatDateTime(user.createdAt)}</Row>
          </dl>
        </Card>

        <Card title="Change password" description="Use 8 to 72 characters.">
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {formError && <InlineAlert>{formError}</InlineAlert>}
            <TextField
              label="Current password"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              error={errors.currentPassword}
              trailing={toggle}
            />
            <TextField
              label="New password"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              value={next}
              onChange={(e) => setNext(e.target.value)}
              error={errors.newPassword}
            />
            <TextField
              label="Confirm new password"
              type={show ? 'text' : 'password'}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={errors.confirm}
            />
            <Button type="submit" loading={mutation.isPending}>
              Change password
            </Button>
          </form>
        </Card>
      </div>
    </>
  )
}

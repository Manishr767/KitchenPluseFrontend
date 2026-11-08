import { Eye, EyeOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { toApiError } from '@/api/errors'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { InlineAlert } from '@/components/common/States'
import { useToast } from '@/components/common/useToast'
import { SelectField, TextField } from '@/components/forms/Fields'
import { useCurrentUser, useAuth } from '@/features/auth/useAuth'
import { useBranches } from '@/features/branches/queries'
import { ROLES, type Role, type User } from '@/types'
import { roleLabel } from '@/utils/format'
import { compact, isEmail, required, validatePassword, type FieldErrors } from '@/utils/validation'
import { useCreateUser, useUpdateUser } from './queries'

/** Create (no `user`) or edit (email is immutable on the backend). */
export function UserFormModal({ user, onClose }: { user?: User; onClose: () => void }) {
  const toast = useToast()
  const me = useCurrentUser()
  const { refreshUser } = useAuth()
  const branches = useBranches()
  const create = useCreateUser()
  const update = useUpdateUser(user?.id ?? 0)
  const editing = user !== undefined
  const isSelf = editing && user.id === me.id

  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [role, setRole] = useState<Role>(user?.role ?? 'BRANCH_STAFF')
  const [branchId, setBranchId] = useState(user?.branchId ? String(user.branchId) : '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const pending = create.isPending || update.isPending
  const needsBranch = role === 'BRANCH_STAFF'

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const found = compact({
      name: required(name, 'Name', 100),
      email: editing ? undefined : (required(email, 'Email', 255) ?? (isEmail(email) ? undefined : 'Enter a valid email address.')),
      ...(editing ? {} : validatePassword(password)),
      branchId: needsBranch && !branchId ? 'Choose a branch for branch staff.' : undefined,
    })
    setErrors(found)
    setFormError(null)
    if (Object.keys(found).length > 0) return

    // The backend requires a branch for BRANCH_STAFF and rejects one for every other role.
    const resolvedBranch = needsBranch ? Number(branchId) : null
    try {
      if (editing) {
        await update.mutateAsync({ name: name.trim(), role, branchId: resolvedBranch })
        if (isSelf) await refreshUser()
        toast.success('User updated.')
      } else {
        await create.mutateAsync({ name: name.trim(), email: email.trim(), password, role, branchId: resolvedBranch })
        toast.success('User created.')
      }
      onClose()
    } catch (error) {
      const apiError = toApiError(error)
      setErrors(apiError.fieldErrors)
      setFormError(apiError.message)
    }
  }

  const branchList = branches.data ?? []
  const currentBranchMissing =
    editing && user.branchId !== null && !branchList.some((b) => b.id === user.branchId && b.active)

  return (
    <Modal
      title={editing ? 'Edit user' : 'New user'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="user-form" loading={pending}>
            {editing ? 'Save changes' : 'Create user'}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <InlineAlert>{formError}</InlineAlert>}
        <TextField label="Full name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} maxLength={100} autoFocus />
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          disabled={editing}
          maxLength={255}
          hint={editing ? 'The email can’t be changed.' : undefined}
          autoComplete="off"
        />
        {!editing && (
          <TextField
            label="Initial password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
            hint="8 to 72 characters. The user can change it from their profile."
            autoComplete="new-password"
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
        )}
        <SelectField
          label="Role"
          value={role}
          onChange={(e) => {
            setRole(e.target.value as Role)
            setErrors((prev) => ({ ...prev, branchId: '', role: '' }))
          }}
          error={errors.role}
          disabled={isSelf}
          hint={isSelf ? 'You can’t change your own role.' : undefined}
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>{roleLabel(r)}</option>
          ))}
        </SelectField>

        {needsBranch && (
          <SelectField
            label="Branch"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            error={errors.branchId}
            disabled={branches.isLoading}
            hint="Branch staff work in exactly one active branch."
          >
            <option value="">{branches.isLoading ? 'Loading branches…' : 'Select a branch'}</option>
            {branchList.filter((b) => b.active).map((b) => (
              <option key={b.id} value={b.id}>{b.code} – {b.name}</option>
            ))}
            {currentBranchMissing && user.branchId !== null && (
              <option value={user.branchId} disabled>Current branch (inactive or unavailable)</option>
            )}
          </SelectField>
        )}
        {needsBranch && branches.isError && <InlineAlert>{toApiError(branches.error).message}</InlineAlert>}
        {!needsBranch && <p className="text-xs text-gray-500">Only branch staff are assigned to a branch.</p>}
      </form>
    </Modal>
  )
}

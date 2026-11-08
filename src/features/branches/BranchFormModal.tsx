import { useState, type FormEvent } from 'react'
import { toApiError } from '@/api/errors'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { InlineAlert } from '@/components/common/States'
import { useToast } from '@/components/common/useToast'
import { TextField } from '@/components/forms/Fields'
import type { Branch } from '@/types'
import { compact, required, type FieldErrors } from '@/utils/validation'
import { useCreateBranch, useUpdateBranch } from './queries'

const CODE_PATTERN = /^[A-Za-z0-9_-]+$/

/** Create (no `branch`) or edit (code is immutable on the backend). */
export function BranchFormModal({ branch, onClose }: { branch?: Branch; onClose: () => void }) {
  const toast = useToast()
  const create = useCreateBranch()
  const update = useUpdateBranch(branch?.id ?? 0)
  const editing = branch !== undefined

  const [code, setCode] = useState(branch?.code ?? '')
  const [name, setName] = useState(branch?.name ?? '')
  const [address, setAddress] = useState(branch?.address ?? '')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const pending = create.isPending || update.isPending

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const found = compact({
      code: editing
        ? undefined
        : (required(code, 'Code', 20) ??
          (CODE_PATTERN.test(code.trim()) ? undefined : 'Use only letters, numbers, hyphens and underscores.')),
      name: required(name, 'Name', 100),
      address: required(address, 'Address', 255),
    })
    setErrors(found)
    setFormError(null)
    if (Object.keys(found).length > 0) return

    try {
      if (editing) {
        await update.mutateAsync({ name: name.trim(), address: address.trim() })
        toast.success('Branch updated.')
      } else {
        await create.mutateAsync({ code: code.trim(), name: name.trim(), address: address.trim() })
        toast.success('Branch created.')
      }
      onClose()
    } catch (error) {
      const apiError = toApiError(error)
      setErrors(apiError.fieldErrors)
      setFormError(apiError.message)
    }
  }

  return (
    <Modal
      title={editing ? 'Edit branch' : 'New branch'}
      description={editing ? undefined : 'The code identifies the branch and can’t be changed later.'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="branch-form" loading={pending}>
            {editing ? 'Save changes' : 'Create branch'}
          </Button>
        </>
      }
    >
      <form id="branch-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <InlineAlert>{formError}</InlineAlert>}
        <TextField
          label="Code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          error={errors.code}
          disabled={editing}
          maxLength={20}
          hint={editing ? 'The code can’t be changed.' : 'Up to 20 letters, numbers, hyphens or underscores.'}
          autoFocus={!editing}
        />
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} maxLength={100} autoFocus={editing} />
        <TextField label="Address" value={address} onChange={(e) => setAddress(e.target.value)} error={errors.address} maxLength={255} />
      </form>
    </Modal>
  )
}

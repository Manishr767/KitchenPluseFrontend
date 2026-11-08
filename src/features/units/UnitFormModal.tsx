import { useState, type FormEvent } from 'react'
import { toApiError } from '@/api/errors'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { InlineAlert } from '@/components/common/States'
import { useToast } from '@/components/common/useToast'
import { TextField } from '@/components/forms/Fields'
import { compact, required, type FieldErrors } from '@/utils/validation'
import { useCreateUnit } from './queries'

export function UnitFormModal({ onClose }: { onClose: () => void }) {
  const toast = useToast()
  const create = useCreateUnit()
  const [name, setName] = useState('')
  const [symbol, setSymbol] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const found = compact({ name: required(name, 'Name', 50), symbol: required(symbol, 'Symbol', 20) })
    setErrors(found)
    setFormError(null)
    if (Object.keys(found).length > 0) return
    try {
      await create.mutateAsync({ name: name.trim(), symbol: symbol.trim() })
      toast.success('Unit created.')
      onClose()
    } catch (error) {
      const apiError = toApiError(error)
      setErrors(apiError.fieldErrors)
      setFormError(apiError.message)
    }
  }

  return (
    <Modal
      title="New unit"
      description="Units can’t be edited or removed after they are created."
      onClose={onClose}
      width="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button type="submit" form="unit-form" loading={create.isPending}>
            Create unit
          </Button>
        </>
      }
    >
      <form id="unit-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <InlineAlert>{formError}</InlineAlert>}
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} maxLength={50} hint="For example, Kilogram." autoFocus />
        <TextField label="Symbol" value={symbol} onChange={(e) => setSymbol(e.target.value)} error={errors.symbol} maxLength={20} hint="For example, kg." />
      </form>
    </Modal>
  )
}

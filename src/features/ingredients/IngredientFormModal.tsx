import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { toApiError } from '@/api/errors'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { InlineAlert } from '@/components/common/States'
import { useToast } from '@/components/common/useToast'
import { SelectField, TextField } from '@/components/forms/Fields'
import { useUnits } from '@/features/units/queries'
import type { Ingredient } from '@/types'
import { compact, required, type FieldErrors } from '@/utils/validation'
import { useCreateIngredient, useUpdateIngredient } from './queries'

/** Create (no `ingredient`) or rename (the stock unit is fixed after creation on the backend). */
export function IngredientFormModal({ ingredient, onClose }: { ingredient?: Ingredient; onClose: () => void }) {
  const toast = useToast()
  const units = useUnits()
  const create = useCreateIngredient()
  const update = useUpdateIngredient(ingredient?.id ?? 0)
  const editing = ingredient !== undefined

  const [name, setName] = useState(ingredient?.name ?? '')
  const [unitId, setUnitId] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const pending = create.isPending || update.isPending

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const found = compact({
      name: required(name, 'Name', 100),
      stockUnitId: editing || unitId ? undefined : 'Choose a stock unit.',
    })
    setErrors(found)
    setFormError(null)
    if (Object.keys(found).length > 0) return

    try {
      if (editing) {
        await update.mutateAsync({ name: name.trim() })
        toast.success('Ingredient updated.')
      } else {
        await create.mutateAsync({ name: name.trim(), stockUnitId: Number(unitId) })
        toast.success('Ingredient created.')
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
      title={editing ? 'Rename ingredient' : 'New ingredient'}
      description={editing ? undefined : 'The stock unit can’t be changed after the ingredient is created.'}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" form="ingredient-form" loading={pending} disabled={!editing && !units.data?.length}>
            {editing ? 'Save changes' : 'Create ingredient'}
          </Button>
        </>
      }
    >
      <form id="ingredient-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <InlineAlert>{formError}</InlineAlert>}
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} error={errors.name} maxLength={100} autoFocus />

        {editing ? (
          <TextField
            label="Stock unit"
            value={`${ingredient.stockUnit.name} (${ingredient.stockUnit.symbol})`}
            disabled
            readOnly
            hint="The stock unit can’t be changed."
          />
        ) : units.isError ? (
          <InlineAlert>{toApiError(units.error).message}</InlineAlert>
        ) : (
          <SelectField
            label="Stock unit"
            value={unitId}
            onChange={(e) => setUnitId(e.target.value)}
            error={errors.stockUnitId}
            disabled={units.isLoading}
            hint={
              units.data && units.data.length === 0 ? undefined : 'The unit this ingredient is counted in.'
            }
          >
            <option value="">{units.isLoading ? 'Loading units…' : 'Select a unit'}</option>
            {units.data?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.symbol})
              </option>
            ))}
          </SelectField>
        )}
        {!editing && units.data && units.data.length === 0 && (
          <InlineAlert tone="warning">
            No units exist yet. <Link to="/units" className="font-medium underline">Create a unit</Link> first.
          </InlineAlert>
        )}
      </form>
    </Modal>
  )
}

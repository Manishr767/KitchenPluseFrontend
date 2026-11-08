import { useState, type ReactNode } from 'react'
import { toApiError } from '@/api/errors'
import { ConfirmDialog } from './ConfirmDialog'
import { useToast } from './useToast'

/** Shared confirmation for activate / deactivate on branches, ingredients and users. */
export function ToggleActiveDialog({
  noun,
  name,
  nextActive,
  detail,
  onConfirm,
  onClose,
}: {
  noun: string
  name: string
  /** The state the record will have after confirming. */
  nextActive: boolean
  detail?: ReactNode
  onConfirm: () => Promise<unknown>
  onClose: () => void
}) {
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const verb = nextActive ? 'Activate' : 'Deactivate'

  async function confirm() {
    setLoading(true)
    setError(null)
    try {
      await onConfirm()
      toast.success(`${noun} ${nextActive ? 'activated' : 'deactivated'}.`)
      onClose()
    } catch (e) {
      setError(toApiError(e).message)
      setLoading(false)
    }
  }

  return (
    <ConfirmDialog
      title={`${verb} ${noun.toLowerCase()}?`}
      danger={!nextActive}
      confirmLabel={verb}
      loading={loading}
      error={error}
      onConfirm={confirm}
      onCancel={onClose}
      message={
        <>
          <p>
            {verb} <span className="font-medium text-gray-900">{name}</span>?
          </p>
          {detail && <p className="mt-2">{detail}</p>}
        </>
      }
    />
  )
}

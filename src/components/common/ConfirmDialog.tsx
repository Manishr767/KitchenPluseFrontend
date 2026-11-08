import type { ReactNode } from 'react'
import { Button } from './Button'
import { InlineAlert } from './States'
import { Modal } from './Modal'

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  danger = false,
  loading = false,
  error,
  onConfirm,
  onCancel,
}: {
  title: string
  message: ReactNode
  confirmLabel: string
  danger?: boolean
  loading?: boolean
  error?: string | null
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      width="max-w-md"
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-gray-600">
        <div>{message}</div>
        {error && <InlineAlert>{error}</InlineAlert>}
      </div>
    </Modal>
  )
}

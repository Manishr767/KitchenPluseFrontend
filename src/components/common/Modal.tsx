import { X } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

/** Accessible modal built on the native <dialog> element (focus trap and Escape handled by the browser). */
export function Modal({
  title,
  description,
  onClose,
  children,
  footer,
  width = 'max-w-lg',
}: {
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  width?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (dialog && !dialog.open) dialog.showModal()
    return () => dialog?.close()
  }, [])

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onMouseDown={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className={`m-auto w-[calc(100%-2rem)] ${width} rounded-xl border border-gray-200 bg-white p-0 shadow-xl`}
    >
      <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="size-5" />
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
      {footer && (
        <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3">{footer}</div>
      )}
    </dialog>
  )
}

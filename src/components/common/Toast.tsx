import { CircleCheck, CircleAlert } from 'lucide-react'
import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToastContext, type ToastApi } from './toastContext'

interface ToastItem {
  id: number
  tone: 'success' | 'error'
  message: string
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const push = useCallback((tone: ToastItem['tone'], message: string) => {
    const id = nextId.current++
    setToasts((t) => [...t, { id, tone, message }])
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500)
  }, [])

  const api = useMemo<ToastApi>(
    () => ({ success: (m) => push('success', m), error: (m) => push('error', m) }),
    [push],
  )

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 bottom-4 z-[100] flex w-80 max-w-[calc(100%-2rem)] flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-start gap-2.5 rounded-lg border border-gray-200 bg-white px-3.5 py-3 text-sm shadow-lg"
          >
            {t.tone === 'success' ? (
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
            ) : (
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden="true" />
            )}
            <span className="text-gray-800">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

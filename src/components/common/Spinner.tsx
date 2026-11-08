import { LoaderCircle } from 'lucide-react'

export function Spinner({ className = 'size-4' }: { className?: string }) {
  return <LoaderCircle className={`${className} animate-spin`} aria-hidden="true" />
}

export function LoadingBlock({ label = 'Loading…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
      <Spinner className="size-5 text-brand-600" />
      {label}
    </div>
  )
}

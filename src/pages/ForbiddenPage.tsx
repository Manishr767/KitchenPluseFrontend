import { ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

export function ForbiddenPage() {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
        <ShieldCheck className="size-6" aria-hidden="true" />
      </div>
      <h1 className="text-xl font-semibold text-gray-900">You don’t have access to this page</h1>
      <p className="mt-1 max-w-sm text-sm text-gray-500">Your role doesn’t include this part of KitchenPulse.</p>
      <Link to="/dashboard" className="mt-5 text-sm font-medium text-brand-600 hover:text-brand-700">
        Back to dashboard
      </Link>
    </div>
  )
}

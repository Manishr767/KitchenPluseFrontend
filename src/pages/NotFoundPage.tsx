import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <p className="tabular text-4xl font-semibold text-gray-300">404</p>
      <h1 className="mt-2 text-xl font-semibold text-gray-900">Page not found</h1>
      <p className="mt-1 text-sm text-gray-500">The page you’re looking for doesn’t exist.</p>
      <Link to="/dashboard" className="mt-5 text-sm font-medium text-brand-600 hover:text-brand-700">
        Back to dashboard
      </Link>
    </div>
  )
}

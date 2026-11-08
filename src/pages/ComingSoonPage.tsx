import { Clock } from 'lucide-react'
import { Card } from '@/components/common/Card'
import { PageHeader } from '@/components/common/PageHeader'
import type { FutureModule } from '@/routes/navigation'

export function ComingSoonPage({ module }: { module: FutureModule }) {
  const Icon = module.icon
  return (
    <>
      <PageHeader title={module.label} />
      <Card>
        <div className="flex flex-col items-center px-4 py-12 text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
            <Icon className="size-6" aria-hidden="true" />
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
            <Clock className="size-3.5" aria-hidden="true" />
            Coming Soon – Backend Integration Pending
          </span>
          <p className="mt-4 max-w-md text-sm text-gray-700">{module.description}</p>
          <p className="mt-2 max-w-md text-sm text-gray-500">
            The KitchenPulse backend doesn’t provide this module yet, so there is nothing to show. It will be
            connected once the matching APIs exist.
          </p>
        </div>
      </Card>
    </>
  )
}

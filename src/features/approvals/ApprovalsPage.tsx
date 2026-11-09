import { useMemo, useState } from 'react'
import { errorMessage } from '@/api/errors'
import { listIngredients } from '@/api/ingredients.api'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { PageHeader } from '@/components/common/PageHeader'
import { useToast } from '@/components/common/useToast'
import { useQuery } from '@tanstack/react-query'
import { formatDateTime } from '@/utils/format'
import { useIngredientRequests, useReviewIngredientRequest } from '@/features/requests/queries'

export function ApprovalsPage() {
  const toast = useToast()
  const [quantities, setQuantities] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState<Record<number, string>>({})
  const requests = useIngredientRequests()
  const review = useReviewIngredientRequest()
  const ingredients = useQuery({
    queryKey: ['approvals', 'active-ingredients'],
    queryFn: async () => {
      const first = await listIngredients({ active: true, page: 0, size: 100, sort: 'name,asc' })
      const all = [...first.content]
      for (let page = 1; page < first.totalPages; page += 1) {
        const next = await listIngredients({ active: true, page, size: 100, sort: 'name,asc' })
        all.push(...next.content)
      }
      return all
    },
  })
  const ingredientById = useMemo(() => new Map((ingredients.data ?? []).map((item) => [item.id, item])), [ingredients.data])
  const pending = (requests.data ?? []).filter((request) => request.status === 'SUBMITTED')
  const reviewed = (requests.data ?? []).filter((request) => ['APPROVED', 'PARTIALLY_APPROVED', 'REJECTED'].includes(request.status))

  function valueFor(requestId: number, ingredientId: number, requested: number) {
    return quantities[`${requestId}:${ingredientId}`] ?? String(requested)
  }

  async function submitReview(requestId: number, items: { ingredientId: number; requestedQuantity: number }[]) {
    const parsed = items.map((item) => ({
      ingredientId: item.ingredientId,
      approvedQuantity: Number(valueFor(requestId, item.ingredientId, item.requestedQuantity)),
    }))
    if (parsed.some((item, index) => !Number.isFinite(item.approvedQuantity) || item.approvedQuantity < 0 || item.approvedQuantity > items[index].requestedQuantity || !/^\d{1,12}(\.\d{1,3})?$/.test(String(valueFor(requestId, item.ingredientId, items[index].requestedQuantity)).trim()))) {
      toast.error('Enter a valid approval quantity between zero and the requested quantity (maximum 3 decimal places).')
      return
    }
    try {
      const result = await review.mutateAsync({ id: requestId, body: { items: parsed, reviewNote: notes[requestId]?.trim() || undefined } })
      toast.success(`Request #${result.id} ${result.status.toLowerCase().replaceAll('_', ' ')}.`)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <div>
      <PageHeader title="Approvals" description="Review ingredient requests submitted by branches and approve the quantities the warehouse should prepare." />
      {requests.isLoading || ingredients.isLoading ? <Card><p className="text-sm text-gray-500">Loading requests…</p></Card> : requests.isError ? <Card><p className="text-sm text-red-700">{errorMessage(requests.error)}</p><Button className="mt-3" variant="secondary" onClick={() => requests.refetch()}>Try again</Button></Card> : ingredients.isError ? <Card><p className="text-sm text-red-700">{errorMessage(ingredients.error)}</p><Button className="mt-3" variant="secondary" onClick={() => ingredients.refetch()}>Try again</Button></Card> : (
        <>
          <div className="mb-5 grid gap-4 sm:grid-cols-2"><Card><p className="text-sm text-gray-500">Awaiting review</p><p className="mt-1 text-2xl font-semibold text-gray-900">{pending.length}</p></Card><Card><p className="text-sm text-gray-500">Reviewed requests</p><p className="mt-1 text-2xl font-semibold text-gray-900">{reviewed.length}</p></Card></div>
          <div className="space-y-4">
            {pending.length === 0 ? <Card title="Review queue"><p className="text-sm text-gray-600">There are no submitted requests waiting for review.</p></Card> : pending.map((request) => (
              <Card key={request.id} title={`Request #${request.id} · Branch #${request.branchId}`} description={`Submitted ${request.submittedAt ? formatDateTime(request.submittedAt) : '—'}`}>
                <div className="space-y-3">
                  {request.items.map((item) => {
                    const ingredient = ingredientById.get(item.ingredientId)
                    return <div key={item.id} className="grid grid-cols-1 gap-2 border-b border-gray-100 pb-3 sm:grid-cols-[1fr_auto_auto] sm:items-center"><div><p className="font-medium text-gray-900">{ingredient?.name ?? `Ingredient #${item.ingredientId}`}</p><p className="text-xs text-gray-500">Requested: {item.requestedQuantity} {ingredient?.stockUnit.symbol ?? ''}</p></div><label className="text-sm text-gray-600" htmlFor={`approval-${request.id}-${item.ingredientId}`}>Approve quantity</label><div className="flex items-center gap-2"><input id={`approval-${request.id}-${item.ingredientId}`} aria-label={`${ingredient?.name ?? `Ingredient ${item.ingredientId}`} approved quantity`} type="number" min="0" max={item.requestedQuantity} step="0.001" value={valueFor(request.id, item.ingredientId, item.requestedQuantity)} onChange={(event) => setQuantities((current) => ({ ...current, [`${request.id}:${item.ingredientId}`]: event.target.value }))} className="h-10 w-32 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" /><span className="text-xs text-gray-500">{ingredient?.stockUnit.symbol ?? ''}</span></div></div>
                  })}
                  <div><label className="mb-1 block text-sm font-medium text-gray-700" htmlFor={`review-note-${request.id}`}>Review note (optional)</label><textarea id={`review-note-${request.id}`} rows={2} maxLength={1000} value={notes[request.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [request.id]: event.target.value }))} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" placeholder="Reason for partial approval or rejection" /></div>
                  <div className="flex justify-end"><Button loading={review.isPending} disabled={review.isPending} onClick={() => submitReview(request.id, request.items)}>Submit review</Button></div>
                </div>
              </Card>
            ))}
          </div>
          {reviewed.length > 0 && <div className="mt-7"><h2 className="mb-3 text-lg font-semibold text-gray-900">Review history</h2><div className="overflow-x-auto rounded-xl border border-gray-200 bg-white"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-xs uppercase text-gray-500"><tr><th className="px-4 py-3">Request</th><th className="px-4 py-3">Branch</th><th className="px-4 py-3">Reviewed</th><th className="px-4 py-3">Result</th><th className="px-4 py-3">Note</th></tr></thead><tbody className="divide-y divide-gray-100">{reviewed.map((request) => <tr key={request.id}><td className="px-4 py-3 font-medium">#{request.id}</td><td className="px-4 py-3">#{request.branchId}</td><td className="px-4 py-3">{request.reviewedAt ? formatDateTime(request.reviewedAt) : '—'}</td><td className="px-4 py-3">{request.status.replaceAll('_', ' ')}</td><td className="px-4 py-3">{request.reviewNote ?? '—'}</td></tr>)}</tbody></table></div></div>}
        </>
      )}
    </div>
  )
}

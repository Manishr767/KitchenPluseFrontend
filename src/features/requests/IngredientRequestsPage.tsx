import { useMemo, useState } from 'react'
import { errorMessage } from '@/api/errors'
import { listIngredients } from '@/api/ingredients.api'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { PageHeader } from '@/components/common/PageHeader'
import { useToast } from '@/components/common/useToast'
import { useCurrentUser } from '@/features/auth/useAuth'
import { useQuery } from '@tanstack/react-query'
import { formatDateTime } from '@/utils/format'
import { useCreateAndSubmitIngredientRequest, useIngredientRequests } from './queries'

export function IngredientRequestsPage() {
  const user = useCurrentUser()
  const isBranchStaff = user.role === 'BRANCH_STAFF'
  const toast = useToast()
  const [quantities, setQuantities] = useState<Record<number, string>>({})
  const ingredients = useQuery({
    queryKey: ['ingredient-requests', 'active-ingredients'],
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
  const requests = useIngredientRequests()
  const createRequest = useCreateAndSubmitIngredientRequest()
  const ingredientById = useMemo(() => new Map((ingredients.data ?? []).map((item) => [item.id, item])), [ingredients.data])
  const selected = Object.entries(quantities).filter(([, value]) => value.trim() !== '')
  const invalid = selected.some(([, value]) => !/^\d{1,12}(\.\d{1,3})?$/.test(value.trim()) || !Number.isFinite(Number(value)) || Number(value) <= 0)

  async function handleSubmit() {
    if (selected.length === 0 || invalid) {
      toast.error('Enter a valid positive quantity for at least one ingredient (maximum 3 decimal places).')
      return
    }
    try {
      const result = await createRequest.mutateAsync({
        items: selected.map(([ingredientId, value]) => ({ ingredientId: Number(ingredientId), quantity: Number(value) })),
      })
      setQuantities({})
      toast.success(`Request #${result.id} submitted to Central Office.`)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <div>
      <PageHeader title="Ingredient requests" description={isBranchStaff ? 'Request ingredients from Central Office for your branch.' : 'View ingredient requests submitted by restaurant branches.'} />

      {isBranchStaff && (ingredients.isLoading ? (
        <Card><p className="text-sm text-gray-500">Loading active ingredients…</p></Card>
      ) : ingredients.isError ? (
        <Card><p className="text-sm text-red-700">{errorMessage(ingredients.error)}</p><Button className="mt-3" variant="secondary" onClick={() => ingredients.refetch()}>Try again</Button></Card>
      ) : (ingredients.data?.length ?? 0) === 0 ? (
        <Card><p className="text-sm text-gray-600">There are no active ingredients available to request. Ask an administrator to add or activate ingredients.</p></Card>
      ) : (
        <Card title="New ingredient request" description="Enter the quantity needed for each ingredient. Quantities use each ingredient’s stock unit." padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3 font-medium">Ingredient</th><th className="px-5 py-3 font-medium">Request quantity</th></tr></thead>
              <tbody className="divide-y divide-gray-100">
                {ingredients.data?.map((ingredient) => (
                  <tr key={ingredient.id}>
                    <td className="px-5 py-4"><p className="font-medium text-gray-900">{ingredient.name}</p><p className="text-xs text-gray-500">{ingredient.stockUnit.name} ({ingredient.stockUnit.symbol})</p></td>
                    <td className="px-5 py-4"><div className="flex items-center gap-2"><label className="sr-only" htmlFor={`request-${ingredient.id}`}>{ingredient.name} quantity</label><input id={`request-${ingredient.id}`} type="number" min="0.001" step="0.001" placeholder="0" value={quantities[ingredient.id] ?? ''} onChange={(event) => setQuantities((current) => ({ ...current, [ingredient.id]: event.target.value }))} className="h-10 w-40 rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" /><span className="text-xs text-gray-500">{ingredient.stockUnit.symbol}</span></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4"><p className="text-xs text-gray-500">{selected.length} ingredient{selected.length === 1 ? '' : 's'} selected.</p><Button onClick={handleSubmit} loading={createRequest.isPending} disabled={selected.length === 0 || invalid}>Submit request</Button></div>
        </Card>
      ))}

      <div className="mt-6">
        {requests.isLoading ? (
          <Card><p className="text-sm text-gray-500">Loading requests…</p></Card>
        ) : requests.isError ? (
          <Card><p className="text-sm text-red-700">{errorMessage(requests.error)}</p><Button className="mt-3" variant="secondary" onClick={() => requests.refetch()}>Try again</Button></Card>
        ) : (requests.data?.length ?? 0) === 0 ? (
          <Card title="Request history"><p className="text-sm text-gray-600">No ingredient requests have been submitted yet.</p></Card>
        ) : (
          <Card title="Request history" description="Requests are submitted to Central Office for review." padded={false}>
            <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3 font-medium">Request</th><th className="px-5 py-3 font-medium">Branch</th><th className="px-5 py-3 font-medium">Items</th><th className="px-5 py-3 font-medium">Submitted</th><th className="px-5 py-3 font-medium">Status</th></tr></thead><tbody className="divide-y divide-gray-100">{requests.data?.map((request) => <tr key={request.id}><td className="px-5 py-4 font-medium text-gray-900">#{request.id}</td><td className="px-5 py-4 text-gray-700">{request.branchId}</td><td className="px-5 py-4 text-gray-700"><div className="space-y-1">{request.items.map((item) => <p key={item.id}>{ingredientById.get(item.ingredientId)?.name ?? `Ingredient #${item.ingredientId}`} — {item.requestedQuantity} {ingredientById.get(item.ingredientId)?.stockUnit.symbol ?? ''}</p>)}</div></td><td className="px-5 py-4 text-gray-600">{request.submittedAt ? formatDateTime(request.submittedAt) : 'Not submitted'}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${request.status === 'SUBMITTED' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{request.status}</span></td></tr>)}</tbody></table></div>
          </Card>
        )}
      </div>
    </div>
  )
}

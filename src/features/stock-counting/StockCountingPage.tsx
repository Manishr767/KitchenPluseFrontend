import { useMemo, useState } from 'react'
import { errorMessage } from '@/api/errors'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { PageHeader } from '@/components/common/PageHeader'
import { useToast } from '@/components/common/useToast'
import { useCurrentUser } from '@/features/auth/useAuth'
import { useRecordStockCount, useStockCountData } from './queries'

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

export function StockCountingPage() {
  const user = useCurrentUser()
  const toast = useToast()
  const branchId = user.branchId
  const [quantities, setQuantities] = useState<Record<number, string>>({})
  const { ingredients, inventory } = useStockCountData(branchId ?? 0)
  const submitCount = useRecordStockCount(branchId ?? 0)
  const inventoryByIngredient = useMemo(
    () => new Map((inventory.data ?? []).map((item) => [item.ingredientId, item])),
    [inventory.data],
  )

  if (branchId === null) {
    return (
      <div>
        <PageHeader title="Stock counting" description="Record a periodic count of ingredients at your branch." />
        <Card><p className="text-sm text-amber-700">Your account has no branch assigned. Ask an administrator to assign your branch before recording stock counts.</p></Card>
      </div>
    )
  }

  const entries = Object.entries(quantities).filter(([, value]) => value.trim() !== '')
  const hasInvalidQuantity = entries.some(([, value]) => {
    if (!/^\d{1,12}(\.\d{1,3})?$/.test(value.trim())) return true
    return !Number.isFinite(Number(value)) || Number(value) < 0
  })
  const canSubmit = entries.length > 0 && !hasInvalidQuantity && !submitCount.isPending

  async function handleSubmit() {
    if (entries.length === 0) {
      toast.error('Enter at least one stock quantity before submitting.')
      return
    }
    if (hasInvalidQuantity) {
      toast.error('Quantities must be non-negative and have no more than 3 decimal places.')
      return
    }
    try {
      const result = await submitCount.mutateAsync({
        branchId: branchId as number,
        items: entries.map(([ingredientId, value]) => ({ ingredientId: Number(ingredientId), quantity: Number(value) })),
      })
      setQuantities({})
      toast.success(`Stock count #${result.stockCountId} submitted (${result.itemCount} items).`)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  return (
    <div>
      <PageHeader title="Stock counting" description="Enter the quantities physically counted at your branch. You can record a partial count; leave uncounted ingredients blank." />
      {ingredients.isLoading || inventory.isLoading ? (
        <Card><p className="text-sm text-gray-500">Loading ingredients and latest inventory…</p></Card>
      ) : ingredients.isError ? (
        <Card><p className="text-sm text-red-700">{errorMessage(ingredients.error)}</p><Button className="mt-3" variant="secondary" onClick={() => ingredients.refetch()}>Try again</Button></Card>
      ) : inventory.isError ? (
        <Card><p className="text-sm text-red-700">{errorMessage(inventory.error)}</p><Button className="mt-3" variant="secondary" onClick={() => inventory.refetch()}>Try again</Button></Card>
      ) : (ingredients.data?.length ?? 0) === 0 ? (
        <Card><p className="text-sm text-gray-600">There are no active ingredients to count. Add or activate ingredients first.</p></Card>
      ) : (
        <Card title="Branch stock" description="Latest recorded stock is shown for reference. It is not changed until you submit this count." action={<span className="text-xs text-gray-500">Branch ID: {branchId}</span>} padded={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr><th className="px-5 py-3 font-medium">Ingredient</th><th className="px-5 py-3 font-medium">Last recorded</th><th className="px-5 py-3 font-medium">Counted quantity</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ingredients.data?.map((ingredient) => {
                  const latest = inventoryByIngredient.get(ingredient.id)
                  return (
                    <tr key={ingredient.id}>
                      <td className="px-5 py-4"><p className="font-medium text-gray-900">{ingredient.name}</p><p className="text-xs text-gray-500">{ingredient.stockUnit.name} ({ingredient.stockUnit.symbol})</p></td>
                      <td className="px-5 py-4 text-gray-600">{latest ? <><p>{latest.quantity} {latest.unit}</p><p className="mt-0.5 text-xs text-gray-400">{formatDate(latest.countedAt)}</p></> : <span className="text-gray-400">No previous count</span>}</td>
                      <td className="px-5 py-4">
                        <label className="sr-only" htmlFor={`count-${ingredient.id}`}>{ingredient.name} counted quantity</label>
                        <div className="flex items-center gap-2">
                          <input id={`count-${ingredient.id}`} type="number" min="0" max="999999999999" step="0.001" inputMode="decimal" placeholder="Enter quantity" value={quantities[ingredient.id] ?? ''} onChange={(event) => setQuantities((current) => ({ ...current, [ingredient.id]: event.target.value }))} className="h-10 w-40 rounded-lg border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20" />
                          <span className="text-xs text-gray-500">{ingredient.stockUnit.symbol}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-5 py-4">
            <p className="text-xs text-gray-500">{entries.length} ingredient{entries.length === 1 ? '' : 's'} entered. Blank rows will not be submitted.</p>
            <Button onClick={handleSubmit} loading={submitCount.isPending} disabled={!canSubmit}>Submit stock count</Button>
          </div>
        </Card>
      )}
    </div>
  )
}

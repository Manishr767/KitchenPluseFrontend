import { useState } from 'react'
import { errorMessage } from '@/api/errors'
import { Button } from '@/components/common/Button'
import { Card } from '@/components/common/Card'
import { PageHeader } from '@/components/common/PageHeader'
import { useCurrentUser } from '@/features/auth/useAuth'
import { useInventory, useBranches } from './queries'
import { formatDateTime } from '@/utils/format'

export function InventoryPage() {
  const user = useCurrentUser()
  const canChooseBranch = user.branchId === null
  const branches = useBranches(canChooseBranch)
  const [selectedBranchId, setSelectedBranchId] = useState<number | ''>('')
  const branchId = user.branchId ?? (selectedBranchId === '' ? null : selectedBranchId)
  const inventory = useInventory(branchId)
  const selectedBranch = branches.data?.find((branch) => branch.id === branchId)

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="View the latest recorded ingredient quantities for each branch. Stock levels update when branch staff submit a stock count."
      />

      {canChooseBranch && (
        <Card>
          <label htmlFor="inventory-branch" className="mb-2 block text-sm font-medium text-gray-700">Select branch</label>
          {branches.isLoading ? (
            <p className="text-sm text-gray-500">Loading branches…</p>
          ) : branches.isError ? (
            <div><p className="text-sm text-red-700">{errorMessage(branches.error)}</p><Button className="mt-3" variant="secondary" onClick={() => branches.refetch()}>Try again</Button></div>
          ) : (
            <select
              id="inventory-branch"
              value={selectedBranchId}
              onChange={(event) => setSelectedBranchId(event.target.value === '' ? '' : Number(event.target.value))}
              className="h-10 w-full max-w-md rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">Choose a branch…</option>
              {branches.data?.filter((branch) => branch.active).map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name} ({branch.code})</option>
              ))}
            </select>
          )}
        </Card>
      )}

      {branchId === null ? (
        <Card><p className="text-sm text-gray-600">Select a branch to view its latest inventory.</p></Card>
      ) : inventory.isLoading ? (
        <Card><p className="text-sm text-gray-500">Loading inventory…</p></Card>
      ) : inventory.isError ? (
        <Card><p className="text-sm text-red-700">{errorMessage(inventory.error)}</p><Button className="mt-3" variant="secondary" onClick={() => inventory.refetch()}>Try again</Button></Card>
      ) : (inventory.data?.length ?? 0) === 0 ? (
        <Card title={selectedBranch ? `${selectedBranch.name} inventory` : 'Branch inventory'}>
          <p className="text-sm text-gray-600">No stock counts have been submitted for this branch yet. Once branch staff record a count, the latest quantities will appear here.</p>
        </Card>
      ) : (
        <Card
          title={selectedBranch ? `${selectedBranch.name} inventory` : 'Your branch inventory'}
          description="Latest recorded quantity per ingredient."
          action={<span className="text-xs text-gray-500">{inventory.data?.length ?? 0} ingredients</span>}
          padded={false}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                <tr><th className="px-5 py-3 font-medium">Ingredient</th><th className="px-5 py-3 font-medium">Current recorded quantity</th><th className="px-5 py-3 font-medium">Last counted</th><th className="px-5 py-3 font-medium">Count reference</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {inventory.data?.map((item) => (
                  <tr key={item.ingredientId}>
                    <td className="px-5 py-4 font-medium text-gray-900">{item.ingredientName}</td>
                    <td className="px-5 py-4 text-gray-700">{item.quantity} {item.unit}</td>
                    <td className="px-5 py-4 text-gray-600">{formatDateTime(item.countedAt)}</td>
                    <td className="px-5 py-4 text-gray-500">#{item.stockCountId}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}

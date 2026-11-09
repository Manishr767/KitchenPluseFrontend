import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/api/warehouse.api'
export function useWarehouseApprovedRequests() { return useQuery({ queryKey: ['warehouse', 'approved-requests'], queryFn: api.listWarehouseApprovedRequests }) }
export function useWarehouseDispatches() { return useQuery({ queryKey: ['warehouse', 'dispatches'], queryFn: api.listWarehouseDispatches }) }
export function useDispatchWarehouseRequest() {
 const client = useQueryClient()
 return useMutation({ mutationFn: ({ id, body }: { id: number; body: api.CreateWarehouseDispatch }) => api.dispatchWarehouseRequest(id, body), onSuccess: () => { client.invalidateQueries({ queryKey: ['warehouse'] }); client.invalidateQueries({ queryKey: ['ingredient-requests'] }) } })
}

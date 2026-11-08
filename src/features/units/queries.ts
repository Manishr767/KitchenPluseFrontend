import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as unitsApi from '@/api/units.api'

export function useUnits() {
  return useQuery({ queryKey: ['units', 'list'], queryFn: unitsApi.listUnits })
}

export function useCreateUnit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: unitsApi.createUnit,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['units'] }),
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSpots, fetchSpotsAdmin, fetchSpotById, createSpot, updateSpot, deleteSpot } from '@/lib/supabase/queries'
import type { SpotFormData } from '@/types'

export const SPOTS_KEY = ['spots'] as const

export const useSpots      = () => useQuery({ queryKey: SPOTS_KEY, queryFn: fetchSpots, staleTime: 5 * 60_000 })
export const useSpotsAdmin = () => useQuery({ queryKey: [...SPOTS_KEY, 'admin'], queryFn: fetchSpotsAdmin })
export const useSpot       = (id: string) => useQuery({ queryKey: [...SPOTS_KEY, id], queryFn: () => fetchSpotById(id), enabled: !!id })

export function useCreateSpot() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: createSpot, onSuccess: () => qc.invalidateQueries({ queryKey: SPOTS_KEY }) })
}
export function useUpdateSpot() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<SpotFormData> }) => updateSpot(id, data), onSuccess: () => qc.invalidateQueries({ queryKey: SPOTS_KEY }) })
}
export function useDeleteSpot() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: deleteSpot, onSuccess: () => qc.invalidateQueries({ queryKey: SPOTS_KEY }) })
}

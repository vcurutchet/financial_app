import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

async function fetchAssets(profileId) {
  let query = supabase
    .from('assets')
    .select('*, profile:profiles(id, name, type)')
    .order('category')
  if (profileId) query = query.eq('profile_id', profileId)
  const { data, error } = await query
  if (error) throw error
  return data
}

async function upsertAsset(asset) {
  const { data, error } = await supabase.from('assets').upsert(asset).select().single()
  if (error) throw error
  return data
}

async function deleteAsset(id) {
  const { error } = await supabase.from('assets').delete().eq('id', id)
  if (error) throw error
}

export function useAssets(profileId) {
  return useQuery({
    queryKey: ['assets', profileId],
    queryFn: () => fetchAssets(profileId),
  })
}

export function useUpsertAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: upsertAsset,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }),
  })
}

export function useDeleteAsset() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAsset,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['assets'] }),
  })
}

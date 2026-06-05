import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

async function fetchAccounts(profileId) {
  let query = supabase
    .from('accounts')
    .select('*, profile:profiles(id, name, type)')
    .order('name')
  if (profileId) query = query.eq('profile_id', profileId)
  const { data, error } = await query
  if (error) throw error
  return data
}

async function upsertAccount(account) {
  const { data, error } = await supabase.from('accounts').upsert(account).select().single()
  if (error) throw error
  return data
}

async function deleteAccount(id) {
  const { error } = await supabase.from('accounts').delete().eq('id', id)
  if (error) throw error
}

export function useAccounts(profileId) {
  return useQuery({
    queryKey: ['accounts', profileId],
    queryFn: () => fetchAccounts(profileId),
  })
}

export function useUpsertAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: upsertAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  })
}

export function useDeleteAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteAccount,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  })
}

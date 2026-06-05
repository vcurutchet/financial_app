import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

async function fetchProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').order('type')
  if (error) throw error
  return data
}

async function upsertProfile(profile) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert(profile)
    .select()
    .single()
  if (error) throw error
  return data
}

export function useProfiles() {
  return useQuery({ queryKey: ['profiles'], queryFn: fetchProfiles })
}

export function useUpsertProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: upsertProfile,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profiles'] }),
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

async function fetchFiscalYears() {
  const { data, error } = await supabase
    .from('fiscal_years')
    .select('*')
    .order('year', { ascending: false })
  if (error) throw error
  return data
}

async function upsertFiscalYear(fy) {
  const { data, error } = await supabase
    .from('fiscal_years')
    .upsert(fy)
    .select()
    .single()
  if (error) throw error
  return data
}

export function useFiscalYears() {
  return useQuery({ queryKey: ['fiscal_years'], queryFn: fetchFiscalYears })
}

export function useCurrentFiscalYear() {
  return useQuery({
    queryKey: ['fiscal_years', 'current'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fiscal_years')
        .select('*')
        .eq('is_current', true)
        .maybeSingle()
      if (error) throw error
      return data
    },
  })
}

export function useUpsertFiscalYear() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: upsertFiscalYear,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fiscal_years'] }),
  })
}

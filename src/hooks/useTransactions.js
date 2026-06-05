import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const QUERY_KEY = 'transactions'

async function fetchTransactions(filters = {}) {
  let query = supabase
    .from('transactions')
    .select(`
      *,
      category:categories(id, name, color, type),
      account:accounts(id, name),
      profile:profiles(id, name, type)
    `)
    .order('date', { ascending: false })

  if (filters.profileId) query = query.eq('profile_id', filters.profileId)
  if (filters.type) query = query.eq('type', filters.type)
  if (filters.direction) query = query.eq('direction', filters.direction)
  if (filters.fiscalYearId) query = query.eq('fiscal_year_id', filters.fiscalYearId)
  if (filters.month) {
    const [year, month] = filters.month.split('-')
    const next = String(Number(month) + 1).padStart(2, '0')
    query = query.gte('date', `${year}-${month}-01`).lt('date', `${year}-${next}-01`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

async function addTransaction(tx) {
  const { data, error } = await supabase
    .from('transactions')
    .insert(tx)
    .select()
    .single()
  if (error) throw error
  return data
}

async function updateTransaction({ id, ...updates }) {
  const { data, error } = await supabase
    .from('transactions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

async function deleteTransaction(id) {
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (error) throw error
}

export function useTransactions(filters = {}) {
  return useQuery({
    queryKey: [QUERY_KEY, filters],
    queryFn: () => fetchTransactions(filters),
  })
}

export function useAddTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: addTransaction,
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useUpdateTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateTransaction,
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

export function useDeleteTransaction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteTransaction,
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  })
}

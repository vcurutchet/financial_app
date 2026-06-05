import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

async function fetchSalaryPayments(fiscalYearId) {
  let query = supabase.from('salary_payments').select('*').order('date', { ascending: false })
  if (fiscalYearId) query = query.eq('fiscal_year_id', fiscalYearId)
  const { data, error } = await query
  if (error) throw error
  return data
}

async function addSalaryPayment(payment) {
  const { data, error } = await supabase.from('salary_payments').insert(payment).select().single()
  if (error) throw error
  return data
}

async function updateSalaryPayment({ id, ...updates }) {
  const { data, error } = await supabase
    .from('salary_payments')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

async function deleteSalaryPayment(id) {
  const { error } = await supabase.from('salary_payments').delete().eq('id', id)
  if (error) throw error
}

export function useSalaryPayments(fiscalYearId) {
  return useQuery({
    queryKey: ['salary_payments', fiscalYearId],
    queryFn: () => fetchSalaryPayments(fiscalYearId),
    enabled: !!fiscalYearId,
  })
}

export function useAddSalaryPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: addSalaryPayment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['salary_payments'] }),
  })
}

export function useUpdateSalaryPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: updateSalaryPayment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['salary_payments'] }),
  })
}

export function useDeleteSalaryPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteSalaryPayment,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['salary_payments'] }),
  })
}

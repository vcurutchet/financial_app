import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

async function fetchCategories({ scope, type } = {}) {
  let query = supabase.from('categories').select('*').order('name')
  if (scope) query = query.in('scope', [scope, 'both'])
  if (type) query = query.eq('type', type)
  const { data, error } = await query
  if (error) throw error
  return data
}

async function addCategory(cat) {
  const { data, error } = await supabase.from('categories').insert(cat).select().single()
  if (error) throw error
  return data
}

export function useCategories(filters = {}) {
  return useQuery({
    queryKey: ['categories', filters],
    queryFn: () => fetchCategories(filters),
  })
}

export function useAddCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: addCategory,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }),
  })
}

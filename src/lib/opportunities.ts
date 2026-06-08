import { createServerSupabaseClient } from './supabase/server'
import { mapRowToOpportunity } from './supabase/mappers'
import type { Opportunity } from '@/types/opportunity'

export async function getAllOpportunities(): Promise<Opportunity[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(`getAllOpportunities: ${error.message}`)
  return (data ?? []).map(mapRowToOpportunity)
}

export async function getOpportunityBySlug(slug: string): Promise<Opportunity | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) return null
  return mapRowToOpportunity(data)
}

export async function getWeeklyPick(): Promise<Opportunity | null> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('weekly_pick', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  if (error) return null
  return mapRowToOpportunity(data)
}

export async function getOpportunitiesBySector(sector: string): Promise<Opportunity[]> {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('sector', sector)
    .order('created_at', { ascending: false })
  if (error) throw new Error(`getOpportunitiesBySector: ${error.message}`)
  return (data ?? []).map(mapRowToOpportunity)
}

import { cache } from 'react'
import { enrichOpportunity } from '@/data/opportunity-enrichment'
import { createDataSupabaseClient } from './supabase/data'
import { mapRowToOpportunity } from './supabase/mappers'
import type { Opportunity } from '@/types/opportunity'

export const getAllOpportunities = cache(async (): Promise<Opportunity[]> => {
  const supabase = createDataSupabaseClient()
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(`getAllOpportunities: ${error.message}`)
  return (data ?? []).map(mapRowToOpportunity)
})

export async function getOpportunityBySlug(slug: string): Promise<Opportunity | null> {
  const supabase = createDataSupabaseClient()
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) return null
  return mapRowToOpportunity(data)
}

export const getWeeklyPick = cache(async (): Promise<Opportunity | null> => {
  const supabase = createDataSupabaseClient()
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('weekly_pick', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  if (error) return null
  return mapRowToOpportunity(data)
})

export async function getOpportunitiesBySector(sector: string): Promise<Opportunity[]> {
  const supabase = createDataSupabaseClient()
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('sector', sector)
    .order('created_at', { ascending: false })
  if (error) throw new Error(`getOpportunitiesBySector: ${error.message}`)
  return (data ?? []).map(mapRowToOpportunity)
}

export async function getDealOfTheDay(): Promise<Opportunity> {
  const all = await getAllOpportunities()
  const now = new Date()
  const dayKey = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()
  const pool = [...all].sort((a, b) => b.scores.opportunity - a.scores.opportunity)
  const raw = pool[dayKey % pool.length]
  return enrichOpportunity(raw)
}

export async function getEnrichedOpportunityBySlug(slug: string): Promise<Opportunity | null> {
  const raw = await getOpportunityBySlug(slug)
  if (!raw) return null
  return enrichOpportunity(raw)
}

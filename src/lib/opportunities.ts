import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { enrichOpportunity } from '@/data/opportunity-enrichment'
import { createDataSupabaseClient, isSupabaseDataConfigured } from './supabase/data'
import { mapRowToOpportunity, mapRowToOpportunityListItem, OPPORTUNITY_LIST_SELECT } from './supabase/mappers'
import type { OpportunityRow } from './supabase/types'
import type { Opportunity } from '@/types/opportunity'
import type { OpportunityListItem } from '@/types/opportunity'
import type { MapCatalogOpportunity } from '@/context/map-catalog-context'

/** Tag invalidé par POST /api/revalidate après chaque run de sourcing. */
export const OPPORTUNITIES_CACHE_TAG = 'opportunities'

async function fetchOpportunityListItemsFromDb(): Promise<OpportunityListItem[]> {
  if (!isSupabaseDataConfigured()) return []
  const supabase = createDataSupabaseClient()
  const { data, error } = await supabase
    .from('opportunities')
    .select(OPPORTUNITY_LIST_SELECT)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => mapRowToOpportunityListItem(row as OpportunityRow))
}

const getCachedOpportunityListItems = unstable_cache(
  fetchOpportunityListItemsFromDb,
  ['opportunity-list-items-v2'],
  {
    tags: [OPPORTUNITIES_CACHE_TAG],
    revalidate: process.env.NODE_ENV === 'development' ? 30 : 3600,
  }
)

/** Projection légère pour la page catalogue (cartes + filtres client). */
export const getOpportunityListItems = cache(async (): Promise<OpportunityListItem[]> => {
  if (!isSupabaseDataConfigured()) return []
  try {
    return await getCachedOpportunityListItems()
  } catch (err) {
    console.warn(
      `[opportunities] getOpportunityListItems indisponible — fallback direct: ${err instanceof Error ? err.message : err}`
    )
    try {
      return await fetchOpportunityListItemsFromDb()
    } catch {
      return []
    }
  }
})

async function fetchAllOpportunitiesFromDb(): Promise<Opportunity[]> {
  if (!isSupabaseDataConfigured()) return []
  const supabase = createDataSupabaseClient()
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(mapRowToOpportunity)
}

/**
 * Catalogue complet — cache cross-requêtes (ISR) avec tag pour invalidation à la demande.
 * Sans ce tag, revalidateTag('opportunities') était un no-op : la liste restait figée
 * alors que les fiches /opportunities/[slug] (dynamicParams) se régénéraient à la volée.
 */
const getCachedAllOpportunities = unstable_cache(
  fetchAllOpportunitiesFromDb,
  ['all-opportunities-v2'],
  {
    tags: [OPPORTUNITIES_CACHE_TAG],
    revalidate: process.env.NODE_ENV === 'development' ? 30 : 3600,
  }
)

/** Déduplication intra-requête (layout + page) + cache ISR taggé. */
export const getAllOpportunities = cache(async (): Promise<Opportunity[]> => {
  if (!isSupabaseDataConfigured()) return []
  try {
    return await getCachedAllOpportunities()
  } catch (err) {
    console.warn(
      `[opportunities] getAllOpportunities indisponible — fallback direct: ${err instanceof Error ? err.message : err}`
    )
    try {
      return await fetchAllOpportunitiesFromDb()
    } catch {
      return []
    }
  }
})

export async function getOpportunityBySlug(slug: string): Promise<Opportunity | null> {
  if (!isSupabaseDataConfigured()) return null
  const supabase = createDataSupabaseClient()
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()
  if (error) return null
  return mapRowToOpportunity(data)
}

export const getWeeklyPick = cache(async (): Promise<Opportunity | null> => {
  if (!isSupabaseDataConfigured()) return null
  const supabase = createDataSupabaseClient()
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('status', 'published')
    .eq('weekly_pick', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  if (error) return null
  return mapRowToOpportunity(data)
})

/**
 * Projection légère du catalogue pour la carte monde (compteurs + liste par pays).
 * Dérivée au runtime depuis Supabase → reflète le sourcing sans rebuild.
 */
export async function getMapCatalog(): Promise<MapCatalogOpportunity[]> {
  const all = await getAllOpportunities()
  return all.map((o) => ({
    slug: o.slug,
    name: o.name,
    pitch: o.pitch,
    originCountryCode: o.originCountryCode,
    scores: { opportunity: o.scores.opportunity },
    revenueMin: o.revenueMin,
    revenueMax: o.revenueMax,
  }))
}

export async function getOpportunitiesBySector(sector: string): Promise<Opportunity[]> {
  if (!isSupabaseDataConfigured()) return []
  try {
    const supabase = createDataSupabaseClient()
    const { data, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('status', 'published')
      .eq('sector', sector)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapRowToOpportunity)
  } catch (err) {
    console.warn(
      `[opportunities] getOpportunitiesBySector(${sector}) indisponible — fallback []: ${err instanceof Error ? err.message : err}`
    )
    return []
  }
}

export async function getDealOfTheDay(): Promise<Opportunity | null> {
  const all = await getAllOpportunities()
  if (all.length === 0) return null
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

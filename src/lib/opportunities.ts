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

const MAP_CATALOG_SELECT =
  'slug, name, pitch, origin_country_code, scores, revenue_min, revenue_max'

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
 * Catalogue complet — déduplication intra-requête uniquement.
 * unstable_cache évité : le payload dépasse la limite Next.js de 2 Mo (~111 fiches).
 * L'ISR page-level (revalidate / revalidatePath) couvre home, quiz, etc.
 */
export const getAllOpportunities = cache(async (): Promise<Opportunity[]> => {
  if (!isSupabaseDataConfigured()) return []
  try {
    return await fetchAllOpportunitiesFromDb()
  } catch (err) {
    console.warn(
      `[opportunities] getAllOpportunities indisponible — fallback []: ${err instanceof Error ? err.message : err}`
    )
    return []
  }
})

async function fetchMapCatalogFromDb(): Promise<MapCatalogOpportunity[]> {
  if (!isSupabaseDataConfigured()) return []
  const supabase = createDataSupabaseClient()
  const { data, error } = await supabase
    .from('opportunities')
    .select(MAP_CATALOG_SELECT)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map((row) => {
    const scores = row.scores as { opportunity?: number } | null
    return {
      slug: row.slug as string,
      name: row.name as string,
      pitch: row.pitch as string,
      originCountryCode: row.origin_country_code as string,
      scores: { opportunity: scores?.opportunity ?? 0 },
      revenueMin: row.revenue_min as number,
      revenueMax: row.revenue_max as number,
    }
  })
}

const getCachedMapCatalog = unstable_cache(
  fetchMapCatalogFromDb,
  ['map-catalog-v1'],
  {
    tags: [OPPORTUNITIES_CACHE_TAG],
    revalidate: process.env.NODE_ENV === 'development' ? 30 : 3600,
  }
)

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

/** Fiche publiée ou archivée — réservé aux projets portfolio déjà créés. */
export async function getOpportunityBySlugIncludingArchived(
  slug: string,
): Promise<Opportunity | null> {
  if (!isSupabaseDataConfigured()) return null
  const supabase = createDataSupabaseClient()
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('slug', slug)
    .in('status', ['published', 'archived'])
    .maybeSingle()
  if (error || !data) return null
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
  if (!isSupabaseDataConfigured()) return []
  try {
    return await getCachedMapCatalog()
  } catch (err) {
    console.warn(
      `[opportunities] getMapCatalog indisponible — fallback direct: ${err instanceof Error ? err.message : err}`
    )
    try {
      return await fetchMapCatalogFromDb()
    } catch {
      return []
    }
  }
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

export async function getEnrichedOpportunityBySlugIncludingArchived(
  slug: string,
): Promise<Opportunity | null> {
  const raw = await getOpportunityBySlugIncludingArchived(slug)
  if (!raw) return null
  return enrichOpportunity(raw)
}

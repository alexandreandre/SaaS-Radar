import { createClient } from '@supabase/supabase-js'
import { getSupabaseAnonKey, getSupabaseUrl } from './env'

const CI_PLACEHOLDER_HOST = 'placeholder.supabase.co'
const CI_PLACEHOLDER_ANON_KEY = 'placeholder-anon-key'

/** True quand les variables pointent vers une vraie instance (pas les placeholders CI). */
export function isSupabaseDataConfigured(): boolean {
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()
  if (!url || !key) return false
  if (key === CI_PLACEHOLDER_ANON_KEY) return false
  try {
    if (new URL(url).hostname === CI_PLACEHOLDER_HOST) return false
  } catch {
    return false
  }
  return true
}

/** Client lecture publique — fonctionne au build (SSG) et en requête, sans cookies. */
export function createDataSupabaseClient() {
  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()
  if (!url || !key) {
    throw new Error(
      'Renseignez SUPABASE_URL et SUPABASE_ANON_KEY'
    )
  }
  return createClient(url, key)
}

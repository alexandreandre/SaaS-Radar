import { createClient } from '@supabase/supabase-js'
import { getSupabaseAnonKey, getSupabaseUrl } from './env'

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

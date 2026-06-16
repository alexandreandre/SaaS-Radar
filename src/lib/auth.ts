import 'server-only'
import { cache } from 'react'
import type { User } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import type { Tier } from '@/lib/tier'
import type { Database } from '@/types/database'

type ProfileRow = Database['public']['Tables']['profiles']['Row']

/** Utilisateur authentifie (verifie cote serveur) ou null. Dedupe par requete. */
export const getCurrentUser = cache(async (): Promise<User | null> => {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user
  } catch {
    return null
  }
})

/**
 * Profil de l'utilisateur courant.
 * Fallback robuste : si la ligne profiles est absente (trigger pas encore execute,
 * compte cree avant la migration), tente un upsert best-effort puis renvoie un profil
 * 'free' par defaut. Ne jette jamais.
 */
export const getProfile = cache(async (): Promise<ProfileRow | null> => {
  try {
    const supabase = await createServerSupabaseClient()
    const user = await getCurrentUser()
    if (!user) return null

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (data) return data as ProfileRow

    // Profil manquant : upsert best-effort (peut etre refuse par la RLS si pas service-role,
    // d'ou le fallback en memoire renvoye dans tous les cas).
    const fallback: ProfileRow = {
      id: user.id,
      email: user.email ?? null,
      full_name:
        (user.user_metadata?.full_name as string | undefined) ??
        (user.user_metadata?.name as string | undefined) ??
        null,
      plan: 'free',
      is_admin: false,
      opportunities_viewed_this_month: 0,
      last_reset_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      stripe_customer_id: null,
      stripe_subscription_id: null,
      subscription_status: null,
      current_period_end: null,
    }
    await supabase
      .from('profiles')
      .upsert({ id: user.id, email: fallback.email }, { onConflict: 'id' })
    return fallback
  } catch {
    return null
  }
})

function normalizeTier(plan: string | undefined | null): Tier {
  return plan === 'builder' || plan === 'pro' ? plan : 'free'
}

/**
 * Tier autoritatif (source de verite serveur = profiles.plan).
 * Ne jette jamais : retombe sur 'free' si non connecte ou profil absent.
 */
export async function getTier(): Promise<Tier> {
  const profile = await getProfile()
  return normalizeTier(profile?.plan)
}

/** True si l'utilisateur courant est super-admin (profiles.is_admin). */
export async function isAdmin(): Promise<boolean> {
  const profile = await getProfile()
  return profile?.is_admin === true
}

/** Limite mensuelle de consultations pour le plan Free (quota optionnel). */
export const FREE_MONTHLY_QUOTA = 3

function isStaleReset(lastResetAt: string | null | undefined): boolean {
  if (!lastResetAt) return true
  const last = new Date(lastResetAt)
  const now = new Date()
  return (
    last.getUTCFullYear() !== now.getUTCFullYear() ||
    last.getUTCMonth() !== now.getUTCMonth()
  )
}

export type QuotaState = {
  /** True si l'utilisateur peut encore consulter une fiche premium ce mois-ci. */
  allowed: boolean
  used: number
  limit: number
}

/**
 * Quota optionnel (NON cable par defaut — activable plus tard cote lecture fiche).
 * Reset mensuel : si last_reset_at date d'un mois anterieur, le compteur repart a 0.
 * Les tiers payants n'ont pas de limite.
 */
export async function consumeOpportunityView(): Promise<QuotaState> {
  const profile = await getProfile()
  const limit = FREE_MONTHLY_QUOTA
  // Tiers payants : illimite.
  if (!profile || normalizeTier(profile.plan) !== 'free') {
    return { allowed: true, used: 0, limit }
  }

  const stale = isStaleReset(profile.last_reset_at)
  const used = stale ? 0 : profile.opportunities_viewed_this_month
  if (used >= limit) {
    return { allowed: false, used, limit }
  }

  try {
    const supabase = await createServerSupabaseClient()
    await supabase
      .from('profiles')
      .update({
        opportunities_viewed_this_month: used + 1,
        ...(stale ? { last_reset_at: new Date().toISOString() } : {}),
      })
      .eq('id', profile.id)
  } catch {
    // Best-effort : on n'empeche pas la lecture si l'increment echoue.
  }

  return { allowed: true, used: used + 1, limit }
}

import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  return updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Toutes les routes sauf :
     * - _next/static, _next/image (assets build)
     * - favicon, fichiers d'images, /geo (topojson cache immutable)
     * - api/revalidate & api/admin (proteges par secret, pas de session cookie)
     * - api/stripe (webhook/checkout/portal : Stripe n'envoie pas de cookie ;
     *   le webhook a besoin du body brut intact, pas de refresh de session)
     * - api/newsletter (cron Vercel + unsubscribe : pas de session utilisateur)
     */
    '/((?!_next/static|_next/image|favicon.ico|geo/|api/revalidate|api/admin|api/stripe|api/newsletter|api/metrics/web-vitals|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}

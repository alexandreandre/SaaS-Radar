import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { hasAdminAccess, normalizeAdminRole } from '@/lib/admin/rbac'
import { isCockpitEnabled, isCheckoutEnabled } from '@/lib/product-phase'
import { getSupabaseAnonKey, getSupabaseUrl } from './env'

const PROTECTED_PREFIXES = ['/mes-saas', '/cockpit', '/account']

const COCKPIT_PATH_PREFIXES = ['/cockpit', '/mes-saas', '/account', '/start']
const PRICING_PATH = '/pricing'

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

function isCockpitPath(pathname: string): boolean {
  return COCKPIT_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  )
}

/**
 * Rafraichit la session Supabase a chaque requete et reecrit les cookies sur la reponse.
 * Indispensable avec @supabase/ssr : sans ce refresh, la session SSR expire et les
 * Server Components ne voient plus l'utilisateur connecte.
 *
 * Les routes protegees redirigent ici (getUser deja appele) pour ne pas bloquer le rendu
 * des pages sur un second round-trip auth dans (workspace)/layout.tsx.
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname

  let response = NextResponse.next({ request })

  const url = getSupabaseUrl()
  const key = getSupabaseAnonKey()
  // Tolerance build/preview sans secrets : on ne casse pas la requete.
  if (!url || !key) return response

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // IMPORTANT : getUser() force la revalidation du token et declenche setAll si refresh.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let isAdminUser = false
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, admin_role')
      .eq('id', user.id)
      .maybeSingle()
    isAdminUser = hasAdminAccess(
      normalizeAdminRole(profile?.admin_role, profile?.is_admin),
    )
  }

  if (!isCockpitEnabled(isAdminUser)) {
    if (pathname === '/start') {
      return NextResponse.redirect(new URL('/opportunities', request.url))
    }
    if (pathname === PRICING_PATH || pathname.startsWith(`${PRICING_PATH}/`)) {
      return NextResponse.redirect(new URL('/newsletter', request.url))
    }
    if (isCockpitPath(pathname)) {
      return NextResponse.redirect(new URL('/bientot', request.url))
    }
    if (pathname.startsWith('/api/build/') || pathname.startsWith('/api/campaign/')) {
      return NextResponse.json(
        { error: 'Cockpit indisponible en phase discovery' },
        { status: 403 },
      )
    }
  }

  if (!isCheckoutEnabled()) {
    if (pathname === '/api/stripe/checkout' || pathname === '/api/stripe/portal') {
      return NextResponse.json(
        { error: 'Abonnements indisponibles en phase discovery' },
        { status: 403 },
      )
    }
  }

  if (isProtectedPath(pathname) && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname || '/mes-saas')
    return NextResponse.redirect(loginUrl)
  }

  return response
}

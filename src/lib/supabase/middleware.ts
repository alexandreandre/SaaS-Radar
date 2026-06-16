import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Rafraichit la session Supabase a chaque requete et reecrit les cookies sur la reponse.
 * Indispensable avec @supabase/ssr : sans ce refresh, la session SSR expire et les
 * Server Components ne voient plus l'utilisateur connecte.
 *
 * Ne lit volontairement AUCUNE logique de redirection ici : la protection des routes
 * est faite dans (workspace)/layout.tsx cote serveur (T1.1).
 */
export async function updateSession(request: NextRequest): Promise<NextResponse> {
  // Propage le pathname courant aux Server Components (layout (workspace)) via un header :
  // App Router n'expose pas la pathname aux layouts, c'est le canal recommande.
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', request.nextUrl.pathname)

  let response = NextResponse.next({ request: { headers: requestHeaders } })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  // Tolerance build/preview sans secrets : on ne casse pas la requete.
  if (!url || !key) return response

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request: { headers: requestHeaders } })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  // IMPORTANT : getUser() force la revalidation du token et declenche setAll si refresh.
  await supabase.auth.getUser()

  return response
}

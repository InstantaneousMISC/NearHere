import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { claimBusinessForUser } from '@/server/auth/claim'

function getSafeDestination(next: string | null) {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/'
  }

  return next
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  const destination = getSafeDestination(requestUrl.searchParams.get('next'))
  const redirectUrl = `${origin}${destination}`
  let response = NextResponse.redirect(redirectUrl)

  if (code) {
    // The callback is a route handler, so copy every session cookie onto the
    // response that performs the redirect. This preserves the exchanged PKCE
    // session for the destination request.
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
            response = NextResponse.redirect(redirectUrl)
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )
    const { data } = await supabase.auth.exchangeCodeForSession(code)

    // Google authentication returns here before the browser revisits the claim
    // page. Claim ownership in the same verified identity flow.
    const claimMatch = destination.match(/^\/business\/claim\/([^/?#]+)$/)
    if (claimMatch && data.user) {
      try {
        await claimBusinessForUser({
          token: decodeURIComponent(claimMatch[1]),
          userId: data.user.id,
          userEmail: data.user.email,
        })
        const dashboardResponse = NextResponse.redirect(`${origin}/business/dashboard`)
        response.cookies.getAll().forEach((cookie) => dashboardResponse.cookies.set(cookie))
        return dashboardResponse
      } catch {
        // Keep the claim URL as the destination so it can display the relevant
        // token or email-match error to the user.
      }
    }
  }

  return response
}

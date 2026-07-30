import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAdminRoute = pathname.startsWith('/admin')
  const isBusinessDashboardRoute =
    pathname.startsWith('/business/dashboard') ||
    pathname.startsWith('/business/profile') ||
    pathname.startsWith('/business/analytics') ||
    pathname.startsWith('/business/setup') ||
    pathname.startsWith('/submit-creative/')

  // The proxy's only responsibility is protecting page navigations and
  // refreshing sessions for those navigations. Public pages and API requests
  // validate identity in their own server handlers/procedures, so refreshing a
  // Supabase session here would add a network round trip to every request
  // without adding authorization coverage.
  if (!isAdminRoute && !isBusinessDashboardRoute) {
    return NextResponse.next({ request })
  }

  let { response, user } = await updateSession(request)

  // Dev admin and merchant mock bypass
  if (process.env.NODE_ENV !== 'production') {
    if (request.cookies.get('mock_admin')?.value === 'true') {
      user = {
        id: '6a43af92-16fe-4873-9f64-1dd278d794c2',
        email: 'admin@localspotmailers.com',
      } as any
    } else {
      const mockEmail = request.cookies.get('mock_user_email')?.value
      const mockId = request.cookies.get('mock_user_id')?.value
      if (mockEmail && mockId) {
        user = {
          id: mockId,
          email: mockEmail,
        } as any
      }
    }
  }

  // Protect /admin/* routes — redirect unauthenticated users to the admin portal.
  if (isAdminRoute && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth/admin/login'
    loginUrl.searchParams.set('redirectTo', `${pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(loginUrl)
  }

  // Protect business dashboard routes — claim and public business pages remain public.
  if (isBusinessDashboardRoute && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/auth/business/login'
    loginUrl.searchParams.set('redirectTo', `${pathname}${request.nextUrl.search}`)
    return NextResponse.redirect(loginUrl)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static file extensions (svg, png, jpg, jpeg, gif, webp, ico)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}

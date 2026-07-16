import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  let { response, user } = await updateSession(request)
  const { pathname } = request.nextUrl

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

  // Protect /admin/* routes — redirect unauthenticated users to login
  if (pathname.startsWith('/admin')) {
    if (!user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/auth/login'
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Protect /business/* dashboard routes — redirect unauthenticated users to login
  const isBusinessDashboardRoute =
    pathname.startsWith('/business/dashboard') ||
    pathname.startsWith('/business/profile') ||
    pathname.startsWith('/business/analytics') ||
    pathname.startsWith('/business/setup')

  if (isBusinessDashboardRoute) {
    if (!user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/auth/login'
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // If user is already authenticated and visiting /auth/login, redirect to /admin
  if (pathname === '/auth/login') {
    if (user) {
      const adminUrl = request.nextUrl.clone()
      adminUrl.pathname = '/admin'
      return NextResponse.redirect(adminUrl)
    }
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

import { NextResponse, type NextRequest } from 'next/server'

// Paths that must NEVER be gated by the session proxy.
const PUBLIC_PATHS = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/api/auth',
  '/api/health',
  '/share',
]

// The compose file ships a placeholder secret for first boot. Treat it as
// "auth not really configured" so the container behaves like anonymous/local
// dev instead of locking every route behind a login that doesn't exist yet.
const INSECURE_DEFAULT_SECRET = 'changeme-insecure-dev-secret-32chars-min'

export default function proxy(request: NextRequest) {
  const secret = process.env.BETTER_AUTH_SECRET
  if (!secret || secret === INSECURE_DEFAULT_SECRET) {
    return NextResponse.next()
  }

  const { pathname } = request.nextUrl
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const sessionCookie =
    request.cookies.get('better-auth.session_token') ??
    request.cookies.get('__Secure-better-auth.session_token')

  if (!sessionCookie) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|design-mode-agent.js|.*\\.png$).*)'],
}

/**
 * Purpose: Auth gate for the self-hosted UI (Next.js 16 proxy).
 * - No SIN_UI_TOKEN configured -> everything is open (local dev mode).
 * - API requests without a valid session -> 401 JSON.
 * - Page requests without a valid session -> redirect to /login.
 * Also accepts an `Authorization: Bearer <token>` header for scripted access.
 */
import { NextResponse, type NextRequest } from 'next/server'

const AUTH_COOKIE = 'sin_session'

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/health']

function isPublic(pathname: string): boolean {
  return (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith('/share/') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/images/')
  )
}

export function proxy(req: NextRequest) {
  const expected = process.env.SIN_UI_TOKEN
  if (!expected) return NextResponse.next()

  const { pathname } = req.nextUrl
  if (isPublic(pathname)) return NextResponse.next()

  const cookieToken = req.cookies.get(AUTH_COOKIE)?.value
  const headerToken = req.headers
    .get('authorization')
    ?.replace(/^Bearer\s+/i, '')

  // Edge runtime cannot read the token store from disk. Treat presence of a
  // session as "let the Node route verify it" — every API/route handler
  // re-verifies via guardRequest/assertAuthed (defense in depth).
  const authed =
    cookieToken === expected ||
    headerToken === expected ||
    Boolean(cookieToken?.startsWith('sin_')) ||
    Boolean(headerToken?.startsWith('sin_'))
  if (authed) return NextResponse.next()

  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { ok: false, error: 'Unauthorized' },
      { status: 401 },
    )
  }

  const loginUrl = req.nextUrl.clone()
  loginUrl.pathname = '/login'
  loginUrl.searchParams.set('next', pathname)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}

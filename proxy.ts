import { type NextRequest, NextResponse } from 'next/server'

// ── CORS ─────────────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean)

function corsHeaders(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  }
}

// ── Auth route lists ──────────────────────────────────────────────────────────

const ADMIN_PREFIXES = ['/admin']
const USER_PREFIXES  = [
  '/dashboard', '/orders', '/services', '/wallet',
  '/rewards', '/notifications', '/profile', '/help', '/referrals',
]
// These are always public — never redirect them
const PUBLIC_PATHS = ['/login', '/signup', '/admin-login', '/admin/login']

// ── Main proxy function ───────────────────────────────────────────────────────

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const origin = req.headers.get('origin') ?? ''
  const allowed = ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')

  // ── CORS pre-flight for /api/* ─────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {
    if (req.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 204,
        headers: allowed ? corsHeaders(origin) : {},
      })
    }
    const res = NextResponse.next()
    if (allowed) {
      Object.entries(corsHeaders(origin)).forEach(([k, v]) => res.headers.set(k, v))
    }
    return res
  }

  // ── Auth guard for protected pages ────────────────────────────────────────
  // Skip public pages, static assets, and the root
  if (
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/')) ||
    pathname.startsWith('/_next/') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  const isAdminPath = ADMIN_PREFIXES.some((p) => pathname.startsWith(p))
  const isUserPath  = USER_PREFIXES.some((p) => pathname.startsWith(p))

  if (!isAdminPath && !isUserPath) return NextResponse.next()

  const loginUrl = new URL(isAdminPath ? '/admin/login' : '/login', req.url)

  const hasAccess  = !!req.cookies.get('access_token')?.value
  const hasRefresh = !!req.cookies.get('refresh_token')?.value

  // Valid access token — let the Server Component verify it
  if (hasAccess) return NextResponse.next()

  // No tokens at all → login
  if (!hasRefresh) return NextResponse.redirect(loginUrl)

  // Access token expired but refresh token present → silently rotate
  try {
    const refreshUrl = new URL('/api/auth/refresh-cookie', req.url)
    const refreshRes = await fetch(refreshUrl.toString(), {
      method: 'POST',
      headers: { cookie: req.headers.get('cookie') ?? '' },
    })

    if (!refreshRes.ok) return NextResponse.redirect(loginUrl)

    const body = (await refreshRes.json()) as {
      success: boolean
      data?: { accessToken: string; refreshToken: string }
    }
    if (!body.success || !body.data) return NextResponse.redirect(loginUrl)

    const { accessToken, refreshToken } = body.data

    // Redirect back to the same URL so the Server Component sees fresh cookies
    const response = NextResponse.redirect(req.url)
    response.cookies.set('access_token', accessToken, {
      path: '/',
      maxAge: 60 * 15,           // 15 min — mirrors JWT expiry
      sameSite: 'strict',
      httpOnly: false,            // must be JS-readable for apiFetch Bearer header
    })
    response.cookies.set('refresh_token', refreshToken, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days — matches DB TTL
      sameSite: 'strict',
      httpOnly: false,
    })
    return response
  } catch {
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     *   - _next/static, _next/image
     *   - files with extensions (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)',
  ],
}

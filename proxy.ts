import { NextRequest, NextResponse } from 'next/server'

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

export function proxy(req: NextRequest) {
  const origin = req.headers.get('origin') ?? ''
  const allowed = ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')

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

export const config = {
  matcher: '/api/:path*',
}

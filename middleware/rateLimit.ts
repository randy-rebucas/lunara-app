import { NextRequest, NextResponse } from 'next/server'
import { RateLimiterMemory } from 'rate-limiter-flexible'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

const limiters = new Map<string, RateLimiterMemory>()
const globalLimiter = new RateLimiterMemory({ points: 100, duration: 60 })

function getLimiter(key: string, points: number, durationSecs: number): RateLimiterMemory {
  const existing = limiters.get(key)
  if (existing) return existing
  const limiter = new RateLimiterMemory({ points, duration: durationSecs })
  limiters.set(key, limiter)
  return limiter
}

function getIP(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
}

export async function checkGlobalRateLimit(req: NextRequest): Promise<NextResponse | null> {
  const ip = getIP(req)
  try {
    await globalLimiter.consume(ip)
    return null
  } catch {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please slow down.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }
}

export function withRateLimit(
  handler: (req: NextRequest, ctx: AnyCtx) => Promise<NextResponse>,
  options: { points?: number; duration?: number; key?: string } = {}
) {
  const { points = 5, duration = 60, key = 'default' } = options
  const limiter = getLimiter(key, points, duration)

  return async (req: NextRequest, ctx: AnyCtx): Promise<NextResponse> => {
    const ip = getIP(req)

    try {
      await limiter.consume(ip)
      return handler(req, ctx)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(duration) } }
      )
    }
  }
}

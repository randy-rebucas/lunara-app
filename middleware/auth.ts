import { NextRequest, NextResponse } from 'next/server'
import { verifyAccessToken, JWTPayload } from '@/lib/jwt'
import { checkGlobalRateLimit } from '@/middleware/rateLimit'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

export function withAuth(
  handler: (req: NextRequest, ctx: AnyCtx, user: JWTPayload) => Promise<NextResponse>,
  options: { role?: 'admin' | 'driver' } = {}
) {
  return async (req: NextRequest, ctx: AnyCtx): Promise<NextResponse> => {
    const limited = await checkGlobalRateLimit(req)
    if (limited) return limited

    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.slice(7)
    try {
      const user = verifyAccessToken(token)
      if (options.role && user.role !== options.role) {
        return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
      }
      return handler(req, ctx, user)
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }
  }
}

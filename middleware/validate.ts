import { NextRequest, NextResponse } from 'next/server'
import { ZodSchema } from 'zod'
import { verifyAccessToken, JWTPayload } from '@/lib/jwt'
import { checkGlobalRateLimit } from '@/middleware/rateLimit'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (req: NextRequest, ctx: AnyCtx, body: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ctx: AnyCtx): Promise<NextResponse> => {
    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
    }

    const result = schema.safeParse(rawBody)
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: result.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 }
      )
    }

    return handler(req, ctx, result.data)
  }
}

export function withAuthAndValidation<T>(
  schema: ZodSchema<T>,
  handler: (req: NextRequest, ctx: AnyCtx, user: JWTPayload, body: T) => Promise<NextResponse>,
  options: { role?: 'admin' | 'driver' } = {}
) {
  return async (req: NextRequest, ctx: AnyCtx): Promise<NextResponse> => {
    const limited = await checkGlobalRateLimit(req)
    if (limited) return limited

    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    let user: JWTPayload
    try {
      user = verifyAccessToken(authHeader.slice(7))
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    if (options.role && user.role !== options.role) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    let rawBody: unknown
    try {
      rawBody = await req.json()
    } catch {
      return NextResponse.json({ success: false, error: 'Invalid JSON body' }, { status: 400 })
    }

    const result = schema.safeParse(rawBody)
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: result.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 }
      )
    }

    return handler(req, ctx, user, result.data)
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/jwt'
import { withValidation } from '@/middleware/validate'
import { refreshTokenSchema, RefreshTokenInput } from '@/schemas/auth.schema'
import RefreshToken from '@/models/RefreshToken'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

async function handleRefresh(
  _req: NextRequest,
  _ctx: AnyCtx,
  body: RefreshTokenInput
): Promise<NextResponse> {
  await connectDB()

  let payload: ReturnType<typeof verifyRefreshToken>
  try {
    payload = verifyRefreshToken(body.refreshToken)
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid or expired refresh token' },
      { status: 401 }
    )
  }

  const stored = await RefreshToken.findOne({ jti: payload.jti, isRevoked: false })
  if (!stored || stored.expiresAt < new Date()) {
    return NextResponse.json(
      { success: false, error: 'Refresh token has been revoked or expired' },
      { status: 401 }
    )
  }

  // Rotate: revoke old, issue new
  await RefreshToken.findByIdAndUpdate(stored._id, { isRevoked: true })

  const tokenPayload = { userId: payload.userId, role: payload.role }
  const accessToken = signAccessToken(tokenPayload)
  const { token: refreshToken, jti } = signRefreshToken(tokenPayload)

  await RefreshToken.create({
    user: payload.userId,
    jti,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })

  return NextResponse.json({
    success: true,
    data: { accessToken, refreshToken },
  })
}

export const POST = withValidation(refreshTokenSchema, handleRefresh)

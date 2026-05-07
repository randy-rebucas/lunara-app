import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { verifyRefreshToken, signAccessToken, signRefreshToken } from '@/lib/jwt'
import RefreshToken from '@/models/RefreshToken'

/**
 * POST /api/auth/refresh-cookie
 *
 * Reads the refresh_token from the request cookie (not the body),
 * rotates it, and returns the new tokens in the JSON body so the
 * caller (middleware) can set them as cookies on the redirect response.
 */
export async function POST(req: NextRequest) {
  const refreshToken = req.cookies.get('refresh_token')?.value
  if (!refreshToken) {
    return NextResponse.json({ success: false, error: 'No refresh token cookie' }, { status: 401 })
  }

  try {
    const payload = verifyRefreshToken(refreshToken)

    await connectDB()

    const stored = await RefreshToken.findOne({ jti: payload.jti, isRevoked: false })
    if (!stored || stored.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Refresh token revoked or expired' },
        { status: 401 }
      )
    }

    await RefreshToken.findByIdAndUpdate(stored._id, { isRevoked: true })

    const tokenPayload = { userId: payload.userId, role: payload.role }
    const newAccessToken = signAccessToken(tokenPayload)
    const { token: newRefreshToken, jti } = signRefreshToken(tokenPayload)

    await RefreshToken.create({
      user: payload.userId,
      jti,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })

    return NextResponse.json({
      success: true,
      data: { accessToken: newAccessToken, refreshToken: newRefreshToken },
    })
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid refresh token' }, { status: 401 })
  }
}

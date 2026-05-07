import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { connectDB } from '@/lib/db'
import { signAccessToken, signRefreshToken } from '@/lib/jwt'
import { withRateLimit } from '@/middleware/rateLimit'
import { withValidation } from '@/middleware/validate'
import { adminLoginSchema, AdminLoginInput } from '@/schemas/auth.schema'
import User from '@/models/User'
import RefreshToken from '@/models/RefreshToken'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

async function handleAdminLogin(
  _req: NextRequest,
  _ctx: AnyCtx,
  body: AdminLoginInput
): Promise<NextResponse> {
  await connectDB()

  const user = await User.findOne({ email: body.email.toLowerCase() }).select('+passwordHash')

  // Use a generic error to avoid leaking whether the email exists
  const invalidError = NextResponse.json(
    { success: false, error: 'Invalid email or password' },
    { status: 401 }
  )

  if (!user || !user.passwordHash) return invalidError

  if (user.role !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'Access denied. Admin credentials required.' },
      { status: 403 }
    )
  }

  const passwordMatch = await bcrypt.compare(body.password, user.passwordHash)
  if (!passwordMatch) return invalidError

  const payload = { userId: user._id.toString(), role: user.role as 'admin' }
  const accessToken = signAccessToken(payload)
  const { token: refreshToken, jti } = signRefreshToken(payload)

  await RefreshToken.create({
    user: user._id,
    jti,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })

  return NextResponse.json({
    success: true,
    data: {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  })
}

export const POST = withRateLimit(withValidation(adminLoginSchema, handleAdminLogin), {
  key: 'admin-login',
  points: 5,
  duration: 60,
})

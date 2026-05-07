import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { checkOtpVerification } from '@/lib/otp'
import { signAccessToken, signRefreshToken, signPhoneVerifiedToken } from '@/lib/jwt'
import { withRateLimit } from '@/middleware/rateLimit'
import { withValidation } from '@/middleware/validate'
import { verifyOtpSchema, VerifyOtpInput } from '@/schemas/auth.schema'
import User from '@/models/User'
import RefreshToken from '@/models/RefreshToken'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

async function handleVerifyOtp(
  _req: NextRequest,
  _ctx: AnyCtx,
  body: VerifyOtpInput
): Promise<NextResponse> {
  await connectDB()

  let approved: boolean
  try {
    approved = await checkOtpVerification(body.phone, body.otp)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to verify OTP'
    return NextResponse.json({ success: false, error: message }, { status: 503 })
  }
  if (!approved) {
    return NextResponse.json({ success: false, error: 'Invalid or expired OTP' }, { status: 400 })
  }

  const user = await User.findOne({ phone: body.phone })

  if (!user) {
    const phoneVerifiedToken = signPhoneVerifiedToken(body.phone)
    return NextResponse.json({
      success: true,
      data: { isNewUser: true, phoneVerifiedToken },
    })
  }

  if (!user.isVerified) {
    await User.findByIdAndUpdate(user._id, { isVerified: true })
  }

  const payload = { userId: user._id.toString(), role: user.role as 'user' | 'admin' | 'driver' }
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
      isNewUser: false,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        avatar: user.avatar,
        isVerified: true,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints,
      },
    },
  })
}

export const POST = withRateLimit(withValidation(verifyOtpSchema, handleVerifyOtp), {
  key: 'auth-verify-otp',
  points: 5,
  duration: 60,
})

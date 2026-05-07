import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { signAccessToken, signRefreshToken, verifyPhoneVerifiedToken } from '@/lib/jwt'
import { generateReferralCode } from '@/lib/utils'
import { withRateLimit } from '@/middleware/rateLimit'
import { withValidation } from '@/middleware/validate'
import User from '@/models/User'
import Wallet from '@/models/Wallet'
import Referral from '@/models/Referral'
import RefreshToken from '@/models/RefreshToken'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

const signupSchema = z.object({
  phoneVerifiedToken: z.string().min(1),
  name: z.string().min(2).max(100),
  referralCode: z.string().optional(),
})

type SignupInput = z.infer<typeof signupSchema>

async function handleSignup(
  _req: NextRequest,
  _ctx: AnyCtx,
  body: SignupInput
): Promise<NextResponse> {
  await connectDB()

  let phone: string
  try {
    const verified = verifyPhoneVerifiedToken(body.phoneVerifiedToken)
    phone = verified.phone
  } catch {
    return NextResponse.json(
      { success: false, error: 'Phone verification token is invalid or expired' },
      { status: 401 }
    )
  }

  const existing = await User.findOne({ phone })
  if (existing) {
    return NextResponse.json(
      { success: false, error: 'An account with this phone number already exists' },
      { status: 409 }
    )
  }

  let referralCode = generateReferralCode()
  while (await User.exists({ referralCode })) {
    referralCode = generateReferralCode()
  }

  let referredBy: mongoose.Types.ObjectId | undefined
  if (body.referralCode) {
    const referrer = await User.findOne({ referralCode: body.referralCode.toUpperCase() })
    if (referrer) referredBy = referrer._id as mongoose.Types.ObjectId
  }

  const userId = new mongoose.Types.ObjectId()
  const wallet = await Wallet.create({ user: userId, balance: 0, currency: 'PHP' })

  const user = await User.create({
    _id: userId,
    name: body.name,
    phone,
    referralCode,
    referredBy,
    wallet: wallet._id,
    isVerified: true,
    role: 'user',
  })

  if (referredBy) {
    await Referral.create({
      referrer: referredBy,
      referee: userId,
      referralCode: body.referralCode,
    })
  }

  const payload = { userId: user._id.toString(), role: 'user' as const }
  const accessToken = signAccessToken(payload)
  const { token: refreshToken, jti } = signRefreshToken(payload)

  await RefreshToken.create({
    user: user._id,
    jti,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  })

  return NextResponse.json(
    {
      success: true,
      message: 'Account created successfully',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          name: user.name,
          phone: user.phone,
          referralCode: user.referralCode,
          isVerified: user.isVerified,
          role: user.role,
          loyaltyPoints: user.loyaltyPoints,
        },
      },
    },
    { status: 201 }
  )
}

export const POST = withRateLimit(withValidation(signupSchema, handleSignup), {
  key: 'auth-signup',
  points: 5,
  duration: 60,
})

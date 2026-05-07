import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { withAuthAndValidation } from '@/middleware/validate'
import type { JWTPayload } from '@/lib/jwt'
import User from '@/models/User'
import Referral from '@/models/Referral'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

const applyReferralSchema = z.object({
  referralCode: z.string().min(1).toUpperCase(),
})

type ApplyReferralInput = z.infer<typeof applyReferralSchema>

async function handleApplyReferral(
  _req: NextRequest,
  _ctx: AnyCtx,
  user: JWTPayload,
  body: ApplyReferralInput
): Promise<NextResponse> {
  await connectDB()

  const dbUser = await User.findById(user.userId).select('referredBy referralCode')
  if (!dbUser) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
  }

  if (dbUser.referredBy) {
    return NextResponse.json(
      { success: false, error: 'You have already applied a referral code' },
      { status: 400 }
    )
  }

  if (dbUser.referralCode === body.referralCode) {
    return NextResponse.json(
      { success: false, error: 'You cannot apply your own referral code' },
      { status: 400 }
    )
  }

  const referrer = await User.findOne({ referralCode: body.referralCode })
  if (!referrer) {
    return NextResponse.json({ success: false, error: 'Invalid referral code' }, { status: 404 })
  }

  const existing = await Referral.findOne({ referee: user.userId })
  if (existing) {
    return NextResponse.json(
      { success: false, error: 'A referral record already exists for your account' },
      { status: 400 }
    )
  }

  await User.findByIdAndUpdate(user.userId, { referredBy: referrer._id })
  await Referral.create({
    referrer: referrer._id,
    referee: user.userId,
    referralCode: body.referralCode,
  })

  return NextResponse.json({
    success: true,
    message: 'Referral code applied. Rewards will be credited after your first order.',
  })
}

export const POST = withAuthAndValidation(applyReferralSchema, handleApplyReferral)

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import mongoose from 'mongoose'
import crypto from 'crypto'
import { connectDB } from '@/lib/db'
import { withAuthAndValidation } from '@/middleware/validate'
import type { JWTPayload } from '@/lib/jwt'
import Reward from '@/models/Reward'
import User from '@/models/User'
import Coupon from '@/models/Coupon'
import LoyaltyRedemption from '@/models/LoyaltyRedemption'
import Notification from '@/models/Notification'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

const redeemSchema = z.object({
  rewardId: z.string().min(1),
})

type RedeemInput = z.infer<typeof redeemSchema>

async function handleRedeem(
  _req: NextRequest,
  _ctx: AnyCtx,
  user: JWTPayload,
  body: RedeemInput
): Promise<NextResponse> {
  await connectDB()

  const [reward, dbUser] = await Promise.all([
    Reward.findById(body.rewardId),
    User.findById(user.userId).select('loyaltyPoints'),
  ])

  if (!reward || !reward.isActive) {
    return NextResponse.json({ success: false, error: 'Reward not found' }, { status: 404 })
  }

  if (!dbUser || dbUser.loyaltyPoints < reward.pointsRequired) {
    return NextResponse.json(
      { success: false, error: 'Insufficient loyalty points' },
      { status: 400 }
    )
  }

  const couponCode = `REWARD-${crypto.randomBytes(3).toString('hex').toUpperCase()}`
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)

  const session = await mongoose.startSession()
  let coupon: (typeof Coupon.prototype) | null = null

  await session.withTransaction(async () => {
    await User.findByIdAndUpdate(
      user.userId,
      { $inc: { loyaltyPoints: -reward.pointsRequired } },
      { session }
    )

    ;[coupon] = await Coupon.create(
      [
        {
          code: couponCode,
          discountType: 'fixed',
          discountValue: reward.discountValue,
          minOrderValue: 0,
          maxUses: 1,
          expiresAt,
          isActive: true,
        },
      ],
      { session }
    )

    await LoyaltyRedemption.create(
      [
        {
          user: user.userId,
          reward: reward._id,
          pointsSpent: reward.pointsRequired,
          discountValue: reward.discountValue,
          couponCode,
        },
      ],
      { session }
    )
  })

  await session.endSession()

  await Notification.create({
    user: user.userId,
    title: 'Reward Redeemed!',
    message: `You redeemed "${reward.title}". Use code ${couponCode} on your next order.`,
    type: 'reward',
    data: { couponCode },
  })

  return NextResponse.json({
    success: true,
    message: 'Reward redeemed successfully',
    data: { couponCode, discountValue: reward.discountValue, expiresAt },
  })
}

export const POST = withAuthAndValidation(redeemSchema, handleRedeem)

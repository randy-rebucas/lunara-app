import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { withAuth } from '@/middleware/auth'
import type { JWTPayload } from '@/lib/jwt'
import User from '@/models/User'
import Referral from '@/models/Referral'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

async function handleGetReferrals(
  _req: NextRequest,
  _ctx: AnyCtx,
  user: JWTPayload
): Promise<NextResponse> {
  await connectDB()

  const [dbUser, referrals] = await Promise.all([
    User.findById(user.userId).select('referralCode'),
    Referral.find({ referrer: user.userId })
      .populate('referee', 'name phone createdAt')
      .sort({ createdAt: -1 }),
  ])

  const totalRewardEarned = referrals
    .filter((r) => r.rewardCredited)
    .reduce((sum, r) => sum + r.referrerReward, 0)

  return NextResponse.json({
    success: true,
    data: {
      referralCode: dbUser?.referralCode,
      totalReferrals: referrals.length,
      creditedReferrals: referrals.filter((r) => r.rewardCredited).length,
      totalRewardEarned,
      referrals,
    },
  })
}

export const GET = withAuth(handleGetReferrals)

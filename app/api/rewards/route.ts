import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { withAuth } from '@/middleware/auth'
import type { JWTPayload } from '@/lib/jwt'
import Reward from '@/models/Reward'
import User from '@/models/User'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

async function handleListRewards(
  _req: NextRequest,
  _ctx: AnyCtx,
  user: JWTPayload
): Promise<NextResponse> {
  await connectDB()

  const [rewards, dbUser] = await Promise.all([
    Reward.find({ isActive: true }).sort({ pointsRequired: 1 }),
    User.findById(user.userId).select('loyaltyPoints'),
  ])

  return NextResponse.json({
    success: true,
    data: {
      loyaltyPoints: dbUser?.loyaltyPoints ?? 0,
      rewards,
    },
  })
}

export const GET = withAuth(handleListRewards)

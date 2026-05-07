import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { withAuth } from '@/middleware/auth'
import { getPagination } from '@/lib/utils'
import type { JWTPayload } from '@/lib/jwt'
import LoyaltyRedemption from '@/models/LoyaltyRedemption'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

async function handleRedemptionHistory(
  req: NextRequest,
  _ctx: AnyCtx,
  user: JWTPayload
): Promise<NextResponse> {
  await connectDB()

  const url = new URL(req.url)
  const { page, limit, skip } = getPagination(url)

  const [items, total] = await Promise.all([
    LoyaltyRedemption.find({ user: user.userId })
      .populate('reward', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    LoyaltyRedemption.countDocuments({ user: user.userId }),
  ])

  return NextResponse.json({
    success: true,
    data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
  })
}

export const GET = withAuth(handleRedemptionHistory)

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { withAuth } from '@/middleware/auth'
import { withAuthAndValidation } from '@/middleware/validate'
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

  // Admin sees all rewards; regular users only see active ones
  const filter = user.role === 'admin' ? {} : { isActive: true }
  const [rewards, dbUser] = await Promise.all([
    Reward.find(filter).sort({ pointsRequired: 1 }),
    User.findById(user.userId).select('loyaltyPoints'),
  ])

  return NextResponse.json({
    success: true,
    data: { loyaltyPoints: dbUser?.loyaltyPoints ?? 0, rewards },
  })
}

const createRewardSchema = z.object({
  title: z.string().min(1).max(200),
  pointsRequired: z.number().int().min(1),
  discountValue: z.number().min(0),
})

type CreateRewardInput = z.infer<typeof createRewardSchema>

async function handleCreateReward(
  _req: NextRequest,
  _ctx: AnyCtx,
  user: JWTPayload,
  body: CreateRewardInput
): Promise<NextResponse> {
  if (user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()
  const reward = await Reward.create(body)
  return NextResponse.json({ success: true, data: reward }, { status: 201 })
}

export const GET = withAuth(handleListRewards)
export const POST = withAuthAndValidation(createRewardSchema, handleCreateReward as Parameters<typeof withAuthAndValidation>[1])

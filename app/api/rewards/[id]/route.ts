import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { withAuth } from '@/middleware/auth'
import { withAuthAndValidation } from '@/middleware/validate'
import type { JWTPayload } from '@/lib/jwt'
import Reward from '@/models/Reward'

type Ctx = { params: Promise<{ id: string }> }

const updateRewardSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  pointsRequired: z.number().int().min(1).optional(),
  discountValue: z.number().min(0).optional(),
  isActive: z.boolean().optional(),
})

type UpdateRewardInput = z.infer<typeof updateRewardSchema>

async function handleUpdateReward(
  _req: NextRequest,
  ctx: Ctx,
  user: JWTPayload,
  body: UpdateRewardInput
): Promise<NextResponse> {
  if (user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()
  const { id } = await ctx.params

  const reward = await Reward.findByIdAndUpdate(id, body, { new: true, runValidators: true })
  if (!reward) {
    return NextResponse.json({ success: false, error: 'Reward not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: reward })
}

async function handleDeleteReward(
  _req: NextRequest,
  ctx: Ctx,
  user: JWTPayload
): Promise<NextResponse> {
  if (user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()
  const { id } = await ctx.params

  const reward = await Reward.findByIdAndDelete(id)
  if (!reward) {
    return NextResponse.json({ success: false, error: 'Reward not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: null })
}

export const PATCH = withAuthAndValidation(updateRewardSchema, handleUpdateReward as Parameters<typeof withAuthAndValidation>[1])
export const DELETE = withAuth(handleDeleteReward as Parameters<typeof withAuth>[0], { role: 'admin' })

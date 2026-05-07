import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { withAuth } from '@/middleware/auth'
import { withAuthAndValidation } from '@/middleware/validate'
import type { JWTPayload } from '@/lib/jwt'
import User from '@/models/User'

type Ctx = { params: Promise<{ id: string }> }

async function handleGetUser(
  _req: NextRequest,
  ctx: Ctx,
  _user: JWTPayload
): Promise<NextResponse> {
  await connectDB()

  const { id } = await ctx.params
  const target = await User.findById(id)
    .select('-passwordHash')
    .populate('wallet', 'balance currency')

  if (!target) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: target })
}

const updateUserSchema = z.object({
  role: z.enum(['user', 'admin', 'driver']).optional(),
  loyaltyPoints: z.number().int().min(0).optional(),
  isVerified: z.boolean().optional(),
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional(),
})

type UpdateUserInput = z.infer<typeof updateUserSchema>

async function handleUpdateUser(
  _req: NextRequest,
  ctx: Ctx,
  _user: JWTPayload,
  body: UpdateUserInput
): Promise<NextResponse> {
  await connectDB()
  const { id } = await ctx.params

  const updated = await User.findByIdAndUpdate(id, body, { new: true, runValidators: true })
    .select('-passwordHash')

  if (!updated) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: updated })
}

export const GET = withAuth(handleGetUser as Parameters<typeof withAuth>[0], { role: 'admin' })
export const PATCH = withAuthAndValidation(
  updateUserSchema,
  handleUpdateUser as Parameters<typeof withAuthAndValidation>[1],
  { role: 'admin' }
)

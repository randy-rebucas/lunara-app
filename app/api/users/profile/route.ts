import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { withAuth } from '@/middleware/auth'
import { withAuthAndValidation } from '@/middleware/validate'
import type { JWTPayload } from '@/lib/jwt'
import User from '@/models/User'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  fcmToken: z.string().optional(),
})

type UpdateProfileInput = z.infer<typeof updateProfileSchema>

async function handleGetProfile(
  _req: NextRequest,
  _ctx: AnyCtx,
  user: JWTPayload
): Promise<NextResponse> {
  await connectDB()

  const profile = await User.findById(user.userId)
    .select('-passwordHash')
    .populate('wallet', 'balance currency')

  if (!profile) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: profile })
}

async function handleUpdateProfile(
  _req: NextRequest,
  _ctx: AnyCtx,
  user: JWTPayload,
  body: UpdateProfileInput
): Promise<NextResponse> {
  await connectDB()

  const updated = await User.findByIdAndUpdate(user.userId, body, { new: true }).select(
    '-passwordHash'
  )

  return NextResponse.json({ success: true, data: updated })
}

export const GET = withAuth(handleGetProfile)
export const PUT = withAuthAndValidation(updateProfileSchema, handleUpdateProfile)

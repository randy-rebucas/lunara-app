import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { withAuth } from '@/middleware/auth'
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
    .select('-passwordHash -otpHash -otpExpiry')
    .populate('wallet', 'balance currency')

  if (!target) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: target })
}

export const GET = withAuth(
  handleGetUser as Parameters<typeof withAuth>[0],
  { role: 'admin' }
)

import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { withAuth } from '@/middleware/auth'
import type { JWTPayload } from '@/lib/jwt'
import Notification from '@/models/Notification'

type Ctx = { params: Promise<{ id: string }> }

async function handleMarkRead(
  _req: NextRequest,
  ctx: Ctx,
  user: JWTPayload
): Promise<NextResponse> {
  await connectDB()

  const { id } = await ctx.params
  const notification = await Notification.findOneAndUpdate(
    { _id: id, user: user.userId },
    { isRead: true },
    { new: true }
  )

  if (!notification) {
    return NextResponse.json({ success: false, error: 'Notification not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: notification })
}

export const PUT = withAuth(handleMarkRead as Parameters<typeof withAuth>[0])

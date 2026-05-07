import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { withAuth } from '@/middleware/auth'
import type { JWTPayload } from '@/lib/jwt'
import Notification from '@/models/Notification'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

async function handleMarkAllRead(
  _req: NextRequest,
  _ctx: AnyCtx,
  user: JWTPayload
): Promise<NextResponse> {
  await connectDB()

  const result = await Notification.updateMany(
    { user: user.userId, isRead: false },
    { isRead: true }
  )

  return NextResponse.json({
    success: true,
    message: `${result.modifiedCount} notification(s) marked as read`,
  })
}

export const PUT = withAuth(handleMarkAllRead)

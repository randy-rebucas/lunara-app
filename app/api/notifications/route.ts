import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { withAuth } from '@/middleware/auth'
import { getPagination } from '@/lib/utils'
import type { JWTPayload } from '@/lib/jwt'
import Notification from '@/models/Notification'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

async function handleListNotifications(
  req: NextRequest,
  _ctx: AnyCtx,
  user: JWTPayload
): Promise<NextResponse> {
  await connectDB()

  const url = new URL(req.url)
  const { page, limit, skip } = getPagination(url)
  const type = url.searchParams.get('type')

  const filter: Record<string, unknown> = { user: user.userId }
  if (type) filter.type = type

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: user.userId, isRead: false }),
  ])

  return NextResponse.json({
    success: true,
    data: { items, total, page, limit, totalPages: Math.ceil(total / limit), unreadCount },
  })
}

export const GET = withAuth(handleListNotifications)

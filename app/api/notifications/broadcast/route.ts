import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { withAuthAndValidation } from '@/middleware/validate'
import { sendPushNotification } from '@/lib/firebase'
import type { JWTPayload } from '@/lib/jwt'
import User from '@/models/User'
import Notification from '@/models/Notification'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

const broadcastSchema = z.object({
  target: z.enum(['all', 'user', 'driver']),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  type: z.enum(['order', 'promo', 'reward', 'system']).default('system'),
})

type BroadcastInput = z.infer<typeof broadcastSchema>

async function handleBroadcast(
  _req: NextRequest,
  _ctx: AnyCtx,
  caller: JWTPayload,
  body: BroadcastInput
): Promise<NextResponse> {
  if (caller.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()

  // Never broadcast to admin accounts
  const filter = body.target === 'all' ? { role: { $in: ['user', 'driver'] } } : { role: body.target }
  const users = await User.find(filter).select('_id fcmToken').lean()

  if (users.length === 0) {
    return NextResponse.json({ success: false, error: 'No users found' }, { status: 404 })
  }

  // Create in-app notifications in bulk
  await Notification.insertMany(
    users.map((u) => ({
      user: u._id,
      title: body.title,
      message: body.message,
      type: body.type,
    }))
  )

  // Fire push notifications (best-effort, don't fail on FCM errors)
  const pushPromises = users
    .filter((u) => u.fcmToken)
    .map((u) => sendPushNotification(u.fcmToken!, body.title, body.message).catch(() => null))

  await Promise.allSettled(pushPromises)

  return NextResponse.json({
    success: true,
    message: `Notification sent to ${users.length} user${users.length !== 1 ? 's' : ''}`,
    data: { count: users.length },
  })
}

export const POST = withAuthAndValidation(broadcastSchema, handleBroadcast, { role: 'admin' })

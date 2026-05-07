import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { withAuthAndValidation } from '@/middleware/validate'
import { sendPushNotification } from '@/lib/firebase'
import type { JWTPayload } from '@/lib/jwt'
import User from '@/models/User'
import Notification from '@/models/Notification'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

const sendNotificationSchema = z.object({
  userId: z.string().min(1),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  type: z.enum(['order', 'promo', 'reward', 'system']).default('system'),
  data: z.record(z.string(), z.string()).optional(),
})

type SendNotificationInput = z.infer<typeof sendNotificationSchema>

async function handleSendNotification(
  _req: NextRequest,
  _ctx: AnyCtx,
  _user: JWTPayload,
  body: SendNotificationInput
): Promise<NextResponse> {
  await connectDB()

  const target = await User.findById(body.userId).select('fcmToken')
  if (!target) {
    return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
  }

  await Notification.create({
    user: body.userId,
    title: body.title,
    message: body.message,
    type: body.type,
    data: body.data,
  })

  if (target.fcmToken) {
    await sendPushNotification(target.fcmToken, body.title, body.message, body.data).catch(() => null)
  }

  return NextResponse.json({ success: true, message: 'Notification sent' })
}

export const POST = withAuthAndValidation(sendNotificationSchema, handleSendNotification, {
  role: 'admin',
})

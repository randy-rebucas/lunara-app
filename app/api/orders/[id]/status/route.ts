import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { withAuthAndValidation } from '@/middleware/validate'
import { updateOrderStatusSchema, UpdateOrderStatusInput } from '@/schemas/order.schema'
import { sendPushNotification } from '@/lib/firebase'
import type { JWTPayload } from '@/lib/jwt'
import Order from '@/models/Order'
import Notification from '@/models/Notification'
import User from '@/models/User'

type Ctx = { params: Promise<{ id: string }> }

const PUSH_TRIGGER_STATUSES = new Set(['confirmed', 'picked_up', 'out_for_delivery', 'delivered'])

const STATUS_MESSAGES: Record<string, string> = {
  confirmed: 'Your order has been confirmed.',
  picked_up: 'Your laundry has been picked up.',
  washing: 'Your laundry is being washed.',
  drying: 'Your laundry is in the dryer.',
  ironing: 'Your laundry is being ironed and folded.',
  out_for_delivery: 'Your laundry is out for delivery!',
  delivered: 'Your laundry has been delivered. Thank you!',
  cancelled: 'Your order has been cancelled.',
}

async function handleUpdateStatus(
  _req: NextRequest,
  ctx: Ctx,
  user: JWTPayload,
  body: UpdateOrderStatusInput
): Promise<NextResponse> {
  await connectDB()

  const { id } = await ctx.params
  const order = await Order.findById(id)

  if (!order) {
    return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
  }

  order.status = body.status
  if (body.status === 'delivered') {
    order.deliveryTime = new Date()
    // Credit loyalty points: 1 point per peso of final amount
    const pointsEarned = Math.floor(order.totalAmount - order.discountAmount)
    await User.findByIdAndUpdate(order.user, { $inc: { loyaltyPoints: pointsEarned } })
  }
  await order.save()

  const message = STATUS_MESSAGES[body.status] ?? 'Your order status has been updated.'

  await Notification.create({
    user: order.user,
    title: 'Order Update',
    message,
    type: 'order',
    data: { orderId: id, status: body.status },
  })

  if (PUSH_TRIGGER_STATUSES.has(body.status)) {
    const dbUser = await User.findById(order.user).select('fcmToken')
    if (dbUser?.fcmToken) {
      await sendPushNotification(dbUser.fcmToken, 'Order Update', message, {
        orderId: id,
        status: body.status,
      }).catch(() => null)
    }
  }

  return NextResponse.json({ success: true, data: order })
}

export const PATCH = withAuthAndValidation(
  updateOrderStatusSchema,
  handleUpdateStatus as Parameters<typeof withAuthAndValidation<UpdateOrderStatusInput>>[1],
  { role: 'admin' }
)

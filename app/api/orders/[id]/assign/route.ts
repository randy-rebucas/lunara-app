import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { withAuthAndValidation } from '@/middleware/validate'
import { sendPushNotification } from '@/lib/firebase'
import type { JWTPayload } from '@/lib/jwt'
import Order from '@/models/Order'
import User from '@/models/User'
import Notification from '@/models/Notification'

type Ctx = { params: Promise<{ id: string }> }

const assignDriverSchema = z.object({
  // null = unassign
  driverId: z.string().nullable(),
})

type AssignDriverInput = z.infer<typeof assignDriverSchema>

async function handleAssignDriver(
  _req: NextRequest,
  ctx: Ctx,
  user: JWTPayload,
  body: AssignDriverInput
): Promise<NextResponse> {
  if (user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()
  const { id } = await ctx.params

  const order = await Order.findById(id)
  if (!order) {
    return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
  }

  if (['delivered', 'cancelled'].includes(order.status)) {
    return NextResponse.json(
      { success: false, error: `Cannot assign driver to a ${order.status} order` },
      { status: 400 }
    )
  }

  if (body.driverId) {
    const driver = await User.findOne({ _id: body.driverId, role: 'driver' })
    if (!driver) {
      return NextResponse.json({ success: false, error: 'Driver not found' }, { status: 404 })
    }

    order.driver = driver._id
    await order.save()

    // Notify the driver
    await Notification.create({
      user: driver._id,
      title: 'New Order Assigned',
      message: `You have been assigned to order #${id.slice(-6).toUpperCase()}.`,
      type: 'order',
      data: { orderId: id },
    })

    if (driver.fcmToken) {
      await sendPushNotification(
        driver.fcmToken,
        'New Order Assigned',
        `You have been assigned to order #${id.slice(-6).toUpperCase()}.`,
        { orderId: id }
      ).catch(() => null)
    }
  } else {
    // Unassign
    order.driver = undefined
    await order.save()
  }

  const populated = await order.populate([
    { path: 'user', select: 'name phone' },
    { path: 'driver', select: 'name phone' },
  ])

  return NextResponse.json({ success: true, data: populated })
}

export const PUT = withAuthAndValidation(
  assignDriverSchema,
  handleAssignDriver as Parameters<typeof withAuthAndValidation>[1]
)

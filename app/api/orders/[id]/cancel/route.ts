import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { withAuth } from '@/middleware/auth'
import type { JWTPayload } from '@/lib/jwt'
import Order from '@/models/Order'
import Notification from '@/models/Notification'

type Ctx = { params: Promise<{ id: string }> }

async function handleCancelOrder(
  _req: NextRequest,
  ctx: Ctx,
  user: JWTPayload
): Promise<NextResponse> {
  await connectDB()

  const { id } = await ctx.params
  const order = await Order.findById(id)

  if (!order) {
    return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
  }

  const isOwner = order.user.toString() === user.userId
  if (!isOwner && user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  if (['delivered', 'cancelled', 'out_for_delivery'].includes(order.status)) {
    return NextResponse.json(
      { success: false, error: `Cannot cancel an order with status: ${order.status}` },
      { status: 400 }
    )
  }

  order.status = 'cancelled'
  await order.save()

  await Notification.create({
    user: order.user,
    title: 'Order Cancelled',
    message: 'Your order has been cancelled.',
    type: 'order',
    data: { orderId: id, status: 'cancelled' },
  })

  return NextResponse.json({ success: true, data: order })
}

export const PUT = withAuth(handleCancelOrder as Parameters<typeof withAuth>[0])

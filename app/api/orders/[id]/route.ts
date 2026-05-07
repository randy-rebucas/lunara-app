import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { withAuth } from '@/middleware/auth'
import type { JWTPayload } from '@/lib/jwt'
import Order from '@/models/Order'

type Ctx = { params: Promise<{ id: string }> }

async function handleGetOrder(
  _req: NextRequest,
  ctx: Ctx,
  user: JWTPayload
): Promise<NextResponse> {
  await connectDB()

  const { id } = await ctx.params
  const order = await Order.findById(id).populate('couponApplied', 'code discountType discountValue')

  if (!order) {
    return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
  }

  const isOwner = order.user.toString() === user.userId
  if (!isOwner && user.role !== 'admin' && user.role !== 'driver') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ success: true, data: order })
}

export const GET = withAuth(handleGetOrder as Parameters<typeof withAuth>[0])

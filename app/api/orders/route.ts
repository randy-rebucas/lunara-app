import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { withAuth } from '@/middleware/auth'
import { withAuthAndValidation } from '@/middleware/validate'
import { createOrderSchema, CreateOrderInput } from '@/schemas/order.schema'
import { getPagination, creditReferralReward } from '@/lib/utils'
import { sendPushNotification } from '@/lib/firebase'
import type { JWTPayload } from '@/lib/jwt'
import Order from '@/models/Order'
import Wallet from '@/models/Wallet'
import Transaction from '@/models/Transaction'
import Coupon from '@/models/Coupon'
import Notification from '@/models/Notification'
import User from '@/models/User'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

async function handleListOrders(
  req: NextRequest,
  _ctx: AnyCtx,
  user: JWTPayload
): Promise<NextResponse> {
  await connectDB()

  const url = new URL(req.url)
  const { page, limit, skip } = getPagination(url)
  const status = url.searchParams.get('status')

  const filter: Record<string, unknown> = { user: user.userId }
  if (status) filter.status = status

  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ])

  return NextResponse.json({
    success: true,
    data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
  })
}

async function handleCreateOrder(
  _req: NextRequest,
  _ctx: AnyCtx,
  user: JWTPayload,
  body: CreateOrderInput
): Promise<NextResponse> {
  await connectDB()

  const totalAmount = body.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  let discountAmount = 0
  let couponDoc: (typeof Coupon.prototype) | null = null

  if (body.couponCode) {
    couponDoc = await Coupon.findOne({
      code: body.couponCode.toUpperCase(),
      isActive: true,
      expiresAt: { $gt: new Date() },
      $expr: { $lt: ['$usedCount', '$maxUses'] },
    })

    if (!couponDoc) {
      return NextResponse.json({ success: false, error: 'Invalid or expired coupon' }, { status: 400 })
    }

    if (totalAmount < couponDoc.minOrderValue) {
      return NextResponse.json(
        { success: false, error: `Minimum order value for this coupon is ₱${couponDoc.minOrderValue}` },
        { status: 400 }
      )
    }

    discountAmount =
      couponDoc.discountType === 'percent'
        ? (totalAmount * couponDoc.discountValue) / 100
        : Math.min(couponDoc.discountValue, totalAmount)
  }

  const finalAmount = totalAmount - discountAmount

  if (body.paymentMethod === 'wallet') {
    const wallet = await Wallet.findOneAndUpdate(
      { user: user.userId, balance: { $gte: finalAmount } },
      { $inc: { balance: -finalAmount } },
      { new: true }
    )

    if (!wallet) {
      return NextResponse.json({ success: false, error: 'Insufficient wallet balance' }, { status: 400 })
    }

    await Transaction.create({
      wallet: wallet._id,
      user: user.userId,
      type: 'debit',
      amount: finalAmount,
      description: 'Order payment',
      reference: `ORDER-${Date.now()}`,
    })
  }

  if (couponDoc) {
    await Coupon.findByIdAndUpdate(couponDoc._id, { $inc: { usedCount: 1 } })
  }

  const order = await Order.create({
    user: user.userId,
    items: body.items,
    status: 'pending',
    pickupAddress: body.pickupAddress,
    deliveryAddress: body.deliveryAddress,
    pickupTime: new Date(body.pickupTime),
    totalAmount,
    couponApplied: couponDoc?._id,
    discountAmount,
    paymentMethod: body.paymentMethod,
    notes: body.notes,
  })

  const isFirstOrder = (await Order.countDocuments({ user: user.userId })) === 1
  if (isFirstOrder) {
    await creditReferralReward(user.userId).catch(() => null)
  }

  const dbUser = await User.findById(user.userId).select('fcmToken')
  if (dbUser?.fcmToken) {
    await sendPushNotification(
      dbUser.fcmToken,
      'Order Placed',
      'Your order has been placed successfully.',
      { orderId: order._id.toString(), status: 'pending' }
    ).catch(() => null)
  }

  await Notification.create({
    user: user.userId,
    title: 'Order Placed',
    message: 'Your order has been placed successfully.',
    type: 'order',
    data: { orderId: order._id.toString(), status: 'pending' },
  })

  return NextResponse.json({ success: true, data: order }, { status: 201 })
}

export const GET = withAuth(handleListOrders)
export const POST = withAuthAndValidation(createOrderSchema, handleCreateOrder)

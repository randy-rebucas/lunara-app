import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { withAuthAndValidation } from '@/middleware/validate'
import { applyCouponSchema, ApplyCouponInput } from '@/schemas/coupon.schema'
import type { JWTPayload } from '@/lib/jwt'
import Coupon from '@/models/Coupon'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

async function handleApplyCoupon(
  _req: NextRequest,
  _ctx: AnyCtx,
  _user: JWTPayload,
  body: ApplyCouponInput
): Promise<NextResponse> {
  await connectDB()

  const coupon = await Coupon.findOne({
    code: body.code.toUpperCase(),
    isActive: true,
    expiresAt: { $gt: new Date() },
    $expr: { $lt: ['$usedCount', '$maxUses'] },
  })

  if (!coupon) {
    return NextResponse.json({ success: false, error: 'Invalid or expired coupon' }, { status: 400 })
  }

  if (body.orderAmount < coupon.minOrderValue) {
    return NextResponse.json(
      {
        success: false,
        error: `Minimum order value for this coupon is ₱${coupon.minOrderValue}`,
      },
      { status: 400 }
    )
  }

  const discountAmount =
    coupon.discountType === 'percent'
      ? (body.orderAmount * coupon.discountValue) / 100
      : Math.min(coupon.discountValue, body.orderAmount)

  return NextResponse.json({
    success: true,
    data: {
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      finalAmount: body.orderAmount - discountAmount,
    },
  })
}

export const POST = withAuthAndValidation(applyCouponSchema, handleApplyCoupon)

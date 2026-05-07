import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { withAuth } from '@/middleware/auth'
import { withAuthAndValidation } from '@/middleware/validate'
import type { JWTPayload } from '@/lib/jwt'
import Coupon from '@/models/Coupon'

type Ctx = { params: Promise<{ id: string }> }

const updateCouponSchema = z.object({
  isActive: z.boolean().optional(),
  discountValue: z.number().min(0).optional(),
  minOrderValue: z.number().min(0).optional(),
  maxUses: z.number().int().min(1).optional(),
  expiresAt: z.string().datetime().optional(),
})

type UpdateCouponInput = z.infer<typeof updateCouponSchema>

async function handleUpdateCoupon(
  _req: NextRequest,
  ctx: Ctx,
  _user: JWTPayload,
  body: UpdateCouponInput
): Promise<NextResponse> {
  await connectDB()
  const { id } = await ctx.params

  const update = {
    ...body,
    ...(body.expiresAt && { expiresAt: new Date(body.expiresAt) }),
  }

  const coupon = await Coupon.findByIdAndUpdate(id, update, { new: true, runValidators: true })
  if (!coupon) {
    return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: coupon })
}

async function handleDeleteCoupon(
  _req: NextRequest,
  ctx: Ctx,
  _user: JWTPayload
): Promise<NextResponse> {
  await connectDB()
  const { id } = await ctx.params

  const coupon = await Coupon.findByIdAndDelete(id)
  if (!coupon) {
    return NextResponse.json({ success: false, error: 'Coupon not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: null })
}

export const PATCH = withAuthAndValidation(
  updateCouponSchema,
  handleUpdateCoupon as Parameters<typeof withAuthAndValidation>[1],
  { role: 'admin' }
)
export const DELETE = withAuth(handleDeleteCoupon as Parameters<typeof withAuth>[0], { role: 'admin' })

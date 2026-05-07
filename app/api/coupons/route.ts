import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { withAuth } from '@/middleware/auth'
import { withAuthAndValidation } from '@/middleware/validate'
import { createCouponSchema, CreateCouponInput } from '@/schemas/coupon.schema'
import { getPagination } from '@/lib/utils'
import type { JWTPayload } from '@/lib/jwt'
import Coupon from '@/models/Coupon'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

async function handleListCoupons(
  req: NextRequest,
  _ctx: AnyCtx,
  _user: JWTPayload
): Promise<NextResponse> {
  await connectDB()

  const url = new URL(req.url)
  const { page, limit, skip } = getPagination(url)

  const [items, total] = await Promise.all([
    Coupon.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
    Coupon.countDocuments(),
  ])

  return NextResponse.json({
    success: true,
    data: { items, total, page, limit, totalPages: Math.ceil(total / limit) },
  })
}

async function handleCreateCoupon(
  _req: NextRequest,
  _ctx: AnyCtx,
  _user: JWTPayload,
  body: CreateCouponInput
): Promise<NextResponse> {
  await connectDB()

  const existing = await Coupon.findOne({ code: body.code })
  if (existing) {
    return NextResponse.json({ success: false, error: 'Coupon code already exists' }, { status: 409 })
  }

  const coupon = await Coupon.create({
    ...body,
    expiresAt: new Date(body.expiresAt),
  })

  return NextResponse.json({ success: true, data: coupon }, { status: 201 })
}

export const GET = withAuth(handleListCoupons, { role: 'admin' })
export const POST = withAuthAndValidation(createCouponSchema, handleCreateCoupon, { role: 'admin' })

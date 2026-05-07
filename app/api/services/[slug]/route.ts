import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { withAuthAndValidation } from '@/middleware/validate'
import type { JWTPayload } from '@/lib/jwt'
import Service from '@/models/Service'

type Ctx = { params: Promise<{ slug: string }> }

// GET /api/services/:slug — public, looks up by slug
export async function GET(_req: NextRequest, ctx: Ctx) {
  await connectDB()
  const { slug } = await ctx.params
  const service = await Service.findOne({ slug, isActive: true })
  if (!service) {
    return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true, data: service })
}

// PATCH /api/services/:id — admin only, looks up by ObjectId
const updateServiceSchema = z.object({
  isActive: z.boolean().optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  basePrice: z.number().min(0).optional(),
  unit: z.string().min(1).max(50).optional(),
  sortOrder: z.number().int().optional(),
})

type UpdateServiceInput = z.infer<typeof updateServiceSchema>

async function handleUpdateService(
  _req: NextRequest,
  ctx: Ctx,
  user: JWTPayload,
  body: UpdateServiceInput
): Promise<NextResponse> {
  if (user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()
  const { slug: id } = await ctx.params

  const service = await Service.findByIdAndUpdate(id, body, { new: true, runValidators: true })
  if (!service) {
    return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, data: service })
}

export const PATCH = withAuthAndValidation(
  updateServiceSchema,
  handleUpdateService as Parameters<typeof withAuthAndValidation>[1]
)

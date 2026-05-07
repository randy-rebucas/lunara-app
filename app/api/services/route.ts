import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { withAuthAndValidation } from '@/middleware/validate'
import type { JWTPayload } from '@/lib/jwt'
import Service from '@/models/Service'

export async function GET() {
  await connectDB()
  const services = await Service.find({ isActive: true }).sort({ sortOrder: 1, name: 1 })
  return NextResponse.json({ success: true, data: services })
}

const createServiceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  basePrice: z.number().min(0),
  unit: z.enum(['per_kg', 'per_piece', 'flat']),
  sortOrder: z.number().int().min(0).optional(),
})

type CreateServiceInput = z.infer<typeof createServiceSchema>

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

async function handleCreateService(
  _req: NextRequest,
  _ctx: AnyCtx,
  user: JWTPayload,
  body: CreateServiceInput
): Promise<NextResponse> {
  if (user.role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
  }

  await connectDB()

  const slug = body.name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const existing = await Service.findOne({ slug })
  const finalSlug = existing ? `${slug}-${Date.now()}` : slug

  const service = await Service.create({ ...body, slug: finalSlug })
  return NextResponse.json({ success: true, data: service }, { status: 201 })
}

export const POST = withAuthAndValidation(createServiceSchema, handleCreateService as Parameters<typeof withAuthAndValidation>[1])

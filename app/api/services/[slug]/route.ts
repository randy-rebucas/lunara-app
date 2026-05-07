import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Service from '@/models/Service'

type Ctx = { params: Promise<{ slug: string }> }

export async function GET(_req: NextRequest, ctx: Ctx) {
  await connectDB()
  const { slug } = await ctx.params
  const service = await Service.findOne({ slug, isActive: true })
  if (!service) {
    return NextResponse.json({ success: false, error: 'Service not found' }, { status: 404 })
  }
  return NextResponse.json({ success: true, data: service })
}

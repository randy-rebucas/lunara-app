import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import Service from '@/models/Service'

export async function GET() {
  await connectDB()
  const services = await Service.find({ isActive: true }).sort({ sortOrder: 1, name: 1 })
  return NextResponse.json({ success: true, data: services })
}

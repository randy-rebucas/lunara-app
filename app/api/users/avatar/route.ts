import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { uploadFile } from '@/lib/cloudinary'
import { withAuth } from '@/middleware/auth'
import type { JWTPayload } from '@/lib/jwt'
import User from '@/models/User'

type AnyCtx = { params: Promise<Record<string, string | string[]>> }

async function handleUploadAvatar(
  req: NextRequest,
  _ctx: AnyCtx,
  user: JWTPayload
): Promise<NextResponse> {
  await connectDB()

  const formData = await req.formData()
  const file = formData.get('avatar') as File | null

  if (!file || file.size === 0) {
    return NextResponse.json(
      { success: false, error: 'No avatar file provided' },
      { status: 400 }
    )
  }

  const { url } = await uploadFile(file, 'avatars')
  const updated = await User.findByIdAndUpdate(
    user.userId,
    { avatar: url },
    { new: true }
  ).select('-passwordHash')

  return NextResponse.json({ success: true, data: { avatar: url, user: updated } })
}

export const POST = withAuth(handleUploadAvatar)

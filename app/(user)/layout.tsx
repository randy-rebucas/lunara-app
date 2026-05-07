import { redirect } from 'next/navigation'
import { requireSession } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import UserHeader from '@/components/layout/user-header'
import UserBottomNav from '@/components/layout/user-bottom-nav'

export default async function UserLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession()
  await connectDB()
  const user = await User.findById(session.userId).select('name role').lean()
  if (!user) redirect('/login')

  const name = (user as { name: string }).name
  const initials = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div className="flex min-h-screen flex-col bg-muted/20">
      <UserHeader name={name} initials={initials} />
      <main className="flex-1 pb-20">{children}</main>
      <UserBottomNav />
    </div>
  )
}

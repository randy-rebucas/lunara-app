import { requireAdmin } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import SendNotificationForm from './send-notification-form'

export default async function AdminNotificationsPage() {
  await requireAdmin()
  await connectDB()

  const raw = await User.find({ role: 'user' }).select('_id name phone').lean()
  const users = JSON.parse(JSON.stringify(raw)) as Array<{ _id: string; name: string; phone: string }>

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold">Send Notification</h1>
        <p className="text-sm text-muted-foreground">Send push notifications and in-app messages</p>
      </div>
      <div className="max-w-lg">
        <SendNotificationForm users={users} />
      </div>
    </div>
  )
}

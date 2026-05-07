import { requireSession } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import Notification from '@/models/Notification'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell } from 'lucide-react'
import MarkReadButton from './mark-read-button'

const TYPE_COLOR: Record<string, string> = {
  order: 'bg-blue-100 text-blue-800',
  promo: 'bg-purple-100 text-purple-800',
  reward: 'bg-amber-100 text-amber-800',
  system: 'bg-gray-100 text-gray-800',
}

export default async function NotificationsPage() {
  const session = await requireSession()
  await connectDB()

  const raw = await Notification.find({ user: session.userId }).sort({ createdAt: -1 }).lean()
  const notifications = JSON.parse(JSON.stringify(raw)) as Array<{
    _id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string
  }>

  const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n._id)

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
        {unreadIds.length > 0 && <MarkReadButton ids={unreadIds} />}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Bell className="mb-4 h-12 w-12 text-muted-foreground/40" />
          <p className="text-muted-foreground">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n._id} className={n.isRead ? 'opacity-70' : 'border-l-4 border-l-primary'}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${TYPE_COLOR[n.type] ?? ''}`}>
                        {n.type}
                      </span>
                      {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="mt-1 font-medium">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

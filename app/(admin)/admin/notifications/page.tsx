import { requireAdmin } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import User from '@/models/User'
import Notification from '@/models/Notification'
import SendNotificationForm from './send-notification-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Bell, CheckCheck, BarChart2, ShoppingCart, Tag, Trophy, Settings } from 'lucide-react'

const TYPE_META: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  order:  { label: 'Order',  icon: ShoppingCart, color: 'text-blue-600',   bg: 'bg-blue-50'   },
  promo:  { label: 'Promo',  icon: Tag,          color: 'text-purple-600', bg: 'bg-purple-50' },
  reward: { label: 'Reward', icon: Trophy,       color: 'text-yellow-600', bg: 'bg-yellow-50' },
  system: { label: 'System', icon: Settings,     color: 'text-gray-600',   bg: 'bg-gray-50'   },
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime()
  const m    = Math.floor(diff / 60000)
  const h    = Math.floor(m / 60)
  const d    = Math.floor(h / 24)
  if (d > 0)  return `${d}d ago`
  if (h > 0)  return `${h}h ago`
  if (m > 0)  return `${m}m ago`
  return 'just now'
}

export default async function AdminNotificationsPage() {
  await requireAdmin()
  await connectDB()

  const [rawUsers, rawNotifications, totalCount, readCount] = await Promise.all([
    User.find({}).select('_id name phone role').limit(1000).lean(),
    Notification.find({})
      .sort({ createdAt: -1 })
      .limit(50)
      .populate<{ user: { _id: string; name: string } }>('user', 'name')
      .lean(),
    Notification.countDocuments(),
    Notification.countDocuments({ isRead: true }),
  ])

  const users       = JSON.parse(JSON.stringify(rawUsers))   as Array<{ _id: string; name: string; phone: string; role: string }>
  const notifs      = JSON.parse(JSON.stringify(rawNotifications)) as Array<{
    _id: string
    user: { _id: string; name: string } | null
    title: string
    message: string
    type: string
    isRead: boolean
    createdAt: string
  }>

  const userCount   = users.filter((u) => u.role === 'user').length
  const driverCount = users.filter((u) => u.role === 'driver').length
  const unreadCount = totalCount - readCount
  const readRate    = totalCount > 0 ? Math.round((readCount / totalCount) * 100) : 0

  // Type breakdown for last 50
  const typeCounts  = notifs.reduce<Record<string, number>>((acc, n) => {
    acc[n.type] = (acc[n.type] ?? 0) + 1
    return acc
  }, {})

  const statCards = [
    { label: 'Total Sent',  value: totalCount,  icon: Bell,       color: 'text-blue-600',   bg: 'bg-blue-50'   },
    { label: 'Unread',      value: unreadCount, icon: Bell,       color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'Read Rate',   value: `${readRate}%`, icon: CheckCheck, color: 'text-green-600',  bg: 'bg-green-50'  },
    { label: 'Audience',    value: userCount + driverCount, icon: BarChart2, color: 'text-purple-600', bg: 'bg-purple-50' },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="text-sm text-muted-foreground">Send and monitor push notifications and in-app messages</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`rounded-lg p-2 ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-xl font-bold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[420px_1fr]">

        {/* Left: Compose */}
        <SendNotificationForm
          users={users.filter((u) => u.role !== 'admin')}
          userCount={userCount}
          driverCount={driverCount}
        />

        {/* Right: History + Type breakdown */}
        <div className="space-y-4">

          {/* Type breakdown */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recent Breakdown (last 50)</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {Object.entries(TYPE_META).map(([key, meta]) => {
                const count = typeCounts[key] ?? 0
                const Icon  = meta.icon
                return (
                  <div key={key} className={`flex items-center gap-2 rounded-lg px-3 py-2 ${meta.bg}`}>
                    <Icon className={`h-4 w-4 ${meta.color}`} />
                    <span className={`text-sm font-medium ${meta.color}`}>{meta.label}</span>
                    <span className={`text-sm font-bold ${meta.color}`}>{count}</span>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Notification history */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {notifs.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                  <Bell className="h-8 w-8 opacity-30" />
                  <p className="text-sm">No notifications sent yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifs.map((n) => {
                    const meta = TYPE_META[n.type] ?? TYPE_META.system
                    const Icon = meta.icon
                    return (
                      <div key={n._id} className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40 ${!n.isRead ? 'bg-orange-50/40' : ''}`}>
                        <div className={`mt-0.5 flex-shrink-0 rounded-md p-1.5 ${meta.bg}`}>
                          <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="truncate text-sm font-medium">{n.title}</p>
                            <div className="flex flex-shrink-0 items-center gap-1.5">
                              {!n.isRead && (
                                <span className="inline-block h-1.5 w-1.5 rounded-full bg-orange-500" />
                              )}
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {timeAgo(new Date(n.createdAt))}
                              </span>
                            </div>
                          </div>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{n.message}</p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              → {n.user?.name ?? 'Unknown user'}
                            </span>
                            <Badge variant="outline" className={`h-4 px-1 text-[10px] ${meta.color}`}>
                              {meta.label}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              {notifs.length > 0 && (
                <p className="border-t px-4 py-2 text-center text-xs text-muted-foreground">
                  Showing {notifs.length} most recent of {totalCount} total
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

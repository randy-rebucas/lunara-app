import { Suspense } from 'react'
import Link from 'next/link'
import {
  Bell, Package, Tag, Star, Settings, ChevronLeft, type LucideIcon,
} from 'lucide-react'
import { requireSession } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import Notification from '@/models/Notification'
import MarkReadButton from './mark-read-button'
import NotificationFilterTabs from './notification-filter-tabs'

// ── Icon + colour per notification type ────────────────────────────
// Types must match Notification model enum: order | promo | reward | system
const TYPE_META: Record<string, { icon: LucideIcon; bg: string; color: string }> = {
  order:  { icon: Package,  bg: 'bg-blue-500',   color: 'text-white' },
  promo:  { icon: Tag,      bg: 'bg-orange-400', color: 'text-white' },
  reward: { icon: Star,     bg: 'bg-amber-400',  color: 'text-white' },
  system: { icon: Settings, bg: 'bg-pink-500',   color: 'text-white' },
}
const DEFAULT_META = { icon: Bell, bg: 'bg-gray-400', color: 'text-white' }

// ── Time helpers ─────────────────────────────────────────────────────
function groupLabel(dateStr: string): 'Today' | 'This Week' | 'Earlier' {
  const d     = new Date(dateStr)
  const now   = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const itemStart  = new Date(d.getFullYear(),   d.getMonth(),   d.getDate()).getTime()
  const diff = todayStart - itemStart
  if (diff === 0)                  return 'Today'
  if (diff <= 7 * 24 * 3600_000)  return 'This Week'
  return 'Earlier'
}

function formatTimestamp(dateStr: string): string {
  const d     = new Date(dateStr)
  const now   = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
  const itemStart  = new Date(d.getFullYear(),   d.getMonth(),   d.getDate()).getTime()
  const diff = todayStart - itemStart

  if (diff === 0) {
    return d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' })
  }
  if (diff === 86_400_000) return 'Yesterday'
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
}

// ── Tab → type mapping (must match Notification model enum) ──────────
function typeFilter(tab: string): string[] | null {
  if (tab === 'orders')  return ['order']
  if (tab === 'offers')  return ['promo']
  if (tab === 'updates') return ['reward', 'system']
  return null
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab = 'all' } = await searchParams
  const session = await requireSession()
  await connectDB()

  const types  = typeFilter(tab)
  const query  = types
    ? Notification.find({ user: session.userId, type: { $in: types } })
    : Notification.find({ user: session.userId })

  const raw = await query.sort({ createdAt: -1 }).lean()

  const notifications = JSON.parse(JSON.stringify(raw)) as Array<{
    _id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string
  }>

  const unreadIds = notifications.filter((n) => !n.isRead).map((n) => n._id)

  // ── Group by time ───────────────────────────────────────────────────
  const groups: Record<string, typeof notifications> = {}
  const ORDER: Array<'Today' | 'This Week' | 'Earlier'> = ['Today', 'This Week', 'Earlier']
  for (const n of notifications) {
    const g = groupLabel(n.createdAt)
    if (!groups[g]) groups[g] = []
    groups[g].push(n)
  }

  return (
    <div className="flex min-h-full flex-col bg-white">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="bg-white px-4 pt-5">
        <div className="flex items-center justify-between">
          <Link href="/dashboard" className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:bg-gray-100">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-900">Notifications</h1>
          </div>
          <div className="flex items-center gap-1">
            {unreadIds.length > 0 && (
              <Suspense fallback={null}>
                <MarkReadButton ids={unreadIds} />
              </Suspense>
            )}
          </div>
        </div>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Stay updated with your orders and offers
        </p>

        {/* Tabs */}
        <div className="mt-4">
          <Suspense fallback={null}>
            <NotificationFilterTabs />
          </Suspense>
        </div>
      </div>

      {/* ── Notification list ───────────────────────────────────── */}
      <div className="flex-1 bg-white pb-8">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Bell className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="font-semibold text-gray-900">You're all caught up!</p>
            <p className="mt-1 text-sm text-muted-foreground">No notifications in this category</p>
          </div>
        ) : (
          ORDER.filter((g) => groups[g]?.length).map((group) => (
            <div key={group}>
              {/* Section header */}
              <div className="px-4 pb-2 pt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {group}
                </p>
              </div>

              {/* Items */}
              <div className="divide-y divide-gray-100">
                {groups[group].map((n) => {
                  const meta = TYPE_META[n.type] ?? DEFAULT_META
                  const Icon = meta.icon
                  return (
                    <div
                      key={n._id}
                      className={`flex gap-3.5 px-4 py-4 transition-colors ${
                        n.isRead ? 'bg-white' : 'bg-primary/[0.03]'
                      }`}
                    >
                      {/* Icon circle */}
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${meta.bg}`}>
                        <Icon className={`h-5 w-5 ${meta.color}`} strokeWidth={1.8} />
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-semibold leading-tight ${n.isRead ? 'text-gray-700' : 'text-gray-900'}`}>
                            {n.title}
                          </p>
                          <div className="flex shrink-0 items-center gap-1.5">
                            {!n.isRead && (
                              <span className="h-2 w-2 rounded-full bg-primary" />
                            )}
                            <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                              {formatTimestamp(n.createdAt)}
                            </span>
                          </div>
                        </div>
                        <p className="mt-0.5 text-sm leading-snug text-muted-foreground line-clamp-2">
                          {n.message}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Send, Users, User as UserIcon, Truck, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { apiFetch } from '@/lib/client/auth'

interface User { _id: string; name: string; phone: string }

const TYPE_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'promo',  label: 'Promo' },
  { value: 'reward', label: 'Reward' },
  { value: 'order',  label: 'Order' },
]

const BROADCAST_TARGETS = [
  { value: 'all',    label: 'All Users',    icon: Users },
  { value: 'user',   label: 'Customers',    icon: UserIcon },
  { value: 'driver', label: 'Drivers Only', icon: Truck },
]

export default function SendNotificationForm({ users, userCount, driverCount }: {
  users: User[]
  userCount: number
  driverCount: number
}) {
  const router = useRouter()
  const [mode,    setMode]    = useState<'individual' | 'broadcast'>('individual')
  const [userId,  setUserId]  = useState('')
  const [target,  setTarget]  = useState<'all' | 'user' | 'driver'>('all')
  const [title,   setTitle]   = useState('')
  const [message, setMessage] = useState('')
  const [type,    setType]    = useState<'order' | 'promo' | 'reward' | 'system'>('system')
  const [loading, setLoading] = useState(false)

  const recipientCount = mode === 'broadcast'
    ? target === 'all'    ? userCount + driverCount
    : target === 'user'   ? userCount
    : driverCount
    : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode === 'individual' && !userId) { toast.error('Select a recipient'); return }
    setLoading(true)
    try {
      const endpoint = mode === 'broadcast' ? '/api/notifications/broadcast' : '/api/notifications/send'
      const body     = mode === 'broadcast'
        ? { target, title, message, type }
        : { userId, title, message, type }

      const res  = await apiFetch(endpoint, { method: 'POST', body: JSON.stringify(body) })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      toast.success(data.message ?? 'Notification sent!')
      setTitle('')
      setMessage('')
      if (mode === 'individual') setUserId('')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Send className="h-4 w-4 text-primary" />
          Compose Notification
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Mode toggle */}
          <div className="flex gap-1 rounded-lg border bg-muted/40 p-1">
            {[
              { key: 'individual', label: 'Individual',  Icon: UserIcon },
              { key: 'broadcast',  label: 'Broadcast',   Icon: Megaphone },
            ].map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key as typeof mode)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-md py-1.5 text-sm font-medium transition-colors
                  ${mode === key
                    ? 'bg-white shadow-sm text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Recipient */}
          {mode === 'individual' ? (
            <div className="space-y-1">
              <Label>Recipient</Label>
              <Select value={userId} onValueChange={setUserId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user…" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u._id} value={u._id}>
                      {u.name} — {u.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="space-y-1">
              <Label>Target Audience</Label>
              <div className="grid grid-cols-3 gap-2">
                {BROADCAST_TARGETS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTarget(value as typeof target)}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-medium transition-colors
                      ${target === value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-muted text-muted-foreground hover:border-primary/40'
                      }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
              {recipientCount !== null && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Will be sent to <strong>{recipientCount}</strong> user{recipientCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}

          <Separator />

          {/* Type */}
          <div className="space-y-1">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>Title</Label>
              <span className={`text-xs ${title.length > 90 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                {title.length}/100
              </span>
            </div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Your order is ready!"
              required
              maxLength={100}
            />
          </div>

          {/* Message */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label>Message</Label>
              <span className={`text-xs ${message.length > 450 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                {message.length}/500
              </span>
            </div>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your notification message…"
              rows={4}
              required
              maxLength={500}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || (mode === 'individual' && !userId)}
          >
            <Send className="mr-2 h-4 w-4" />
            {loading ? 'Sending…' : mode === 'broadcast' ? `Broadcast to ${recipientCount ?? '…'} users` : 'Send Notification'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

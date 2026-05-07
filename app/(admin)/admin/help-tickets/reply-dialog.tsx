'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MessageSquare, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { apiFetch } from '@/lib/client/auth'

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

interface Props {
  ticketId: string
  subject: string
  message: string
  currentReply?: string
  currentStatus: string
  userName?: string
  createdAt: string
}

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'open',        label: 'Open'        },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved',    label: 'Resolved'    },
  { value: 'closed',      label: 'Closed'      },
]

function formatDate(d: string) {
  return new Date(d).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function ReplyDialog({
  ticketId, subject, message, currentReply, currentStatus, userName, createdAt,
}: Props) {
  const router  = useRouter()
  const [open,   setOpen]   = useState(false)
  const [reply,  setReply]  = useState(currentReply ?? '')
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)

  const isResolved = currentStatus === 'resolved' || currentStatus === 'closed'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res  = await apiFetch(`/api/help/${ticketId}`, {
        method: 'PATCH',
        body: JSON.stringify({ adminReply: reply, status }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success('Ticket updated')
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant={isResolved ? 'ghost' : 'outline'}
        size="sm"
        className="h-8 px-2 text-xs"
        onClick={() => setOpen(true)}
      >
        <MessageSquare className="mr-1 h-3 w-3" />
        {isResolved ? 'View' : currentReply ? 'Edit Reply' : 'Reply'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base">{subject}</DialogTitle>
            <DialogDescription className="sr-only">Review the customer&apos;s message and write a reply. You can also update the ticket status.</DialogDescription>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>Submitted by <strong>{userName ?? 'Unknown'}</strong> on {formatDate(createdAt)}</span>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Customer message */}
            <div className="rounded-lg border bg-muted/40 p-3">
              <p className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Customer Message
              </p>
              <p className="text-sm leading-relaxed">{message}</p>
            </div>

            {/* Existing reply preview */}
            {currentReply && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="mb-1.5 text-xs font-semibold text-green-700 uppercase tracking-wide">
                  Current Admin Reply
                </p>
                <p className="text-sm leading-relaxed text-green-800">{currentReply}</p>
              </div>
            )}

            <Separator />

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Status */}
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reply */}
              <div className="space-y-1">
                <Label>{currentReply ? 'Update Reply' : 'Write Reply'}</Label>
                <Textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={4}
                  placeholder="Write your reply to the customer…"
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving…' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

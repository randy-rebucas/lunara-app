'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { apiFetch } from '@/lib/client/auth'

const NEXT_STATUSES: Record<string, string[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['picked_up', 'cancelled'],
  picked_up: ['washing'],
  washing: ['drying'],
  drying: ['ironing'],
  ironing: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
}

export default function OrderStatusUpdater({ orderId, currentStatus }: {
  orderId: string; currentStatus: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const options = NEXT_STATUSES[currentStatus] ?? []

  async function handleChange(status: string) {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success(`Status updated to ${status.replace(/_/g, ' ')}`)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  if (options.length === 0) return null

  return (
    <Select onValueChange={handleChange} disabled={loading}>
      <SelectTrigger className="h-8 w-36 text-xs">
        <SelectValue placeholder="Update status" />
      </SelectTrigger>
      <SelectContent>
        {options.map((s) => (
          <SelectItem key={s} value={s} className="text-xs capitalize">
            {s.replace(/_/g, ' ')}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

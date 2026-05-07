'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/client/auth'

export default function OrderCancelButton({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleCancel() {
    if (!confirm('Cancel this order?')) return
    setLoading(true)
    try {
      const res = await apiFetch(`/api/orders/${orderId}/cancel`, { method: 'PUT' })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success('Order cancelled')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={loading}
      onClick={handleCancel}
      className="text-red-600 hover:text-red-700"
    >
      {loading ? '…' : 'Cancel'}
    </Button>
  )
}

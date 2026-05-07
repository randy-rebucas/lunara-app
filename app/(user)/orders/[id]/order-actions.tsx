'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { apiFetch } from '@/lib/client/auth'

export default function OrderActions({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleCancel() {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/orders/${orderId}/cancel`, { method: 'PUT' })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success('Order cancelled')
      router.refresh()
      setOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        className="h-12 w-full rounded-xl border-primary bg-white text-sm font-extrabold text-primary hover:bg-blue-50 hover:text-primary"
        onClick={() => setOpen(true)}
      >
        Cancel Order
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this order?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This action cannot be undone. Wallet payments will be refunded within 24 hours.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Keep Order</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={loading}>
              {loading ? 'Cancelling…' : 'Yes, Cancel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

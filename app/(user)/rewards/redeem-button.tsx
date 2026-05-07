'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { apiFetch } from '@/lib/client/auth'

export default function RedeemButton({ rewardId, title, pointsRequired }: {
  rewardId: string; title: string; pointsRequired: number
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [couponCode, setCouponCode] = useState('')

  async function handleRedeem() {
    setLoading(true)
    try {
      const res = await apiFetch('/api/rewards/redeem', {
        method: 'POST',
        body: JSON.stringify({ rewardId }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setCouponCode(data.data.couponCode)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Redemption failed')
      setOpen(false)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button size="sm" className="w-full" onClick={() => setOpen(true)}>
        Redeem for {pointsRequired} pts
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{couponCode ? '🎉 Reward Redeemed!' : `Redeem "${title}"?`}</DialogTitle>
          </DialogHeader>
          {couponCode ? (
            <div className="space-y-2 text-center">
              <p className="text-sm text-muted-foreground">Your coupon code:</p>
              <div className="rounded-lg bg-muted px-4 py-3">
                <code className="text-lg font-bold tracking-widest">{couponCode}</code>
              </div>
              <p className="text-xs text-muted-foreground">Valid for 30 days. Use at checkout.</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              You will spend {pointsRequired} points to get a discount coupon.
            </p>
          )}
          <DialogFooter>
            {couponCode ? (
              <Button className="w-full" onClick={() => { setOpen(false); setCouponCode('') }}>Done</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleRedeem} disabled={loading}>
                  {loading ? 'Redeeming…' : 'Confirm'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { apiFetch } from '@/lib/client/auth'

const PRESETS = [100, 250, 500, 1000]

export default function WalletTopUp() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleTopUp() {
    const value = parseFloat(amount)
    if (!value || value < 50) {
      toast.error('Minimum top-up is ₱50')
      return
    }
    setLoading(true)
    try {
      const res = await apiFetch('/api/wallet/topup', {
        method: 'POST',
        body: JSON.stringify({ amount: value }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success(`₱${value.toFixed(2)} added to your wallet`)
      setOpen(false)
      setAmount('')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Top-up failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" className="w-full" onClick={() => setOpen(true)}>
        Add Money
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Money</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {PRESETS.map((p) => (
                <Button key={p} variant="outline" size="sm"
                  onClick={() => setAmount(String(p))}
                  className={amount === String(p) ? 'border-primary bg-primary/5' : ''}>
                  ₱{p}
                </Button>
              ))}
            </div>
            <Input
              type="number"
              placeholder="Custom amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={50}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleTopUp} disabled={loading}>
              {loading ? 'Processing…' : `Top Up ₱${parseFloat(amount) || 0}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

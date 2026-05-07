'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { apiFetch } from '@/lib/client/auth'

export default function AddCouponForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [type, setType] = useState<'percent' | 'fixed'>('percent')
  const [value, setValue] = useState('')
  const [minOrder, setMinOrder] = useState('0')
  const [maxUses, setMaxUses] = useState('100')
  const [expiresAt, setExpiresAt] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiFetch('/api/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: code.toUpperCase(),
          discountType: type,
          discountValue: Number(value),
          minOrderValue: Number(minOrder),
          maxUses: Number(maxUses),
          expiresAt,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success('Coupon created')
      setOpen(false)
      setCode(''); setValue(''); setMinOrder('0'); setMaxUses('100'); setExpiresAt('')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />Add Coupon
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Coupon</DialogTitle>
            <DialogDescription className="sr-only">Add a new promotional discount coupon code.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Code</Label>
              <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="PROMO10" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as 'percent' | 'fixed')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed Amount</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Value ({type === 'percent' ? '%' : '₱'})</Label>
                <Input type="number" value={value} onChange={(e) => setValue(e.target.value)} placeholder={type === 'percent' ? '10' : '50'} min={1} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Min Order (₱)</Label>
                <Input type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} min={0} />
              </div>
              <div className="space-y-1">
                <Label>Max Uses</Label>
                <Input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} min={1} />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Expires At</Label>
              <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Creating…' : 'Create'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

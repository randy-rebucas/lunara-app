'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { apiFetch } from '@/lib/client/auth'

interface Props {
  couponId: string
  code: string
  discountType: string
  discountValue: number
  minOrderValue: number
  maxUses: number
  expiresAt: string
  isActive: boolean
}

function toDatetimeLocal(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function CouponEditDialog(props: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [discountValue, setDiscountValue] = useState(String(props.discountValue))
  const [minOrder, setMinOrder] = useState(String(props.minOrderValue))
  const [maxUses, setMaxUses] = useState(String(props.maxUses))
  const [expiresAt, setExpiresAt] = useState(toDatetimeLocal(props.expiresAt))
  const [isActive, setIsActive] = useState(props.isActive)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiFetch(`/api/coupons/${props.couponId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          discountValue: Number(discountValue),
          minOrderValue: Number(minOrder),
          maxUses: Number(maxUses),
          expiresAt: new Date(expiresAt).toISOString(),
          isActive,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success('Coupon updated')
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete coupon "${props.code}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/coupons/${props.couponId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success('Coupon deleted')
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(true)}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Coupon — <code className="rounded bg-muted px-1.5 text-sm">{props.code}</code></DialogTitle>
            <DialogDescription className="sr-only">Edit discount value, limits, expiry and status for this coupon.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Discount Value ({props.discountType === 'percent' ? '%' : '₱'})</Label>
                <Input
                  type="number"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  min={0}
                  step={props.discountType === 'percent' ? '1' : '0.01'}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Min Order (₱)</Label>
                <Input type="number" value={minOrder} onChange={(e) => setMinOrder(e.target.value)} min={0} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Max Uses</Label>
                <Input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} min={1} required />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={isActive ? 'active' : 'inactive'} onValueChange={(v) => setIsActive(v === 'active')}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Expires At</Label>
              <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} required />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                {deleting ? 'Deleting…' : 'Delete Coupon'}
              </Button>
              <DialogFooter className="sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save Changes'}</Button>
              </DialogFooter>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

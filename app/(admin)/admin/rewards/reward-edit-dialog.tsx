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
  rewardId: string
  title: string
  pointsRequired: number
  discountValue: number
  isActive: boolean
}

export default function RewardEditDialog(props: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(props.title)
  const [points, setPoints] = useState(String(props.pointsRequired))
  const [discount, setDiscount] = useState(String(props.discountValue))
  const [isActive, setIsActive] = useState(props.isActive)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm(`Delete "${props.title}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await apiFetch(`/api/rewards/${props.rewardId}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success('Reward deleted')
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    } finally {
      setDeleting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiFetch(`/api/rewards/${props.rewardId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title,
          pointsRequired: Number(points),
          discountValue: Number(discount),
          isActive,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success('Reward updated')
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
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setOpen(true)}>
        <Pencil className="h-3.5 w-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Reward — {props.title}</DialogTitle>
            <DialogDescription className="sr-only">Update title, points cost, discount value and status for this reward.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Points Required</Label>
                <Input type="number" value={points} onChange={(e) => setPoints(e.target.value)} min={1} required />
              </div>
              <div className="space-y-1">
                <Label>Discount Value (₱)</Label>
                <Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} min={0} required />
              </div>
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
                {deleting ? 'Deleting…' : 'Delete'}
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

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { apiFetch } from '@/lib/client/auth'

export default function AddRewardForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [points, setPoints] = useState('')
  const [discount, setDiscount] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiFetch('/api/rewards', {
        method: 'POST',
        body: JSON.stringify({ title, pointsRequired: Number(points), discountValue: Number(discount) }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success('Reward added')
      setOpen(false)
      setTitle(''); setPoints(''); setDiscount('')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />Add Reward
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Reward</DialogTitle>
            <DialogDescription className="sr-only">Create a new loyalty reward that customers can redeem with their points.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="₱50 Off Your Order" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Points Required</Label>
                <Input type="number" value={points} onChange={(e) => setPoints(e.target.value)} placeholder="100" min={1} required />
              </div>
              <div className="space-y-1">
                <Label>Discount Value (₱)</Label>
                <Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="50" min={0} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Adding…' : 'Add Reward'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

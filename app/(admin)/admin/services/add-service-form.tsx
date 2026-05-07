'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { apiFetch } from '@/lib/client/auth'

export default function AddServiceForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [unit, setUnit] = useState<'per_kg' | 'per_piece' | 'flat'>('per_kg')
  const [sortOrder, setSortOrder] = useState('0')
  const [loading, setLoading] = useState(false)

  function reset() {
    setName(''); setDescription(''); setBasePrice(''); setUnit('per_kg'); setSortOrder('0')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiFetch('/api/services', {
        method: 'POST',
        body: JSON.stringify({
          name,
          description,
          basePrice: Number(basePrice),
          unit,
          sortOrder: Number(sortOrder),
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success('Service created')
      setOpen(false)
      reset()
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
        <Plus className="mr-2 h-4 w-4" />Add Service
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Service</DialogTitle>
            <DialogDescription className="sr-only">Create a new laundry service with pricing and unit details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Wash & Fold" required />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="Clean, folded and ready to use" rows={2} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Base Price (₱)</Label>
                <Input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)}
                  placeholder="49" min={0} step="0.01" required />
              </div>
              <div className="space-y-1">
                <Label>Unit</Label>
                <Select value={unit} onValueChange={(v) => setUnit(v as typeof unit)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_kg">Per kg</SelectItem>
                    <SelectItem value="per_piece">Per piece</SelectItem>
                    <SelectItem value="flat">Flat rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Sort Order</Label>
              <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} min={0} />
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

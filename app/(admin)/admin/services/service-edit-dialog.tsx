'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { apiFetch } from '@/lib/client/auth'

interface Props {
  serviceId: string
  name: string
  description: string
  basePrice: number
  unit: string
  sortOrder: number
  isActive: boolean
}

export default function ServiceEditDialog(props: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(props.name)
  const [description, setDescription] = useState(props.description)
  const [basePrice, setBasePrice] = useState(String(props.basePrice))
  const [unit, setUnit] = useState(props.unit)
  const [sortOrder, setSortOrder] = useState(String(props.sortOrder))
  const [isActive, setIsActive] = useState(props.isActive)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiFetch(`/api/services/${props.serviceId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          description,
          basePrice: Number(basePrice),
          unit,
          sortOrder: Number(sortOrder),
          isActive,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success('Service updated')
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
            <DialogTitle>Edit Service — {props.name}</DialogTitle>
            <DialogDescription className="sr-only">Update name, description, pricing, unit and status for this service.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Base Price (₱)</Label>
                <Input type="number" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} min={0} step="0.01" required />
              </div>
              <div className="space-y-1">
                <Label>Unit</Label>
                <Select value={unit} onValueChange={setUnit}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_kg">Per kg</SelectItem>
                    <SelectItem value="per_piece">Per piece</SelectItem>
                    <SelectItem value="flat">Flat rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Sort Order</Label>
                <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} min={0} />
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
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save Changes'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

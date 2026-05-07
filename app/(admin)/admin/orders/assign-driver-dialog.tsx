'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { UserCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { apiFetch } from '@/lib/client/auth'

interface Driver { _id: string; name: string; phone: string }

interface Props {
  orderId: string
  currentDriverId?: string
  currentDriverName?: string
  drivers: Driver[]
}

export default function AssignDriverDialog({ orderId, currentDriverId, currentDriverName, drivers }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState(currentDriverId ?? 'none')
  const [loading, setLoading] = useState(false)

  async function handleSave() {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/orders/${orderId}/assign`, {
        method: 'PUT',
        body: JSON.stringify({ driverId: selected === 'none' ? null : selected }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success(selected === 'none' ? 'Driver unassigned' : 'Driver assigned')
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to assign driver')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => setOpen(true)}
      >
        <UserCheck className="h-3.5 w-3.5" />
        {currentDriverName ? currentDriverName : 'Assign Driver'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Driver</DialogTitle>
            <DialogDescription className="sr-only">Select a driver to assign to this order, or choose unassign to remove the current driver.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {currentDriverName && (
              <p className="text-sm text-muted-foreground">
                Current driver: <span className="font-medium text-foreground">{currentDriverName}</span>
              </p>
            )}
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger>
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— Unassign —</SelectItem>
                {drivers.map((d) => (
                  <SelectItem key={d._id} value={d._id}>
                    {d.name}
                    <span className="ml-2 text-xs text-muted-foreground">{d.phone}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {drivers.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No drivers available. Add a user with the driver role first.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

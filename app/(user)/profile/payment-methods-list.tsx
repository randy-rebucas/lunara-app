'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Trash2, Smartphone, CreditCard, Building2, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { apiFetch } from '@/lib/client/auth'

interface Payment { _id: string; type: string; label: string; maskedNumber?: string; isDefault: boolean }

import type { LucideIcon } from 'lucide-react'

const TYPE_META: Record<string, { icon: LucideIcon; bg: string; color: string }> = {
  gcash: { icon: Smartphone,  bg: 'bg-blue-50',   color: 'text-blue-600'  },
  maya:  { icon: Wallet,      bg: 'bg-green-50',  color: 'text-green-600' },
  card:  { icon: CreditCard,  bg: 'bg-purple-50', color: 'text-purple-600'},
  bank:  { icon: Building2,   bg: 'bg-gray-100',  color: 'text-gray-600'  },
}

export default function PaymentMethodsList({ payments }: { payments: Payment[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'card' | 'gcash' | 'maya' | 'bank'>('gcash')
  const [label, setLabel] = useState('')
  const [masked, setMasked] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiFetch('/api/payments', {
        method: 'POST',
        body: JSON.stringify({ type, label, maskedNumber: masked || undefined }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success('Payment method added')
      setOpen(false)
      setLabel('')
      setMasked('')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await apiFetch(`/api/payments/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove')
    }
  }

  return (
    <div className="space-y-3">
      {payments.map((pm) => {
        const meta = TYPE_META[pm.type] ?? TYPE_META.card
        const Icon = meta.icon
        return (
          <div key={pm._id} className="flex items-center gap-3">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${meta.bg}`}>
              <Icon className={`h-4.5 w-4.5 ${meta.color}`} strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{pm.label}</p>
              {pm.maskedNumber && <p className="text-xs text-muted-foreground">{pm.maskedNumber}</p>}
            </div>
            {pm.isDefault && <Badge variant="secondary" className="text-xs">Default</Badge>}
            <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleDelete(pm._id)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        )
      })}

      <Button variant="outline" size="sm" className="w-full mt-2" onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />Add Payment Method
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Payment Method</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4">
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={type} onValueChange={(v) => setType(v as typeof type)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gcash">GCash</SelectItem>
                  <SelectItem value="maya">Maya</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Label</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. My GCash" required />
            </div>
            <div className="space-y-1">
              <Label>Last 4 digits (optional)</Label>
              <Input value={masked} onChange={(e) => setMasked(e.target.value)} placeholder="****1234" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Adding…' : 'Add'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

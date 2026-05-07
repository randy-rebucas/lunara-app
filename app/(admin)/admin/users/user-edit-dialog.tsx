'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { apiFetch } from '@/lib/client/auth'

interface Props {
  userId: string
  name: string
  role: string
  loyaltyPoints: number
  isVerified: boolean
}

export default function UserEditDialog({ userId, name, role, loyaltyPoints, isVerified }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [newRole, setNewRole] = useState(role)
  const [points, setPoints] = useState(String(loyaltyPoints))
  const [verified, setVerified] = useState(isVerified)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiFetch(`/api/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          role: newRole,
          loyaltyPoints: Number(points),
          isVerified: verified,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success('User updated')
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
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>Edit</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User — {name}</DialogTitle>
            <DialogDescription className="sr-only">Update role, loyalty points and verification status for this user.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label>Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Loyalty Points</Label>
              <Input
                type="number"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                min={0}
                required
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                id="verified"
                type="checkbox"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="verified">Mark as verified</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}

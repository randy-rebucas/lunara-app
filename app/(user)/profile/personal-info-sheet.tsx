'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { ChevronRight, User } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiFetch } from '@/lib/client/auth'

interface Props {
  name: string
  email: string
  phone: string
}

export default function PersonalInfoSheet({ name, email, phone }: Props) {
  const router   = useRouter()
  const [open,      setOpen]      = useState(false)
  const [formName,  setFormName]  = useState(name)
  const [formEmail, setFormEmail] = useState(email)
  const [loading,   setLoading]   = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res  = await apiFetch('/api/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: formName, email: formEmail || undefined }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success('Profile updated')
      setOpen(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors active:bg-blue-50"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50">
          <User className="h-4.5 w-4.5 text-primary" strokeWidth={1.6} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-extrabold text-slate-900">Personal Information</p>
          <p className="text-[10px] font-semibold text-slate-400">Update your name, email and phone number</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl px-5 pb-8 pt-6 max-h-[85vh]">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-left text-lg font-bold">Personal Information</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pi-name" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Full Name
              </Label>
              <Input
                id="pi-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
                className="h-11 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pi-phone" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Phone
              </Label>
              <Input
                id="pi-phone"
                value={phone}
                disabled
                className="h-11 rounded-xl bg-muted"
              />
              <p className="text-xs text-muted-foreground">Phone number cannot be changed</p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pi-email" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Email <span className="normal-case font-normal">(optional)</span>
              </Label>
              <Input
                id="pi-email"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="you@email.com"
                className="h-11 rounded-xl"
              />
            </div>
            <Button
              type="submit"
              className="mt-2 h-12 w-full rounded-xl text-base font-semibold"
              disabled={loading}
            >
              {loading ? 'Saving…' : 'Save Changes'}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  )
}

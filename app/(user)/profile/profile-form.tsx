'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { apiFetch } from '@/lib/client/auth'

interface Props {
  userId: string
  name: string
  email: string
  preferences: { pushNotifications: boolean; emailNotifications: boolean; language: string }
}

export default function ProfileForm({ userId, name, email, preferences }: Props) {
  const router = useRouter()
  const [formName, setFormName] = useState(name)
  const [formEmail, setFormEmail] = useState(email)
  const [loading, setLoading] = useState(false)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiFetch('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name: formName, email: formEmail || undefined }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success('Profile updated')
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Edit Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name">Full name</Label>
            <Input id="name" value={formName} onChange={(e) => setFormName(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save Changes'}</Button>
        </form>
      </CardContent>
    </Card>
  )
}

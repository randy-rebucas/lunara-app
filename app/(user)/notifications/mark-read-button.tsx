'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/client/auth'

export default function MarkReadButton({ ids }: { ids: string[] }) {
  const router = useRouter()

  async function handleMarkAll() {
    try {
      const res = await apiFetch('/api/notifications/read-all', { method: 'PUT' })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      router.refresh()
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  if (ids.length === 0) return null

  return (
    <Button variant="ghost" size="sm" onClick={handleMarkAll} className="h-8 px-3 text-xs font-medium text-primary">
      Mark all read
    </Button>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/client/auth'

export default function MarkReadButton({ ids }: { ids: string[] }) {
  const router = useRouter()

  async function handleMarkAll() {
    try {
      await Promise.all(
        ids.map((id) => apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' }))
      )
      router.refresh()
    } catch {
      toast.error('Failed to mark as read')
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleMarkAll} className="text-primary">
      Mark all read
    </Button>
  )
}

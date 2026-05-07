'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/client/auth'

export default function RewardToggle({ rewardId, isActive }: { rewardId: string; isActive: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/rewards/${rewardId}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !isActive }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleToggle} disabled={loading}
      className={isActive ? 'text-red-600 hover:text-red-700' : 'text-green-600 hover:text-green-700'}>
      {loading ? '…' : isActive ? 'Deactivate' : 'Activate'}
    </Button>
  )
}

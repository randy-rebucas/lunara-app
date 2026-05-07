'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { apiFetch } from '@/lib/client/auth'

export default function CouponActions({ couponId, isActive }: { couponId: string; isActive: boolean }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleToggle() {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/coupons/${couponId}`, {
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
    <Button
      variant="ghost"
      size="sm"
      disabled={loading}
      onClick={handleToggle}
      className={`h-8 px-2 text-xs ${isActive ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}`}
    >
      {loading ? '…' : isActive ? 'Disable' : 'Enable'}
    </Button>
  )
}

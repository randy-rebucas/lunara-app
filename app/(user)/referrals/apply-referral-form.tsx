'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiFetch } from '@/lib/client/auth'

export default function ApplyReferralForm() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleApply(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await apiFetch('/api/referrals/apply', {
        method: 'POST',
        body: JSON.stringify({ referralCode: code }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success(data.message)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleApply} className="flex gap-2">
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        placeholder="Enter referral code"
        className="flex-1"
        required
      />
      <Button type="submit" disabled={loading}>{loading ? '…' : 'Apply'}</Button>
    </form>
  )
}

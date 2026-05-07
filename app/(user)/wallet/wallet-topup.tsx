'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Lock, ChevronRight, CreditCard, Smartphone, Building2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiFetch } from '@/lib/client/auth'
import { cn } from '@/lib/cn'

const PRESETS = [50, 100, 250, 500, 1000]

type PM = { type: string; label: string; maskedNumber?: string } | null

const PM_ICON: Record<string, typeof CreditCard> = {
  card: CreditCard,
  gcash: Smartphone,
  maya: Smartphone,
  bank: Building2,
}

interface Props {
  defaultPM: PM
}

export default function WalletTopUp({ defaultPM }: Props) {
  const router = useRouter()
  const [selected, setSelected]   = useState<number | 'custom' | null>(null)
  const [custom, setCustom]       = useState('')
  const [agreed, setAgreed]       = useState(false)
  const [loading, setLoading]     = useState(false)

  const effectiveAmount =
    selected === 'custom' ? parseFloat(custom) || 0
    : selected ?? 0

  async function handleTopUp() {
    if (!agreed) {
      toast.error('Please agree to the Terms & Conditions')
      return
    }
    if (!effectiveAmount || effectiveAmount < 50) {
      toast.error('Minimum top-up is ₱50')
      return
    }
    setLoading(true)
    try {
      const reference = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
      const res  = await apiFetch('/api/wallet/topup', {
        method: 'POST',
        body: JSON.stringify({ amount: effectiveAmount, reference }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success(`₱${effectiveAmount.toFixed(2)} added to your wallet!`)
      setSelected(null)
      setCustom('')
      setAgreed(false)
      router.refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Top-up failed')
    } finally {
      setLoading(false)
    }
  }

  const PMIcon = defaultPM ? (PM_ICON[defaultPM.type] ?? CreditCard) : CreditCard

  return (
    <div className="space-y-5">

      {/* ── Choose Amount ──────────────────────────────────────── */}
      <div>
        <p className="mb-3 text-[15px] font-semibold text-gray-900">Choose Top Up Amount</p>
        <div className="grid grid-cols-3 gap-2.5">
          {PRESETS.map((amount) => {
            const isActive = selected === amount
            return (
              <button
                key={amount}
                type="button"
                onClick={() => setSelected(amount)}
                className={cn(
                  'flex flex-col items-center justify-center rounded-2xl border-2 py-3.5 px-2 transition-all',
                  isActive
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                )}
              >
                <span className={cn('text-[17px] font-bold', isActive ? 'text-primary' : 'text-gray-900')}>
                  ₱{amount}
                </span>
              </button>
            )
          })}

          {/* Custom amount tile */}
          <button
            onClick={() => setSelected('custom')}
            className={cn(
              'flex flex-col items-center justify-center rounded-2xl border-2 py-3 px-2 transition-all',
              selected === 'custom'
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300'
            )}
          >
            <Pencil className={cn('mb-1 h-4 w-4', selected === 'custom' ? 'text-primary' : 'text-gray-500')} />
            <span className={cn('text-[13px] font-semibold', selected === 'custom' ? 'text-primary' : 'text-gray-700')}>
              Custom
            </span>
            <span className="mt-0.5 text-[11px] text-muted-foreground">Enter amount</span>
          </button>
        </div>

        {/* Custom input */}
        {selected === 'custom' && (
          <div className="mt-3 relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">₱</span>
            <Input
              type="number"
              placeholder="Enter amount (min ₱50)"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              className="pl-8 rounded-xl h-12 text-base"
              min={50}
              autoFocus
            />
          </div>
        )}
      </div>

      {/* ── Payment Method ────────────────────────────────────── */}
      <div>
        <p className="mb-2 text-[15px] font-semibold text-gray-900">Payment Method</p>
        <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5">
          {defaultPM ? (
            <>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-100">
                <PMIcon className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{defaultPM.label}</p>
                {defaultPM.maskedNumber && (
                  <p className="text-xs text-muted-foreground">•••• {defaultPM.maskedNumber}</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="flex-1 text-sm text-muted-foreground">No payment method added</p>
            </>
          )}
          <button
            onClick={() => router.push('/profile#payments')}
            className="flex items-center gap-0.5 text-sm font-semibold text-primary shrink-0"
          >
            Change <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Terms checkbox ────────────────────────────────────── */}
      <label className="flex cursor-pointer items-center gap-3">
        <div
          onClick={() => setAgreed((v) => !v)}
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors',
            agreed ? 'border-primary bg-primary' : 'border-gray-300 bg-white'
          )}
        >
          {agreed && (
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 12 12">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
        <p className="text-sm text-gray-700">
          I agree to the{' '}
          <span className="font-semibold text-primary underline cursor-pointer">Terms &amp; Conditions</span>
        </p>
      </label>

      {/* ── CTA button ────────────────────────────────────────── */}
      <Button
        className="h-14 w-full rounded-2xl text-base font-bold shadow-md shadow-primary/25"
        disabled={!effectiveAmount || loading || !agreed}
        onClick={handleTopUp}
      >
        {loading ? 'Processing…' : `Proceed to Top Up${effectiveAmount ? ` ₱${effectiveAmount.toFixed(2)}` : ''}`}
        {!loading && <ChevronRight className="ml-1 h-5 w-5" />}
      </Button>

      {/* Security note */}
      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground pb-2">
        <Lock className="h-3 w-3" />
        Your payment is secure and encrypted
      </p>
    </div>
  )
}

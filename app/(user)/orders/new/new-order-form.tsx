'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  WashingMachine, Shirt, BedDouble, Footprints, Sparkles, Wind, Layers,
  MapPin, Clock, CalendarDays, ChevronRight, Check, Tag, type LucideIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { apiFetch } from '@/lib/client/auth'
import { cn } from '@/lib/cn'

// ── Service icons + descriptions ───────────────────────────────────
interface ServiceMeta { icon: LucideIcon; desc: string; bg: string; color: string }
const SERVICE_META: Record<string, ServiceMeta> = {
  'Wash & Fold':     { icon: WashingMachine, desc: 'Clean, folded and ready to use',   bg: 'bg-blue-100',    color: 'text-blue-600'   },
  'Dry Cleaning':    { icon: Shirt,          desc: 'Gentle care for your best wear',    bg: 'bg-purple-100',  color: 'text-purple-600' },
  'Bedding & Linen': { icon: BedDouble,      desc: 'Fresh and deep cleaned',            bg: 'bg-teal-100',    color: 'text-teal-600'   },
  'Shoe Laundry':    { icon: Footprints,     desc: 'Clean kicks, looking fresh',        bg: 'bg-orange-100',  color: 'text-orange-600' },
  'Special Care':    { icon: Sparkles,       desc: 'Extra care for delicate items',     bg: 'bg-pink-100',    color: 'text-pink-600'   },
  'Steam Press':     { icon: Wind,           desc: 'Wrinkle-free in no time',           bg: 'bg-cyan-100',    color: 'text-cyan-600'   },
  'Bulk Wash':       { icon: Layers,         desc: 'Ideal for large loads',             bg: 'bg-green-100',   color: 'text-green-600'  },
}
const DEFAULT_META: ServiceMeta = { icon: Sparkles, desc: 'Professional laundry care', bg: 'bg-gray-100', color: 'text-gray-600' }

// ── Time windows ───────────────────────────────────────────────────
const TIME_WINDOWS = [
  { label: '8AM – 10AM',  value: '08:00' },
  { label: '10AM – 12PM', value: '10:00' },
  { label: '12PM – 2PM',  value: '12:00' },
  { label: '2PM – 4PM',   value: '14:00' },
  { label: '4PM – 6PM',   value: '16:00' },
]

// ── Date helpers ───────────────────────────────────────────────────
function getDatePills() {
  const days: { label: string; sub: string; value: string; date: Date }[] = []
  const now = new Date()
  for (let i = 0; i < 5; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow'
      : d.toLocaleDateString('en-PH', { weekday: 'short' })
    const sub = d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
    const value = d.toISOString().slice(0, 10)
    days.push({ label, sub, value, date: d })
  }
  return days
}

interface Service { _id: string; name: string; basePrice: number; unit: string }

interface Props {
  services: Service[]
  walletBalance: number
}

export default function NewOrderForm({ services, walletBalance }: Props) {
  const router = useRouter()

  // Step 1 – service (single select)
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null)

  // Step 2 – address
  const [street,   setStreet]   = useState('')
  const [city,     setCity]     = useState('')
  const [province, setProvince] = useState('')
  const [zip,      setZip]      = useState('')
  const [editAddr, setEditAddr] = useState(true)

  // Step 5 – payment
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'wallet'>('cash')

  // Step 3 – date & time
  const datePills = useMemo(() => getDatePills(), [])
  const [selectedDate, setSelectedDate] = useState(datePills[0].value)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  // Step 4 – notes
  const [notes, setNotes] = useState('')
  const MAX_NOTES = 120

  // Step 5 – promo
  const [couponCode, setCouponCode]     = useState('')
  const [showCoupon, setShowCoupon]     = useState(false)
  const [couponApplied, setCouponApplied] = useState(false)

  const [loading, setLoading] = useState(false)

  const selectedService = services.find((s) => s._id === selectedServiceId) ?? null
  const subtotal    = selectedService?.basePrice ?? 0
  const hasAddress  = street.trim() && city.trim() && zip.trim()
  const canUseWallet = walletBalance >= subtotal && subtotal > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedService)  { toast.error('Please select a service'); return }
    if (!street.trim())    { toast.error('Please enter a street address'); return }
    if (!city.trim())      { toast.error('Please enter a city'); return }
    if (!zip.trim())       { toast.error('Please enter a ZIP code'); return }
    if (!selectedTime)     { toast.error('Please choose a pickup time window'); return }

    // Build ISO 8601 UTC datetime that Zod datetime() accepts
    const pickupDateTime = new Date(`${selectedDate}T${selectedTime}:00`).toISOString()
    const address = { street, city, province, zip }

    setLoading(true)
    try {
      const res = await apiFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: [{ service: selectedService.name, quantity: 1, price: selectedService.basePrice }],
          pickupAddress:   address,
          deliveryAddress: address,
          pickupTime:      pickupDateTime,
          paymentMethod,
          couponCode:      couponApplied ? couponCode : undefined,
          notes:           notes || undefined,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success('Order placed successfully!')
      router.push(`/orders/${data.data._id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to place order')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 bg-gray-100 px-4 py-4">

      {/* ═══════════════════════════════════════════════════════════
          STEP 1 — Select Service
      ══════════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl bg-white px-4 py-5 shadow-sm">
        <p className="mb-3 text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
          1. Select Service
        </p>
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {services.map((svc) => {
            const meta   = SERVICE_META[svc.name] ?? DEFAULT_META
            const Icon   = meta.icon
            const active = selectedServiceId === svc._id
            return (
              <button
                key={svc._id}
                type="button"
                onClick={() => setSelectedServiceId(svc._id)}
                className={cn(
                  'relative flex w-[90px] shrink-0 flex-col items-center rounded-3xl border-2 px-2 py-3 text-center transition-all',
                  active
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                )}
              >
                {active && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-white" strokeWidth={3} />
                  </span>
                )}
                <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl mb-2', meta.bg)}>
                  <Icon className={cn('h-6 w-6', meta.color)} strokeWidth={1.5} />
                </div>
                <p className={cn('text-[12px] font-bold leading-tight', active ? 'text-primary' : 'text-gray-800')}>
                  {svc.name}
                </p>
                <p className="mt-0.5 text-[10px] leading-tight text-muted-foreground line-clamp-2">
                  {meta.desc}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          STEP 2 — Pickup & Delivery
      ══════════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl bg-white px-4 py-5 shadow-sm">
        <p className="mb-3 text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
          2. Pickup &amp; Delivery
        </p>

        <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200 overflow-hidden">
          {/* Pickup address */}
          <div className="px-4 py-3.5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                <MapPin className="h-4 w-4 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-muted-foreground">Pickup Address</p>
                {hasAddress ? (
                  <p className="mt-0.5 text-sm text-gray-900 truncate">
                    {street}, {city}{province ? `, ${province}` : ''}{zip ? ` ${zip}` : ''}
                  </p>
                ) : (
                  <p className="mt-0.5 text-sm text-muted-foreground">Add your pickup address</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setEditAddr((v) => !v)}
                className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-primary"
              >
                {editAddr ? 'Done' : 'Change'} <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {editAddr && (
              <div className="mt-3 space-y-2.5 border-t border-gray-100 pt-3">
                <div>
                  <Label htmlFor="street" className="text-xs text-muted-foreground">Street / Building</Label>
                  <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} placeholder="221B Baker Street" className="mt-1 h-10 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="city" className="text-xs text-muted-foreground">City</Label>
                    <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Makati" className="mt-1 h-10 rounded-xl" />
                  </div>
                  <div>
                    <Label htmlFor="province" className="text-xs text-muted-foreground">Province</Label>
                    <Input id="province" value={province} onChange={(e) => setProvince(e.target.value)} placeholder="Metro Manila" className="mt-1 h-10 rounded-xl" />
                  </div>
                </div>
                <div className="max-w-[140px]">
                  <Label htmlFor="zip" className="text-xs text-muted-foreground">ZIP Code</Label>
                  <Input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} placeholder="1200" className="mt-1 h-10 rounded-xl" />
                </div>
              </div>
            )}
          </div>

          {/* Delivery address */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-green-50">
              <MapPin className="h-4 w-4 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-muted-foreground">Delivery Address</p>
              <p className="mt-0.5 text-sm text-gray-700">Same as pickup address</p>
            </div>
            <span className="flex shrink-0 items-center gap-0.5 text-sm font-semibold text-primary">
              Change <ChevronRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          STEP 3 — Date & Time
      ══════════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl bg-white px-4 py-5 shadow-sm">
        <p className="mb-3 text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
          3. Choose Date &amp; Time
        </p>

        {/* Date pills */}
        <div className="mb-3 rounded-2xl border border-gray-200 px-4 py-3.5">
          <div className="mb-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-gray-900">Pickup Date</p>
            <p className="ml-auto text-sm font-semibold text-primary">
              {new Date(selectedDate + 'T12:00:00').toLocaleDateString('en-PH', {
                weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
              })} ›
            </p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {datePills.map((pill) => {
              const active = selectedDate === pill.value
              return (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => setSelectedDate(pill.value)}
                  className={cn(
                    'flex shrink-0 flex-col items-center rounded-2xl border-2 px-3 py-2 transition-all min-w-[62px]',
                    active
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  )}
                >
                  <span className="text-[11px] font-semibold">{pill.label}</span>
                  <span className={cn('text-[10px] mt-0.5', active ? 'text-white/80' : 'text-muted-foreground')}>
                    {pill.sub}
                  </span>
                </button>
              )
            })}
            <button
              type="button"
              className="flex shrink-0 flex-col items-center justify-center rounded-2xl border-2 border-gray-200 bg-white px-3 py-2 text-muted-foreground hover:border-gray-300 min-w-[52px]"
            >
              <CalendarDays className="h-4 w-4" />
              <span className="mt-0.5 text-[10px]">More</span>
            </button>
          </div>
        </div>

        {/* Time window pills */}
        <div className="rounded-2xl border border-gray-200 px-4 py-3.5">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <p className="text-sm font-semibold text-gray-900">Pickup Time Window</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {TIME_WINDOWS.map((tw) => {
              const active = selectedTime === tw.value
              return (
                <button
                  key={tw.value}
                  type="button"
                  onClick={() => setSelectedTime(tw.value)}
                  className={cn(
                    'rounded-xl border-2 px-3 py-1.5 text-[12px] font-semibold transition-all',
                    active
                      ? 'border-primary bg-primary text-white'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  )}
                >
                  {tw.label}
                </button>
              )
            })}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="text-primary">ⓘ</span>
            We'll arrive anytime within the selected time window.
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          STEP 4 — Special Instructions
      ══════════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl bg-white px-4 py-5 shadow-sm">
        <p className="mb-3 text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
          4. Special Instructions <span className="normal-case font-normal">(Optional)</span>
        </p>
        <div className="relative rounded-2xl border border-gray-200 overflow-hidden">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, MAX_NOTES))}
            placeholder="E.g. Ring the bell, leave at the door, etc."
            rows={3}
            className="resize-none border-0 text-sm focus-visible:ring-0 px-4 pt-3 pb-8"
          />
          <span className="absolute bottom-2.5 right-3.5 text-[11px] text-muted-foreground">
            {notes.length}/{MAX_NOTES}
          </span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          STEP 5 — Order Summary
      ══════════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl bg-white px-4 py-5 shadow-sm">
        <p className="mb-3 text-[13px] font-bold uppercase tracking-wider text-muted-foreground">
          5. Order Summary
        </p>

        <div className="divide-y divide-gray-100 rounded-2xl border border-gray-200 overflow-hidden">
          {/* Selected service row */}
          <div className="flex items-center gap-3 px-4 py-3.5">
            {selectedService ? (() => {
              const meta = SERVICE_META[selectedService.name] ?? DEFAULT_META
              const Icon = meta.icon
              return (
                <>
                  <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-xl', meta.bg)}>
                    <Icon className={cn('h-5 w-5', meta.color)} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{selectedService.name}</p>
                    <p className="text-xs text-muted-foreground">
                      By {selectedService.unit.replace('per_', '')}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-gray-900">₱{selectedService.basePrice.toFixed(2)}</p>
                </>
              )
            })() : (
              <p className="text-sm text-muted-foreground">No service selected yet</p>
            )}
          </div>

          {/* Promo code row */}
          <div>
            {showCoupon ? (
              <div className="flex items-center gap-2 px-4 py-3">
                <Tag className="h-4 w-4 text-primary shrink-0" />
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter promo code"
                  className="h-8 border-0 p-0 text-sm focus-visible:ring-0 uppercase"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => {
                    if (couponCode) { setCouponApplied(true); toast.success('Promo code applied!') }
                    setShowCoupon(false)
                  }}
                  className="shrink-0 text-sm font-semibold text-primary"
                >
                  Apply
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowCoupon(true)}
                className="flex w-full items-center gap-2 px-4 py-3.5 text-left"
              >
                <Tag className="h-4 w-4 text-primary" />
                <span className="flex-1 text-sm font-semibold text-primary">
                  {couponApplied ? `Code: ${couponCode}` : 'Add Promo Code'}
                </span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Payment method toggle */}
          <div className="px-4 py-3.5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payment</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={cn(
                  'flex-1 rounded-xl border-2 py-2 text-sm font-semibold transition-all',
                  paymentMethod === 'cash'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                )}
              >
                Cash on Delivery
              </button>
              <button
                type="button"
                disabled={!canUseWallet}
                onClick={() => canUseWallet && setPaymentMethod('wallet')}
                className={cn(
                  'flex-1 rounded-xl border-2 py-2 text-sm font-semibold transition-all',
                  paymentMethod === 'wallet'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300',
                  !canUseWallet && 'opacity-40 cursor-not-allowed'
                )}
              >
                Wallet {canUseWallet ? `(₱${walletBalance.toFixed(2)})` : '(insufficient)'}
              </button>
            </div>
          </div>

          {/* Estimated total */}
          <div className="flex items-center justify-between px-4 py-3.5">
            <p className="text-[15px] font-bold text-gray-900">Estimated Total</p>
            <p className="text-[15px] font-bold text-gray-900">₱{subtotal.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          CTA
      ══════════════════════════════════════════════════════════════ */}
      <div className="rounded-3xl bg-white px-4 py-4 shadow-sm">
        <Button
          type="submit"
          className="h-14 w-full rounded-2xl text-base font-bold shadow-md shadow-primary/25"
          disabled={loading}
        >
          {loading ? 'Placing order…' : `Place Order · ₱${subtotal.toFixed(2)}`}
          {!loading && <ChevronRight className="ml-1 h-5 w-5" />}
        </Button>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          {paymentMethod === 'wallet' ? 'Wallet balance will be debited immediately' : 'Pay on pickup'}
        </p>
      </div>

    </form>
  )
}

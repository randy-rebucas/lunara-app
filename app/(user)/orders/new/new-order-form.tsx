'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { apiFetch } from '@/lib/client/auth'

interface Service { _id: string; name: string; basePrice: number; unit: string }

export default function NewOrderForm({ services, walletBalance }: {
  services: Service[]
  walletBalance: number
}) {
  const router = useRouter()
  const [quantities, setQuantities] = useState<Record<string, number>>({})
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [province, setProvince] = useState('')
  const [zip, setZip] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'cash'>('cash')
  const [couponCode, setCouponCode] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  function setQty(serviceId: string, delta: number) {
    setQuantities((prev) => {
      const next = (prev[serviceId] ?? 0) + delta
      if (next <= 0) {
        const copy = { ...prev }
        delete copy[serviceId]
        return copy
      }
      return { ...prev, [serviceId]: next }
    })
  }

  const selectedItems = services
    .filter((s) => quantities[s._id] > 0)
    .map((s) => ({ service: s.name, quantity: quantities[s._id], price: s.basePrice }))

  const subtotal = selectedItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (selectedItems.length === 0) {
      toast.error('Select at least one service')
      return
    }
    setLoading(true)
    try {
      const address = { street, city, province, zip }
      const res = await apiFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          items: selectedItems,
          pickupAddress: address,
          deliveryAddress: address,
          pickupTime,
          paymentMethod,
          couponCode: couponCode || undefined,
          notes: notes || undefined,
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Select Services</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {services.map((svc) => (
            <div key={svc._id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{svc.name}</p>
                <p className="text-xs text-muted-foreground">₱{svc.basePrice}/{svc.unit.replace('per_', '')}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="icon" className="h-8 w-8"
                  onClick={() => setQty(svc._id, -1)} disabled={!quantities[svc._id]}>
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="w-6 text-center text-sm font-medium">{quantities[svc._id] ?? 0}</span>
                <Button type="button" variant="outline" size="icon" className="h-8 w-8"
                  onClick={() => setQty(svc._id, 1)}>
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Address</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="street">Street</Label>
            <Input id="street" value={street} onChange={(e) => setStreet(e.target.value)} required placeholder="123 Main St" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="city">City</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} required placeholder="Makati" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="province">Province</Label>
              <Input id="province" value={province} onChange={(e) => setProvince(e.target.value)} required placeholder="Metro Manila" />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="zip">ZIP Code</Label>
            <Input id="zip" value={zip} onChange={(e) => setZip(e.target.value)} required placeholder="1200" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pickup & Payment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="pickupTime">Pickup Time</Label>
            <Input id="pickupTime" type="datetime-local" value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)} required />
          </div>
          <div className="space-y-1">
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'wallet' | 'cash')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash on Delivery</SelectItem>
                <SelectItem value="wallet" disabled={walletBalance < subtotal}>
                  Wallet (₱{walletBalance.toFixed(2)})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="coupon">Coupon Code <span className="text-muted-foreground">(optional)</span></Label>
            <Input id="coupon" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} placeholder="e.g. WELCOME10" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="notes">Notes <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any special instructions…" rows={2} />
          </div>
        </CardContent>
      </Card>

      {selectedItems.length > 0 && (
        <Card className="bg-muted/40">
          <CardContent className="space-y-2 pt-4 text-sm">
            {selectedItems.map((i) => (
              <div key={i.service} className="flex justify-between">
                <span>{i.service} ×{i.quantity}</span>
                <span>₱{(i.price * i.quantity).toFixed(2)}</span>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>Subtotal</span><span>₱{subtotal.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? 'Placing order…' : `Place Order${subtotal > 0 ? ` · ₱${subtotal.toFixed(2)}` : ''}`}
      </Button>
    </form>
  )
}

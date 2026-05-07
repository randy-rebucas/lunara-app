import { requireAdmin } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import Coupon from '@/models/Coupon'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tag, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react'
import AddCouponForm from './add-coupon-form'
import CouponActions from './coupon-actions'
import CouponEditDialog from './coupon-edit-dialog'

function statusOf(coupon: { isActive: boolean; expiresAt: string; usedCount: number; maxUses: number }) {
  const expired   = new Date(coupon.expiresAt) < new Date()
  const exhausted = coupon.usedCount >= coupon.maxUses
  if (expired)   return 'expired'
  if (exhausted) return 'exhausted'
  if (!coupon.isActive) return 'inactive'
  return 'active'
}

const STATUS_STYLE: Record<string, { label: string; dot: string; text: string; pill: string }> = {
  active:    { label: 'Active',    dot: 'bg-green-500',  text: 'text-green-700',  pill: 'bg-green-100 text-green-700' },
  expired:   { label: 'Expired',   dot: 'bg-red-400',    text: 'text-red-600',    pill: 'bg-red-100 text-red-700' },
  exhausted: { label: 'Exhausted', dot: 'bg-orange-400', text: 'text-orange-600', pill: 'bg-orange-100 text-orange-700' },
  inactive:  { label: 'Inactive',  dot: 'bg-gray-300',   text: 'text-gray-500',   pill: 'bg-gray-100 text-gray-600' },
}

export default async function AdminCouponsPage() {
  await requireAdmin()
  await connectDB()

  const raw = await Coupon.find().sort({ createdAt: -1 }).lean()
  const coupons = JSON.parse(JSON.stringify(raw)) as Array<{
    _id: string; code: string; discountType: string; discountValue: number
    minOrderValue: number; maxUses: number; usedCount: number
    expiresAt: string; isActive: boolean
  }>

  const now = new Date()
  const totalActive    = coupons.filter((c) => statusOf(c) === 'active').length
  const totalExpired   = coupons.filter((c) => statusOf(c) === 'expired').length
  const totalExhausted = coupons.filter((c) => statusOf(c) === 'exhausted').length
  const totalUses      = coupons.reduce((s, c) => s + c.usedCount, 0)

  // Expiring within 7 days
  const soonCutoff = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const expiringSoon = coupons.filter(
    (c) => statusOf(c) === 'active' && new Date(c.expiresAt) <= soonCutoff
  )

  return (
    <div className="space-y-5 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Coupons</h1>
          <p className="text-sm text-muted-foreground">Promotional discount codes</p>
        </div>
        <AddCouponForm />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {[
          { label: 'Total Coupons', value: coupons.length, icon: Tag,          color: 'text-primary',    bg: 'bg-primary/10'  },
          { label: 'Active',        value: totalActive,    icon: CheckCircle2, color: 'text-green-600',  bg: 'bg-green-50'    },
          { label: 'Expired',       value: totalExpired,   icon: XCircle,      color: 'text-red-500',    bg: 'bg-red-50'      },
          { label: 'Exhausted',     value: totalExhausted, icon: AlertTriangle,color: 'text-orange-500', bg: 'bg-orange-50'   },
          { label: 'Total Uses',    value: totalUses,      icon: Clock,        color: 'text-blue-600',   bg: 'bg-blue-50'     },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 p-4">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className="text-xl font-bold leading-none">{value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Expiring soon alert */}
      {expiringSoon.length > 0 && (
        <div className="flex items-start gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600" />
          <div className="text-sm">
            <p className="font-semibold text-yellow-800">
              {expiringSoon.length} coupon{expiringSoon.length > 1 ? 's' : ''} expiring within 7 days
            </p>
            <p className="text-xs text-yellow-700">
              {expiringSoon.map((c) => c.code).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Coupon cards */}
      {coupons.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Catalog</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {coupons.map((coupon) => {
              const status   = statusOf(coupon)
              const style    = STATUS_STYLE[status]
              const usePct   = coupon.maxUses > 0 ? Math.min((coupon.usedCount / coupon.maxUses) * 100, 100) : 0
              const daysLeft = Math.ceil((new Date(coupon.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              return (
                <Card
                  key={coupon._id}
                  className={`transition-shadow hover:shadow-md ${status !== 'active' ? 'opacity-70' : ''}`}
                >
                  <CardContent className="p-4">
                    {/* Top row */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <code className="rounded bg-muted px-2 py-0.5 text-sm font-bold tracking-widest">
                          {coupon.code}
                        </code>
                        <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-semibold ${style.pill}`}>
                          {style.label}
                        </span>
                      </div>
                      <CouponEditDialog
                        couponId={coupon._id}
                        code={coupon.code}
                        discountType={coupon.discountType}
                        discountValue={coupon.discountValue}
                        minOrderValue={coupon.minOrderValue}
                        maxUses={coupon.maxUses}
                        expiresAt={coupon.expiresAt}
                        isActive={coupon.isActive}
                      />
                    </div>

                    {/* Discount value */}
                    <div className="mt-3 flex items-baseline gap-1.5">
                      <span className="text-3xl font-bold text-primary">
                        {coupon.discountType === 'percent' ? `${coupon.discountValue}%` : `₱${coupon.discountValue}`}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {coupon.discountType === 'percent' ? 'off' : 'discount'}
                      </span>
                    </div>
                    {coupon.minOrderValue > 0 && (
                      <p className="mt-0.5 text-xs text-muted-foreground">Min order ₱{coupon.minOrderValue}</p>
                    )}

                    {/* Usage bar */}
                    <div className="mt-3 space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{coupon.usedCount} used</span>
                        <span>{coupon.maxUses} max</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full transition-all ${usePct >= 100 ? 'bg-orange-400' : usePct >= 75 ? 'bg-yellow-400' : 'bg-primary/60'}`}
                          style={{ width: `${usePct}%` }}
                        />
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-3 flex items-center justify-between border-t pt-3">
                      <span className={`text-xs ${status === 'expired' ? 'text-red-600 font-medium' : daysLeft <= 7 && daysLeft > 0 ? 'text-yellow-700 font-medium' : 'text-muted-foreground'}`}>
                        {status === 'expired'
                          ? 'Expired'
                          : daysLeft <= 0
                            ? 'Expires today'
                            : `${daysLeft}d left`}
                      </span>
                      <CouponActions couponId={coupon._id} isActive={coupon.isActive} />
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Table */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">All Coupons</h2>
        <Card>
          <CardContent className="p-0">
            {coupons.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-16 text-center">
                <Tag className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No coupons yet. Create one to get started.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Code</TableHead>
                    <TableHead>Discount</TableHead>
                    <TableHead>Min Order</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => {
                    const status   = statusOf(coupon)
                    const style    = STATUS_STYLE[status]
                    const daysLeft = Math.ceil((new Date(coupon.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                    const usePct   = coupon.maxUses > 0 ? Math.min((coupon.usedCount / coupon.maxUses) * 100, 100) : 0
                    return (
                      <TableRow key={coupon._id} className={status !== 'active' ? 'opacity-70' : ''}>
                        <TableCell>
                          <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-bold">{coupon.code}</code>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {coupon.discountType === 'percent' ? `${coupon.discountValue}%` : `₱${coupon.discountValue}`}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {coupon.minOrderValue > 0 ? `₱${coupon.minOrderValue}` : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                              <div
                                className={`h-full rounded-full ${usePct >= 100 ? 'bg-orange-400' : usePct >= 75 ? 'bg-yellow-400' : 'bg-primary/60'}`}
                                style={{ width: `${usePct}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground">{coupon.usedCount}/{coupon.maxUses}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-xs font-medium ${status === 'expired' ? 'text-red-600' : daysLeft <= 7 && daysLeft > 0 ? 'text-yellow-700' : 'text-muted-foreground'}`}>
                            {new Date(coupon.expiresAt).toLocaleDateString('en-PH', { dateStyle: 'short' })}
                            {status !== 'expired' && daysLeft <= 7 && daysLeft > 0 && ` (${daysLeft}d)`}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${style.dot}`} />
                            <span className={`text-xs font-medium ${style.text}`}>{style.label}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <CouponEditDialog
                              couponId={coupon._id}
                              code={coupon.code}
                              discountType={coupon.discountType}
                              discountValue={coupon.discountValue}
                              minOrderValue={coupon.minOrderValue}
                              maxUses={coupon.maxUses}
                              expiresAt={coupon.expiresAt}
                              isActive={coupon.isActive}
                            />
                            <CouponActions couponId={coupon._id} isActive={coupon.isActive} />
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}

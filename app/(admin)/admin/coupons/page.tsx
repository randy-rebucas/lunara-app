import { requireAdmin } from '@/lib/server/auth'
import { connectDB } from '@/lib/db'
import Coupon from '@/models/Coupon'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import AddCouponForm from './add-coupon-form'

export default async function AdminCouponsPage() {
  await requireAdmin()
  await connectDB()

  const raw = await Coupon.find().sort({ createdAt: -1 }).lean()
  const coupons = JSON.parse(JSON.stringify(raw)) as Array<{
    _id: string; code: string; discountType: string; discountValue: number;
    minOrderValue: number; maxUses: number; usedCount: number;
    expiresAt: string; isActive: boolean
  }>

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Coupons</h1>
          <p className="text-sm text-muted-foreground">Promotional discount codes</p>
        </div>
        <AddCouponForm />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Min Order</TableHead>
                <TableHead>Uses</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => {
                const expired = new Date(coupon.expiresAt) < new Date()
                return (
                  <TableRow key={coupon._id}>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-bold">{coupon.code}</code>
                    </TableCell>
                    <TableCell className="font-medium">
                      {coupon.discountType === 'percent' ? `${coupon.discountValue}%` : `₱${coupon.discountValue}`}
                    </TableCell>
                    <TableCell>₱{coupon.minOrderValue}</TableCell>
                    <TableCell>{coupon.usedCount}/{coupon.maxUses}</TableCell>
                    <TableCell className={`text-sm ${expired ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {new Date(coupon.expiresAt).toLocaleDateString('en-PH', { dateStyle: 'short' })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={coupon.isActive && !expired ? 'default' : 'secondary'}>
                        {expired ? 'Expired' : coupon.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

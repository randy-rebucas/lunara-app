import Link from 'next/link'
import { connectDB } from '@/lib/db'
import Service from '@/models/Service'
import { requireSession } from '@/lib/server/auth'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export default async function ServicesPage() {
  await requireSession()
  await connectDB()

  const raw = await Service.find({ isActive: true }).sort({ sortOrder: 1 }).lean()
  const services = JSON.parse(JSON.stringify(raw)) as Array<{
    _id: string; name: string; description: string; basePrice: number; unit: string; icon?: string
  }>

  const unitLabel: Record<string, string> = {
    per_kg: 'per kg',
    per_piece: 'per piece',
    flat: 'flat rate',
  }

  return (
    <div className="space-y-4 p-4">
      <div>
        <h1 className="text-2xl font-bold">Our Services</h1>
        <p className="mt-1 text-sm text-muted-foreground">Professional cleaning for every need</p>
      </div>

      <div className="space-y-3">
        {services.map((svc) => (
          <Card key={svc._id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <h3 className="font-semibold">{svc.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{svc.description}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold text-primary">₱{svc.basePrice}</p>
                  <p className="text-xs text-muted-foreground">{unitLabel[svc.unit] ?? svc.unit}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="pt-2">
        <Button className="w-full" size="lg" asChild>
          <Link href="/orders/new">Book Now</Link>
        </Button>
      </div>
    </div>
  )
}

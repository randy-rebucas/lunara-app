import Link from 'next/link'
import { connectDB } from '@/lib/db'
import Service from '@/models/Service'
import { requireSession } from '@/lib/server/auth'
import { Button } from '@/components/ui/button'
import {
  ArrowRight,
  WashingMachine, Shirt, BedDouble, Footprints, Sparkles,
  type LucideIcon,
} from 'lucide-react'

const SERVICE_META: Record<string, { icon: LucideIcon; iconColor: string; bgColor: string }> = {
  'Wash & Fold':     { icon: WashingMachine, iconColor: 'text-blue-600',   bgColor: 'bg-blue-50   border-blue-100' },
  'Dry Cleaning':    { icon: Shirt,          iconColor: 'text-indigo-600', bgColor: 'bg-indigo-50 border-indigo-100' },
  'Bedding & Linen': { icon: BedDouble,      iconColor: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-100' },
  'Shoe Laundry':    { icon: Footprints,     iconColor: 'text-orange-600', bgColor: 'bg-orange-50 border-orange-100' },
  'Special Care':    { icon: Sparkles,       iconColor: 'text-pink-600',   bgColor: 'bg-pink-50   border-pink-100' },
}

const UNIT_LABEL: Record<string, string> = {
  per_kg:    'per kg',
  per_piece: 'per piece',
  flat:      'flat rate',
}

export default async function ServicesPage() {
  await requireSession()
  await connectDB()

  const raw = await Service.find({ isActive: true }).sort({ sortOrder: 1 }).lean()
  const services = JSON.parse(JSON.stringify(raw)) as Array<{
    _id: string; name: string; description: string; basePrice: number; unit: string; icon?: string
  }>

  return (
    <div className="space-y-5 p-4 pt-5">
      <div>
        <h1 className="text-2xl font-bold">Our Services</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Professional cleaning for every need</p>
      </div>

      <div className="space-y-3">
        {services.map((svc) => {
          const meta = SERVICE_META[svc.name] ?? { icon: Sparkles, iconColor: 'text-gray-500', bgColor: 'bg-gray-50 border-gray-100' }
          const Icon = meta.icon
          return (
            <div
              key={svc._id}
              className="flex items-center gap-4 rounded-2xl border bg-white p-4 shadow-sm"
            >
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border ${meta.bgColor}`}>
                <Icon className={`h-7 w-7 ${meta.iconColor}`} strokeWidth={1.5} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold">{svc.name}</h3>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
                  {svc.description}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-lg font-bold text-primary">₱{svc.basePrice}</p>
                <p className="text-[10px] text-muted-foreground">{UNIT_LABEL[svc.unit] ?? svc.unit}</p>
              </div>
            </div>
          )
        })}
      </div>

      <Button
        className="h-12 w-full rounded-xl text-base font-semibold shadow-md shadow-primary/20"
        size="lg"
        asChild
      >
        <Link href="/orders/new">
          Book Now
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  )
}

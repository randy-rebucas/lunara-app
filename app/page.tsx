import Link from 'next/link'
import Image from 'next/image'
import {
  Shirt,
  Clock,
  Truck,
  Shield,
  Star,
  MapPin,
  Phone,
  CalendarDays,
  ArrowRight,
  CheckCircle2,
  Leaf,
  Sparkles,
  ChevronRight,
  WashingMachine,
  Wind,
  BedDouble,
  Footprints,
  HeartHandshake,
  Users,
  PackageCheck,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const NAV_LINKS = ['Services', 'How It Works', 'Pricing', 'Offers', 'Why Lunara', 'Reviews']

const SERVICES = [
  { icon: Shirt,        title: 'Wash & Fold',      desc: 'Clean, folded and ready to use',      price: 'Starting at ₱49 / lb' },
  { icon: Wind,         title: 'Dry Cleaning',      desc: 'Gentle care for your best wear',       price: 'Starting at ₱149 / item' },
  { icon: BedDouble,    title: 'Bedding & Linen',   desc: 'Fresh and deep cleaned',               price: 'Starting at ₱99 / lb' },
  { icon: Footprints,   title: 'Shoe Laundry',      desc: 'Clean kicks, looking fresh',           price: 'Starting at ₱399 / pair' },
  { icon: HeartHandshake, title: 'Special Care',    desc: 'Delicate care for special fabrics',    price: 'Custom Pricing' },
]

const TRUST_BADGES = [
  { icon: Truck,    label: 'Free Pickup',      sub: 'At your convenience' },
  { icon: Sparkles, label: 'Premium Quality',  sub: 'Care for every fabric' },
  { icon: Clock,    label: 'On-time Delivery', sub: 'Always on schedule' },
  { icon: Shield,   label: 'Secure Payment',   sub: '100% safe & secure' },
]

const WHY_ITEMS = [
  { icon: Truck,        title: 'Hassle-Free',          desc: 'We handle everything, from pickup to delivery.' },
  { icon: Sparkles,     title: 'Quality You Can Trust', desc: 'Premium products and expert care for your clothes.' },
  { icon: Clock,        title: 'Always On Time',        desc: 'Reliable service, delivered as promised.' },
  { icon: CheckCircle2, title: 'Affordable Pricing',    desc: 'Great quality at prices that make sense.' },
  { icon: Leaf,         title: 'Eco-Friendly',          desc: 'Sustainable practices for a cleaner planet.' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">

      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 lg:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <WashingMachine className="h-7 w-7 text-primary" />
            <span className="text-xl font-extrabold tracking-tight text-primary">Lunara</span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {NAV_LINKS.map((link, i) => (
              <a
                key={link}
                href={`#${link.toLowerCase().replace(/\s+/g, '-')}`}
                className={`text-sm font-medium transition-colors ${i === 0 ? 'border-b-2 border-primary pb-0.5 text-primary' : 'text-gray-500 hover:text-gray-900'}`}
              >
                {link}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            <button className="hidden items-center gap-1.5 text-sm font-medium text-gray-600 xl:flex">
              <MapPin className="h-4 w-4 text-primary" />
              Metro Manila
              <ChevronRight className="h-3 w-3 rotate-90 text-gray-400" />
            </button>
            <span className="hidden items-center gap-1.5 text-sm text-gray-600 xl:flex">
              <Phone className="h-4 w-4 text-primary" />
              (02) 8888-0198
            </span>
            <Button size="sm" className="gap-1.5 rounded-md" asChild>
              <Link href="/login">
                <CalendarDays className="h-4 w-4" />
                Book a Pickup
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-0 lg:grid-cols-[1fr_440px_300px]">

          {/* Left: copy */}
          <div className="px-6 py-14 lg:px-10 lg:py-20">
            <Badge variant="outline" className="mb-6 gap-1.5 rounded-full border-primary/30 bg-primary/5 px-3 py-1 text-xs text-primary">
              <Star className="h-3 w-3 fill-primary" />
              Fresh. Clean. Delivered.
            </Badge>
            <h1 className="mb-5 text-4xl font-extrabold leading-[1.15] tracking-tight text-gray-900 lg:text-[2.75rem] xl:text-5xl">
              Laundry made easy,{' '}
              <span className="text-primary">life made better.</span>
            </h1>
            <p className="mb-8 max-w-[340px] text-base leading-relaxed text-gray-500">
              We pick up, clean with care, and deliver your laundry fresh to your door.
            </p>
            <div className="mb-10 flex flex-wrap gap-3">
              <Button size="lg" className="gap-2 rounded-md px-6 shadow-md shadow-primary/20" asChild>
                <Link href="/login">
                  <CalendarDays className="h-4 w-4" />
                  Schedule a Pickup
                </Link>
              </Button>
              <a
                href="#how-it-works"
                className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-shadow hover:shadow-md"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                  <ArrowRight className="h-3 w-3 text-primary" />
                </span>
                How It Works
              </a>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
              {TRUST_BADGES.map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex items-start gap-2">
                  <div className="mt-0.5 shrink-0 rounded-lg border border-gray-100 bg-gray-50 p-1.5 shadow-sm">
                    <Icon className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{label}</p>
                    <p className="text-[11px] leading-tight text-gray-400">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Center: hero image */}
          <div className="relative hidden min-h-[500px] items-end justify-center overflow-hidden bg-gradient-to-b from-sky-50 to-sky-100/70 lg:flex">
            {/* large oval glow */}
            <div className="absolute left-1/2 top-[12%] h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-sky-200/50" />

            {/* sparkles */}
            <span className="absolute left-8  top-12  text-2xl font-black text-primary/25 select-none">✦</span>
            <span className="absolute right-12 top-16  text-sm  font-black text-primary/20 select-none">✦</span>
            <span className="absolute left-14  bottom-20 text-sm  font-black text-primary/15 select-none">✦</span>
            <span className="absolute right-8  top-[45%] text-xl  font-black text-primary/15 select-none">✦</span>

            {/* bubbles */}
            <span className="absolute right-5  top-10  h-12 w-12 rounded-full border-2 border-sky-300/40 bg-white/20" />
            <span className="absolute left-5   top-1/3 h-7  w-7  rounded-full border-2 border-sky-300/30 bg-white/10" />
            <span className="absolute right-10 bottom-24 h-5  w-5  rounded-full border   border-sky-400/30 bg-white/10" />
            <span className="absolute left-1/3 top-6    h-4  w-4  rounded-full border   border-sky-200/40 bg-white/10" />

            <Image
              src="/hero-laundry.png"
              alt="Fresh laundry basket with clean folded towels"
              width={440}
              height={420}
              className="relative z-10 object-contain"
              priority
            />
          </div>

          {/* Right: booking card */}
          <div className="w-full border-l border-gray-100 bg-white px-6 py-10 lg:px-8 lg:py-14">
            <p className="mb-1 text-xl font-bold text-gray-900">Book a Pickup</p>
            <p className="mb-6 text-sm text-gray-400">Quick and easy scheduling</p>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-500">Pickup Address</label>
                <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-400">
                  <MapPin className="h-4 w-4 shrink-0 text-primary" />
                  123 Main St, Metro Manila
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-500">Pickup Date</label>
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    May 24, 2026
                  </div>
                  <ChevronRight className="h-4 w-4 rotate-90 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-gray-500">Time Slot</label>
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    10:00 AM – 12:00 PM
                  </div>
                  <ChevronRight className="h-4 w-4 rotate-90 text-gray-400" />
                </div>
              </div>
              <Button className="mt-2 w-full gap-2 rounded-lg py-6 text-base font-semibold shadow-md shadow-primary/20" asChild>
                <Link href="/login">
                  Book Now
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="border-t border-gray-100">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-gray-100 lg:grid-cols-4">
            {[
              { icon: Users,       value: '50,000+', label: 'Happy Customers' },
              { icon: PackageCheck, value: '1M+',    label: 'Orders Completed' },
              { icon: MapPin,      value: '150+',    label: 'Cities Served' },
              { icon: Star,        value: '4.8/5',   label: 'Average Rating' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-3 px-6 py-5 lg:px-10">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/8">
                  <Icon className="h-5 w-5 text-primary/50" />
                </div>
                <div>
                  <p className="text-xl font-extrabold text-gray-900">{value}</p>
                  <p className="text-xs text-gray-400">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Services ────────────────────────────────────────────────────── */}
      <section id="services" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Our Laundry Services</h2>
            <p className="mt-2 text-gray-500">Expert care for every item, every time.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {SERVICES.map(({ icon: Icon, title, desc, price }) => (
              <div
                key={title}
                className="group flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/10 bg-primary/8">
                  <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-400">{desc}</p>
                </div>
                <p className="text-xs font-semibold text-gray-500">{price}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Learn more
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-gray-50 transition-colors group-hover:border-primary/30 group-hover:bg-primary/5">
                    <ArrowRight className="h-3.5 w-3.5 text-gray-400 group-hover:text-primary" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Promo + Testimonial ─────────────────────────────────────────── */}
      <section className="bg-gray-50 py-10">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-5 px-4 lg:grid-cols-2 lg:px-8">

          {/* Promo banner — stock image + discount */}
          <div className="relative flex min-h-[200px] items-center overflow-hidden rounded-2xl bg-sky-50">
            {/* image occupies left ~40% */}
            <div className="relative h-full w-2/5 min-w-[160px] self-stretch">
              <Image
                src="https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=320&h=280&fit=crop&q=80"
                alt="Neatly folded laundry"
                fill
                className="object-cover"
                sizes="160px"
              />
              {/* 20% badge */}
              <div className="absolute left-3 top-3 flex h-14 w-14 flex-col items-center justify-center rounded-full bg-orange-400 text-white shadow-lg">
                <span className="text-[10px] font-bold leading-tight">20%</span>
                <span className="text-[10px] font-bold leading-tight">OFF</span>
              </div>
            </div>

            {/* text */}
            <div className="flex-1 px-6 py-8">
              <p className="mb-1 text-xs font-bold uppercase tracking-wider text-primary">First Order Offer</p>
              <p className="mb-1 text-2xl font-extrabold text-gray-900">
                Get <span className="text-primary">20% OFF</span>
              </p>
              <p className="mb-4 text-sm font-semibold text-gray-700">on your first order</p>
              <p className="mb-5 text-xs text-gray-500">Experience premium laundry with unbeatable convenience.</p>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-white px-3 py-2 text-sm font-mono font-bold tracking-widest text-primary">
                  WELCOME20
                </div>
                <Button size="sm" className="gap-1 rounded-lg" asChild>
                  <Link href="/login">Claim Offer <ArrowRight className="h-3 w-3" /></Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Testimonial — stock avatar */}
          <div className="flex flex-col justify-center rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="mb-4 text-4xl font-black leading-none text-primary/15">"</div>
            <p className="mb-6 text-base leading-relaxed text-gray-700">
              Lunara has completely changed the way I handle laundry. Super convenient and always high quality! I love that they pick up and deliver — no more laundry day stress.
            </p>
            <div className="flex items-center gap-3">
              <Image
                src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face&q=80"
                alt="Jessica M."
                width={44}
                height={44}
                className="rounded-full object-cover ring-2 ring-primary/20"
              />
              <div>
                <p className="font-semibold text-gray-900">Jessica M.</p>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Choose ──────────────────────────────────────────────────── */}
      <section id="why-lunara" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose Lunara?</h2>
            <p className="mt-2 text-gray-500">We go the extra mile so you don't have to.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {WHY_ITEMS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-gray-100 bg-gray-50 p-5 text-center shadow-sm">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-primary/10 bg-white shadow-sm">
                  <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                </div>
                <p className="font-semibold text-gray-900">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-primary py-16 text-primary-foreground">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5" />
        <div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/5" />
        <div className="relative mx-auto max-w-3xl px-4 text-center">
          <h2 className="mb-3 text-3xl font-extrabold">Ready for fresh laundry?</h2>
          <p className="mb-8 text-primary-foreground/75">
            Join 50,000+ happy customers who trust Lunara with their laundry.
          </p>
          <Button size="lg" variant="secondary" className="gap-2 shadow-lg" asChild>
            <Link href="/login">
              Get Started Today
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-gray-100 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 sm:flex-row lg:px-8">
          <div className="flex items-center gap-2">
            <WashingMachine className="h-5 w-5 text-primary" />
            <span className="font-extrabold text-primary">Lunara</span>
          </div>
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Lunara. All rights reserved.
          </p>
          <div className="flex gap-5 text-sm text-gray-400">
            <a href="#" className="hover:text-gray-700">Privacy</a>
            <a href="#" className="hover:text-gray-700">Terms</a>
            <a href="#" className="hover:text-gray-700">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

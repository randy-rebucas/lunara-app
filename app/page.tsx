import Link from 'next/link'
import { Shirt, Clock, Truck, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const FEATURES = [
  { icon: Shirt, title: 'Expert Cleaning', desc: 'Professional care for all fabric types' },
  { icon: Clock, title: 'Quick Turnaround', desc: '24–48 hour service on most items' },
  { icon: Truck, title: 'Free Pickup & Delivery', desc: 'We come to you — at no extra cost' },
  { icon: Shield, title: 'Satisfaction Guaranteed', desc: 'Not happy? We\'ll rewash for free' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <span className="text-2xl font-bold text-primary">Lunara</span>
          <div className="flex gap-3">
            <Button variant="ghost" asChild><Link href="/login">Login</Link></Button>
            <Button asChild><Link href="/login">Get Started</Link></Button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-24 text-center">
        <div className="mb-4 inline-flex items-center rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
          🧺 Laundry, the smarter way
        </div>
        <h1 className="mb-6 text-5xl font-bold tracking-tight text-foreground">
          Fresh laundry,<br />
          <span className="text-primary">delivered to your door</span>
        </h1>
        <p className="mx-auto mb-10 max-w-xl text-lg text-muted-foreground">
          Schedule a pickup, we clean everything, and deliver it back fresh. No more laundry day headaches.
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" asChild className="w-full sm:w-auto">
            <Link href="/login">Book Your First Pickup</Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/services">View Services & Pricing</Link>
          </Button>
        </div>
      </section>

      <section className="bg-muted/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-12 text-center text-3xl font-bold">Why choose Lunara?</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="mb-2 font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Lunara. All rights reserved.
      </footer>
    </div>
  )
}

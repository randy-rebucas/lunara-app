'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { setTokens } from '@/lib/client/auth'
import { WashingMachine } from 'lucide-react'

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const phoneVerifiedToken = searchParams.get('token') ?? ''
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!phoneVerifiedToken) {
      toast.error('Session expired. Please login again.')
      router.push('/login')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: email || undefined, phoneVerifiedToken }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      setTokens(data.data.accessToken, data.data.refreshToken)
      toast.success('Account created! Welcome to Lunara.')
      router.push('/dashboard')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 px-4">
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <WashingMachine className="h-7 w-7" />
        </div>
        <span className="text-2xl font-bold tracking-tight">Lunara</span>
        <span className="text-sm text-muted-foreground">Laundry, delivered fresh</span>
      </div>

      <Card className="w-full max-w-sm border-0 shadow-xl">
        <CardContent className="p-8">
          <div className="mb-6 space-y-1 text-center">
            <h1 className="text-2xl font-bold">Create account</h1>
            <p className="text-sm text-muted-foreground">Tell us a bit about yourself</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full name</Label>
              <Input
                id="name"
                placeholder="Juan Dela Cruz"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-muted-foreground text-xs">(optional)</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="juan@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  )
}

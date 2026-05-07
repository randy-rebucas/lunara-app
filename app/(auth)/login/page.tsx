'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import PhoneInput, { isValidPhoneNumber } from 'react-phone-number-input'
import flags from 'react-phone-number-input/flags'
import 'react-phone-number-input/style.css'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { setTokens } from '@/lib/client/auth'
import { WashingMachine, ArrowLeft, Loader2, ShieldCheck } from 'lucide-react'

type Step = 'phone' | 'otp'

export default function LoginPage() {
  const router  = useRouter()
  const [step,    setStep]    = useState<Step>('phone')
  const [phone,   setPhone]   = useState<string | undefined>()
  const [otp,     setOtp]     = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const otpRefs = useRef<Array<HTMLInputElement | null>>([])

  // Countdown timer for resend
  useEffect(() => {
    if (resendCooldown <= 0) return
    const id = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(id)
  }, [resendCooldown])

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    if (!phone || !isValidPhoneNumber(phone)) {
      toast.error('Please enter a valid phone number')
      return
    }
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success('OTP sent!')
      setStep('otp')
      setResendCooldown(60)
      setTimeout(() => otpRefs.current[0]?.focus(), 100)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyOtp(code: string) {
    if (code.length < 6) return
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: code }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)

      if (data.data.isNewUser) {
        router.push(`/signup?token=${encodeURIComponent(data.data.phoneVerifiedToken)}`)
        return
      }

      setTokens(data.data.accessToken, data.data.refreshToken)
      toast.success('Welcome back!')
      router.push('/dashboard')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Invalid OTP')
      // Clear boxes on error
      setOtp('')
      otpRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  function handleOtpKey(
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) {
    const key = e.key
    if (key === 'Backspace') {
      if (otp[idx]) {
        const next = otp.slice(0, idx) + '' + otp.slice(idx + 1)
        setOtp(next)
      } else if (idx > 0) {
        otpRefs.current[idx - 1]?.focus()
      }
      return
    }
    if (key === 'ArrowLeft' && idx > 0)  { otpRefs.current[idx - 1]?.focus(); return }
    if (key === 'ArrowRight' && idx < 5) { otpRefs.current[idx + 1]?.focus(); return }
    if (!/^\d$/.test(key)) { e.preventDefault(); return }

    const next = otp.slice(0, idx) + key + otp.slice(idx + 1)
    setOtp(next)
    if (idx < 5) {
      otpRefs.current[idx + 1]?.focus()
    } else {
      handleVerifyOtp(next)
    }
  }

  function handleOtpPaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    setOtp(pasted.padEnd(6, '').slice(0, 6))
    const lastFilled = Math.min(pasted.length, 5)
    otpRefs.current[lastFilled]?.focus()
    if (pasted.length === 6) handleVerifyOtp(pasted)
  }

  async function handleResend() {
    if (resendCooldown > 0 || !phone) return
    setLoading(true)
    try {
      const res  = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success('New OTP sent!')
      setOtp('')
      setResendCooldown(60)
      otpRefs.current[0]?.focus()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 px-4">

      {/* Logo */}
      <div className="mb-8 flex flex-col items-center gap-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
          <WashingMachine className="h-7 w-7" />
        </div>
        <span className="text-2xl font-bold tracking-tight">Lunara</span>
        <span className="text-sm text-muted-foreground">Laundry, delivered fresh</span>
      </div>

      <Card className="w-full max-w-sm shadow-xl border-0">
        <CardContent className="p-8">

          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-1 text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-sm text-muted-foreground">Enter your phone number to sign in</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Phone number</label>
                {/* react-phone-number-input */}
                <PhoneInput
                  flags={flags}
                  international
                  defaultCountry="PH"
                  value={phone}
                  onChange={setPhone}
                  className="phone-input-wrapper"
                  numberInputProps={{
                    className: 'phone-number-input',
                    placeholder: '917 123 4567',
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Select your country flag and enter your number
                </p>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-semibold"
                disabled={loading || !phone}
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending…</>
                ) : 'Send OTP'}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                New here?{' '}
                <span className="text-primary font-medium">
                  Sign in with your number to create an account
                </span>
              </p>
            </form>

          ) : (
            <div className="space-y-6">
              <div className="space-y-1 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold">Verify your number</h1>
                <p className="text-sm text-muted-foreground">
                  We sent a 6-digit code to
                </p>
                <p className="text-sm font-semibold text-foreground">{phone}</p>
              </div>

              {/* OTP boxes */}
              <div className="flex justify-center gap-2.5" onPaste={handleOtpPaste}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={otp[i] ?? ''}
                    readOnly
                    onKeyDown={(e) => handleOtpKey(e, i)}
                    disabled={loading}
                    className={`h-12 w-10 rounded-xl border-2 text-center text-lg font-bold outline-none transition-all
                      ${otp[i] ? 'border-primary bg-primary/5 text-primary' : 'border-input bg-background text-foreground'}
                      ${loading ? 'opacity-50 cursor-not-allowed' : 'focus:border-primary focus:ring-2 focus:ring-primary/20'}
                    `}
                  />
                ))}
              </div>

              {loading && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying…
                </div>
              )}

              {/* Resend */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || loading}
                  className="text-sm font-medium text-primary disabled:text-muted-foreground disabled:cursor-not-allowed"
                >
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : "Didn't get a code? Resend"}
                </button>
              </div>

              <button
                type="button"
                onClick={() => { setStep('phone'); setOtp('') }}
                className="flex w-full items-center justify-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Change phone number
              </button>
            </div>
          )}

        </CardContent>
      </Card>

    </div>
  )
}

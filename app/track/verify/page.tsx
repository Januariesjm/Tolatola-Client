"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Alert, AlertDescription } from "../../../components/ui/alert"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../../../components/ui/input-otp"
import { ShieldCheck, AlertCircle } from "lucide-react"
import { clientApiPostPublic } from "../../../lib/api-client"
import { useToast } from "../../../hooks/use-toast"
import SiteHeader from "../../../components/layout/site-header"

const TRACKING_STORAGE_KEY = "tolatola_track_request"
const MAX_ATTEMPTS = 5

export default function TrackVerifyPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [otp, setOtp] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [stored, setStored] = useState<{ tracking_code: string; contact: string } | null>(null)

  useEffect(() => {
    if (typeof sessionStorage === "undefined") return
    try {
      const raw = sessionStorage.getItem(TRACKING_STORAGE_KEY)
      if (raw) setStored(JSON.parse(raw))
      else router.replace("/track")
    } catch {
      router.replace("/track")
    }
  }, [router])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stored || otp.length !== 6) {
      setError("Please enter the 6-digit code.")
      return
    }
    if (attempts >= MAX_ATTEMPTS) {
      setError(`Maximum attempts (${MAX_ATTEMPTS}) reached. Please request a new OTP from the track page.`)
      return
    }
    setError(null)
    setLoading(true)
    try {
      const res = await clientApiPostPublic<{ success: boolean; token?: string; error?: string }>(
        "tracking/verify-otp",
        {
          tracking_code: stored.tracking_code,
          contact: stored.contact,
          otp: otp.trim(),
        }
      )
      if (res.success && res.token) {
        sessionStorage.removeItem(TRACKING_STORAGE_KEY)
        router.replace(`/track/status?token=${encodeURIComponent(res.token)}`)
        return
      }
      const errMsg = (res as any).error || "Invalid or expired code."
      setError(errMsg)
      setAttempts((a) => a + 1)
      toast({ title: "Verification failed", description: errMsg, variant: "destructive" })
    } catch (err: any) {
      const msg = err?.message || "Verification failed. Please try again."
      setError(msg)
      setAttempts((a) => a + 1)
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  if (!stored) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={null} profile={null} kycStatus={null} />
      <main className="container max-w-md mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/track" className="text-sm text-muted-foreground hover:text-primary">
            ← Back to track order
          </Link>
        </div>
        <Card className="border-2 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <ShieldCheck className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl font-black tracking-tight">Enter verification code</CardTitle>
            <CardDescription>
              We sent a 6-digit code to the contact details you entered. It expires in 5 minutes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleVerify} className="space-y-4">
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup className="gap-2">
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} className="h-12 w-12 rounded-xl text-lg" />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {attempts > 0 && (
                <p className="text-center text-sm text-muted-foreground">
                  Attempts: {attempts} / {MAX_ATTEMPTS}
                </p>
              )}
              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                className="w-full h-12 rounded-xl font-bold text-base"
                disabled={loading || otp.length !== 6 || attempts >= MAX_ATTEMPTS}
              >
                {loading ? "Verifying…" : "Verify & view status"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground">
              Didn&apos;t receive the code?{" "}
              <Link href="/track" className="text-primary font-medium hover:underline">
                Request again
              </Link>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

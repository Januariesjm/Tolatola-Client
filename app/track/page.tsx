"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Alert, AlertDescription } from "../../components/ui/alert"
import { PackageSearch, ArrowRight, AlertCircle, Loader2 } from "lucide-react"
import { clientApiPostPublic } from "../../lib/api-client"
import { useToast } from "../../hooks/use-toast"
import SiteHeader from "../../components/layout/site-header"

const TRACKING_STORAGE_KEY = "tolatola_track_request"

function TrackOrderInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [trackingCode, setTrackingCode] = useState("")
  const [contact, setContact] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const codeFromUrl = searchParams.get("code")
    if (codeFromUrl) {
      setTrackingCode(codeFromUrl.toUpperCase())
    }
  }, [searchParams])

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const code = trackingCode.trim().toUpperCase()
    const contactNorm = contact.trim()
    const isEmail = contactNorm.includes("@")
    if (!code || !contactNorm) {
      setError("Please enter both tracking code and contact details.")
      return
    }
    setLoading(true)
    try {
      await clientApiPostPublic<{ success: boolean; message?: string }>("tracking/request-otp", {
        tracking_code: code,
        contact: contactNorm,
      })
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(
          TRACKING_STORAGE_KEY,
          JSON.stringify({ tracking_code: code, contact: contactNorm })
        )
      }
      toast({ title: "OTP sent", description: `Check your ${isEmail ? "email" : "phone"} for the 6-digit code.` })
      router.push("/track/verify")
    } catch (err: any) {
      const msg = err?.message || "Failed to send OTP. Check tracking code and contact details."
      setError(msg)
      toast({ title: "Error", description: msg, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader user={null} profile={null} kycStatus={null} />
      <main className="container max-w-md mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
            ← Back to home
          </Link>
        </div>
        <Card className="border-2 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <PackageSearch className="h-7 w-7 text-primary" />
            </div>
            <CardTitle className="text-2xl font-black tracking-tight">Track your order</CardTitle>
            <CardDescription>
              Enter your tracking code and the phone number or email used for the order. We&apos;ll send a one-time code to verify.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tracking_code">Tracking code or Order number</Label>
                <Input
                  id="tracking_code"
                  placeholder="e.g. TDX-12345-6789 or TOLA-2026-XXXXXXXX"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="rounded-xl h-12 font-mono uppercase"
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact">Phone number or Email</Label>
                <Input
                  id="contact"
                  type="text"
                  placeholder="e.g. +255 712 345 678 or name@email.com"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="rounded-xl h-12"
                />
              </div>
              {error && (
                <Alert variant="destructive" className="rounded-xl">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button
                type="submit"
                className="w-full h-12 rounded-xl font-bold text-base"
                disabled={loading}
              >
                {loading ? "Sending…" : "Send OTP"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default function TrackOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      }
    >
      <TrackOrderInner />
    </Suspense>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PackageSearch, ArrowRight, AlertCircle } from "lucide-react"
import { clientApiPostPublic } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import SiteHeader from "@/components/layout/site-header"

const TRACKING_STORAGE_KEY = "tolatola_track_request"

export default function TrackOrderPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [trackingCode, setTrackingCode] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const code = trackingCode.trim().toUpperCase()
    const phoneNorm = phone.trim().replace(/\s/g, "")
    if (!code || !phoneNorm) {
      setError("Please enter both tracking code and phone number.")
      return
    }
    setLoading(true)
    try {
      await clientApiPostPublic<{ success: boolean; message?: string }>("tracking/request-otp", {
        tracking_code: code,
        phone_number: phoneNorm,
      })
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(
          TRACKING_STORAGE_KEY,
          JSON.stringify({ tracking_code: code, phone_number: phoneNorm })
        )
      }
      toast({ title: "OTP sent", description: "Check your phone for the 6-digit code." })
      router.push("/track/verify")
    } catch (err: any) {
      const msg = err?.message || "Failed to send OTP. Check tracking code and phone number."
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
              Enter your tracking code and the phone number used for the order. We&apos;ll send a one-time code to verify.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="tracking_code">Tracking code</Label>
                <Input
                  id="tracking_code"
                  placeholder="e.g. TDX-12345-6789"
                  value={trackingCode}
                  onChange={(e) => setTrackingCode(e.target.value)}
                  className="rounded-xl h-12 font-mono uppercase"
                  maxLength={20}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="e.g. +255 712 345 678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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

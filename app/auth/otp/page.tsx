"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react"

function OtpPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const initialPhone = searchParams.get("phone") || ""
  const redirect = searchParams.get("redirect") || "/shop"

  const [phone, setPhone] = useState(initialPhone)
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"request" | "verify">("request")
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const apiBase = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "")

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) {
      setError("Please enter your phone number.")
      return
    }
    setError(null)
    setInfo(null)
    setSending(true)
    try {
      const res = await fetch(`${apiBase}/auth/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim() }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body?.error || "Failed to send code.")
      }
      setStep("verify")
      setInfo("Code sent. It expires in 10 minutes.")
    } catch (err: any) {
      setError(err?.message || "Failed to send code.")
    } finally {
      setSending(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) {
      setError("Please enter the code.")
      return
    }
    setError(null)
    setVerifying(true)
    try {
      const res = await fetch(`${apiBase}/auth/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phone.trim(), code: code.trim() }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body?.success) {
        const backendCode = body?.code
        if (backendCode === "OTP_EXPIRED") {
          setError("Code expired, request a new one.")
        } else if (backendCode === "OTP_INVALID") {
          setError("Code incorrect.")
        } else {
          setError(body?.error || "Verification failed.")
        }
        return
      }
      router.push(redirect)
    } catch (err: any) {
      setError(err?.message || "Verification failed.")
    } finally {
      setVerifying(false)
    }
  }

  const codeDisabled = code.trim().length < 4 || code.trim().length > 6

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-6">
          <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
            ← Back to home
          </Link>
        </div>
        <Card className="border shadow-lg">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Verify your phone</CardTitle>
                <CardDescription>
                  Add a one-time verification to keep your account secure.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {info && !error && (
              <Alert>
                <AlertDescription>{info}</AlertDescription>
              </Alert>
            )}

            {step === "request" && (
              <form onSubmit={handleRequestCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+2557..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Use your active mobile number (e.g. +2557…).
                  </p>
                </div>
                <Button type="submit" disabled={sending || !phone.trim()} className="w-full">
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Send code"
                  )}
                </Button>
              </form>
            )}

            {step === "verify" && (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+2557..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Verification code</Label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="6‑digit code"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={verifying || codeDisabled}
                  className="w-full"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying…
                    </>
                  ) : (
                    "Verify"
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function OtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <OtpPageContent />
    </Suspense>
  )
}

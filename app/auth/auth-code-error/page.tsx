"use client"

import Link from "next/link"
import { useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle2, Loader2, Mail } from "lucide-react"
import { Input } from "@/components/ui/input"

function AuthCodeErrorContent() {
  const searchParams = useSearchParams()
  const emailFromUrl = searchParams.get("email") || ""
  const [email, setEmail] = useState(emailFromUrl)
  const [resendState, setResendState] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [resendMessage, setResendMessage] = useState("")

  const handleResend = async () => {
    if (!email.trim()) return
    setResendState("loading")
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || ""
      const res = await fetch(`${apiBase}/auth/email/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      if (res.ok) {
        setResendState("success")
        setResendMessage("A new verification email has been sent! Please check your inbox.")
      } else {
        const data = await res.json().catch(() => ({}))
        setResendState("error")
        setResendMessage(data?.error || "Failed to resend. Please try again.")
      }
    } catch {
      setResendState("error")
      setResendMessage("Network error. Please try again.")
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <CardTitle className="text-2xl">Verification Link Invalid</CardTitle>
        <CardDescription>
          The verification link has expired or is invalid.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground text-center">
          Don&apos;t worry — you can request a new verification email below.
        </p>

        {resendState === "success" ? (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950">
            <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
            <p className="text-sm text-green-700 dark:text-green-300">{resendMessage}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label htmlFor="resend-email" className="text-sm font-medium">
                Your email address
              </label>
              <Input
                id="resend-email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={resendState === "loading"}
              />
            </div>
            <Button
              className="w-full"
              onClick={handleResend}
              disabled={resendState === "loading" || !email.trim()}
            >
              {resendState === "loading" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Verification Email
                </>
              )}
            </Button>
            {resendState === "error" && (
              <p className="text-sm text-destructive text-center">{resendMessage}</p>
            )}
          </div>
        )}

        <div className="pt-2 space-y-2">
          <Button variant="outline" asChild className="w-full">
            <Link href="/auth/login">Go to Login</Link>
          </Button>
          <p className="text-xs text-center text-muted-foreground pt-2">
            Need help? Contact{" "}
            <a href="mailto:support@tolatola.co" className="text-primary hover:underline">
              support@tolatola.co
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function AuthCodeErrorPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <Suspense fallback={
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      }>
        <AuthCodeErrorContent />
      </Suspense>
    </div>
  )
}

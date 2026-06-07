"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import { Label } from "../../../components/ui/label"
import { HeaderAnimatedText } from "../../../components/layout/header-animated-text"
import { Eye, EyeOff } from "lucide-react"
import { createClient } from "../../../lib/supabase/client"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const returnUrl = searchParams.get("next") || searchParams.get("returnUrl") || undefined

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [hasSession, setHasSession] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)

  // Check if user has an active session (arrived via /auth/callback recovery flow)
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
      setCheckingSession(false)
    })
  }, [])

  // If no token AND no session, show invalid link message
  if (!checkingSession && !token && !hasSession) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Invalid link</CardTitle>
            <CardDescription>
              This password reset link is missing a token or has expired. Please request a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/forgot-password" className="text-primary text-sm font-semibold hover:underline">
              Request a new password reset link
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError("Password should be at least 6 characters long.")
      return
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setIsSubmitting(true)

    try {
      // Strategy 1: Session-based reset (user arrived via /auth/callback with recovery token)
      if (hasSession) {
        const supabase = createClient()
        const { error: updateError } = await supabase.auth.updateUser({ password })

        if (updateError) {
          throw new Error(updateError.message || "Unable to reset password. Please try again.")
        }

        setSuccess("Your password has been updated successfully.")
        setTimeout(() => {
          const target = returnUrl ? `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}` : "/auth/login?reset=success"
          router.push(target)
        }, 1500)
        return
      }

      // Strategy 2: Token-based reset (legacy flow with ?token= param)
      if (token) {
        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
        if (!apiBase) {
          throw new Error("API base URL is not configured")
        }

        const response = await fetch(`${apiBase}/auth/reset-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        })

        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body.error || "Unable to reset password. Please request a new link.")
        }

        setSuccess("Your password has been updated successfully.")
        setTimeout(() => {
          const target = returnUrl ? `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}` : "/auth/login?reset=success"
          router.push(target)
        }, 1500)
        return
      }

      throw new Error("No valid session or token found. Please request a new reset link.")
    } catch (err: any) {
      setError(err?.message || "Unable to reset password. Please request a new link.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading while checking session
  if (checkingSession) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse animation-delay-2000" />
      </div>

      <div className="w-full max-w-md animate-fade-in-up">
        <div className="flex flex-col gap-6">
          <Link href="/" className="flex items-center gap-3 justify-center hover:scale-105 transition-transform">
            <Image src="/logo-new.png" alt="TOLA" width={150} height={45} className="h-16 md:h-16 lg:h-20 w-auto" />
            <HeaderAnimatedText />
          </Link>

          <Card className="backdrop-blur-sm bg-card/95 shadow-2xl border-primary/20">
            <CardHeader className="space-y-2 text-center pb-6">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Set a new password
              </CardTitle>
              <CardDescription className="text-base">
                Choose a strong password you don&apos;t use elsewhere.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {success && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-sm text-emerald-800 text-center">
                  {success}
                </div>
              )}
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    New password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter a new password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-11 transition-all focus:scale-[1.01] focus:ring-2 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">
                        {showPassword ? "Hide password" : "Show password"}
                      </span>
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Re-enter your new password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-11 transition-all focus:scale-[1.01] focus:ring-2 pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="sr-only">
                        {showConfirmPassword ? "Hide password" : "Show password"}
                      </span>
                    </Button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating password..." : "Update password"}
                </Button>
              </form>

              <div className="text-center text-xs text-muted-foreground">
                Go back to{" "}
                <Link href="/auth/login" className="text-primary font-semibold hover:underline">
                  login
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  )
}

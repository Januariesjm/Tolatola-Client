"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import Image from "next/image"
import { HeaderAnimatedText } from "@/components/layout/header-animated-text"
import { Suspense } from "react"

function SignUpSuccessContent() {
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get("returnUrl")

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse animation-delay-2000" />
      </div>

      <div className="w-full max-w-sm animate-fade-in-up">
        <div className="flex flex-col gap-6">
          <Link href="/" className="flex items-center gap-3 justify-center hover:scale-105 transition-transform">
            <Image src="/tolalogo.jpg" alt="TOLA" width={120} height={40} className="h-12 w-auto" />
            <HeaderAnimatedText />
          </Link>
          <Card className="backdrop-blur-sm bg-card/95 shadow-xl border-primary/10">
            <CardHeader>
              <CardTitle className="text-2xl">Thank you for signing up!</CardTitle>
              <CardDescription>Check your email to confirm</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  You&apos;ve successfully signed up! We&apos;ve sent a verification email to your inbox.
                </p>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-semibold text-primary">📧 Check Your Email</p>
                  <p className="text-xs text-muted-foreground">
                    Click the verification link in the email from <strong>support@tolatola.co</strong> to activate your account.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> The verification link expires in 24 hours. If you don&apos;t see the email, check your spam folder.
                  </p>
                </div>
              </div>
              {returnUrl ? (
                <Link href={`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`}>
                  <Button className="w-full">Continue to Login</Button>
                </Link>
              ) : (
                <Link href="/auth/login">
                  <Button className="w-full">Go to Login</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function SignUpSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <SignUpSuccessContent />
    </Suspense>
  )
}

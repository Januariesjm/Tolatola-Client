"use client"

import type React from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import { HeaderAnimatedText } from "@/components/layout/header-animated-text"
import { logFailedRegistration } from "@/app/actions/registration"

type VendorType = "producer" | "manufacturer" | "supplier" | "wholesaler" | "retail_trader"

export default function SignUpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get("returnUrl")
  const urlError = searchParams.get("error")
  const userTypeParam = searchParams.get("userType") as "customer" | "vendor" | "transporter" | null

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [userType, setUserType] = useState<"customer" | "vendor" | "transporter">(
    userTypeParam && ["customer", "vendor", "transporter"].includes(userTypeParam) ? userTypeParam : "customer"
  )
  const [vendorType, setVendorType] = useState<VendorType | "">("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null)

  useEffect(() => {
    if (userTypeParam && ["customer", "vendor", "transporter"].includes(userTypeParam)) {
      setUserType(userTypeParam)
      if (userTypeParam !== "vendor") {
        setVendorType("")
      }
    }
  }, [userTypeParam])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
      if (!apiBase) {
        throw new Error("API base URL is not configured")
      }

      if (userType === "vendor" && !vendorType) {
        setError("Please select your business type")
        setIsLoading(false)
        return
      }

      const response = await fetch(`${apiBase}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          fullName,
          userType,
          vendorType: userType === "vendor" ? vendorType : undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Signup failed" }))
        throw new Error(errorData.error || "Unable to create account")
      }

      const { user: userData, session } = await response.json()

      const supabase = createClient()
      if (session) {
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        })
      }

      const successUrl = returnUrl
        ? `/auth/sign-up-success?returnUrl=${encodeURIComponent(returnUrl)}`
        : "/auth/sign-up-success"
      router.push(successUrl)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred"
      setError(errorMessage)

      await logFailedRegistration({
        email,
        fullName,
        userType,
        errorMessage,
        registrationStep: "email_signup",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    setIsOAuthLoading("google")
    setError(null)

    try {
      const supabase = createClient()
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tolatola.co'

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${appUrl}/auth/callback${returnUrl ? `?next=${encodeURIComponent(returnUrl)}` : ''}`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      if (error) {
        console.error("Google signup error:", error)
        setError(error.message)
        setIsOAuthLoading(null)
      }
    } catch (err) {
      console.error("Google signup exception:", err)
      setError("Unable to sign up with Google. Please try again.")
      setIsOAuthLoading(null)
    }
  }

  const handleFacebookSignUp = async () => {
    setIsOAuthLoading("facebook")
    setError(null)

    try {
      const supabase = createClient()
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://tolatola.co'

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo: `${appUrl}/auth/callback${returnUrl ? `?next=${encodeURIComponent(returnUrl)}` : ''}`,
          scopes: "email,public_profile",
        },
      })

      if (error) {
        console.error("Facebook signup error:", error)
        setError(error.message)
        setIsOAuthLoading(null)
      }
    } catch (err) {
      console.error("Facebook signup exception:", err)
      setError("Unable to sign up with Facebook. Please try again.")
      setIsOAuthLoading(null)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10 bg-gradient-to-br from-primary/5 via-background to-accent/5 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse animation-delay-2000" />
      </div>

      <div className="w-full max-w-md animate-fade-in-up">
        <div className="flex flex-col gap-6">
          <Link href="/" className="flex items-center gap-3 justify-center hover:scale-105 transition-transform">
            <Image src="/tolalogo.jpg" alt="TOLA" width={150} height={45} className="h-16 md:h-16 lg:h-20 w-auto" />
            <HeaderAnimatedText />
          </Link>

          <Card className="backdrop-blur-sm bg-card/95 shadow-2xl border-primary/20">
            <CardHeader className="space-y-2 text-center pb-6">
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Join TOLA
              </CardTitle>
              <CardDescription className="text-base">
                Create your account to get started
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {urlError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                  <p className="text-sm text-destructive text-center">
                    {decodeURIComponent(urlError)}
                  </p>
                </div>
              )}

              {/* Email/Password Form */}
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-11 transition-all focus:scale-[1.01] focus:ring-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 transition-all focus:scale-[1.01] focus:ring-2"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create a strong password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 transition-all focus:scale-[1.01] focus:ring-2"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">I want to</Label>
                  <RadioGroup
                    value={userType}
                    onValueChange={(value) => {
                      setUserType(value as "customer" | "vendor" | "transporter")
                      if (value !== "vendor") {
                        setVendorType("")
                      }
                    }}
                    className="space-y-2"
                  >
                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/60 hover:bg-accent/30 transition-all cursor-pointer">
                      <RadioGroupItem value="customer" id="customer" />
                      <Label htmlFor="customer" className="font-normal cursor-pointer flex-1 text-sm">
                        Shop for products
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/60 hover:bg-accent/30 transition-all cursor-pointer">
                        <RadioGroupItem value="vendor" id="vendor" />
                        <Label htmlFor="vendor" className="font-normal cursor-pointer flex-1 text-sm">
                          Sell my products
                        </Label>
                      </div>
                      {userType === "vendor" && (
                        <div className="ml-5 pl-3 border-l-2 border-primary/30">
                          <Select value={vendorType} onValueChange={(value) => setVendorType(value as VendorType)}>
                            <SelectTrigger className="h-11 transition-all focus:ring-2">
                              <SelectValue placeholder="Select your business type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="producer">Producer</SelectItem>
                              <SelectItem value="manufacturer">Manufacturer</SelectItem>
                              <SelectItem value="supplier">Supplier</SelectItem>
                              <SelectItem value="wholesaler">Wholesaler</SelectItem>
                              <SelectItem value="retail_trader">Retail Trader</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/60 hover:bg-accent/30 transition-all cursor-pointer">
                      <RadioGroupItem value="transporter" id="transporter" />
                      <Label htmlFor="transporter" className="font-normal cursor-pointer flex-1 text-sm">
                        Provide transport services
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {error && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 animate-shake">
                    <p className="text-sm text-destructive text-center">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                  disabled={isLoading || isOAuthLoading !== null}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                      Creating account...
                    </span>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border/60" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 text-muted-foreground font-medium">
                    Or sign up with
                  </span>
                </div>
              </div>

              {/* OAuth Buttons */}
              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 gap-3 transition-all hover:scale-[1.02] hover:bg-accent/50 border-border/60"
                  onClick={handleGoogleSignUp}
                  disabled={isOAuthLoading !== null}
                >
                  {isOAuthLoading === "google" ? (
                    <span className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  <span className="font-medium">Google</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 gap-3 transition-all hover:scale-[1.02] hover:bg-accent/50 border-border/60"
                  onClick={handleFacebookSignUp}
                  disabled={isOAuthLoading !== null}
                >
                  {isOAuthLoading === "facebook" ? (
                    <span className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  )}
                  <span className="font-medium">Facebook</span>
                </Button>
              </div>

              {/* Login link */}
              <div className="text-center pt-4 border-t border-border/60">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    href={returnUrl ? `/auth/login?returnUrl=${encodeURIComponent(returnUrl)}` : "/auth/login"}
                    className="font-medium text-primary hover:underline underline-offset-4"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

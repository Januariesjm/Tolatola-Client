"use client"

import Link from "next/link"
import Image from "next/image"
import { CheckCircle2, Eye, EyeOff, Gift, Phone, ShoppingCart, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { CountryCodeSelect } from "@/components/ui/country-code-select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HeaderAnimatedText } from "@/components/layout/header-animated-text"
import { useSignUp, type VendorType } from "@/hooks/use-sign-up"

/**
 * The sign-up form.
 *
 * Sliced verbatim out of app/auth/sign-up/page.tsx; all state and submission
 * live in useSignUp.
 */
export function SignUpForm() {
  const {
    returnUrl,
    urlError,
    refCode,
    email,
    setEmail,
    password,
    setPassword,
    showPassword,
    setShowPassword,
    fullName,
    setFullName,
    countryCode,
    setCountryCode,
    phoneNumber,
    setPhoneNumber,
    userType,
    setUserType,
    vendorType,
    setVendorType,
    acceptedPolicies,
    setAcceptedPolicies,
    error,
    isLoading,
    isOAuthLoading,
    referralCode,
    setReferralCode,
    showReferralField,
    setShowReferralField,
    referralValidating,
    referralError,
    referredByAgent,
    validateReferralCode,
    clearReferralValidation,
    handleSignUp,
    handleGoogleSignUp,
    handleFacebookSignUp,
  } = useSignUp()

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-primary/5 via-slate-50 to-accent/10 text-slate-900 px-4 sm:px-6 lg:px-8 flex items-center">
      <div className="mx-auto flex w-full items-stretch justify-between gap-8 lg:gap-10">
        {/* Left hero / marketing panel */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center rounded-3xl bg-gradient-to-br from-primary/10 via-sky-50 to-white px-8 py-10 shadow-sm">
          <div className="absolute -left-32 -top-32 h-72 w-72 rounded-full bg-primary/15 blur-3xl opacity-70" />
          <div className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-emerald-200/40 blur-3xl opacity-70" />

          <div className="relative z-10 max-w-md space-y-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="relative h-12 w-12 rounded-2xl bg-white shadow-md border border-primary/10 flex items-center justify-center">
                <Image src="/logo-new.png" alt="TOLA" fill className="object-contain p-1.5" />
              </div>
              <div>
                <p className="text-xs font-semibold tracking-[0.18em] text-primary uppercase">TOLA DIGITAL TRADE</p>
                <p className="text-lg font-semibold tracking-tight text-slate-900">Grow your trade footprint</p>
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl xl:text-4xl font-black tracking-tight text-slate-900">
                Join a logistics‑ready marketplace designed for real businesses.
              </h1>
              <p className="text-sm text-slate-600 leading-relaxed">
                Whether you&apos;re a buyer, vendor, or transporter, Tola connects you to secure payments, verified partners, and live
                delivery tracking.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-emerald-200 bg-white/80 px-5 py-4 flex items-start gap-4 shadow-sm">
              <div className="mt-1 h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">Built for digital trade flows</p>
                <p className="text-[12px] text-slate-600 leading-relaxed">
                  Create one account to manage products, orders, and transport assignments across Tanzania.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="flex-1 lg:w-1/2 flex items-center justify-center py-10">
          <div className="w-full max-w-md lg:max-w-lg animate-fade-in-up">
            {/* Mobile logo */}
            <div className="flex flex-col gap-6 mb-6 lg:mb-10 lg:hidden">
              <Link href="/" className="flex items-center gap-3 justify-center">
                <Image src="/logo-new.png" alt="TOLA" width={150} height={45} className="h-12 w-auto" />
                <HeaderAnimatedText />
              </Link>
            </div>

            <Card className="backdrop-blur-sm bg-white shadow-2xl border-slate-200">
              <CardHeader className="space-y-2 pb-4">
                <CardTitle className="text-2xl font-semibold tracking-tight text-slate-900">Join TOLA</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Create your account to shop, sell, or deliver across the TOLA ecosystem.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {urlError && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                    <p className="text-sm text-destructive text-center">{decodeURIComponent(urlError)}</p>
                  </div>
                )}

                {referredByAgent && (
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200/60 p-4 flex items-center gap-3 animate-fade-in shadow-sm">
                    <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-800">You've been referred!</p>
                      <p className="text-[11px] text-emerald-600 font-medium leading-tight">
                        Referred by TOLA agent <span className="font-bold underline">{referredByAgent}</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Email/Password Form */}
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className="text-sm font-medium">
                      Full Name
                    </Label>
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
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
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
                    <Label htmlFor="phoneNumber" className="text-sm font-medium flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      Phone Number
                    </Label>
                    <div className="flex gap-2">
                      <CountryCodeSelect value={countryCode} onChange={setCountryCode} disabled={isLoading || isOAuthLoading !== null} />
                      <Input
                        id="phoneNumber"
                        type="tel"
                        placeholder="712 345 678"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9\s-]/g, ""))}
                        className="h-11 flex-1 transition-all focus:scale-[1.01] focus:ring-2"
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">We&apos;ll use this to contact you if needed</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Create a strong password"
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
                        <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                      </Button>
                    </div>
                  </div>

                  {/* Optional Referral Code Field */}
                  {!showReferralField && !refCode ? (
                    <button
                      type="button"
                      onClick={() => setShowReferralField(true)}
                      className="flex items-center gap-2 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors py-1"
                    >
                      <Gift className="h-3.5 w-3.5" />
                      Have a referral code?
                    </button>
                  ) : null}

                  {showReferralField && (
                    <div className="space-y-2 animate-fade-in">
                      <Label htmlFor="referralCode" className="text-sm font-medium flex items-center gap-2">
                        <Gift className="h-3.5 w-3.5 text-emerald-600" />
                        Referral Code
                        <span className="text-[10px] text-muted-foreground font-normal">(optional)</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="referralCode"
                          type="text"
                          placeholder="e.g. TOLA-AG-XXXX"
                          value={referralCode}
                          onChange={(e) => {
                            setReferralCode(e.target.value.toUpperCase())
                            clearReferralValidation()
                          }}
                          onBlur={() => validateReferralCode(referralCode)}
                          className={`h-11 transition-all focus:scale-[1.01] focus:ring-2 pr-10 uppercase tracking-wider font-mono text-sm ${
                            referredByAgent
                              ? "border-emerald-400 ring-1 ring-emerald-200"
                              : referralError
                                ? "border-red-300 ring-1 ring-red-100"
                                : ""
                          }`}
                          disabled={!!refCode}
                        />
                        {referralValidating && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin h-4 w-4 border-2 border-emerald-500 border-t-transparent rounded-full" />
                        )}
                        {!referralValidating && referredByAgent && (
                          <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                        )}
                        {!referralValidating && referralError && (
                          <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-red-400" />
                        )}
                      </div>
                      {referredByAgent && (
                        <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Referred by agent: <span className="font-bold">{referredByAgent}</span>
                        </p>
                      )}
                      {referralError && <p className="text-[11px] text-red-500 font-medium">{referralError}</p>}
                    </div>
                  )}

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

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Onboarding Consent</Label>
                    <div className="flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/5/40 px-3 py-3 md:px-4 md:py-3.5">
                      <Checkbox
                        id="accepted-policies"
                        checked={acceptedPolicies}
                        onCheckedChange={(v) => setAcceptedPolicies(Boolean(v))}
                        className="mt-1 border-primary/40 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                      <div className="space-y-1 text-xs text-muted-foreground leading-relaxed">
                        <label htmlFor="accepted-policies" className="font-medium text-foreground text-[13px] leading-snug">
                          I confirm that I have read and agree to the{" "}
                          <Link href="/legal/compliance" className="text-primary underline-offset-2 hover:underline font-semibold">
                            Legal &amp; Risk Policies
                          </Link>{" "}
                          of TOLA DIGITAL TRADE &amp; SUPPLY CHAIN ECOSYSTEM.
                        </label>
                        <p className="italic text-[11px]">
                          Unakubaliana na sera za kisheria, bima na usimamizi wa hatari za TOLA DIGITAL TRADE &amp; SUPPLY CHAIN ECOSYSTEM.
                        </p>
                      </div>
                    </div>
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
                    <span className="bg-card px-3 text-muted-foreground font-medium">Or sign up with</span>
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
    </div>
  )
}

"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useRegistrationRecovery } from "@/hooks/use-registration-recovery"
import { joinPhoneNumber, splitPhoneNumber } from "@/lib/auth/country-codes"
import { useReferralCode } from "@/hooks/use-referral-code"
import { logger } from "@/lib/logger"

const log = logger.child("app.auth.sign-up")

// TODO: wire this to a server action if/when available
const logFailedRegistration = async (_payload: unknown) => {
  // no-op in client build
}

export type VendorType = "producer" | "manufacturer" | "supplier" | "wholesaler" | "retail_trader"

/**
 * All sign-up state and submission: the form fields, registration-recovery
 * auto-save, referral-code validation, and the email/Google/Facebook paths.
 *
 * Extracted from app/auth/sign-up/page.tsx, which was 845 lines of this logic
 * plus a 410-line form in one file.
 */
export function useSignUp() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const returnUrl = searchParams.get("returnUrl")
  const urlError = searchParams.get("error")
  const userTypeParam = searchParams.get("userType") as "customer" | "vendor" | "transporter" | null
  const refCode = searchParams.get("ref")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState("")
  const [countryCode, setCountryCode] = useState("+255")
  const [phoneNumber, setPhoneNumber] = useState("")
  const [userType, setUserType] = useState<"customer" | "vendor" | "transporter">(
    userTypeParam && ["customer", "vendor", "transporter"].includes(userTypeParam) ? userTypeParam : "customer",
  )
  const [vendorType, setVendorType] = useState<VendorType | "">("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isOAuthLoading, setIsOAuthLoading] = useState<string | null>(null)
  const [acceptedPolicies, setAcceptedPolicies] = useState(false)

  const {
    referralCode,
    setReferralCode,
    showReferralField,
    setShowReferralField,
    referralValidating,
    referralError,
    referredByAgent,
    validateReferralCode,
    clearReferralValidation,
    effectiveReferralCode,
  } = useReferralCode(refCode)

  // Registration recovery — auto-save + resume
  const { saveProgress, markCompleted } = useRegistrationRecovery({
    userType,
    onResumeData: (data) => {
      if (data.full_name && !fullName) setFullName(data.full_name)
      if (data.email && !email) setEmail(data.email)
      if (data.phone && !phoneNumber) {
        // Try to extract country code from saved phone
        const savedPhone = data.phone as string
        const parts = splitPhoneNumber(savedPhone)
        if (parts) {
          setCountryCode(parts.countryCode)
          setPhoneNumber(parts.localNumber)
        } else {
          setPhoneNumber(savedPhone)
        }
      }
      if (data.form_data?.userType) setUserType(data.form_data.userType)
      if (data.form_data?.vendorType) setVendorType(data.form_data.vendorType)
    },
  })

  // Auto-save on field changes
  const fullPhone = joinPhoneNumber(countryCode, phoneNumber)

  useEffect(() => {
    if (fullName || email) {
      saveProgress({
        full_name: fullName,
        email,
        phone: fullPhone || undefined,
        last_step: "account_details",
        form_data: { userType, vendorType },
      })
    }
  }, [fullName, email, fullPhone, userType, vendorType, saveProgress])

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

      if (!phoneNumber.trim() || phoneNumber.replace(/\D/g, "").length < 7) {
        setError("Please enter a valid phone number (at least 7 digits)")
        setIsLoading(false)
        return
      }

      if (userType === "vendor" && !vendorType) {
        setError("Please select your business type")
        setIsLoading(false)
        return
      }

      if (!acceptedPolicies) {
        setError("You must agree to the Legal & Risk Policies to create an account.")
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
          phone: fullPhone,
          userType,
          vendorType: userType === "vendor" ? vendorType : undefined,
          acceptedPolicies: true,
          referralCode: effectiveReferralCode || undefined,
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

      // Mark registration as completed in recovery system
      await markCompleted()

      const successUrl = returnUrl ? `/auth/sign-up-success?returnUrl=${encodeURIComponent(returnUrl)}` : "/auth/sign-up-success"
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
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tolatola.co"
      const activeRefCode = effectiveReferralCode

      const nextQuery = returnUrl ? `?next=${encodeURIComponent(returnUrl)}` : ""
      const refQuery = activeRefCode ? `${nextQuery ? "&" : "?"}ref=${encodeURIComponent(activeRefCode)}` : ""
      const redirectToUrl = `${appUrl}/auth/callback${nextQuery}${refQuery}`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectToUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      })

      if (error) {
        log.error("google signup error", error)
        setError(error.message)
        setIsOAuthLoading(null)
      }
    } catch (err) {
      log.error("google signup exception", err)
      setError("Unable to sign up with Google. Please try again.")
      setIsOAuthLoading(null)
    }
  }

  const handleFacebookSignUp = async () => {
    setIsOAuthLoading("facebook")
    setError(null)

    try {
      const supabase = createClient()
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tolatola.co"
      const activeRefCode = effectiveReferralCode

      const nextQuery = returnUrl ? `?next=${encodeURIComponent(returnUrl)}` : ""
      const refQuery = activeRefCode ? `${nextQuery ? "&" : "?"}ref=${encodeURIComponent(activeRefCode)}` : ""
      const redirectToUrl = `${appUrl}/auth/callback${nextQuery}${refQuery}`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "facebook",
        options: {
          redirectTo: redirectToUrl,
          scopes: "email,public_profile",
        },
      })

      if (error) {
        log.error("facebook signup error", error)
        setError(error.message)
        setIsOAuthLoading(null)
      }
    } catch (err) {
      log.error("facebook signup exception", err)
      setError("Unable to sign up with Facebook. Please try again.")
      setIsOAuthLoading(null)
    }
  }

  return {
    // routing
    returnUrl,
    urlError,
    /** Referral code from the ?ref= share link, if any. */
    refCode,
    // fields
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
    // status
    error,
    isLoading,
    isOAuthLoading,
    // referral
    referralCode,
    setReferralCode,
    showReferralField,
    setShowReferralField,
    referralValidating,
    referralError,
    referredByAgent,
    validateReferralCode,
    clearReferralValidation,
    // actions
    handleSignUp,
    handleGoogleSignUp,
    handleFacebookSignUp,
  }
}

export type SignUpState = ReturnType<typeof useSignUp>

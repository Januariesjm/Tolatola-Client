"use client"

import { useCallback, useEffect, useState } from "react"
import { logger } from "@/lib/logger"

const log = logger.child("auth.referral-code")

/** Response from `GET /agents/referral-info`. */
interface ReferralInfoResponse {
  valid?: boolean
  agent_name?: string | null
}

/**
 * Referral-code entry and validation for sign-up.
 *
 * Extracted from app/auth/sign-up/page.tsx. A code can arrive two ways — as a
 * `?ref=` query parameter (an agent's share link) or typed by hand — and both
 * paths run the same lookup, so it lives in one place.
 */
export function useReferralCode(initialCode?: string | null) {
  const [referralCode, setReferralCode] = useState(initialCode || "")
  const [showReferralField, setShowReferralField] = useState(Boolean(initialCode))
  const [referralValidating, setReferralValidating] = useState(false)
  const [referralError, setReferralError] = useState<string | null>(null)
  /** Name of the agent the code belongs to, once confirmed. */
  const [referredByAgent, setReferredByAgent] = useState<string | null>(null)

  const validateReferralCode = useCallback(async (code: string) => {
    if (!code.trim()) {
      setReferredByAgent(null)
      setReferralError(null)
      return
    }

    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL
    if (!apiBase) return

    setReferralValidating(true)
    setReferralError(null)
    try {
      const res = await fetch(`${apiBase}/agents/referral-info?code=${encodeURIComponent(code.trim())}`)
      const data: ReferralInfoResponse = await res.json()

      if (data.valid && data.agent_name) {
        setReferredByAgent(data.agent_name)
        setReferralError(null)
      } else {
        setReferredByAgent(null)
        setReferralError("Invalid referral code. Please check and try again.")
      }
    } catch (err) {
      // A lookup failure must not block sign-up: the code is still submitted
      // with the registration and the backend re-checks it.
      log.error("error validating referral code", err)
      setReferredByAgent(null)
    } finally {
      setReferralValidating(false)
    }
  }, [])

  useEffect(() => {
    if (initialCode) {
      validateReferralCode(initialCode)
    }
  }, [initialCode, validateReferralCode])

  /**
   * Clears a previous verdict. Called as the user edits the code, so a stale
   * "verified" tick or error does not sit next to a value it no longer describes.
   */
  const clearReferralValidation = useCallback(() => {
    setReferredByAgent(null)
    setReferralError(null)
  }, [])

  /** The code to submit: whatever was typed, else the one from the link. */
  const effectiveReferralCode = (referralCode.trim() || initialCode || "").trim()

  return {
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
  }
}

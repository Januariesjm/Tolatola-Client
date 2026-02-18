"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Cookie } from "lucide-react"

const STORAGE_KEY = "tola-cookie-consent"

type ConsentState = "accepted" | "rejected" | "unknown"

export function CookieConsentBanner() {
  const [consent, setConsent] = useState<ConsentState>("unknown")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window === "undefined") return
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored === "accepted" || stored === "rejected") {
        setConsent(stored)
      }
    } catch {
      // ignore storage errors
    }
  }, [])

  // If not mounted or already accepted, don't show
  if (!mounted || consent === "accepted") return null

  const handleAccept = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "accepted")
    } catch {
      // ignore
    }
    setConsent("accepted")
  }

  const handleReject = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "rejected")
    } catch {
      // ignore
    }
    // Keep consent as "rejected" so banner shows again on next visit
    setConsent("rejected")
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 sm:px-6 pb-4 sm:pb-8">
      <Card className="w-full sm:w-3/4 max-w-4xl border border-white/40 bg-gradient-to-r from-white/70 via-slate-50/60 to-white/70 backdrop-blur-xl shadow-xl flex flex-col sm:flex-row sm:items-center gap-4 px-4 py-3 sm:px-8 sm:py-5 rounded-2xl">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Cookie className="h-4 w-4" />
          </div>
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-slate-900">
              We use cookies to improve performance.
            </p>
            <p className="text-xs text-slate-600">
              TolaTola uses essential and performance cookies to understand usage and enhance your experience.
              You can accept tracking cookies or continue with only essential cookies.
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto text-xs"
            onClick={handleReject}
          >
            Reject
          </Button>
          <Button
            size="sm"
            className="w-full sm:w-auto text-xs"
            onClick={handleAccept}
          >
            Accept
          </Button>
        </div>
      </Card>
    </div>
  )
}


"use client"

import { useState, useEffect, useRef, useCallback } from "react"

const SESSION_KEY = "tola_reg_session_id"
const DEBOUNCE_MS = 5000 // Auto-save every 5 seconds of inactivity

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return ""
  let sid = localStorage.getItem(SESSION_KEY)
  if (!sid) {
    sid = `reg_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
    localStorage.setItem(SESSION_KEY, sid)
  }
  return sid
}

function clearSessionId() {
  if (typeof window === "undefined") return
  localStorage.removeItem(SESSION_KEY)
}

interface RegistrationRecoveryOptions {
  userType: "customer" | "vendor" | "transporter"
  onResumeData?: (data: any) => void
}

interface SavePayload {
  full_name?: string
  email?: string
  phone?: string
  user_type?: string
  last_step?: string
  form_data?: Record<string, any>
  user_id?: string
}

export function useRegistrationRecovery({ userType, onResumeData }: RegistrationRecoveryOptions) {
  const [sessionId, setSessionId] = useState<string>("")
  const [hasResumeData, setHasResumeData] = useState(false)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const lastPayload = useRef<string>("")

  useEffect(() => {
    const sid = getOrCreateSessionId()
    setSessionId(sid)

    // Check for saved progress on mount
    const checkResume = async () => {
      try {
        const response = await fetch(`/api/registration-recovery/resume?session_id=${encodeURIComponent(sid)}`)
        if (!response.ok) return

        const result = await response.json()
        if (result.found && result.data) {
          setHasResumeData(true)
          onResumeData?.(result.data)
        }
      } catch (err) {
        console.error("[RegRecovery] Resume check failed:", err)
      }
    }

    checkResume()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const saveProgress = useCallback(
    async (payload: SavePayload) => {
      if (!sessionId) return

      const payloadStr = JSON.stringify(payload)
      if (payloadStr === lastPayload.current) return // No change
      lastPayload.current = payloadStr

      try {
        await fetch(`/api/registration-recovery/save`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: sessionId,
            user_type: userType,
            ...payload,
          }),
        })
      } catch (err) {
        console.error("[RegRecovery] Save failed:", err)
      }
    },
    [sessionId, userType],
  )

  const debouncedSave = useCallback(
    (payload: SavePayload) => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
      debounceTimer.current = setTimeout(() => {
        saveProgress(payload)
      }, DEBOUNCE_MS)
    },
    [saveProgress],
  )

  const markCompleted = useCallback(async () => {
    if (!sessionId) return
    try {
      await fetch(`/api/registration-recovery/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      })
    } catch (err) {
      console.error("[RegRecovery] Complete marking failed:", err)
    }
    clearSessionId()
  }, [sessionId])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [])

  return {
    sessionId,
    hasResumeData,
    saveProgress: debouncedSave,
    markCompleted,
  }
}

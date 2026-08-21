"use client"

import { useCallback, useEffect, useRef, useState } from "react"

/** Idle time before the buyer is asked whether they are still there. */
export const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000

/** How long the buyer has to answer before the session is closed. */
export const TERMINATION_COUNTDOWN_SEC = 120

/** How often idle time is checked. Coarse on purpose -- the threshold is an hour. */
export const INACTIVITY_POLL_MS = 15_000

interface UseSupportInactivityOptions {
  /** Called once when the idle threshold is first crossed. */
  onPrompt: () => void
  /** Called when the countdown reaches zero without a response. */
  onExpire: () => void
}

/**
 * Idle-session lifecycle for the support widget: notice the buyer went away,
 * warn them, then close the chat.
 *
 * Extracted from components/support/floating-support-widget.tsx, which ran two
 * interleaved effects for this. The countdown effect called the widget's
 * `handleEndChatSession` from inside a `setSecondsRemaining` updater -- a state
 * setter dispatching unrelated state updates as a side effect, which React may
 * invoke more than once. The expiry callback now fires from an effect that
 * watches the count instead.
 *
 * Both callbacks are held in refs so a caller passing inline arrow functions
 * does not restart the timers on every render.
 */
export function useSupportInactivity({ onPrompt, onExpire }: UseSupportInactivityOptions) {
  const [promptActive, setPromptActive] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(TERMINATION_COUNTDOWN_SEC)
  const lastActivityRef = useRef<number>(Date.now())

  /**
   * Mirrors `promptActive` for the interval's guard.
   *
   * The guard has to be synchronous. Reading the state variable instead means
   * reading the value captured when the effect ran, which is still `false` on
   * the tick right after the threshold is crossed -- so the prompt fired twice
   * whenever two ticks landed before React re-rendered.
   */
  const promptActiveRef = useRef(false)

  const onPromptRef = useRef(onPrompt)
  const onExpireRef = useRef(onExpire)
  useEffect(() => {
    onPromptRef.current = onPrompt
    onExpireRef.current = onExpire
  }, [onPrompt, onExpire])

  const setPrompt = useCallback((value: boolean) => {
    promptActiveRef.current = value
    setPromptActive(value)
  }, [])

  /** Marks the buyer as present, cancelling any pending termination. */
  const registerActivity = useCallback(() => {
    lastActivityRef.current = Date.now()
    setPrompt(false)
  }, [setPrompt])

  /** Clears the prompt without treating it as activity, e.g. when ending the chat. */
  const dismissPrompt = useCallback(() => setPrompt(false), [setPrompt])

  // Idle watcher. One interval for the hook's lifetime -- the guard is the ref,
  // so this never needs to be torn down and re-established.
  useEffect(() => {
    const interval = setInterval(() => {
      if (promptActiveRef.current) return
      if (Date.now() - lastActivityRef.current < INACTIVITY_TIMEOUT_MS) return

      setPrompt(true)
      setSecondsRemaining(TERMINATION_COUNTDOWN_SEC)
      onPromptRef.current()
    }, INACTIVITY_POLL_MS)

    return () => clearInterval(interval)
  }, [setPrompt])

  // Countdown, only while the prompt is up.
  useEffect(() => {
    if (!promptActive) return

    const ticker = setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(ticker)
  }, [promptActive])

  // Expiry is its own effect so it is not dispatched from inside a state updater.
  useEffect(() => {
    if (!promptActive || secondsRemaining > 0) return
    setPrompt(false)
    onExpireRef.current()
  }, [promptActive, secondsRemaining, setPrompt])

  return { promptActive, secondsRemaining, registerActivity, dismissPrompt }
}

"use client"

import { useEffect } from "react"
import { EventEmitter } from "events"

export function GlobalErrorLogger() {
  useEffect(() => {
    // Increase global EventEmitter max listeners limit to prevent MaxListenersExceededWarning
    try {
      if (EventEmitter && typeof EventEmitter.defaultMaxListeners === "number") {
        EventEmitter.defaultMaxListeners = 100
      }
    } catch (e) {
      /* ignore */
    }

    // Silence browser extension / contentscript stream noise & orphaned data warnings
    const originalWarn = console.warn
    const originalError = console.error

    console.warn = (...args: any[]) => {
      const msg = args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ")
      if (
        msg.includes("MaxListenersExceededWarning") ||
        msg.includes("ObjectMultiplex") ||
        msg.includes("app-init-liveness") ||
        msg.includes("background-liveness")
      ) {
        return
      }
      originalWarn.apply(console, args)
    }

    console.error = (...args: any[]) => {
      const msg = args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ")
      if (
        msg.includes("MaxListenersExceededWarning") ||
        msg.includes("ObjectMultiplex") ||
        msg.includes("app-init-liveness") ||
        msg.includes("background-liveness")
      ) {
        return
      }
      originalError.apply(console, args)
    }

    const handleChunkError = (error: any) => {
      const message = error?.message || (typeof error === "string" ? error : "")
      const isChunkError =
        /Loading chunk [\d]+ failed/.test(message) || /Loading CSS chunk [\d]+ failed/.test(message) || message.includes("ChunkLoadError")

      if (isChunkError) {
        console.log("Chunk load error detected, reloading to recover...")
        const lastReload = sessionStorage.getItem("last_chunk_reload")
        const now = Date.now()
        if (!lastReload || now - parseInt(lastReload) > 10000) {
          sessionStorage.setItem("last_chunk_reload", now.toString())
          window.location.reload()
        }
      }
    }

    const handleError = (event: ErrorEvent) => {
      const msg = event?.message || ""
      if (
        msg.includes("MaxListenersExceededWarning") ||
        msg.includes("ObjectMultiplex") ||
        msg.includes("app-init-liveness") ||
        msg.includes("background-liveness")
      ) {
        return
      }
      handleChunkError(event.error || event.message)
      console.error("[Global Error]", {
        message: event.message,
        source: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
      })
    }

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reasonStr = String(event?.reason || "")
      if (
        reasonStr.includes("MaxListenersExceededWarning") ||
        reasonStr.includes("ObjectMultiplex") ||
        reasonStr.includes("app-init-liveness") ||
        reasonStr.includes("background-liveness")
      ) {
        return
      }
      handleChunkError(event.reason)
      console.error("[Unhandled Promise Rejection]", {
        reason: event.reason,
      })
    }

    window.addEventListener("error", handleError)
    window.addEventListener("unhandledrejection", handleRejection)

    return () => {
      console.warn = originalWarn
      console.error = originalError
      window.removeEventListener("error", handleError)
      window.removeEventListener("unhandledrejection", handleRejection)
    }
  }, [])

  return null
}

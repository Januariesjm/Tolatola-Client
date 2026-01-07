"use client"

import { useEffect } from "react"

export function GlobalErrorLogger() {
    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            console.error("[Global Error]", {
                message: event.message,
                source: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
            })
        }

        const handleRejection = (event: PromiseRejectionEvent) => {
            console.error("[Unhandled Promise Rejection]", {
                reason: event.reason,
            })
        }

        window.addEventListener("error", handleError)
        window.addEventListener("unhandledrejection", handleRejection)

        return () => {
            window.removeEventListener("error", handleError)
            window.removeEventListener("unhandledrejection", handleRejection)
        }
    }, [])

    return null
}

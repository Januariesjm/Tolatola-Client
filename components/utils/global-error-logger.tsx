"use client"

import { useEffect } from "react"

export function GlobalErrorLogger() {
    useEffect(() => {
        const handleChunkError = (error: any) => {
            const message = error?.message || (typeof error === 'string' ? error : '')
            const isChunkError = /Loading chunk [\d]+ failed/.test(message) ||
                /Loading CSS chunk [\d]+ failed/.test(message) ||
                message.includes("ChunkLoadError")

            if (isChunkError) {
                console.log("Chunk load error detected, reloading to recover...")
                // Simple protection against infinite loops: don't reload if we just did
                const lastReload = sessionStorage.getItem('last_chunk_reload')
                const now = Date.now()
                if (!lastReload || now - parseInt(lastReload) > 10000) {
                    sessionStorage.setItem('last_chunk_reload', now.toString())
                    window.location.reload()
                }
            }
        }

        const handleError = (event: ErrorEvent) => {
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
            handleChunkError(event.reason)
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

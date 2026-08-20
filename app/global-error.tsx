"use client"

import { useEffect } from "react"
import { logger } from "@/lib/logger"

const log = logger.child("app.global-error-boundary")

/**
 * Last-resort error boundary for failures in the root layout itself, which
 * app/error.tsx cannot catch.
 *
 * This replaces the whole document, so it must render its own <html>/<body>
 * and cannot rely on the app's providers, fonts or global stylesheet having
 * loaded. Styles are inline for that reason -- keep it dependency-free.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    log.error("unhandled error in root layout", error, { digest: error.digest })
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          color: "#111827",
          background: "#f9fafb",
        }}
      >
        <div style={{ maxWidth: "32rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#4b5563", lineHeight: 1.6, marginBottom: "1.5rem" }}>
            The application failed to load. Please try again — if the problem persists, contact
            support.
          </p>
          <button
            onClick={reset}
            style={{
              cursor: "pointer",
              borderRadius: "0.5rem",
              border: "none",
              background: "#111827",
              color: "#ffffff",
              padding: "0.625rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 500,
            }}
          >
            Try again
          </button>
          {error.digest ? (
            <p style={{ marginTop: "1.5rem", fontSize: "0.75rem", color: "#6b7280" }}>
              Reference: <code>{error.digest}</code>
            </p>
          ) : null}
        </div>
      </body>
    </html>
  )
}

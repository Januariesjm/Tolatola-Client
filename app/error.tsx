"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { logger } from "@/lib/logger"

const log = logger.child("app.error-boundary")

/**
 * Route-level error boundary. Next.js renders this in place of the segment
 * whenever a render, effect or data fetch throws, instead of the user seeing a
 * blank page.
 *
 * Errors are reported through lib/logger so a single error-tracking
 * integration picks them up.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // `digest` is the only handle on the server-side stack in production
    // builds, so it belongs in the report.
    log.error("unhandled error rendering route", error, { digest: error.digest })
  }, [error])

  return (
    <div className="flex min-h-[60vh] w-full items-center justify-center p-6 md:p-10">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-6 w-6 text-destructive" aria-hidden="true" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            We hit an unexpected problem loading this page. You can try again, or head back to the homepage.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={reset} className="gap-2">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            Try again
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Go to homepage</Link>
          </Button>
          {error.digest ? (
            <p className="mt-2 self-center text-xs text-muted-foreground sm:mt-0 sm:ml-auto">
              Reference: <code>{error.digest}</code>
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

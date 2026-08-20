import { NextResponse } from "next/server"
import type { ZodTypeAny, z } from "zod"
import { logger } from "@/lib/logger"

const log = logger.child("api.validate-request")

/**
 * Zod validation for API route bodies.
 *
 * Route handlers were destructuring straight out of `request.json()`, so a
 * missing, misspelled or wrongly-typed field flowed into a Supabase query and
 * surfaced as a confusing 404, a driver error, or — worse — a query with
 * `undefined` in it. This gives every handler one line that either yields a
 * fully typed body or a 400 explaining what was wrong.
 *
 * Usage:
 *
 *   const parsed = await validateRequestBody(request, assignRoleSchema)
 *   if (!parsed.ok) return parsed.response
 *   const { userId, roleId } = parsed.data
 */

/** Either a parsed body or the 400 to return. */
export type ValidationResult<T> = { ok: true; data: T } | { ok: false; response: NextResponse }

/** Shape of the 400 body, so clients can rely on it. */
export interface ValidationErrorBody {
  error: string
  issues: string[]
}

function badRequest(error: string, issues: string[]): NextResponse {
  return NextResponse.json({ error, issues } satisfies ValidationErrorBody, { status: 400 })
}

/**
 * Reads and validates a JSON request body against `schema`.
 *
 * Returns a 400 for a body that is not JSON at all, and a 400 listing the
 * failing fields when the schema rejects it. `scope` only labels the log line.
 */
export async function validateRequestBody<S extends ZodTypeAny>(
  request: Request,
  schema: S,
  scope = "unknown",
): Promise<ValidationResult<z.infer<S>>> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return { ok: false, response: badRequest("Request body must be valid JSON", []) }
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    // Field paths, not values: a rejected body can contain user data.
    const issues = parsed.error.issues.map((issue) => (issue.path.length > 0 ? `${issue.path.join(".")}: ${issue.message}` : issue.message))
    log.warn("rejected malformed request body", undefined, { scope, issues })
    return { ok: false, response: badRequest("Invalid request body", issues) }
  }

  return { ok: true, data: parsed.data }
}

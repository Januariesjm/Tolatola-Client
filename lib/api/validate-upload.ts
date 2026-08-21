import { NextResponse } from "next/server"
import { logger } from "@/lib/logger"

const log = logger.child("api.validate-upload")

/**
 * Validation for multipart file-upload routes.
 *
 * The JSON routes go through `validateRequestBody` with a zod schema, but the
 * upload routes read `FormData`, which zod cannot describe usefully — a `File`
 * is a runtime object, not a shape. This is the equivalent boundary check for
 * them: field present, non-empty, within the size cap, and of an allowed type.
 *
 * Generalised from the checks `app/api/upload-business-license` already had, so
 * the limits stay the ones already in production (5MB; PDF/JPEG/PNG).
 */

/** Image types accepted for avatars and product photos. */
export const IMAGE_MIME_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"] as const

/** Document types accepted for KYC and licences: images plus PDF. */
export const DOCUMENT_MIME_TYPES = [...IMAGE_MIME_TYPES, "application/pdf"] as const

/** Matches the limit app/api/upload-business-license already enforced. */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024

export interface UploadRules {
  /** Accepted MIME types. A type outside this list is rejected with 415. */
  allowedTypes: readonly string[]
  /** Defaults to MAX_UPLOAD_BYTES. */
  maxBytes?: number
  /** FormData field name; defaults to "file". */
  field?: string
}

export type UploadValidation =
  /** `formData` is returned so a caller can read sibling fields without re-parsing the body. */
  { ok: true; file: File; formData: FormData } | { ok: false; response: NextResponse }

function reject(status: number, error: string): { ok: false; response: NextResponse } {
  return { ok: false, response: NextResponse.json({ error }, { status }) }
}

const humanMb = (bytes: number) => `${Math.round((bytes / (1024 * 1024)) * 10) / 10}MB`

/**
 * Reads and validates a single uploaded file.
 *
 * Status codes are deliberate: 413 for a file that is too large and 415 for a
 * disallowed type, rather than collapsing everything into 400, so a client can
 * tell the two apart.
 */
export async function validateUpload(request: Request, rules: UploadRules): Promise<UploadValidation> {
  const field = rules.field ?? "file"
  const maxBytes = rules.maxBytes ?? MAX_UPLOAD_BYTES

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return reject(400, "Request body must be multipart form data")
  }

  const value = formData.get(field)

  // A text field posted under the same name must not be treated as a file.
  if (!value || typeof value === "string") {
    return reject(400, `No file provided under "${field}"`)
  }

  const file = value as File

  if (file.size === 0) {
    return reject(400, "File is empty")
  }

  if (file.size > maxBytes) {
    log.warn("rejected oversized upload", undefined, { size: file.size, maxBytes })
    return reject(413, `File size must be less than ${humanMb(maxBytes)}`)
  }

  if (!rules.allowedTypes.includes(file.type)) {
    // Log the type but never the filename: it is attacker-controlled text.
    log.warn("rejected upload of a disallowed type", undefined, { type: file.type })
    return reject(415, `Invalid file type. Allowed: ${rules.allowedTypes.join(", ")}`)
  }

  return { ok: true, file, formData }
}

/**
 * A safe, lowercase file extension derived from an uploaded filename.
 *
 * Filenames are attacker-controlled and get concatenated into storage paths, so
 * anything that is not a short alphanumeric run is discarded rather than
 * sanitised — that avoids "../", embedded nulls and double extensions
 * (`x.png.html`) reaching the bucket key.
 */
export function safeFileExtension(filename: string | undefined, fallback = "bin"): string {
  if (!filename) return fallback

  const lastDot = filename.lastIndexOf(".")
  if (lastDot === -1 || lastDot === filename.length - 1) return fallback

  const ext = filename.slice(lastDot + 1).toLowerCase()
  return /^[a-z0-9]{1,10}$/.test(ext) ? ext : fallback
}

/**
 * A single storage-path segment safe to concatenate into a bucket key.
 *
 * Keeps letters, digits, dash and underscore; collapses everything else to a
 * dash. That removes "/" and ".." (path traversal), NUL bytes, and whitespace
 * from values that arrive as form fields or filenames.
 */
export function safePathSegment(value: string | undefined, fallback = "file"): string {
  if (!value) return fallback

  const cleaned = value
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)

  return cleaned.length > 0 ? cleaned : fallback
}

/**
 * Attachment rules for the support chat composer.
 *
 * Extracted from handleFileSelect in
 * components/support/floating-support-widget.tsx, where the size limit, the
 * accepted types and the base64 split were interleaved with `toast` calls and a
 * FileReader callback -- so none of it could be exercised without rendering the
 * widget and driving a file input.
 */

import type { SelectedAttachment } from "@/lib/support/chat-message"

/** Upload ceiling. The support API rejects anything larger. */
export const MAX_ATTACHMENT_BYTES = 12 * 1024 * 1024

/** A rejection, shaped for `toast`. */
export interface AttachmentRejection {
  title: string
  description: string
}

export type AttachmentValidation = { ok: true; isPdf: boolean } | { ok: false; error: AttachmentRejection }

/** The parts of a File the rules look at, so tests need not construct a real File. */
export interface AttachmentCandidate {
  name: string
  size: number
  type: string
}

/**
 * True for PDFs. Checked by extension as well as MIME type because some
 * browsers hand over an empty `type` for a drag-and-dropped PDF.
 */
export function isPdfAttachment(file: AttachmentCandidate): boolean {
  return file.type === "application/pdf" || file.name.endsWith(".pdf")
}

/** True for images, by MIME type only -- the widget previews these inline. */
export function isImageAttachment(file: AttachmentCandidate): boolean {
  return file.type.startsWith("image/")
}

/**
 * Applies the size and format rules, in that order: an oversized PDF reports the
 * size problem rather than the format one.
 */
export function validateChatAttachment(file: AttachmentCandidate): AttachmentValidation {
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return {
      ok: false,
      error: { title: "File Too Large", description: "Please select an image or PDF under 12MB." },
    }
  }

  const isPdf = isPdfAttachment(file)

  if (!isPdf && !isImageAttachment(file)) {
    return {
      ok: false,
      error: {
        title: "Unsupported File Format",
        description: "Please upload a picture (JPG, PNG, WEBP, GIF) or a PDF document.",
      },
    }
  }

  return { ok: true, isPdf }
}

/**
 * Strips the `data:<mime>;base64,` prefix from a FileReader result.
 *
 * Falls back to the whole string when there is no prefix, matching the original
 * handler: the AI endpoint receives whatever we have rather than nothing.
 */
export function extractBase64Payload(dataUrl: string): string {
  return dataUrl.includes(";base64,") ? dataUrl.split(";base64,")[1] : dataUrl
}

/**
 * Builds the staged attachment from a file and its data URL.
 *
 * `mimeType` falls back to a type inferred from `isPdf` because an empty
 * `file.type` would otherwise reach the API as an empty content type.
 */
export function buildSelectedAttachment(file: File, dataUrl: string, isPdf: boolean): SelectedAttachment {
  return {
    file,
    previewUrl: dataUrl,
    base64Data: extractBase64Payload(dataUrl),
    mimeType: file.type || (isPdf ? "application/pdf" : "image/jpeg"),
    name: file.name,
    size: file.size,
    isPdf,
  }
}

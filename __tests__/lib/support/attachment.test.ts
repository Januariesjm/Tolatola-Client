/**
 * Tests for lib/support/attachment.ts.
 *
 * Extracted from handleFileSelect in floating-support-widget.tsx, where these
 * rules were tangled with toast calls and a FileReader callback.
 */

import {
  MAX_ATTACHMENT_BYTES,
  buildSelectedAttachment,
  extractBase64Payload,
  isImageAttachment,
  isPdfAttachment,
  validateChatAttachment,
} from "@/lib/support/attachment"

const MB = 1024 * 1024

const candidate = (overrides: Partial<{ name: string; size: number; type: string }> = {}) => ({
  name: "receipt.png",
  size: 2 * MB,
  type: "image/png",
  ...overrides,
})

describe("isPdfAttachment", () => {
  it("accepts the PDF mime type", () => {
    expect(isPdfAttachment(candidate({ name: "doc", type: "application/pdf" }))).toBe(true)
  })

  it("accepts a .pdf extension when the browser reports no type", () => {
    expect(isPdfAttachment(candidate({ name: "invoice.pdf", type: "" }))).toBe(true)
  })

  it("rejects a name that merely contains pdf", () => {
    expect(isPdfAttachment(candidate({ name: "pdf-notes.txt", type: "text/plain" }))).toBe(false)
  })
})

describe("isImageAttachment", () => {
  it.each(["image/png", "image/jpeg", "image/webp", "image/gif"])("accepts %s", (type) => {
    expect(isImageAttachment(candidate({ type }))).toBe(true)
  })

  it("rejects a non-image type", () => {
    expect(isImageAttachment(candidate({ type: "application/zip" }))).toBe(false)
  })
})

describe("validateChatAttachment", () => {
  it("accepts an image under the limit", () => {
    expect(validateChatAttachment(candidate())).toEqual({ ok: true, isPdf: false })
  })

  it("accepts a PDF under the limit and reports it as one", () => {
    expect(validateChatAttachment(candidate({ name: "invoice.pdf", type: "application/pdf" }))).toEqual({ ok: true, isPdf: true })
  })

  it("rejects a file over the size limit", () => {
    const result = validateChatAttachment(candidate({ size: MAX_ATTACHMENT_BYTES + 1 }))

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error.title).toBe("File Too Large")
  })

  it("accepts a file exactly at the limit", () => {
    expect(validateChatAttachment(candidate({ size: MAX_ATTACHMENT_BYTES })).ok).toBe(true)
  })

  it("reports the size problem first for an oversized PDF", () => {
    const result = validateChatAttachment(candidate({ name: "huge.pdf", type: "application/pdf", size: 50 * MB }))

    expect(result.ok === false && result.error.title).toBe("File Too Large")
  })

  it("rejects an unsupported format", () => {
    const result = validateChatAttachment(candidate({ name: "archive.zip", type: "application/zip" }))

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error.title).toBe("Unsupported File Format")
  })

  it("gives every rejection a title and a description for the toast", () => {
    for (const bad of [candidate({ size: 99 * MB }), candidate({ name: "a.zip", type: "application/zip" })]) {
      const result = validateChatAttachment(bad)
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.error.title).toBeTruthy()
        expect(result.error.description).toBeTruthy()
      }
    }
  })
})

describe("extractBase64Payload", () => {
  it("strips the data URL prefix", () => {
    expect(extractBase64Payload("data:image/png;base64,AAAB")).toBe("AAAB")
  })

  it("returns the input unchanged when there is no prefix", () => {
    expect(extractBase64Payload("AAAB")).toBe("AAAB")
  })

  it("keeps only the payload when the base64 itself contains commas", () => {
    expect(extractBase64Payload("data:application/pdf;base64,AA,BB")).toBe("AA,BB")
  })
})

describe("buildSelectedAttachment", () => {
  const file = (name: string, type: string, size = 1234) => ({ name, type, size }) as File

  it("carries the file metadata and preview through", () => {
    const result = buildSelectedAttachment(file("shot.png", "image/png", 4096), "data:image/png;base64,AAAB", false)

    expect(result).toMatchObject({
      previewUrl: "data:image/png;base64,AAAB",
      base64Data: "AAAB",
      mimeType: "image/png",
      name: "shot.png",
      size: 4096,
      isPdf: false,
    })
  })

  it("infers a PDF mime type when the browser reported none", () => {
    const result = buildSelectedAttachment(file("invoice.pdf", ""), "data:application/pdf;base64,AAAB", true)

    expect(result.mimeType).toBe("application/pdf")
  })

  it("infers an image mime type when the browser reported none", () => {
    const result = buildSelectedAttachment(file("photo", ""), "data:image/jpeg;base64,AAAB", false)

    expect(result.mimeType).toBe("image/jpeg")
  })
})

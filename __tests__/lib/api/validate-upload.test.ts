/**
 * @jest-environment node
 */

/**
 * Tests for the upload boundary validator (lib/api/validate-upload.ts).
 *
 * This guards every multipart route, three of which previously had no
 * authentication and no size or type limit at all, so the rejection paths are
 * the point: an oversized file, a disallowed type, a text field posing as a
 * file, and filenames crafted to escape a storage folder.
 */

import {
  DOCUMENT_MIME_TYPES,
  IMAGE_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  safeFileExtension,
  safePathSegment,
  validateUpload,
} from "@/lib/api/validate-upload"

/**
 * A NUL byte, the classic filename-terminator trick. Built from a char code so
 * the literal never appears in this source file.
 */
const NUL = String.fromCharCode(0)

/** Builds a Request carrying multipart form data. */
function uploadRequest(entries: Record<string, string | File>) {
  const form = new FormData()
  for (const [key, value] of Object.entries(entries)) form.append(key, value)
  return new Request("http://localhost/api/upload", { method: "POST", body: form })
}

/** A File of a given type and byte length. */
function file(name: string, type: string, bytes = 16) {
  return new File([new Uint8Array(bytes)], name, { type })
}

beforeEach(() => {
  jest.spyOn(console, "warn").mockImplementation(() => {})
})
afterEach(() => jest.restoreAllMocks())

describe("validateUpload", () => {
  it("accepts an allowed image", async () => {
    const result = await validateUpload(uploadRequest({ file: file("a.png", "image/png") }), {
      allowedTypes: IMAGE_MIME_TYPES,
    })

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.file.name).toBe("a.png")
  })

  it("returns the form data so siblings can be read without re-parsing", async () => {
    const result = await validateUpload(uploadRequest({ file: file("a.png", "image/png"), documentType: "national-id" }), {
      allowedTypes: IMAGE_MIME_TYPES,
    })

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.formData.get("documentType")).toBe("national-id")
  })

  it("rejects a missing file with 400", async () => {
    const result = await validateUpload(uploadRequest({}), { allowedTypes: IMAGE_MIME_TYPES })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(400)
      await expect(result.response.json()).resolves.toEqual({ error: 'No file provided under "file"' })
    }
  })

  it("rejects a text field posing as the file field", async () => {
    // formData.get() returns a string here; treating it as a File would blow up
    // later on .size / .arrayBuffer().
    const result = await validateUpload(uploadRequest({ file: "just-a-string" }), {
      allowedTypes: IMAGE_MIME_TYPES,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(400)
  })

  it("rejects an empty file", async () => {
    const result = await validateUpload(uploadRequest({ file: file("a.png", "image/png", 0) }), {
      allowedTypes: IMAGE_MIME_TYPES,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(400)
      await expect(result.response.json()).resolves.toEqual({ error: "File is empty" })
    }
  })

  it("rejects a file over the size cap with 413", async () => {
    const result = await validateUpload(uploadRequest({ file: file("big.png", "image/png", MAX_UPLOAD_BYTES + 1) }), {
      allowedTypes: IMAGE_MIME_TYPES,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(413)
      await expect(result.response.json()).resolves.toEqual({
        error: "File size must be less than 5MB",
      })
    }
  })

  it("accepts a file exactly at the cap", async () => {
    const result = await validateUpload(uploadRequest({ file: file("edge.png", "image/png", MAX_UPLOAD_BYTES) }), {
      allowedTypes: IMAGE_MIME_TYPES,
    })

    expect(result.ok).toBe(true)
  })

  it("honours a lower custom cap", async () => {
    const result = await validateUpload(uploadRequest({ file: file("a.png", "image/png", 2048) }), {
      allowedTypes: IMAGE_MIME_TYPES,
      maxBytes: 1024,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(413)
  })

  it.each([
    ["text/html", "an HTML file that would be served from a public bucket"],
    ["image/svg+xml", "an SVG, which can carry script"],
    ["application/x-msdownload", "an executable"],
    ["application/pdf", "a PDF where only images are allowed"],
  ])("rejects %s (%s) with 415", async (type) => {
    const result = await validateUpload(uploadRequest({ file: file("x", type) }), {
      allowedTypes: IMAGE_MIME_TYPES,
    })

    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.response.status).toBe(415)
  })

  it("accepts a PDF when documents are allowed", async () => {
    const result = await validateUpload(uploadRequest({ file: file("a.pdf", "application/pdf") }), {
      allowedTypes: DOCUMENT_MIME_TYPES,
    })

    expect(result.ok).toBe(true)
  })

  it("reads a custom field name", async () => {
    const result = await validateUpload(uploadRequest({ document: file("a.png", "image/png") }), {
      allowedTypes: IMAGE_MIME_TYPES,
      field: "document",
    })

    expect(result.ok).toBe(true)
  })

  it("rejects a body that is not multipart with 400", async () => {
    const request = new Request("http://localhost/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file: "nope" }),
    })

    const result = await validateUpload(request, { allowedTypes: IMAGE_MIME_TYPES })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(400)
      await expect(result.response.json()).resolves.toEqual({
        error: "Request body must be multipart form data",
      })
    }
  })

  it("never echoes the filename back in an error", async () => {
    const nasty = "<script>alert(1)</script>.html"
    const result = await validateUpload(uploadRequest({ file: file(nasty, "text/html") }), {
      allowedTypes: IMAGE_MIME_TYPES,
    })

    if (!result.ok) {
      expect(JSON.stringify(await result.response.json())).not.toContain("script")
    }
  })
})

describe("safeFileExtension", () => {
  it.each([
    ["photo.png", "png"],
    ["photo.PNG", "png"],
    ["archive.tar.gz", "gz"],
    ["doc.pdf", "pdf"],
  ])("extracts %s -> %s", (name, expected) => {
    expect(safeFileExtension(name)).toBe(expected)
  })

  it.each([["no-extension"], ["trailing."], [""], [undefined]])("falls back for %p", (name) => {
    expect(safeFileExtension(name as string | undefined)).toBe("bin")
  })

  it("uses the caller's fallback", () => {
    expect(safeFileExtension("no-extension", "png")).toBe("png")
  })

  it.each([["evil.a/b"], ["evil.this-extension-is-far-too-long"], ["evil.pn g"]])("rejects the suspicious extension in %p", (name) => {
    // Anything that is not a short alphanumeric run is discarded rather than
    // sanitised, so nothing unexpected reaches a bucket key.
    expect(safeFileExtension(name)).toBe("bin")
  })

  it("discards everything before the extension, so an embedded NUL cannot escape", () => {
    // "evil.php<NUL>.png" -> the extension is the clean "png"; the rest of the
    // name (including the NUL and the .php) is never used to build a key.
    expect(safeFileExtension(`evil.php${NUL}.png`)).toBe("png")
  })

  it("rejects a NUL inside the extension itself", () => {
    expect(safeFileExtension(`evil.pn${NUL}g`)).toBe("bin")
  })
})

describe("safePathSegment", () => {
  it("keeps a plain segment", () => {
    expect(safePathSegment("national-id")).toBe("national-id")
  })

  it.each([
    ["../../etc/passwd", "etc-passwd"],
    ["a/b/c", "a-b-c"],
    ["with spaces", "with-spaces"],
    ["../", "file"],
  ])("neutralises %p", (input, expected) => {
    expect(safePathSegment(input)).toBe(expected)
  })

  it("strips a NUL byte", () => {
    expect(safePathSegment(`id${NUL}.png`)).toBe("id-png")
  })

  it.each([[""], [undefined], ["///"]])("falls back for %p", (input) => {
    expect(safePathSegment(input as string | undefined)).toBe("file")
  })

  it("uses the caller's fallback", () => {
    expect(safePathSegment("", "document")).toBe("document")
  })

  it("caps the length so a long field cannot bloat the key", () => {
    expect(safePathSegment("a".repeat(200)).length).toBe(64)
  })

  it("never returns a value containing a path separator", () => {
    for (const input of ["../../x", "a/b", "\\windows\\path", "..%2f..%2f"]) {
      expect(safePathSegment(input)).not.toMatch(/[/\\]/)
    }
  })
})

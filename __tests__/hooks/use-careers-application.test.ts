/**
 * Tests for useCareersApplication (hooks/use-careers-application.ts).
 *
 * The submit flow validates three required documents and two required fields
 * before ever uploading anything, then uploads CV/certificates/letter in
 * parallel before submitting the application itself. What's worth pinning:
 * the validation order (each missing piece produces its own message), that a
 * failed upload or a rejected application surfaces through `formError`
 * rather than throwing, and that `isSubmitting` always clears afterward.
 */

import { act, renderHook } from "@testing-library/react"
import { useCareersApplication } from "@/hooks/use-careers-application"
import type { Job } from "@/lib/careers/jobs"

const API_BASE = "http://localhost:4000/api"
const ORIGINAL_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

const job: Job = { title: "Senior Software Engineer", type: "Full-time", mode: "Remote", location: "Dar es Salaam", desc: "", dept: "Eng" }

function pdfFile(name = "cv.pdf", size = 1024) {
  const file = new File(["x".repeat(size)], name, { type: "application/pdf" })
  return file
}

function mockUploadsAndSubmit(opts: { uploadsOk?: boolean; submitOk?: boolean; submitError?: string } = {}) {
  const { uploadsOk = true, submitOk = true, submitError } = opts
  const fetchMock = jest.fn(async (url: string) => {
    if (String(url).includes("/career-applications")) {
      if (!submitOk) {
        return { ok: false, json: async () => ({ error: submitError }) } as Response
      }
      return { ok: true, json: async () => ({ success: true }) } as Response
    }
    // one of the three upload endpoints
    if (!uploadsOk) return { ok: false, json: async () => ({}) } as Response
    return { ok: true, json: async () => ({ url: "https://cdn/file" }) } as Response
  })
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

function fillRequiredFields(hook: ReturnType<typeof useCareersApplication>) {
  act(() => hook.setCvFile(pdfFile("cv.pdf")))
  act(() => hook.setCertificatesFile(pdfFile("certs.pdf")))
  act(() => hook.setApplicationLetterFile(pdfFile("letter.pdf")))
  act(() => hook.setFormData({ full_name: "Asha Mwinyi", email: "asha@example.com", phone: "", cover_letter: "" }))
}

async function submit(result: { current: ReturnType<typeof useCareersApplication> }) {
  await act(async () => {
    await result.current.handleSubmit({ preventDefault: () => {} } as unknown as React.FormEvent)
  })
}

beforeEach(() => {
  process.env.NEXT_PUBLIC_API_BASE_URL = API_BASE
  jest.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

afterAll(() => {
  if (ORIGINAL_API_BASE === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL
  else process.env.NEXT_PUBLIC_API_BASE_URL = ORIGINAL_API_BASE
})

describe("useCareersApplication", () => {
  describe("handleApply", () => {
    it("opens the dialog for the chosen job and resets any previous state", () => {
      const { result } = renderHook(() => useCareersApplication())

      // Trigger a stale error and a stale CV before re-opening for a job.
      act(() => result.current.handleFileSelect(new File(["x"], "photo.png", { type: "image/png" }), result.current.setCvFile))
      expect(result.current.formError).not.toBe("")

      act(() => result.current.handleApply(job))

      expect(result.current.selectedJob).toEqual(job)
      expect(result.current.isDialogOpen).toBe(true)
      expect(result.current.isSuccess).toBe(false)
      expect(result.current.formError).toBe("")
      expect(result.current.cvFile).toBeNull()
    })
  })

  describe("handleFileSelect", () => {
    it("rejects a file over the size cap", () => {
      const { result } = renderHook(() => useCareersApplication())
      const tooBig = pdfFile("big.pdf", 11 * 1024 * 1024)

      act(() => result.current.handleFileSelect(tooBig, result.current.setCvFile))

      expect(result.current.cvFile).toBeNull()
      expect(result.current.formError).toMatch(/less than 10MB/i)
    })

    it("rejects an image for a documents-only field", () => {
      const { result } = renderHook(() => useCareersApplication())
      const image = new File(["x"], "photo.png", { type: "image/png" })

      act(() => result.current.handleFileSelect(image, result.current.setCvFile))

      expect(result.current.cvFile).toBeNull()
      expect(result.current.formError).toMatch(/PDF or Word document/i)
    })

    it("accepts an image when the field opts in", () => {
      const { result } = renderHook(() => useCareersApplication())
      const image = new File(["x"], "certificate.png", { type: "image/png" })

      act(() => result.current.handleFileSelect(image, result.current.setCertificatesFile, true))

      expect(result.current.certificatesFile).toBe(image)
      expect(result.current.formError).toBe("")
    })

    it("does nothing when no file was chosen", () => {
      const { result } = renderHook(() => useCareersApplication())

      act(() => result.current.handleFileSelect(undefined, result.current.setCvFile))

      expect(result.current.cvFile).toBeNull()
    })
  })

  describe("handleSubmit validation", () => {
    it("requires a CV before anything else", async () => {
      mockUploadsAndSubmit()
      const { result } = renderHook(() => useCareersApplication())
      act(() => result.current.handleApply(job))

      await submit(result)

      expect(result.current.formError).toMatch(/upload your CV/i)
      expect(global.fetch).not.toHaveBeenCalled()
    })

    it("requires certificates once the CV is present", async () => {
      mockUploadsAndSubmit()
      const { result } = renderHook(() => useCareersApplication())
      act(() => result.current.handleApply(job))
      act(() => result.current.setCvFile(pdfFile()))

      await submit(result)

      expect(result.current.formError).toMatch(/Academic Certificates/i)
    })

    it("requires the application letter once CV and certificates are present", async () => {
      mockUploadsAndSubmit()
      const { result } = renderHook(() => useCareersApplication())
      act(() => result.current.handleApply(job))
      act(() => result.current.setCvFile(pdfFile()))
      act(() => result.current.setCertificatesFile(pdfFile()))

      await submit(result)

      expect(result.current.formError).toMatch(/Letter of Application/i)
    })

    it("requires name and email once every document is present", async () => {
      mockUploadsAndSubmit()
      const { result } = renderHook(() => useCareersApplication())
      act(() => result.current.handleApply(job))
      act(() => result.current.setCvFile(pdfFile()))
      act(() => result.current.setCertificatesFile(pdfFile()))
      act(() => result.current.setApplicationLetterFile(pdfFile()))

      await submit(result)

      expect(result.current.formError).toMatch(/fill in all required fields/i)
      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe("handleSubmit success and failure", () => {
    it("succeeds once every document and field is present", async () => {
      mockUploadsAndSubmit()
      const { result } = renderHook(() => useCareersApplication())
      act(() => result.current.handleApply(job))
      fillRequiredFields(result.current)

      await submit(result)

      expect(result.current.isSuccess).toBe(true)
      expect(result.current.formError).toBe("")
      expect(result.current.isSubmitting).toBe(false)
    })

    it("surfaces an upload failure through formError, without throwing", async () => {
      mockUploadsAndSubmit({ uploadsOk: false })
      const { result } = renderHook(() => useCareersApplication())
      act(() => result.current.handleApply(job))
      fillRequiredFields(result.current)

      await submit(result)

      expect(result.current.isSuccess).toBe(false)
      expect(result.current.formError).toMatch(/failed to upload/i)
      expect(result.current.isSubmitting).toBe(false)
    })

    it("surfaces the backend's error message when the application is rejected", async () => {
      mockUploadsAndSubmit({ submitOk: false, submitError: "Position no longer open" })
      const { result } = renderHook(() => useCareersApplication())
      act(() => result.current.handleApply(job))
      fillRequiredFields(result.current)

      await submit(result)

      expect(result.current.formError).toBe("Position no longer open")
      expect(result.current.isSubmitting).toBe(false)
    })
  })

  describe("scrollToJobs", () => {
    it("scrolls the job listings section into view", () => {
      const { result } = renderHook(() => useCareersApplication())
      const el = document.createElement("div")
      el.id = "job-listings"
      el.scrollIntoView = jest.fn()
      document.body.appendChild(el)

      act(() => result.current.scrollToJobs())

      expect(el.scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" })
      document.body.removeChild(el)
    })
  })
})

/**
 * Tests for useIncompleteRegistrations (hooks/use-incomplete-registrations.ts).
 *
 * Extracted from components/admin/incomplete-registrations-tab.tsx, which
 * called the backend directly with a raw `fetch(..., { credentials: "include" })`
 * instead of the shared `lib/api-client.ts` helpers every other admin tab's
 * mutations use. `updateStatus` now goes through `clientApiPut` -- same PUT
 * verb, same path and body the original raw fetch used, just over the
 * bearer-token transport instead of a session cookie.
 *
 * What's worth pinning: filtering combines search/status/type correctly, the
 * per-status counts are independent of the active filter, and a failed
 * update surfaces through the error toast rather than throwing -- while a
 * successful one clears the contact-modal state and refreshes the page.
 */

import { act, renderHook } from "@testing-library/react"
import { useIncompleteRegistrations } from "@/hooks/use-incomplete-registrations"
import type { IncompleteRegistration } from "@/lib/types/admin"

const toast = jest.fn()
const refresh = jest.fn()
const clientApiPut = jest.fn()

jest.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: (...args: unknown[]) => toast(...args) }) }))
jest.mock("@/lib/api-client", () => ({ clientApiPut: (...args: unknown[]) => clientApiPut(...args) }))

const mockRouter = { push: jest.fn(), replace: jest.fn(), refresh, back: jest.fn(), forward: jest.fn(), prefetch: jest.fn() }
jest.mock("next/navigation", () => ({ useRouter: () => mockRouter }))

function registration(overrides: Partial<IncompleteRegistration> = {}): IncompleteRegistration {
  return {
    id: "r-1",
    full_name: "Asha Mwinyi",
    email: "asha@example.com",
    phone: "+255700000000",
    user_type: "vendor",
    recovery_status: "pending",
    last_activity_at: "2026-02-01T10:00:00.000Z",
    expires_at: "2026-03-01T10:00:00.000Z",
    created_at: "2026-01-20T10:00:00.000Z",
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("useIncompleteRegistrations", () => {
  describe("filtered", () => {
    it("narrows by status, type, and search together", () => {
      const registrations = [
        registration({ id: "r-1", full_name: "Asha Mwinyi", recovery_status: "pending", user_type: "vendor" }),
        registration({ id: "r-2", full_name: "Baraka John", recovery_status: "contacted", user_type: "customer" }),
      ]
      const { result } = renderHook(() => useIncompleteRegistrations(registrations))

      act(() => result.current.setStatusFilter("pending"))
      expect(result.current.filtered.map((r) => r.id)).toEqual(["r-1"])

      act(() => result.current.setStatusFilter("all"))
      act(() => result.current.setSearchQuery("baraka"))
      expect(result.current.filtered.map((r) => r.id)).toEqual(["r-2"])
    })
  })

  describe("counts", () => {
    it("count each recovery status independently of the active filter", () => {
      const registrations = [
        registration({ id: "r-1", recovery_status: "pending" }),
        registration({ id: "r-2", recovery_status: "pending" }),
        registration({ id: "r-3", recovery_status: "contacted" }),
      ]
      const { result } = renderHook(() => useIncompleteRegistrations(registrations))

      act(() => result.current.setStatusFilter("contacted"))

      expect(result.current.pending).toBe(2)
      expect(result.current.contacted).toBe(1)
      expect(result.current.completed).toBe(0)
      expect(result.current.notInterested).toBe(0)
    })
  })

  describe("updateStatus", () => {
    it("PUTs the same status endpoint the original raw fetch used", async () => {
      clientApiPut.mockResolvedValue({ success: true })
      const { result } = renderHook(() => useIncompleteRegistrations([registration()]))

      await act(async () => {
        await result.current.updateStatus("r-1", "contacted", "Called, will follow up")
      })

      expect(clientApiPut).toHaveBeenCalledWith("admin/incomplete-registrations/r-1/status", {
        status: "contacted",
        notes: "Called, will follow up",
      })
    })

    it("shows a success toast and refreshes on success", async () => {
      clientApiPut.mockResolvedValue({ success: true })
      const { result } = renderHook(() => useIncompleteRegistrations([registration()]))

      await act(async () => {
        await result.current.updateStatus("r-1", "contacted")
      })

      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Status updated" }))
      expect(refresh).toHaveBeenCalled()
    })

    it("clears processing and the contact modal on success", async () => {
      clientApiPut.mockResolvedValue({ success: true })
      const { result } = renderHook(() => useIncompleteRegistrations([registration()]))
      act(() => result.current.setContactModal({ id: "r-1", name: "Asha" }))
      act(() => result.current.setContactNotes("draft note"))

      await act(async () => {
        await result.current.updateStatus("r-1", "contacted", "draft note")
      })

      expect(result.current.processing).toBeNull()
      expect(result.current.contactModal).toBeNull()
      expect(result.current.contactNotes).toBe("")
    })

    it("shows an error toast and still clears processing when the request fails, without throwing", async () => {
      clientApiPut.mockRejectedValue(new Error("network down"))
      const { result } = renderHook(() => useIncompleteRegistrations([registration()]))

      await act(async () => {
        await result.current.updateStatus("r-1", "contacted")
      })

      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Error", variant: "destructive" }))
      expect(refresh).not.toHaveBeenCalled()
      expect(result.current.processing).toBeNull()
    })

    it("sets processing to the record id while the request is in flight", async () => {
      let resolve!: () => void
      clientApiPut.mockReturnValue(new Promise((r) => (resolve = () => r({ success: true }))))
      const { result } = renderHook(() => useIncompleteRegistrations([registration()]))

      let submitted!: Promise<void>
      act(() => {
        submitted = result.current.updateStatus("r-1", "contacted")
      })
      expect(result.current.processing).toBe("r-1")

      await act(async () => {
        resolve()
        await submitted
      })
      expect(result.current.processing).toBeNull()
    })
  })
})

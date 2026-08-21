/**
 * Tests for useReferralCode (hooks/use-referral-code.ts).
 *
 * A referral code reaches sign-up two ways — a `?ref=` share link or typed by
 * hand — and both run the same lookup. The important behaviour is that a failed
 * lookup never blocks sign-up: the code is still submitted and the backend
 * re-checks it.
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import { setErrorReporter, type LogRecord } from "@/lib/logger"
import { useReferralCode } from "@/hooks/use-referral-code"

const API_BASE = "http://localhost:4000/api"
const ORIGINAL_API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL

let reported: LogRecord[]

function mockLookup(result: { body?: unknown } | "reject") {
  const fetchMock = jest.fn(async () => {
    if (result === "reject") throw new Error("network down")
    return { ok: true, status: 200, json: async () => result.body ?? {} } as Response
  })
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

beforeEach(() => {
  // The hook bails out entirely when this is unset, so it has to be present
  // for any lookup to happen.
  process.env.NEXT_PUBLIC_API_BASE_URL = API_BASE
  jest.clearAllMocks()
  reported = []
  setErrorReporter((r) => reported.push(r))
  jest.spyOn(console, "error").mockImplementation(() => {})
  mockLookup({ body: { valid: true, agent_name: "Asha Mwinyi" } })
})

afterEach(() => {
  setErrorReporter(null)
  jest.restoreAllMocks()
})

afterAll(() => {
  if (ORIGINAL_API_BASE === undefined) delete process.env.NEXT_PUBLIC_API_BASE_URL
  else process.env.NEXT_PUBLIC_API_BASE_URL = ORIGINAL_API_BASE
})

describe("useReferralCode", () => {
  describe("without a code in the link", () => {
    it("starts empty with the field hidden", () => {
      const { result } = renderHook(() => useReferralCode(null))

      expect(result.current.referralCode).toBe("")
      expect(result.current.showReferralField).toBe(false)
      expect(result.current.referredByAgent).toBeNull()
    })

    it("does not look anything up on mount", () => {
      renderHook(() => useReferralCode(null))

      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe("with a code in the link", () => {
    it("prefills the field, reveals it, and validates immediately", async () => {
      const fetchMock = mockLookup({ body: { valid: true, agent_name: "Asha Mwinyi" } })
      const { result } = renderHook(() => useReferralCode("TOLA-AG-0001"))

      expect(result.current.referralCode).toBe("TOLA-AG-0001")
      expect(result.current.showReferralField).toBe(true)

      await waitFor(() => expect(result.current.referredByAgent).toBe("Asha Mwinyi"))
      expect(fetchMock).toHaveBeenCalledWith(`${API_BASE}/agents/referral-info?code=TOLA-AG-0001`)
    })

    it("URL-encodes the code", async () => {
      const fetchMock = mockLookup({ body: { valid: true, agent_name: "A" } })
      renderHook(() => useReferralCode("TOLA AG/01"))

      await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(`${API_BASE}/agents/referral-info?code=TOLA%20AG%2F01`))
    })
  })

  describe("validateReferralCode", () => {
    it("records the agent for a valid code", async () => {
      const { result } = renderHook(() => useReferralCode(null))

      await act(async () => {
        await result.current.validateReferralCode("TOLA-AG-0002")
      })

      expect(result.current.referredByAgent).toBe("Asha Mwinyi")
      expect(result.current.referralError).toBeNull()
    })

    it("reports an invalid code without naming an agent", async () => {
      mockLookup({ body: { valid: false } })
      const { result } = renderHook(() => useReferralCode(null))

      await act(async () => {
        await result.current.validateReferralCode("NOPE")
      })

      expect(result.current.referredByAgent).toBeNull()
      expect(result.current.referralError).toMatch(/invalid referral code/i)
    })

    it("treats a valid flag with no agent name as invalid", async () => {
      mockLookup({ body: { valid: true } })
      const { result } = renderHook(() => useReferralCode(null))

      await act(async () => {
        await result.current.validateReferralCode("WEIRD")
      })

      expect(result.current.referralError).toMatch(/invalid referral code/i)
    })

    it("clears state for an empty code without calling the API", async () => {
      const { result } = renderHook(() => useReferralCode(null))

      await act(async () => {
        await result.current.validateReferralCode("   ")
      })

      expect(global.fetch).not.toHaveBeenCalled()
      expect(result.current.referredByAgent).toBeNull()
      expect(result.current.referralError).toBeNull()
    })

    it("does nothing when NEXT_PUBLIC_API_BASE_URL is unset", async () => {
      delete process.env.NEXT_PUBLIC_API_BASE_URL
      const { result } = renderHook(() => useReferralCode(null))

      await act(async () => {
        await result.current.validateReferralCode("TOLA-AG-0007")
      })

      expect(global.fetch).not.toHaveBeenCalled()
      expect(result.current.referralValidating).toBe(false)
    })

    it("logs a network failure but sets NO error, so sign-up is not blocked", async () => {
      mockLookup("reject")
      const { result } = renderHook(() => useReferralCode(null))

      await act(async () => {
        await result.current.validateReferralCode("TOLA-AG-0003")
      })

      expect(reported.map((r) => r.message)).toContain("error validating referral code")
      expect(result.current.referredByAgent).toBeNull()
      // Deliberately null: the code still goes with the registration.
      expect(result.current.referralError).toBeNull()
    })

    it("clears the validating flag on both paths", async () => {
      const { result } = renderHook(() => useReferralCode(null))

      await act(async () => {
        await result.current.validateReferralCode("TOLA-AG-0004")
      })
      expect(result.current.referralValidating).toBe(false)

      mockLookup("reject")
      await act(async () => {
        await result.current.validateReferralCode("TOLA-AG-0005")
      })
      expect(result.current.referralValidating).toBe(false)
    })
  })

  describe("clearReferralValidation", () => {
    it("drops a previous verdict so it cannot describe an edited code", async () => {
      const { result } = renderHook(() => useReferralCode(null))
      await act(async () => {
        await result.current.validateReferralCode("TOLA-AG-0006")
      })
      expect(result.current.referredByAgent).toBe("Asha Mwinyi")

      act(() => result.current.clearReferralValidation())

      expect(result.current.referredByAgent).toBeNull()
      expect(result.current.referralError).toBeNull()
    })
  })

  describe("effectiveReferralCode", () => {
    it("prefers a typed code over the one from the link", () => {
      const { result } = renderHook(() => useReferralCode("FROM-LINK"))

      act(() => result.current.setReferralCode("TYPED"))

      expect(result.current.effectiveReferralCode).toBe("TYPED")
    })

    it("falls back to the link code when nothing is typed", () => {
      const { result } = renderHook(() => useReferralCode("FROM-LINK"))

      expect(result.current.effectiveReferralCode).toBe("FROM-LINK")
    })

    it("trims and is empty when there is neither", () => {
      const { result } = renderHook(() => useReferralCode(null))

      act(() => result.current.setReferralCode("   "))

      expect(result.current.effectiveReferralCode).toBe("")
    })
  })
})

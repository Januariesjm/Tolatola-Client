/**
 * Tests for useValidationSurveys (hooks/use-validation-surveys.ts).
 *
 * Extracted from components/admin/validation-surveys-tab.tsx. What's worth
 * pinning: a filter change (type/region/either date) refetches immediately,
 * search/agent text is debounced 450ms rather than firing per keystroke, the
 * query string only carries the filters actually set, and a failed fetch
 * leaves `surveys`/`stats` alone instead of throwing.
 */

import { act, renderHook } from "@testing-library/react"
import { useValidationSurveys } from "@/hooks/use-validation-surveys"
import { defaultStats, type ValidationSurvey } from "@/lib/admin/validation-surveys-types"

function mockFetch(result: { ok: boolean; data?: unknown[]; stats?: unknown } | "reject") {
  const fetchMock = jest.fn(async () => {
    if (result === "reject") throw new Error("network down")
    if (!result.ok) return { ok: false } as Response
    return { ok: true, json: async () => ({ data: result.data ?? [], stats: result.stats }) } as Response
  })
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

const survey = (overrides: Partial<ValidationSurvey> = {}) => ({ id: "s-1", full_name: "Asha Mwinyi", ...overrides }) as ValidationSurvey

beforeEach(() => {
  jest.useFakeTimers()
  jest.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  jest.useRealTimers()
  jest.restoreAllMocks()
})

describe("useValidationSurveys", () => {
  it("fetches once on mount with no filters in the query string", async () => {
    const fetchMock = mockFetch({ ok: true, data: [] })
    renderHook(() => useValidationSurveys([], defaultStats))

    await act(async () => {
      await Promise.resolve()
    })

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/validation-surveys?")
  })

  it("refetches immediately when a filter changes", async () => {
    const fetchMock = mockFetch({ ok: true, data: [] })
    const { result } = renderHook(() => useValidationSurveys([], defaultStats))
    await act(async () => {
      await Promise.resolve()
    })
    fetchMock.mockClear()

    act(() => result.current.setRegionFilter("Dar es Salaam"))
    await act(async () => {
      await Promise.resolve()
    })

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/validation-surveys?region=Dar+es+Salaam")
  })

  it("debounces a search query instead of fetching per keystroke", async () => {
    const fetchMock = mockFetch({ ok: true, data: [] })
    const { result } = renderHook(() => useValidationSurveys([], defaultStats))
    await act(async () => {
      await Promise.resolve()
    })
    fetchMock.mockClear()

    act(() => result.current.setSearch("A"))
    act(() => result.current.setSearch("As"))
    act(() => result.current.setSearch("Asha"))

    expect(fetchMock).not.toHaveBeenCalled()

    await act(async () => {
      jest.advanceTimersByTime(450)
      await Promise.resolve()
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith("/api/admin/validation-surveys?search=Asha")
  })

  it("updates surveys and stats from a successful response", async () => {
    const stats = { ...defaultStats, totalResponses: 5 }
    mockFetch({ ok: true, data: [survey()], stats })
    const { result } = renderHook(() => useValidationSurveys([], defaultStats))

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.surveys).toEqual([survey()])
    expect(result.current.stats).toEqual(stats)
    expect(result.current.loading).toBe(false)
  })

  it("leaves surveys and stats unchanged when the response is not ok", async () => {
    mockFetch({ ok: false })
    const seeded = [survey({ id: "seed" })]
    const { result } = renderHook(() => useValidationSurveys(seeded, defaultStats))

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.surveys).toEqual(seeded)
    expect(result.current.loading).toBe(false)
  })

  it("survives a rejected fetch without throwing", async () => {
    mockFetch("reject")
    const { result } = renderHook(() => useValidationSurveys([], defaultStats))

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.loading).toBe(false)
  })

  describe("resetFilters", () => {
    it("clears every filter back to its default", () => {
      mockFetch({ ok: true, data: [] })
      const { result } = renderHook(() => useValidationSurveys([], defaultStats))

      act(() => result.current.setSearch("Asha"))
      act(() => result.current.setTypeFilter("vendor"))
      act(() => result.current.setRegionFilter("Dodoma"))
      act(() => result.current.setAgentFilter("AGT-1"))
      act(() => result.current.setSurveyFrom("2026-01-01"))
      act(() => result.current.setSurveyTo("2026-01-31"))
      act(() => result.current.setUploadFrom("2026-01-01"))
      act(() => result.current.setUploadTo("2026-01-31"))

      act(() => result.current.resetFilters())

      expect(result.current.search).toBe("")
      expect(result.current.typeFilter).toBe("all")
      expect(result.current.regionFilter).toBe("all")
      expect(result.current.agentFilter).toBe("")
      expect(result.current.surveyFrom).toBe("")
      expect(result.current.surveyTo).toBe("")
      expect(result.current.uploadFrom).toBe("")
      expect(result.current.uploadTo).toBe("")
    })
  })
})

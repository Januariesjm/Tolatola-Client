/**
 * Tests for AgentPerformanceTab (components/agent/agent-performance-tab.tsx).
 *
 * Covers the period selector (week/month/year) driving the analytics fetch,
 * the loading state while that request is in flight, the metrics rendered
 * from the response, the error-toast path, and the safe zeroed defaults used
 * before any analytics have loaded. The recharts panels themselves render an
 * empty SVG in jsdom (no layout, so ResponsiveContainer measures 0x0) so this
 * only asserts on their surrounding titles, not chart internals.
 */

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AgentPerformanceTab } from "@/components/agent/agent-performance-tab"

const mockToast = jest.fn()
jest.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast: mockToast }) }))

const mockGetSession = jest.fn()
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { getSession: mockGetSession } }),
}))

const analyticsResponse = {
  totalRegistrations: 42,
  conversionRate: 87,
  categoryBreakdown: { vendor: 10, customer: 20, transporter: 12 },
  statusBreakdown: { active: 30, pending: 8, inactive: 2, rejected: 2 },
  dailyTrend: [{ date: "2026-08-01", count: 3 }],
}

function mockFetch(opts: { ok?: boolean; body?: unknown } = {}) {
  const fetchMock = jest.fn(async () => ({
    ok: opts.ok ?? true,
    json: async () => opts.body ?? analyticsResponse,
  })) as unknown as typeof fetch
  global.fetch = fetchMock
  return fetchMock
}

const agent = { agent_code: "AG-1" }
const trend = [{ date: "2026-01-01", count: 1 }]

beforeEach(() => {
  jest.clearAllMocks()
  mockGetSession.mockResolvedValue({ data: { session: { access_token: "tok" } } })
  mockFetch()
})

describe("AgentPerformanceTab", () => {
  it("fetches performance for the default 'month' period, with the session token", async () => {
    const fetchMock = mockFetch()
    render(<AgentPerformanceTab agent={agent} trend={trend} />)

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/agents/performance?period=month"),
        expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer tok" }) }),
      ),
    )
  })

  it("shows a loading spinner while the analytics request is in flight", async () => {
    let resolveFetch!: (value: unknown) => void
    const fetchMock = jest.fn(() => new Promise((resolve) => (resolveFetch = resolve)))
    global.fetch = fetchMock as unknown as typeof fetch

    render(<AgentPerformanceTab agent={agent} trend={trend} />)

    expect(screen.getByText("Processing analytics data...")).toBeInTheDocument()
    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    resolveFetch({ ok: true, json: async () => analyticsResponse })
    await waitFor(() => expect(screen.queryByText("Processing analytics data...")).not.toBeInTheDocument())
  })

  it("renders the metrics returned by the analytics endpoint", async () => {
    render(<AgentPerformanceTab agent={agent} trend={trend} />)

    await waitFor(() => expect(screen.getByText("42")).toBeInTheDocument())
    expect(screen.getByText("87%")).toBeInTheDocument()
    expect(screen.getByText("30")).toBeInTheDocument() // active/verified
    expect(screen.getByText("8")).toBeInTheDocument() // pending
    expect(screen.getByText("2")).toBeInTheDocument() // rejected
    expect(screen.getByText("Daily Registration Trend")).toBeInTheDocument()
    expect(screen.getByText("Registrations by Category")).toBeInTheDocument()
  })

  it("refetches with the selected period when a period button is clicked", async () => {
    const fetchMock = mockFetch()
    render(<AgentPerformanceTab agent={agent} trend={trend} />)
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("period=month"), expect.anything()))

    await userEvent.click(screen.getByRole("button", { name: "Week" }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("period=week"), expect.anything()))

    await userEvent.click(screen.getByRole("button", { name: "Year" }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("period=year"), expect.anything()))
  })

  it("highlights the active period button", async () => {
    render(<AgentPerformanceTab agent={agent} trend={trend} />)
    await waitFor(() => expect(screen.getByText("42")).toBeInTheDocument())

    expect(screen.getByRole("button", { name: "Month" })).toHaveClass("bg-white")
    expect(screen.getByRole("button", { name: "Week" })).not.toHaveClass("bg-white")

    await userEvent.click(screen.getByRole("button", { name: "Week" }))
    await waitFor(() => expect(screen.getByRole("button", { name: "Week" })).toHaveClass("bg-white"))
    expect(screen.getByRole("button", { name: "Month" })).not.toHaveClass("bg-white")
  })

  it("shows a destructive toast and falls back to zeroed metrics when the request fails", async () => {
    mockFetch({ ok: false })
    render(<AgentPerformanceTab agent={agent} trend={trend} />)

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Error", description: "Failed to load performance report.", variant: "destructive" }),
      ),
    )
    await waitFor(() => expect(screen.queryByText("Processing analytics data...")).not.toBeInTheDocument())

    // analytics stays null on failure, so the defaults render: 0 registrations, 0% conversion.
    expect(screen.getByText("0%")).toBeInTheDocument()
  })

  it("logs and toasts when the session lookup itself throws", async () => {
    mockGetSession.mockRejectedValue(new Error("supabase down"))
    render(<AgentPerformanceTab agent={agent} trend={trend} />)

    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Error" })))
  })
})

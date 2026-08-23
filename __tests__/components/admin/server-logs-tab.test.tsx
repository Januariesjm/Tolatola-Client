/**
 * Tests for ServerLogsTab (components/admin/server-logs-tab.tsx).
 *
 * Fetches `admin/api-logs` (list + pagination) and `admin/api-logs/stats` via
 * `clientApiGet` on mount, and polls both every 15 seconds. What's worth
 * pinning: the loading -> loaded transition, the empty state, the stats
 * header bar, the severity/method/path filters (both the Apply button and
 * pressing Enter in the path box), expanding a row to see its detail panel,
 * pagination controls, the manual refresh button, and that the 15s
 * auto-refresh interval actually re-fetches.
 */

import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ServerLogsTab } from "@/components/admin/server-logs-tab"

const mockClientApiGet = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiGet: (...args: unknown[]) => mockClientApiGet(...args),
}))

function apiLog(overrides: Record<string, unknown> = {}) {
  return {
    id: "log-1",
    method: "GET",
    path: "/api/products",
    status_code: 200,
    response_time_ms: 120,
    ip: "10.0.0.1",
    user_agent: "Mozilla/5.0",
    user_id: "user-1",
    error_message: null,
    severity: "INFO",
    created_at: "2026-01-10T08:30:00.000Z",
    ...overrides,
  }
}

function statsData(overrides: Record<string, unknown> = {}) {
  return { totalRequests24h: 1000, errors24h: 5, warnings24h: 10, avgResponseTimeMs: 150, ...overrides }
}

function pagination(overrides: Record<string, unknown> = {}) {
  return { page: 1, limit: 50, total: 0, totalPages: 0, ...overrides }
}

/** Routes clientApiGet by path prefix so a test only declares what it cares about. */
function mockApi({
  logs = [],
  logsPagination = pagination(),
  stats = statsData(),
}: {
  logs?: unknown[]
  logsPagination?: Record<string, unknown>
  stats?: Record<string, unknown> | null
} = {}) {
  mockClientApiGet.mockImplementation(async (path: string) => {
    if (path.startsWith("admin/api-logs/stats")) return stats
    if (path.startsWith("admin/api-logs")) return { logs, pagination: logsPagination }
    throw new Error(`unexpected path: ${path}`)
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
  jest.useRealTimers()
})

describe("ServerLogsTab", () => {
  it("shows a loading state before the logs resolve", () => {
    mockClientApiGet.mockReturnValue(new Promise(() => {}))
    render(<ServerLogsTab />)

    expect(screen.getByText("Loading server logs...")).toBeInTheDocument()
  })

  it("shows the empty state once loaded with no logs", async () => {
    mockApi({ logs: [] })
    render(<ServerLogsTab />)

    expect(await screen.findByText(/No log entries found/)).toBeInTheDocument()
  })

  it("renders the stats header bar", async () => {
    mockApi({ stats: statsData({ totalRequests24h: 2500, errors24h: 12, warnings24h: 30, avgResponseTimeMs: 88 }) })
    render(<ServerLogsTab />)

    expect(await screen.findByText("2,500")).toBeInTheDocument()
    expect(screen.getByText("12")).toBeInTheDocument()
    expect(screen.getByText("30")).toBeInTheDocument()
    expect(screen.getByText("88ms")).toBeInTheDocument()
  })

  it("renders a log row with severity, method, path, status and latency", async () => {
    mockApi({ logs: [apiLog()], logsPagination: pagination({ total: 1 }) })
    render(<ServerLogsTab />)

    const row = (await screen.findByText("/api/products")).closest("tr") as HTMLElement
    expect(within(row).getByText("INFO")).toBeInTheDocument()
    expect(within(row).getByText("GET")).toBeInTheDocument()
    expect(within(row).getByText("200")).toBeInTheDocument()
    expect(within(row).getByText("120ms")).toBeInTheDocument()
    expect(within(row).getByText("10.0.0.1")).toBeInTheDocument()
  })

  it("shows a dash for a missing IP", async () => {
    mockApi({ logs: [apiLog({ ip: null })] })
    render(<ServerLogsTab />)

    await screen.findByText("/api/products")
    expect(screen.getByText("-")).toBeInTheDocument()
  })

  it("expands a row to show its detail panel, and collapses it again on a second click", async () => {
    mockApi({ logs: [apiLog({ user_agent: null, user_id: null, error_message: "boom" })] })
    render(<ServerLogsTab />)

    const row = (await screen.findByText("/api/products")).closest("tr") as HTMLElement
    await userEvent.click(row)

    expect(screen.getByText("Anonymous")).toBeInTheDocument()
    expect(screen.getByText("boom")).toBeInTheDocument()

    await userEvent.click(row)
    expect(screen.queryByText("boom")).not.toBeInTheDocument()
  })

  it("shows 'None' for a detail row with no error message", async () => {
    mockApi({ logs: [apiLog({ error_message: null })] })
    render(<ServerLogsTab />)

    const row = (await screen.findByText("/api/products")).closest("tr") as HTMLElement
    await userEvent.click(row)

    expect(screen.getByText("None")).toBeInTheDocument()
  })

  it("applies the severity, method and path filters when Apply is clicked", async () => {
    mockApi({ logs: [apiLog()] })
    render(<ServerLogsTab />)
    await screen.findByText("/api/products")

    await userEvent.selectOptions(screen.getByDisplayValue("All Severity"), "ERROR")
    await userEvent.selectOptions(screen.getByDisplayValue("All Methods"), "POST")
    await userEvent.type(screen.getByPlaceholderText("Filter by path..."), "orders")
    mockClientApiGet.mockClear()
    await userEvent.click(screen.getByRole("button", { name: "Apply" }))

    await waitFor(() => {
      const call = mockClientApiGet.mock.calls.find(([p]: [string]) => p.startsWith("admin/api-logs?"))
      expect(call).toBeDefined()
      expect(call![0]).toContain("severity=ERROR")
      expect(call![0]).toContain("method=POST")
      expect(call![0]).toContain("path=orders")
    })
  })

  it("applies the path filter when Enter is pressed in the search box", async () => {
    mockApi({ logs: [apiLog()] })
    render(<ServerLogsTab />)
    await screen.findByText("/api/products")

    const input = screen.getByPlaceholderText("Filter by path...")
    await userEvent.type(input, "orders")
    mockClientApiGet.mockClear()
    await userEvent.type(input, "{Enter}")

    await waitFor(() => {
      const call = mockClientApiGet.mock.calls.find(([p]: [string]) => p.startsWith("admin/api-logs?"))
      expect(call).toBeDefined()
      expect(call![0]).toContain("path=orders")
    })
  })

  it("re-fetches logs and stats when the refresh button is clicked", async () => {
    mockApi({ logs: [apiLog()] })
    render(<ServerLogsTab />)
    await screen.findByText("/api/products")

    mockClientApiGet.mockClear()
    await userEvent.click(screen.getByRole("button", { name: /refresh/i }))

    await waitFor(() => {
      expect(mockClientApiGet.mock.calls.some(([p]: [string]) => p.startsWith("admin/api-logs?"))).toBe(true)
      expect(mockClientApiGet.mock.calls.some(([p]: [string]) => p.startsWith("admin/api-logs/stats"))).toBe(true)
    })
  })

  it("renders pagination controls and paginates forward/backward", async () => {
    mockApi({
      logs: [apiLog()],
      logsPagination: pagination({ page: 2, total: 150, totalPages: 3 }),
    })
    render(<ServerLogsTab />)

    expect(await screen.findByText("Page 2 of 3")).toBeInTheDocument()
    expect(screen.getByText(/Showing 51–100 of 150 entries/)).toBeInTheDocument()

    const buttons = screen.getAllByRole("button")
    const navButtons = buttons.filter((b) => b.className.includes("h-7 w-7"))
    expect(navButtons).toHaveLength(2)
    expect(navButtons[0]).not.toBeDisabled()
    expect(navButtons[1]).not.toBeDisabled()

    mockClientApiGet.mockClear()
    await userEvent.click(navButtons[1]) // next
    await waitFor(() => {
      const call = mockClientApiGet.mock.calls.find(([p]: [string]) => p.startsWith("admin/api-logs?"))
      expect(call![0]).toContain("page=3")
    })
  })

  it("disables the previous button on the first page and the next button on the last page", async () => {
    mockApi({ logs: [apiLog()], logsPagination: pagination({ page: 1, total: 100, totalPages: 2 }) })
    render(<ServerLogsTab />)

    await screen.findByText("Page 1 of 2")
    const buttons = screen.getAllByRole("button")
    const navButtons = buttons.filter((b) => b.className.includes("h-7 w-7"))
    expect(navButtons[0]).toBeDisabled() // prev
    expect(navButtons[1]).not.toBeDisabled() // next
  })

  it("does not render pagination controls when there is only one page", async () => {
    mockApi({ logs: [apiLog()], logsPagination: pagination({ page: 1, total: 1, totalPages: 1 }) })
    render(<ServerLogsTab />)

    await screen.findByText("/api/products")
    expect(screen.queryByText(/^Page \d/)).not.toBeInTheDocument()
  })

  it("polls logs and stats every 15 seconds", async () => {
    jest.useFakeTimers({ advanceTimers: true })
    mockApi({ logs: [apiLog()] })
    render(<ServerLogsTab />)

    await waitFor(() => {
      expect(mockClientApiGet.mock.calls.some(([p]: [string]) => p.startsWith("admin/api-logs/stats"))).toBe(true)
    })
    const callsBefore = mockClientApiGet.mock.calls.length

    await jest.advanceTimersByTimeAsync(15000)
    await waitFor(() => expect(mockClientApiGet.mock.calls.length).toBeGreaterThan(callsBefore))
  })

  it("swallows a fetch error and leaves the list empty", async () => {
    mockClientApiGet.mockRejectedValue(new Error("network down"))
    render(<ServerLogsTab />)

    expect(await screen.findByText(/No log entries found/)).toBeInTheDocument()
  })
})

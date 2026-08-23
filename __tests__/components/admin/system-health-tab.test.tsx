/**
 * Tests for SystemHealthTab (components/admin/system-health-tab.tsx).
 *
 * Fetches `admin/system-health` on mount via `clientApiGet` and polls it every
 * 10 seconds. What's worth pinning: the loading -> loaded transition, the
 * "unable to reach server" state (and its retry button) when the fetch fails,
 * the status indicator per connection state, the derived memory/CPU figures,
 * the manual refresh button, and that the 10s auto-refresh interval actually
 * re-fetches.
 */

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SystemHealthTab } from "@/components/admin/system-health-tab"

const mockClientApiGet = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiGet: (...args: unknown[]) => mockClientApiGet(...args),
}))

function healthData(overrides: Record<string, unknown> = {}) {
  return {
    status: "healthy",
    timestamp: "2026-01-10T08:30:00.000Z",
    uptime: 90061, // 1d 1h 1m 1s
    version: "v20.11.0",
    platform: "linux",
    arch: "x64",
    pid: 4242,
    memory: {
      rss: 100 * 1024 * 1024,
      heapTotal: 80 * 1024 * 1024,
      heapUsed: 40 * 1024 * 1024,
      external: 5 * 1024 * 1024,
      rssMB: 100,
      heapUsedMB: 40,
      heapTotalMB: 80,
    },
    cpu: { user: 2_000_000, system: 1_000_000 },
    database: {
      status: "connected",
      latencyMs: 42,
      tables: { users: 10, orders: 20, products: 30 },
    },
    environment: "production",
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
  jest.useRealTimers()
})

describe("SystemHealthTab", () => {
  it("shows a loading state before the health data resolves", () => {
    mockClientApiGet.mockReturnValue(new Promise(() => {}))
    render(<SystemHealthTab />)

    expect(screen.getByText("Connecting to server...")).toBeInTheDocument()
  })

  it("shows the unreachable state when the fetch fails, with a retry button", async () => {
    mockClientApiGet.mockRejectedValue(new Error("network down"))
    render(<SystemHealthTab />)

    expect(await screen.findByText("Unable to reach server")).toBeInTheDocument()
    expect(screen.getByText("The health endpoint did not respond.")).toBeInTheDocument()
  })

  it("retries the fetch when the retry button is clicked", async () => {
    mockClientApiGet.mockRejectedValueOnce(new Error("network down"))
    render(<SystemHealthTab />)
    await screen.findByText("Unable to reach server")

    mockClientApiGet.mockResolvedValueOnce(healthData())
    await userEvent.click(screen.getByRole("button", { name: /retry/i }))

    expect(await screen.findByText("v20.11.0")).toBeInTheDocument()
  })

  it("renders server info, environment and uptime once loaded", async () => {
    mockClientApiGet.mockResolvedValue(healthData())
    render(<SystemHealthTab />)

    expect(await screen.findByText("v20.11.0")).toBeInTheDocument()
    expect(screen.getByText("linux (x64)")).toBeInTheDocument()
    expect(screen.getByText("4242")).toBeInTheDocument()
    expect(screen.getByText("production")).toBeInTheDocument()
    expect(screen.getByText("1d 1h 1m 1s")).toBeInTheDocument()
  })

  it("shows the Operational status indicator when status is healthy", async () => {
    mockClientApiGet.mockResolvedValue(healthData({ status: "healthy" }))
    render(<SystemHealthTab />)

    // The database's "connected" status also renders "Operational", so both
    // indicators show it here.
    expect((await screen.findAllByText("Operational")).length).toBe(2)
  })

  it("shows the Degraded status indicator when status is degraded", async () => {
    mockClientApiGet.mockResolvedValue(healthData({ status: "degraded" }))
    render(<SystemHealthTab />)

    expect(await screen.findByText("Degraded")).toBeInTheDocument()
  })

  it("shows the Disconnected status indicator for any other status", async () => {
    mockClientApiGet.mockResolvedValue(healthData({ status: "unknown" }))
    render(<SystemHealthTab />)

    expect(await screen.findByText("Disconnected")).toBeInTheDocument()
  })

  it("renders the database latency and table counts", async () => {
    mockClientApiGet.mockResolvedValue(healthData())
    render(<SystemHealthTab />)

    expect(await screen.findByText("42ms")).toBeInTheDocument()
    expect(screen.getByText("10")).toBeInTheDocument()
    expect(screen.getByText("20")).toBeInTheDocument()
    expect(screen.getByText("30")).toBeInTheDocument()
  })

  it("shows the database as Disconnected when its status is not connected/healthy", async () => {
    mockClientApiGet.mockResolvedValue(
      healthData({ database: { status: "down", latencyMs: 0, tables: { users: 0, orders: 0, products: 0 } } }),
    )
    render(<SystemHealthTab />)

    await screen.findByText("v20.11.0")
    // Two StatusIndicators render "Disconnected" when both server + db are down --
    // scope to the Database card's own state by asserting the label exists at all.
    expect(screen.getAllByText("Disconnected").length).toBeGreaterThan(0)
  })

  it("renders CPU user/system/total times in seconds", async () => {
    mockClientApiGet.mockResolvedValue(healthData({ cpu: { user: 2_000_000, system: 1_000_000 } }))
    render(<SystemHealthTab />)

    await screen.findByText("v20.11.0")
    expect(screen.getByText("2.00s")).toBeInTheDocument()
    expect(screen.getByText("1.00s")).toBeInTheDocument()
    expect(screen.getByText("3.00s")).toBeInTheDocument()
  })

  it("renders memory figures in MB", async () => {
    mockClientApiGet.mockResolvedValue(healthData())
    render(<SystemHealthTab />)

    await screen.findByText("v20.11.0")
    expect(screen.getByText("100 MB")).toBeInTheDocument()
    expect(screen.getByText("40 MB")).toBeInTheDocument()
    expect(screen.getByText("80 MB")).toBeInTheDocument()
    expect(screen.getByText("5.00 MB")).toBeInTheDocument()
  })

  it("re-fetches health data when the refresh button is clicked", async () => {
    mockClientApiGet.mockResolvedValue(healthData())
    render(<SystemHealthTab />)
    await screen.findByText("v20.11.0")

    mockClientApiGet.mockClear()
    mockClientApiGet.mockResolvedValue(healthData({ version: "v20.12.0" }))
    await userEvent.click(screen.getByRole("button", { name: /refresh/i }))

    expect(await screen.findByText("v20.12.0")).toBeInTheDocument()
    expect(mockClientApiGet).toHaveBeenCalledWith("admin/system-health")
  })

  it("polls the health endpoint every 10 seconds", async () => {
    jest.useFakeTimers({ advanceTimers: true })
    mockClientApiGet.mockResolvedValue(healthData())
    render(<SystemHealthTab />)

    await waitFor(() => expect(mockClientApiGet).toHaveBeenCalledTimes(1))

    await jest.advanceTimersByTimeAsync(10000)
    await waitFor(() => expect(mockClientApiGet).toHaveBeenCalledTimes(2))

    await jest.advanceTimersByTimeAsync(10000)
    await waitFor(() => expect(mockClientApiGet).toHaveBeenCalledTimes(3))
  })
})

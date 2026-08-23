/**
 * Tests for InfrastructureTab (components/admin/infrastructure-tab.tsx).
 *
 * Fetches `admin/infrastructure` on mount via `clientApiGet` and polls it
 * every 30 seconds. What's worth pinning: the loading -> loaded transition,
 * the "unable to load" state (and its retry button) when the fetch fails,
 * host/runtime figures, the per-service status badge and icon, the
 * dependencies list (and that the whole card is skipped when there are none),
 * and that the 30s auto-refresh interval actually re-fetches.
 */

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { InfrastructureTab } from "@/components/admin/infrastructure-tab"

const mockClientApiGet = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiGet: (...args: unknown[]) => mockClientApiGet(...args),
}))

function infraData(overrides: Record<string, unknown> = {}) {
  return {
    server: {
      hostname: "tolatola-web-1",
      platform: "linux",
      arch: "x64",
      cpus: 4,
      cpuModel: "Intel(R) Xeon(R) CPU",
      totalMemoryGB: "16.00",
      freeMemoryGB: "10.00",
      loadAverage: [0.5, 0.6, 0.7],
      networkInterfaces: [{ name: "eth0", address: "10.0.0.5" }],
    },
    runtime: {
      nodeVersion: "v20.11.0",
      pid: 4242,
      uptime: 3665, // 1h 1m 5s
      cwd: "/app",
      execPath: "/usr/bin/node",
      environment: "production",
      port: "4000",
      appUrl: "https://api.tolatola.co",
    },
    services: [
      {
        name: "Primary Database",
        type: "database",
        status: "operational",
        latencyMs: 12,
        details: { provider: "Supabase" },
      },
      {
        name: "Object Storage",
        type: "storage",
        status: "degraded",
        latencyMs: 620,
        details: { bucket: "uploads" },
      },
      {
        name: "SMS Gateway",
        type: "sms",
        status: "down",
        latencyMs: null,
        details: {},
      },
    ],
    dependencies: [{ name: "next", version: "14.2.0" }],
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

describe("InfrastructureTab", () => {
  it("shows a loading state before the infrastructure data resolves", () => {
    mockClientApiGet.mockReturnValue(new Promise(() => {}))
    render(<InfrastructureTab />)

    expect(screen.getByText("Connecting to infrastructure...")).toBeInTheDocument()
  })

  it("shows the unable-to-load state when the fetch fails, with a retry button", async () => {
    mockClientApiGet.mockRejectedValue(new Error("network down"))
    render(<InfrastructureTab />)

    expect(await screen.findByText("Unable to load infrastructure data")).toBeInTheDocument()
  })

  it("retries the fetch when the retry button is clicked", async () => {
    mockClientApiGet.mockRejectedValueOnce(new Error("network down"))
    render(<InfrastructureTab />)
    await screen.findByText("Unable to load infrastructure data")

    mockClientApiGet.mockResolvedValueOnce(infraData())
    await userEvent.click(screen.getByRole("button", { name: /retry/i }))

    expect(await screen.findByText("tolatola-web-1")).toBeInTheDocument()
  })

  it("renders host machine details", async () => {
    mockClientApiGet.mockResolvedValue(infraData())
    render(<InfrastructureTab />)

    expect(await screen.findByText("tolatola-web-1")).toBeInTheDocument()
    expect(screen.getByText("linux")).toBeInTheDocument()
    expect(screen.getByText("x64")).toBeInTheDocument()
    expect(screen.getByText("4 cores")).toBeInTheDocument()
    expect(screen.getByText("10.0.0.5")).toBeInTheDocument()
  })

  it("computes used memory from total minus free", async () => {
    mockClientApiGet.mockResolvedValue(infraData())
    render(<InfrastructureTab />)

    await screen.findByText("tolatola-web-1")
    expect(screen.getByText("Memory (6.00 / 16.00 GB)")).toBeInTheDocument()
  })

  it("renders application runtime details", async () => {
    mockClientApiGet.mockResolvedValue(infraData())
    render(<InfrastructureTab />)

    expect(await screen.findByText("v20.11.0")).toBeInTheDocument()
    expect(screen.getByText("production")).toBeInTheDocument()
    expect(screen.getByText("4242")).toBeInTheDocument()
    expect(screen.getByText("4000")).toBeInTheDocument()
    expect(screen.getByText("https://api.tolatola.co")).toBeInTheDocument()
    expect(screen.getByText("1h 1m 5s")).toBeInTheDocument()
    expect(screen.getByText("/app")).toBeInTheDocument()
  })

  it("renders each connected service with its name, status badge and latency", async () => {
    mockClientApiGet.mockResolvedValue(infraData())
    render(<InfrastructureTab />)

    await screen.findByText("tolatola-web-1")

    expect(screen.getByText("Primary Database")).toBeInTheDocument()
    expect(screen.getByText("Operational")).toBeInTheDocument()
    expect(screen.getByText("12ms")).toBeInTheDocument()

    expect(screen.getByText("Object Storage")).toBeInTheDocument()
    expect(screen.getByText("Degraded")).toBeInTheDocument()
    expect(screen.getByText("620ms")).toBeInTheDocument()

    expect(screen.getByText("SMS Gateway")).toBeInTheDocument()
    expect(screen.getByText("Down")).toBeInTheDocument()
  })

  it("does not render a latency row for a service with null latency", async () => {
    mockClientApiGet.mockResolvedValue(infraData())
    render(<InfrastructureTab />)

    await screen.findByText("SMS Gateway")
    // The SMS Gateway service has latencyMs: null, so there should be exactly
    // two "Latency:" labels (database + storage), not three.
    expect(screen.getAllByText("Latency:")).toHaveLength(2)
  })

  it("renders service detail key/value pairs with camelCase keys split into words", async () => {
    mockClientApiGet.mockResolvedValue(
      infraData({
        services: [
          {
            name: "Email Service",
            type: "email",
            status: "configured",
            latencyMs: null,
            details: { fromAddress: "noreply@tolatola.co" },
          },
        ],
      }),
    )
    render(<InfrastructureTab />)

    await screen.findByText("Email Service")
    expect(screen.getByText("from Address")).toBeInTheDocument()
    expect(screen.getByText("noreply@tolatola.co")).toBeInTheDocument()
    expect(screen.getByText("Configured")).toBeInTheDocument()
  })

  it("shows the Not Configured badge for an unrecognized service status", async () => {
    mockClientApiGet.mockResolvedValue(
      infraData({
        services: [{ name: "Maps API", type: "maps", status: "unknown", latencyMs: null, details: {} }],
      }),
    )
    render(<InfrastructureTab />)

    expect(await screen.findByText("Not Configured")).toBeInTheDocument()
  })

  it("renders the dependencies list with name and version", async () => {
    mockClientApiGet.mockResolvedValue(
      infraData({
        dependencies: [
          { name: "next", version: "14.2.0" },
          { name: "react", version: "18.3.1" },
        ],
      }),
    )
    render(<InfrastructureTab />)

    await screen.findByText("tolatola-web-1")
    expect(screen.getByText("Dependencies (2)")).toBeInTheDocument()
    expect(screen.getByText("next")).toBeInTheDocument()
    expect(screen.getByText("14.2.0")).toBeInTheDocument()
    expect(screen.getByText("react")).toBeInTheDocument()
    expect(screen.getByText("18.3.1")).toBeInTheDocument()
  })

  it("omits the dependencies card entirely when there are none", async () => {
    mockClientApiGet.mockResolvedValue(infraData({ dependencies: [] }))
    render(<InfrastructureTab />)

    await screen.findByText("tolatola-web-1")
    expect(screen.queryByText(/^Dependencies/)).not.toBeInTheDocument()
  })

  it("re-fetches infrastructure data when the refresh button is clicked", async () => {
    mockClientApiGet.mockResolvedValue(infraData())
    render(<InfrastructureTab />)
    await screen.findByText("tolatola-web-1")

    mockClientApiGet.mockClear()
    mockClientApiGet.mockResolvedValue(infraData({ server: { ...infraData().server, hostname: "tolatola-web-2" } }))
    await userEvent.click(screen.getByRole("button", { name: /refresh/i }))

    expect(await screen.findByText("tolatola-web-2")).toBeInTheDocument()
    expect(mockClientApiGet).toHaveBeenCalledWith("admin/infrastructure")
  })

  it("polls the infrastructure endpoint every 30 seconds", async () => {
    jest.useFakeTimers({ advanceTimers: true })
    mockClientApiGet.mockResolvedValue(infraData())
    render(<InfrastructureTab />)

    await waitFor(() => expect(mockClientApiGet).toHaveBeenCalledTimes(1))

    await jest.advanceTimersByTimeAsync(30000)
    await waitFor(() => expect(mockClientApiGet).toHaveBeenCalledTimes(2))

    await jest.advanceTimersByTimeAsync(30000)
    await waitFor(() => expect(mockClientApiGet).toHaveBeenCalledTimes(3))
  })
})

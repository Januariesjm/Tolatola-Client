/**
 * Tests for AgentNotifications (components/agent/agent-notifications.tsx).
 *
 * Covers the fetch-on-mount lifecycle (loading -> loaded/empty/error),
 * the all/unread filter, the manual refresh action, and the per-type
 * icon/badge rendering -- all driven by the `/agents/notifications` fetch,
 * which is stubbed per test.
 */

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AgentNotifications } from "@/components/agent/agent-notifications"
import { setErrorReporter, type LogRecord } from "@/lib/logger"

const mockGetSession = jest.fn()
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { getSession: mockGetSession } }),
}))

type Notification = {
  id: string
  type: "registration" | "commission" | "performance" | "system" | "other"
  title: string
  message: string
  is_read: boolean
  created_at: string
}

function notification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: "n-1",
    type: "registration",
    title: "New registration",
    message: "A new customer registered under you.",
    is_read: false,
    created_at: new Date().toISOString(),
    ...overrides,
  }
}

/** Stubs `global.fetch` to resolve with the given notifications payload. */
function mockFetch(data: Notification[] | null = [], ok = true) {
  const fetchMock = jest.fn().mockResolvedValue({
    ok,
    json: async () => ({ data }),
  })
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

let reported: LogRecord[]

beforeEach(() => {
  jest.clearAllMocks()
  reported = []
  setErrorReporter((record) => reported.push(record))
  mockGetSession.mockResolvedValue({ data: { session: { access_token: "tok-123" } } })
})

afterEach(() => {
  setErrorReporter(null)
})

describe("AgentNotifications", () => {
  it("shows a loading state while the initial fetch is in flight", () => {
    global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof fetch

    render(<AgentNotifications agent={{}} />)

    expect(screen.getByText("Loading notifications...")).toBeInTheDocument()
  })

  it("requests notifications with the session's bearer token", async () => {
    const fetchMock = mockFetch([])
    render(<AgentNotifications agent={{}} />)

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining("/agents/notifications"),
        expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer tok-123" }) }),
      ),
    )
  })

  it("omits the Authorization header when there is no session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } })
    const fetchMock = mockFetch([])
    render(<AgentNotifications agent={{}} />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers).not.toHaveProperty("Authorization")
  })

  it("renders an empty state when there are no notifications", async () => {
    mockFetch([])
    render(<AgentNotifications agent={{}} />)

    expect(await screen.findByText("No Notifications")).toBeInTheDocument()
    expect(screen.getByText("New notifications will appear here.")).toBeInTheDocument()
    expect(screen.getByText("No new notifications at this time.")).toBeInTheDocument()
    expect(screen.getByText("All (0)")).toBeInTheDocument()
    expect(screen.getByText("Unread (0)")).toBeInTheDocument()
  })

  it("renders a list of notifications with type icon, badge and message", async () => {
    mockFetch([
      notification({ id: "n-1", type: "commission", title: "Commission paid", message: "TZS 5,000 credited", is_read: true }),
      notification({ id: "n-2", type: "performance", title: "Great month", message: "Top 10 agents", is_read: false }),
    ])
    render(<AgentNotifications agent={{}} />)

    expect(await screen.findByText("Commission paid")).toBeInTheDocument()
    expect(screen.getByText("TZS 5,000 credited")).toBeInTheDocument()
    expect(screen.getByText("Great month")).toBeInTheDocument()
    expect(screen.getByText("commission")).toBeInTheDocument()
    expect(screen.getByText("performance")).toBeInTheDocument()
    expect(screen.getByText("You have 1 new unread notification(s).")).toBeInTheDocument()
    expect(screen.getByText("All (2)")).toBeInTheDocument()
    expect(screen.getByText("Unread (1)")).toBeInTheDocument()
  })

  it("falls back to the generic bell icon and badge for an unknown type", async () => {
    mockFetch([notification({ type: "other" as Notification["type"] })])
    render(<AgentNotifications agent={{}} />)

    expect(await screen.findByText("other")).toBeInTheDocument()
  })

  it("filters to unread-only notifications and back", async () => {
    mockFetch([
      notification({ id: "n-1", title: "Read one", is_read: true }),
      notification({ id: "n-2", title: "Unread one", is_read: false }),
    ])
    render(<AgentNotifications agent={{}} />)

    await screen.findByText("Read one")
    expect(screen.getByText("Unread one")).toBeInTheDocument()

    await userEvent.click(screen.getByText("Unread (1)"))

    expect(screen.queryByText("Read one")).not.toBeInTheDocument()
    expect(screen.getByText("Unread one")).toBeInTheDocument()

    await userEvent.click(screen.getByText("All (2)"))

    expect(screen.getByText("Read one")).toBeInTheDocument()
    expect(screen.getByText("Unread one")).toBeInTheDocument()
  })

  it("shows the unread-specific empty message when every notification has been read", async () => {
    mockFetch([notification({ is_read: true })])
    render(<AgentNotifications agent={{}} />)

    await userEvent.click(await screen.findByText(/^Unread/))

    expect(await screen.findByText("All notifications have been read.")).toBeInTheDocument()
  })

  it("refetches when Refresh is clicked", async () => {
    const fetchMock = mockFetch([])
    render(<AgentNotifications agent={{}} />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    await userEvent.click(screen.getByRole("button", { name: /Refresh/ }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })

  it("leaves the notification list untouched when the response is not ok", async () => {
    mockFetch([notification()], false)
    render(<AgentNotifications agent={{}} />)

    await waitFor(() => expect(screen.getByText("No Notifications")).toBeInTheDocument())
  })

  it("logs the error and stops loading when the fetch throws", async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error("network down")) as unknown as typeof fetch
    render(<AgentNotifications agent={{}} />)

    await waitFor(() => expect(reported.map((record) => record.message)).toContain("fetch failed"))
    expect(reported[0].error?.message).toBe("network down")
    expect(screen.getByText("No Notifications")).toBeInTheDocument()
  })

  it("formats relative timestamps for recent notifications", async () => {
    const now = new Date()
    mockFetch([
      notification({ id: "n-a", title: "Seconds ago", created_at: new Date(now.getTime() - 30 * 1000).toISOString() }),
      notification({ id: "n-b", title: "Minutes ago", created_at: new Date(now.getTime() - 10 * 60 * 1000).toISOString() }),
      notification({ id: "n-c", title: "Hours ago", created_at: new Date(now.getTime() - 5 * 60 * 60 * 1000).toISOString() }),
    ])
    render(<AgentNotifications agent={{}} />)

    await screen.findByText("Seconds ago")
    expect(screen.getByText("Just now")).toBeInTheDocument()
    expect(screen.getByText("10 minutes ago")).toBeInTheDocument()
    expect(screen.getByText("5 hours ago")).toBeInTheDocument()
  })
})

/**
 * Tests for ActivityLogsTab (components/admin/activity-logs-tab.tsx).
 *
 * On mount it queries `admin_activity_logs` (with the acting admin joined in)
 * directly via the Supabase client, shows a loading state while that's in
 * flight, then renders the list -- filterable client-side by action, resource,
 * or admin name/email. A query error is swallowed into the logger and simply
 * leaves the list empty. What's worth pinning: the loading -> loaded
 * transition, the empty state, the search filter across all four fields, the
 * per-action badge styling, the admin array-vs-object normalization the
 * component does on the raw row, and that a query error doesn't blow up the
 * component.
 */

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ActivityLogsTab } from "@/components/admin/activity-logs-tab"
import { setErrorReporter, type LogRecord } from "@/lib/logger"

// Overrides the global Supabase mock from jest.setup.ts so each test controls
// exactly what `.from("admin_activity_logs").select(...).order(...).limit(...)`
// resolves to.
const mockLimit = jest.fn()
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        order: () => ({
          limit: (...args: unknown[]) => mockLimit(...args),
        }),
      }),
    }),
  }),
}))

function log(overrides: Record<string, unknown> = {}) {
  return {
    id: "log-1",
    admin_id: "admin-1",
    action: "approve",
    resource: "vendor:v-1",
    details: {},
    created_at: "2026-01-10T08:30:00.000Z",
    admin: { full_name: "Asha Mwinyi", email: "asha@example.com" },
    ...overrides,
  }
}

let reported: LogRecord[]

beforeEach(() => {
  jest.clearAllMocks()
  reported = []
  setErrorReporter((record) => reported.push(record))
  jest.spyOn(console, "error").mockImplementation(() => {})
  mockLimit.mockResolvedValue({ data: [], error: null })
})

afterEach(() => {
  setErrorReporter(null)
  jest.restoreAllMocks()
})

describe("ActivityLogsTab", () => {
  it("shows a loading state before the logs resolve", () => {
    mockLimit.mockReturnValue(new Promise(() => {})) // never resolves
    render(<ActivityLogsTab />)

    expect(screen.getByText("Loading activity logs...")).toBeInTheDocument()
  })

  it("shows the empty state once loaded with no logs", async () => {
    mockLimit.mockResolvedValue({ data: [], error: null })
    render(<ActivityLogsTab />)

    expect(await screen.findByText("No activity logs found.")).toBeInTheDocument()
  })

  it("renders a log row with formatted timestamp, admin, action and resource", async () => {
    mockLimit.mockResolvedValue({ data: [log()], error: null })
    render(<ActivityLogsTab />)

    expect(await screen.findByText("Asha Mwinyi")).toBeInTheDocument()
    expect(screen.getByText("asha@example.com")).toBeInTheDocument()
    expect(screen.getByText("Approve")).toBeInTheDocument()
    expect(screen.getByText("vendor:v-1")).toBeInTheDocument()
  })

  it("shows a dash when the log has no details", async () => {
    mockLimit.mockResolvedValue({ data: [log({ details: {} })], error: null })
    render(<ActivityLogsTab />)

    await screen.findByText("Asha Mwinyi")
    expect(screen.getByText("-")).toBeInTheDocument()
  })

  it("renders serialized details when present", async () => {
    mockLimit.mockResolvedValue({
      data: [log({ details: { reason: "kyc verified" } })],
      error: null,
    })
    render(<ActivityLogsTab />)

    expect(await screen.findByText(JSON.stringify({ reason: "kyc verified" }))).toBeInTheDocument()
  })

  it("falls back to 'Unknown Admin' when the admin relation is missing", async () => {
    mockLimit.mockResolvedValue({
      data: [log({ admin: { full_name: "", email: "" } })],
      error: null,
    })
    render(<ActivityLogsTab />)

    expect(await screen.findByText("Unknown Admin")).toBeInTheDocument()
  })

  it("normalizes an admin relation returned as an array by picking the first entry", async () => {
    mockLimit.mockResolvedValue({
      data: [{ ...log(), admin: [{ full_name: "Baraka John", email: "baraka@example.com" }] }],
      error: null,
    })
    render(<ActivityLogsTab />)

    expect(await screen.findByText("Baraka John")).toBeInTheDocument()
  })

  it("filters logs by search term across action, resource, admin name and email", async () => {
    mockLimit.mockResolvedValue({
      data: [
        log({ id: "log-1", action: "approve", resource: "vendor:v-1" }),
        log({
          id: "log-2",
          action: "reject",
          resource: "product:p-9",
          admin: { full_name: "Baraka John", email: "baraka@example.com" },
        }),
      ],
      error: null,
    })
    render(<ActivityLogsTab />)

    await screen.findByText("Asha Mwinyi")
    expect(screen.getByText("Baraka John")).toBeInTheDocument()

    await userEvent.type(screen.getByPlaceholderText("Search logs..."), "baraka")

    expect(screen.getByText("Baraka John")).toBeInTheDocument()
    expect(screen.queryByText("Asha Mwinyi")).not.toBeInTheDocument()
  })

  it("matches search terms against the resource field", async () => {
    mockLimit.mockResolvedValue({
      data: [
        log({ id: "log-1", resource: "vendor:v-1" }),
        log({ id: "log-2", resource: "product:p-9", admin: { full_name: "Baraka John", email: "baraka@example.com" } }),
      ],
      error: null,
    })
    render(<ActivityLogsTab />)

    await screen.findByText("Asha Mwinyi")
    await userEvent.type(screen.getByPlaceholderText("Search logs..."), "product")

    expect(screen.getByText("product:p-9")).toBeInTheDocument()
    expect(screen.queryByText("vendor:v-1")).not.toBeInTheDocument()
  })

  it("shows the empty state when the search term matches nothing", async () => {
    mockLimit.mockResolvedValue({ data: [log()], error: null })
    render(<ActivityLogsTab />)

    await screen.findByText("Asha Mwinyi")
    await userEvent.type(screen.getByPlaceholderText("Search logs..."), "no-such-term")

    expect(screen.getByText("No activity logs found.")).toBeInTheDocument()
  })

  it.each([
    ["approve", "bg-emerald-100"],
    ["reject", "bg-red-100"],
    ["activate", "bg-blue-100"],
    ["deactivate", "bg-slate-100"],
    ["assign_role", "bg-purple-100"],
  ])("styles the '%s' action with its dedicated badge color", async (action, expectedClass) => {
    mockLimit.mockResolvedValue({ data: [log({ action })], error: null })
    render(<ActivityLogsTab />)

    const label = action.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())
    const badge = await screen.findByText(label)
    expect(badge.className).toContain(expectedClass)
  })

  it("falls back to an outline badge for an unrecognized action", async () => {
    mockLimit.mockResolvedValue({ data: [log({ action: "export_report" })], error: null })
    render(<ActivityLogsTab />)

    expect(await screen.findByText("Export Report")).toBeInTheDocument()
  })

  it("logs and swallows a query error, leaving the list empty", async () => {
    mockLimit.mockResolvedValue({ data: null, error: new Error("query failed") })
    render(<ActivityLogsTab />)

    expect(await screen.findByText("No activity logs found.")).toBeInTheDocument()
    expect(reported.some((r) => r.message === "error fetching logs" && r.error?.message === "query failed")).toBe(true)
  })
})

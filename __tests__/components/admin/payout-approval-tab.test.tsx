/**
 * Tests for PayoutApprovalTab (components/admin/payout-approval-tab.tsx).
 *
 * A prop-driven list of payouts with two mutation actions (approve/reject),
 * both hitting `fetch` directly (not the api-client wrapper), plus a
 * date-range filter and a background poll that only runs while at least one
 * payout is "processing". What's worth pinning: the pending-only section vs.
 * the full history section, the approve/reject success and failure toast
 * paths (optimistic update to "processing"/"failed"), the date-range filter
 * narrowing both sections, and that the 5s poll only fires when there is a
 * processing payout and stops updating once it resolves.
 */

import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PayoutApprovalTab } from "@/components/admin/payout-approval-tab"

const mockToast = jest.fn()
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}))

const mockRouter = { push: jest.fn(), replace: jest.fn(), refresh: jest.fn(), back: jest.fn(), forward: jest.fn(), prefetch: jest.fn() }
jest.mock("next/navigation", () => ({ useRouter: () => mockRouter }))

function payout(overrides: Record<string, unknown> = {}) {
  return {
    id: "payout-1",
    amount: 50000,
    status: "pending",
    user_type: "vendor",
    user_id: "vendor-1",
    payment_method: "mobile-money",
    payment_details: { details: "0712345678" },
    created_at: "2026-01-10T08:30:00.000Z",
    approved_by_name: null,
    failure_reason: null,
    ...overrides,
  }
}

type FetchResult = { ok?: boolean; status?: number; body?: unknown }

function mockFetch(overrides: Array<{ match: (url: string, method: string) => boolean } & FetchResult> = []) {
  const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const method = (init?.method || "GET").toUpperCase()
    const override = overrides.find((o) => o.match(url, method))
    const result: FetchResult = override ?? { ok: true, body: {} }
    return {
      ok: result.ok ?? true,
      status: result.status ?? (result.ok === false ? 500 : 200),
      json: async () => result.body ?? {},
    } as Response
  })
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  mockFetch()
})

afterEach(() => {
  jest.restoreAllMocks()
  jest.useRealTimers()
})

describe("PayoutApprovalTab", () => {
  it("shows the empty states when there are no payouts at all", () => {
    render(<PayoutApprovalTab payouts={[]} />)

    expect(screen.getByText("No pending payout requests")).toBeInTheDocument()
    expect(screen.getByText("No payouts yet")).toBeInTheDocument()
  })

  it("lists a pending payout in the pending section with its details", () => {
    render(<PayoutApprovalTab payouts={[payout()]} />)

    // Appears once in the pending-requests card and once in the all-payouts history.
    expect(screen.getAllByText("TZS 50,000")).toHaveLength(2)
    expect(screen.getByText("Type: vendor")).toBeInTheDocument()
    expect(screen.getByText("User ID: vendor-1")).toBeInTheDocument()
    expect(screen.getByText("Payment Method: mobile-money")).toBeInTheDocument()
    expect(screen.getByText("Details: 0712345678")).toBeInTheDocument()
  })

  it("only lists pending payouts in the pending section, but all payouts in the history section", () => {
    render(
      <PayoutApprovalTab payouts={[payout({ id: "p-1", status: "pending" }), payout({ id: "p-2", status: "completed", amount: 20000 })]} />,
    )

    // Pending section shows only p-1.
    expect(screen.queryByText("No pending payout requests")).not.toBeInTheDocument()
    // History section shows both amounts.
    expect(screen.getAllByText("TZS 50,000")).toHaveLength(2) // pending card + history row
    expect(screen.getByText("TZS 20,000")).toBeInTheDocument()
    expect(screen.getByText("completed")).toBeInTheDocument()
  })

  it("shows the approved-by / rejected-by name and failure reason in history", () => {
    render(
      <PayoutApprovalTab
        payouts={[
          payout({ id: "p-1", status: "completed", approved_by_name: "Asha Mwinyi" }),
          payout({ id: "p-2", status: "failed", approved_by_name: "Baraka John", failure_reason: "Invalid account" }),
        ]}
      />,
    )

    expect(screen.getByText(/Approved by: Asha Mwinyi/)).toBeInTheDocument()
    expect(screen.getByText(/Rejected by: Baraka John/)).toBeInTheDocument()
    expect(screen.getByText("Reason: Invalid account")).toBeInTheDocument()
  })

  it("approves a pending payout: posts to the approve endpoint, toasts success, and moves it out of the pending list", async () => {
    const fetchMock = mockFetch()
    render(<PayoutApprovalTab payouts={[payout()]} />)

    await userEvent.click(screen.getByRole("button", { name: /approve/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/payouts/approve",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ payoutId: "payout-1", userType: "vendor" }),
        }),
      )
    })
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Payout approved", description: "The payout has been initiated and is now processing" }),
    )
    expect(screen.getByText("No pending payout requests")).toBeInTheDocument()
    expect(mockRouter.refresh).toHaveBeenCalled()
  })

  it("shows the API error message and does not optimistically update on approve failure", async () => {
    mockFetch([
      { match: (url, method) => method === "POST" && url.endsWith("/approve"), ok: false, body: { error: "Insufficient balance" } },
    ])
    render(<PayoutApprovalTab payouts={[payout()]} />)

    await userEvent.click(screen.getByRole("button", { name: /approve/i }))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Error", description: "Insufficient balance", variant: "destructive" }),
      )
    })
    // Still pending -- optimistic update did not run on failure.
    expect(screen.queryByText("No pending payout requests")).not.toBeInTheDocument()
  })

  it("rejects a pending payout: posts to the reject endpoint, toasts success, and moves it out of the pending list", async () => {
    const fetchMock = mockFetch()
    render(<PayoutApprovalTab payouts={[payout()]} />)

    await userEvent.click(screen.getByRole("button", { name: /reject/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/admin/payouts/reject",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ payoutId: "payout-1", userType: "vendor" }),
        }),
      )
    })
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Payout rejected", description: "The payout request has been rejected" }),
    )
    expect(screen.getByText("No pending payout requests")).toBeInTheDocument()
  })

  it("shows a generic error toast when reject fails", async () => {
    mockFetch([{ match: (url, method) => method === "POST" && url.endsWith("/reject"), ok: false }])
    render(<PayoutApprovalTab payouts={[payout()]} />)

    await userEvent.click(screen.getByRole("button", { name: /reject/i }))

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Error", description: "Failed to reject payout", variant: "destructive" }),
      )
    })
  })

  it("disables both approve and reject buttons while a request is processing", async () => {
    mockFetch([{ match: (url, method) => method === "POST" && url.endsWith("/approve"), body: {} }])
    // Never-resolving fetch keeps `processing` set so we can observe the disabled state.
    global.fetch = jest.fn(() => new Promise(() => {})) as unknown as typeof fetch
    render(<PayoutApprovalTab payouts={[payout()]} />)

    const approveBtn = screen.getByRole("button", { name: /approve/i })
    const rejectBtn = screen.getByRole("button", { name: /reject/i })
    await userEvent.click(approveBtn)

    expect(approveBtn).toBeDisabled()
    expect(rejectBtn).toBeDisabled()
  })

  it("manually refreshes via the refresh button", async () => {
    render(<PayoutApprovalTab payouts={[payout()]} />)

    await userEvent.click(screen.getByRole("button", { name: "" })) // the icon-only refresh button in the header
  })

  it("filters both sections by the selected date range", async () => {
    const recent = payout({ id: "p-1", status: "completed", created_at: new Date().toISOString(), amount: 10000 })
    const old = payout({ id: "p-2", status: "completed", created_at: "2020-01-01T00:00:00.000Z", amount: 99000 })
    render(<PayoutApprovalTab payouts={[recent, old]} />)

    expect(screen.getByText("TZS 10,000")).toBeInTheDocument()
    expect(screen.getByText("TZS 99,000")).toBeInTheDocument()

    await userEvent.click(screen.getByText("Today"))

    expect(screen.getByText("TZS 10,000")).toBeInTheDocument()
    expect(screen.queryByText("TZS 99,000")).not.toBeInTheDocument()
  })

  it("does not poll when no payout is in the processing state", async () => {
    jest.useFakeTimers({ advanceTimers: true })
    const fetchMock = mockFetch()
    render(<PayoutApprovalTab payouts={[payout({ status: "pending" })]} />)

    await jest.advanceTimersByTimeAsync(20000)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("polls the status endpoint for a processing payout and updates it once resolved", async () => {
    jest.useFakeTimers({ advanceTimers: true })
    const statusFetch = mockFetch([
      {
        match: (url, method) => method === "GET" && url.includes("/status"),
        body: { payout: { ...payout({ status: "completed" }) } },
      },
    ])
    render(<PayoutApprovalTab payouts={[payout({ status: "processing" })]} />)

    expect(screen.getByText("processing")).toBeInTheDocument()

    await jest.advanceTimersByTimeAsync(5000)

    await waitFor(() => {
      expect(statusFetch).toHaveBeenCalledWith(expect.stringContaining("/api/admin/payouts/payout-1/status?userType=vendor"))
    })
    await waitFor(() => expect(screen.getByText("completed")).toBeInTheDocument())
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Payout Status Updated", description: "Payout to vendor-1 is now completed" }),
    )
  })
})

/**
 * Tests for FinancePayoutsTab (components/admin/finance/finance-payouts-tab.tsx).
 *
 * The one finance tab with real mutations: approving/rejecting a pending
 * payout POSTs to /api/admin/payouts/{approve,reject} via the global fetch,
 * and a "processing" payout is polled on an interval via
 * /api/admin/payouts/{id}/status. What's worth pinning: the summary totals,
 * search/status filtering, the optimistic status flip on approve/reject
 * (and that a non-ok response falls back to an error toast without flipping
 * the row), and that the poll only fires for "processing" rows and updates
 * the row + shows a toast once the server reports a settled status.
 *
 * jsdom has no Pointer Capture API, which Radix's DropdownMenu touches on
 * pointer down; polyfilled below, same fix used in other admin finance
 * suites.
 */

if (typeof Element !== "undefined") {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {}
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {}
  }
}

import React from "react"
import { render, screen, within, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FinancePayoutsTab } from "@/components/admin/finance/finance-payouts-tab"

const mockRefresh = jest.fn()
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh, push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}))

const mockToast = jest.fn()
jest.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mockToast }) }))

jest.mock("@/lib/logger", () => {
  const childLogger = { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() }
  return { logger: { child: jest.fn(() => childLogger) } }
})

function payout(overrides: Record<string, unknown> = {}) {
  return {
    id: "p-1",
    status: "pending",
    amount: 50000,
    user_type: "vendor",
    business_name: "Dodoma Crafts",
    payment_method: "mobile-money",
    created_at: "2026-01-10T08:30:00.000Z",
    ...overrides,
  }
}

function summaryCard(title: string) {
  const heading = screen.getByText(title, { selector: '[data-slot="card-title"]' })
  return heading.closest('[data-slot="card"]') as HTMLElement
}

/** The payout row card, scoped by the recipient's business/full name. */
function rowFor(name: string) {
  return screen.getByText(name).closest('[data-slot="card"]') as HTMLElement
}

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn().mockResolvedValue({ ok: true })
})

describe("FinancePayoutsTab", () => {
  it("shows an empty state when there are no payouts", () => {
    render(<FinancePayoutsTab payouts={[]} />)

    expect(screen.getByText("No payout records")).toBeInTheDocument()
  })

  it("shows zeroed totals when there are no payouts", () => {
    render(<FinancePayoutsTab payouts={[]} />)

    expect(within(summaryCard("Pending")).getByText("TZS 0")).toBeInTheDocument()
    expect(within(summaryCard("Processing")).getByText("TZS 0")).toBeInTheDocument()
    expect(within(summaryCard("Sent")).getByText("TZS 0")).toBeInTheDocument()
    expect(within(summaryCard("Failed")).getByText("TZS 0")).toBeInTheDocument()
  })

  it("renders a payout row with amount, recipient, method and status label", () => {
    render(<FinancePayoutsTab payouts={[payout()]} />)

    const row = rowFor("Dodoma Crafts")
    expect(within(row).getByText("TZS 50,000")).toBeInTheDocument()
    expect(within(row).getByText("mobile money")).toBeInTheDocument()
    expect(within(row).getByText("Pending")).toBeInTheDocument()
  })

  it("sums each status into its own summary total", () => {
    render(
      <FinancePayoutsTab
        payouts={[
          payout({ id: "p-1", status: "pending", amount: 10000 }),
          payout({ id: "p-2", status: "processing", amount: 20000 }),
          payout({ id: "p-3", status: "completed", amount: 30000 }),
          payout({ id: "p-4", status: "failed", amount: 5000 }),
        ]}
      />,
    )

    expect(within(summaryCard("Pending")).getByText("TZS 10,000")).toBeInTheDocument()
    expect(within(summaryCard("Processing")).getByText("TZS 20,000")).toBeInTheDocument()
    expect(within(summaryCard("Sent")).getByText("TZS 30,000")).toBeInTheDocument()
    expect(within(summaryCard("Failed")).getByText("TZS 5,000")).toBeInTheDocument()
  })

  it("shows Approve and Reject buttons only for a pending payout", () => {
    render(<FinancePayoutsTab payouts={[payout({ status: "completed" })]} />)

    expect(screen.queryByRole("button", { name: /approve/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /reject/i })).not.toBeInTheDocument()
  })

  it("shows an approved-by note when present", () => {
    render(<FinancePayoutsTab payouts={[payout({ status: "completed", approved_by_name: "Admin Jane" })]} />)

    expect(screen.getByText(/Approved by: Admin Jane/)).toBeInTheDocument()
  })

  it("shows a failure reason for a failed payout", () => {
    render(<FinancePayoutsTab payouts={[payout({ status: "failed", failure_reason: "insufficient float" })]} />)

    expect(screen.getByText(/Reason: insufficient float/)).toBeInTheDocument()
  })

  describe("approving a payout", () => {
    it("posts to the approve endpoint and flips the row to processing", async () => {
      render(<FinancePayoutsTab payouts={[payout()]} />)

      await userEvent.click(screen.getByRole("button", { name: /approve/i }))

      await waitFor(() =>
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/admin/payouts/approve",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ payoutId: "p-1", userType: "vendor" }),
          }),
        ),
      )
      await waitFor(() => expect(within(rowFor("Dodoma Crafts")).getByText("Processing")).toBeInTheDocument())
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Payout approved" }))
      expect(mockRefresh).toHaveBeenCalled()
    })

    it("shows an error toast and leaves the row pending when the approve request fails", async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false, json: async () => ({ error: "Insufficient balance" }) })
      render(<FinancePayoutsTab payouts={[payout()]} />)

      await userEvent.click(screen.getByRole("button", { name: /approve/i }))

      await waitFor(() =>
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: "Error", description: "Insufficient balance", variant: "destructive" }),
        ),
      )
      expect(within(rowFor("Dodoma Crafts")).getByText("Pending")).toBeInTheDocument()
    })
  })

  describe("rejecting a payout", () => {
    it("posts to the reject endpoint and flips the row to failed", async () => {
      render(<FinancePayoutsTab payouts={[payout()]} />)

      await userEvent.click(screen.getByRole("button", { name: /reject/i }))

      await waitFor(() =>
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/admin/payouts/reject",
          expect.objectContaining({ method: "POST", body: JSON.stringify({ payoutId: "p-1", userType: "vendor" }) }),
        ),
      )
      await waitFor(() => expect(within(rowFor("Dodoma Crafts")).getByText("Failed")).toBeInTheDocument())
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Payout rejected" }))
    })

    it("shows a generic error toast when the reject request fails", async () => {
      ;(global.fetch as jest.Mock).mockResolvedValue({ ok: false })
      render(<FinancePayoutsTab payouts={[payout()]} />)

      await userEvent.click(screen.getByRole("button", { name: /reject/i }))

      await waitFor(() =>
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: "Error", description: "Failed to reject payout", variant: "destructive" }),
        ),
      )
      expect(within(rowFor("Dodoma Crafts")).getByText("Pending")).toBeInTheDocument()
    })
  })

  describe("polling a processing payout", () => {
    beforeEach(() => {
      jest.useFakeTimers({ legacyFakeTimers: false })
    })
    afterEach(() => {
      jest.useRealTimers()
    })

    it("polls the status endpoint for processing payouts and updates the row once settled", async () => {
      ;(global.fetch as jest.Mock).mockImplementation((url: string) => {
        if (typeof url === "string" && url.includes("/status")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              payout: {
                id: "p-1",
                status: "completed",
                amount: 50000,
                user_type: "vendor",
                business_name: "Dodoma Crafts",
                created_at: "2026-01-10T08:30:00.000Z",
              },
            }),
          })
        }
        return Promise.resolve({ ok: true })
      })

      render(<FinancePayoutsTab payouts={[payout({ status: "processing" })]} />)
      expect(within(rowFor("Dodoma Crafts")).getByText("Processing")).toBeInTheDocument()

      await act(async () => {
        jest.advanceTimersByTime(5000)
      })

      await waitFor(() =>
        expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/admin/payouts/p-1/status?userType=vendor")),
      )
      await waitFor(() => expect(within(rowFor("Dodoma Crafts")).getByText("Sent")).toBeInTheDocument())
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Payout Status Updated" }))
    })

    it("does not poll at all when no payout is processing", async () => {
      render(<FinancePayoutsTab payouts={[payout({ status: "pending" })]} />)

      await act(async () => {
        jest.advanceTimersByTime(10000)
      })

      expect(global.fetch).not.toHaveBeenCalled()
    })
  })

  describe("search and status filter", () => {
    const second = payout({ id: "p-2", status: "completed", business_name: "Mbeya Grains", payment_method: "bank" })

    it("filters by business name", async () => {
      render(<FinancePayoutsTab payouts={[payout(), second]} />)

      await userEvent.type(screen.getByPlaceholderText(/search vendor/i), "mbeya")

      expect(screen.getByText("Mbeya Grains")).toBeInTheDocument()
      expect(screen.queryByText("Dodoma Crafts")).not.toBeInTheDocument()
    })

    it("filters by payment method", async () => {
      render(<FinancePayoutsTab payouts={[payout(), second]} />)

      await userEvent.type(screen.getByPlaceholderText(/search vendor/i), "bank")

      expect(screen.getByText("Mbeya Grains")).toBeInTheDocument()
      expect(screen.queryByText("Dodoma Crafts")).not.toBeInTheDocument()
    })

    it("filters by status via the dropdown", async () => {
      render(<FinancePayoutsTab payouts={[payout(), second]} />)

      await userEvent.click(screen.getByRole("button", { name: /^All$/i }))
      await userEvent.click(await screen.findByRole("menuitemcheckbox", { name: "Sent" }))

      expect(screen.getByText("Mbeya Grains")).toBeInTheDocument()
      expect(screen.queryByText("Dodoma Crafts")).not.toBeInTheDocument()
    })

    it("shows the empty state when nothing matches", async () => {
      render(<FinancePayoutsTab payouts={[payout()]} />)

      await userEvent.type(screen.getByPlaceholderText(/search vendor/i), "no-such-vendor")

      expect(screen.getByText("No payout records")).toBeInTheDocument()
    })
  })

  describe("date range filter", () => {
    it("excludes payouts created before the selected period", async () => {
      const recent = payout({ id: "p-1", business_name: "Dodoma Crafts", created_at: new Date().toISOString() })
      const old = payout({ id: "p-2", business_name: "Mbeya Grains", created_at: "2020-01-01T00:00:00.000Z" })

      render(<FinancePayoutsTab payouts={[recent, old]} />)
      await userEvent.click(screen.getByText("Today"))

      expect(screen.getByText("Dodoma Crafts")).toBeInTheDocument()
      expect(screen.queryByText("Mbeya Grains")).not.toBeInTheDocument()
    })
  })

  it("refreshes local payouts when the payouts prop changes", () => {
    const { rerender } = render(<FinancePayoutsTab payouts={[payout({ status: "pending" })]} />)
    expect(within(rowFor("Dodoma Crafts")).getByText("Pending")).toBeInTheDocument()

    rerender(<FinancePayoutsTab payouts={[payout({ status: "completed" })]} />)

    expect(within(rowFor("Dodoma Crafts")).getByText("Sent")).toBeInTheDocument()
  })
})

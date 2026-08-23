/**
 * Tests for SecureFundsManagementTab (components/admin/escrow-management-tab.tsx).
 *
 * A pure, prop-driven view over a list of escrow transactions -- there is no
 * fetching and no mutation here, just derived totals (held vs released) and a
 * per-row summary. What's worth pinning: the empty state, the totals sum only
 * the matching status, and each row surfaces the right status label/date
 * depending on whether it has been released yet.
 */

import React from "react"
import { render, screen, within } from "@testing-library/react"
import { SecureFundsManagementTab } from "@/components/admin/escrow-management-tab"

function transaction(overrides: Record<string, unknown> = {}) {
  return {
    id: "tx-1",
    status: "held",
    amount: 50000,
    created_at: "2026-01-10T10:00:00.000Z",
    released_at: null,
    orders: { order_number: "ORD-1001" },
    shops: { name: "Dodoma Crafts" },
    ...overrides,
  }
}

/** The summary card identified by its CardTitle text ("Securely Held Funds" / "Settled Funds"). */
function summaryCard(title: string) {
  return screen.getByText(title).closest('[data-slot="card"]') as HTMLElement
}

describe("SecureFundsManagementTab", () => {
  it("shows an empty state when there are no transactions", () => {
    render(<SecureFundsManagementTab transactions={[]} />)

    expect(screen.getByText("No transaction records")).toBeInTheDocument()
  })

  it("shows zeroed totals when there are no transactions", () => {
    render(<SecureFundsManagementTab transactions={[]} />)

    expect(within(summaryCard("Securely Held Funds")).getByText("TZS 0")).toBeInTheDocument()
    expect(within(summaryCard("Settled Funds")).getByText("TZS 0")).toBeInTheDocument()
  })

  it("renders a held transaction with its reference, merchant and amount", () => {
    render(<SecureFundsManagementTab transactions={[transaction()]} />)

    expect(screen.getByText("Ref #ORD-1001")).toBeInTheDocument()
    expect(screen.getByText("Merchant: Dodoma Crafts")).toBeInTheDocument()
    const row = screen.getByText("Ref #ORD-1001").closest('[data-slot="card"]') as HTMLElement
    expect(within(row).getByText("TZS 50,000")).toBeInTheDocument()
    expect(screen.getByText("Protected")).toBeInTheDocument()
  })

  it("shows 'Secured' as the status for a held transaction with no released_at", () => {
    render(<SecureFundsManagementTab transactions={[transaction()]} />)

    expect(screen.getByText("Secured")).toBeInTheDocument()
  })

  it("shows the released date for a released transaction", () => {
    const released = transaction({
      id: "tx-2",
      status: "released",
      released_at: "2026-01-15T10:00:00.000Z",
    })
    render(<SecureFundsManagementTab transactions={[released]} />)

    expect(screen.getByText("released")).toBeInTheDocument()
    expect(screen.getByText("Settled On")).toBeInTheDocument()
    expect(screen.getByText(new Date("2026-01-15T10:00:00.000Z").toLocaleDateString())).toBeInTheDocument()
  })

  it("shows a dash for a refunded transaction with no released date", () => {
    const refunded = transaction({ id: "tx-3", status: "refunded" })
    render(<SecureFundsManagementTab transactions={[refunded]} />)

    expect(screen.getByText("refunded")).toBeInTheDocument()
    expect(screen.getByText("-")).toBeInTheDocument()
  })

  it("sums held and released amounts independently across multiple transactions", () => {
    render(
      <SecureFundsManagementTab
        transactions={[
          transaction({ id: "tx-1", status: "held", amount: 30000 }),
          transaction({ id: "tx-2", status: "held", amount: 20000 }),
          transaction({ id: "tx-3", status: "released", amount: 15000 }),
        ]}
      />,
    )

    expect(within(summaryCard("Securely Held Funds")).getByText("TZS 50,000")).toBeInTheDocument()
    expect(within(summaryCard("Settled Funds")).getByText("TZS 15,000")).toBeInTheDocument()
  })

  it("renders one card per transaction", () => {
    render(
      <SecureFundsManagementTab
        transactions={[
          transaction({ id: "tx-1", orders: { order_number: "ORD-1" } }),
          transaction({ id: "tx-2", orders: { order_number: "ORD-2" } }),
        ]}
      />,
    )

    expect(screen.getByText("Ref #ORD-1")).toBeInTheDocument()
    expect(screen.getByText("Ref #ORD-2")).toBeInTheDocument()
  })

  it("does not render the empty state when transactions are present", () => {
    render(<SecureFundsManagementTab transactions={[transaction()]} />)

    expect(screen.queryByText("No transaction records")).not.toBeInTheDocument()
  })

  it("scopes the created date to its own row", () => {
    render(<SecureFundsManagementTab transactions={[transaction()]} />)

    const row = screen.getByText("Ref #ORD-1001").closest('[data-slot="card"]') as HTMLElement
    expect(within(row).getByText(new Date("2026-01-10T10:00:00.000Z").toLocaleDateString())).toBeInTheDocument()
  })
})

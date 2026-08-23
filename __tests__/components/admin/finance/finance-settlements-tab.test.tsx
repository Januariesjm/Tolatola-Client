/**
 * Tests for FinanceSettlementsTab (components/admin/finance/finance-settlements-tab.tsx).
 *
 * A pure, prop-driven view over escrow transactions, grouped by order id (or
 * transaction id when there's no order) so that multiple shop line items on
 * the same order collapse into one settlement row. What's worth pinning: the
 * grouping/summing logic, the "any held part makes the whole settlement
 * held" rule, the three status totals, and search/status filtering over the
 * grouped records.
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
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FinanceSettlementsTab } from "@/components/admin/finance/finance-settlements-tab"

function transaction(overrides: Record<string, unknown> = {}) {
  return {
    id: "tx-1",
    order_id: "o-1",
    status: "held",
    amount: 25000,
    created_at: "2026-01-10T08:30:00.000Z",
    released_at: null,
    orders: { order_number: "ORD-1001" },
    shops: { name: "Dodoma Crafts" },
    ...overrides,
  }
}

function summaryCard(title: string) {
  const heading = screen.getByText(title, { selector: '[data-slot="card-title"]' })
  return heading.closest('[data-slot="card"]') as HTMLElement
}

describe("FinanceSettlementsTab", () => {
  it("shows an empty state when there are no transactions", () => {
    render(<FinanceSettlementsTab transactions={[]} />)

    expect(screen.getByText("No settlement records")).toBeInTheDocument()
  })

  it("shows zeroed totals when there are no transactions", () => {
    render(<FinanceSettlementsTab transactions={[]} />)

    expect(within(summaryCard("Pending Settlement")).getByText("TZS 0")).toBeInTheDocument()
    expect(within(summaryCard("Settled")).getByText("TZS 0")).toBeInTheDocument()
    expect(within(summaryCard("Refunded")).getByText("TZS 0")).toBeInTheDocument()
  })

  it("renders a settlement row with order ref, merchant, amount and 'Pending' label for held funds", () => {
    render(<FinanceSettlementsTab transactions={[transaction()]} />)

    expect(screen.getByText("Order #ORD-1001")).toBeInTheDocument()
    expect(screen.getByText("Merchant: Dodoma Crafts")).toBeInTheDocument()
    const row = screen.getByText("Order #ORD-1001").closest('[data-slot="card"]') as HTMLElement
    expect(within(row).getByText("TZS 25,000")).toBeInTheDocument()
    expect(within(row).getByText("Pending")).toBeInTheDocument()
  })

  it("groups multiple transaction rows for the same order into one, summing amounts and merging shop names", () => {
    render(
      <FinanceSettlementsTab
        transactions={[
          transaction({ id: "tx-1", order_id: "o-1", amount: 10000, shops: { name: "Dodoma Crafts" } }),
          transaction({ id: "tx-2", order_id: "o-1", amount: 5000, shops: { name: "Mbeya Grains" } }),
        ]}
      />,
    )

    expect(screen.getAllByText("Order #ORD-1001")).toHaveLength(1)
    expect(screen.getByText("Merchant: Dodoma Crafts, Mbeya Grains")).toBeInTheDocument()
    const row = screen.getByText("Order #ORD-1001").closest('[data-slot="card"]') as HTMLElement
    expect(within(row).getByText("TZS 15,000")).toBeInTheDocument()
  })

  it("marks the grouped settlement as held if any part of it is held, even if another part released", () => {
    render(
      <FinanceSettlementsTab
        transactions={[
          transaction({ id: "tx-1", order_id: "o-1", status: "released" }),
          transaction({ id: "tx-2", order_id: "o-1", status: "held" }),
        ]}
      />,
    )

    const row = screen.getByText("Order #ORD-1001").closest('[data-slot="card"]') as HTMLElement
    expect(within(row).getByText("Pending")).toBeInTheDocument()
  })

  it("shows the released date for a settled transaction", () => {
    render(<FinanceSettlementsTab transactions={[transaction({ status: "released", released_at: "2026-01-15T10:00:00.000Z" })]} />)

    const row = screen.getByText("Order #ORD-1001").closest('[data-slot="card"]') as HTMLElement
    expect(within(row).getByText("Settled")).toBeInTheDocument()
    expect(within(row).getByText("Settled On")).toBeInTheDocument()
  })

  it("shows a refunded badge without a settled-on date", () => {
    render(<FinanceSettlementsTab transactions={[transaction({ status: "refunded" })]} />)

    const row = screen.getByText("Order #ORD-1001").closest('[data-slot="card"]') as HTMLElement
    expect(within(row).getByText("Refunded")).toBeInTheDocument()
    expect(within(row).queryByText("Settled On")).not.toBeInTheDocument()
  })

  it("falls back to a dash order number and N/A merchant when missing", () => {
    render(<FinanceSettlementsTab transactions={[transaction({ orders: undefined, shops: undefined })]} />)

    expect(screen.getByText("Order #—")).toBeInTheDocument()
    expect(screen.getByText("Merchant: N/A")).toBeInTheDocument()
  })

  it("sums each status into its own summary total across grouped settlements", () => {
    render(
      <FinanceSettlementsTab
        transactions={[
          transaction({ id: "tx-1", order_id: "o-1", status: "held", amount: 10000 }),
          transaction({ id: "tx-2", order_id: "o-2", status: "held", amount: 20000, orders: { order_number: "ORD-2002" } }),
          transaction({ id: "tx-3", order_id: "o-3", status: "released", amount: 5000, orders: { order_number: "ORD-3003" } }),
        ]}
      />,
    )

    expect(within(summaryCard("Pending Settlement")).getByText("TZS 30,000")).toBeInTheDocument()
    expect(within(summaryCard("Pending Settlement")).getByText("2 orders")).toBeInTheDocument()
    expect(within(summaryCard("Settled")).getByText("TZS 5,000")).toBeInTheDocument()
  })

  describe("search and status filter", () => {
    const second = transaction({
      id: "tx-2",
      order_id: "o-2",
      status: "released",
      orders: { order_number: "ORD-2002" },
      shops: { name: "Mbeya Grains" },
    })

    it("filters by order number", async () => {
      render(<FinanceSettlementsTab transactions={[transaction(), second]} />)

      await userEvent.type(screen.getByPlaceholderText(/search order/i), "2002")

      expect(screen.getByText("Order #ORD-2002")).toBeInTheDocument()
      expect(screen.queryByText("Order #ORD-1001")).not.toBeInTheDocument()
    })

    it("filters by shop name", async () => {
      render(<FinanceSettlementsTab transactions={[transaction(), second]} />)

      await userEvent.type(screen.getByPlaceholderText(/search order/i), "mbeya")

      expect(screen.getByText("Order #ORD-2002")).toBeInTheDocument()
      expect(screen.queryByText("Order #ORD-1001")).not.toBeInTheDocument()
    })

    it("filters by status via the dropdown", async () => {
      render(<FinanceSettlementsTab transactions={[transaction(), second]} />)

      await userEvent.click(screen.getByRole("button", { name: /^All$/i }))
      await userEvent.click(await screen.findByRole("menuitemcheckbox", { name: "Settled" }))

      expect(screen.getByText("Order #ORD-2002")).toBeInTheDocument()
      expect(screen.queryByText("Order #ORD-1001")).not.toBeInTheDocument()
    })

    it("shows the empty state when nothing matches", async () => {
      render(<FinanceSettlementsTab transactions={[transaction()]} />)

      await userEvent.type(screen.getByPlaceholderText(/search order/i), "no-such-order")

      expect(screen.getByText("No settlement records")).toBeInTheDocument()
    })
  })

  describe("date range filter", () => {
    it("excludes transactions created before the selected period", async () => {
      const recent = transaction({ id: "tx-1", order_id: "o-1", created_at: new Date().toISOString() })
      const old = transaction({
        id: "tx-2",
        order_id: "o-2",
        created_at: "2020-01-01T00:00:00.000Z",
        orders: { order_number: "ORD-2002" },
      })

      render(<FinanceSettlementsTab transactions={[recent, old]} />)
      await userEvent.click(screen.getByText("Today"))

      expect(screen.getByText("Order #ORD-1001")).toBeInTheDocument()
      expect(screen.queryByText("Order #ORD-2002")).not.toBeInTheDocument()
    })
  })
})

/**
 * Tests for FinanceCollectionsTab (components/admin/finance/finance-collections-tab.tsx).
 *
 * A pure, prop-driven view deriving incoming-payment records from orders.
 * Three filters compose: a date-range filter (tested separately), a payment
 * status dropdown, and free-text search. What's worth pinning: the three
 * summary totals only sum their own payment status, the filters compose
 * (AND), and the empty state shows once nothing matches.
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
import { FinanceCollectionsTab } from "@/components/admin/finance/finance-collections-tab"

function order(overrides: Record<string, unknown> = {}) {
  return {
    id: "o-1",
    order_number: "ORD-1001",
    status: "pending",
    payment_status: "paid",
    payment_method: "mobile-money",
    total_amount: 25000,
    created_at: "2026-01-10T08:30:00.000Z",
    users: { full_name: "Asha Mwinyi", phone: "0700000001" },
    order_items: [{ products: { shops: { name: "Dodoma Crafts" } } }],
    ...overrides,
  }
}

function summaryCard(title: string) {
  const heading = screen.getByText(title, { selector: '[data-slot="card-title"]' })
  return heading.closest('[data-slot="card"]') as HTMLElement
}

describe("FinanceCollectionsTab", () => {
  it("shows an empty state when there are no orders", () => {
    render(<FinanceCollectionsTab orders={[]} />)

    expect(screen.getByText("No collection records")).toBeInTheDocument()
  })

  it("shows zeroed summary totals when there are no orders", () => {
    render(<FinanceCollectionsTab orders={[]} />)

    expect(within(summaryCard("Successful")).getByText("TZS 0")).toBeInTheDocument()
    expect(within(summaryCard("Pending")).getByText("TZS 0")).toBeInTheDocument()
    expect(within(summaryCard("Failed")).getByText("TZS 0")).toBeInTheDocument()
  })

  it("renders a collection row with order ref, customer, source and amount", () => {
    render(<FinanceCollectionsTab orders={[order()]} />)

    expect(screen.getByText("#ORD-1001")).toBeInTheDocument()
    expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument()
    expect(screen.getByText("0700000001")).toBeInTheDocument()
    expect(screen.getByText("Shop: Dodoma Crafts")).toBeInTheDocument()
    expect(screen.getByText("mobile money")).toBeInTheDocument()
    const row = screen.getByText("#ORD-1001").closest("tr") as HTMLElement
    expect(within(row).getByText("TZS 25,000")).toBeInTheDocument()
    expect(within(row).getByText("Success")).toBeInTheDocument()
  })

  it("falls back to Guest, dash phone and N/A vendor when missing", () => {
    render(<FinanceCollectionsTab orders={[order({ users: undefined, shipping_address: undefined, order_items: [] })]} />)

    expect(screen.getByText("Guest")).toBeInTheDocument()
    expect(screen.getByText(/Shop: N\/A/)).toBeInTheDocument()
  })

  it("sums each payment status into its own summary total", () => {
    render(
      <FinanceCollectionsTab
        orders={[
          order({ id: "o-1", payment_status: "paid", total_amount: 10000 }),
          order({ id: "o-2", payment_status: "paid", total_amount: 20000 }),
          order({ id: "o-3", payment_status: "pending", total_amount: 5000 }),
          order({ id: "o-4", payment_status: "failed", total_amount: 3000 }),
        ]}
      />,
    )

    expect(within(summaryCard("Successful")).getByText("TZS 30,000")).toBeInTheDocument()
    expect(within(summaryCard("Successful")).getByText("2 payments")).toBeInTheDocument()
    expect(within(summaryCard("Pending")).getByText("TZS 5,000")).toBeInTheDocument()
    expect(within(summaryCard("Failed")).getByText("TZS 3,000")).toBeInTheDocument()
  })

  it("shows a failed status badge with capitalized label", () => {
    render(<FinanceCollectionsTab orders={[order({ payment_status: "failed" })]} />)

    const row = screen.getByText("#ORD-1001").closest("tr") as HTMLElement
    expect(within(row).getByText("Failed")).toBeInTheDocument()
  })

  describe("search", () => {
    const second = order({
      id: "o-2",
      order_number: "ORD-2002",
      users: { full_name: "Baraka John", phone: "0711111111" },
      order_items: [{ products: { shops: { name: "Mbeya Grains" } } }],
    })

    it("filters by order number", async () => {
      render(<FinanceCollectionsTab orders={[order(), second]} />)

      await userEvent.type(screen.getByPlaceholderText(/search order/i), "2002")

      expect(screen.getByText("#ORD-2002")).toBeInTheDocument()
      expect(screen.queryByText("#ORD-1001")).not.toBeInTheDocument()
    })

    it("filters by customer phone", async () => {
      render(<FinanceCollectionsTab orders={[order(), second]} />)

      await userEvent.type(screen.getByPlaceholderText(/search order/i), "0711111111")

      expect(screen.getByText("#ORD-2002")).toBeInTheDocument()
      expect(screen.queryByText("#ORD-1001")).not.toBeInTheDocument()
    })

    it("filters by vendor name", async () => {
      render(<FinanceCollectionsTab orders={[order(), second]} />)

      await userEvent.type(screen.getByPlaceholderText(/search order/i), "mbeya")

      expect(screen.getByText("#ORD-2002")).toBeInTheDocument()
      expect(screen.queryByText("#ORD-1001")).not.toBeInTheDocument()
    })

    it("shows the empty state when the search matches nothing", async () => {
      render(<FinanceCollectionsTab orders={[order()]} />)

      await userEvent.type(screen.getByPlaceholderText(/search order/i), "no-such-order")

      expect(screen.getByText("No collection records")).toBeInTheDocument()
    })
  })

  describe("payment status filter", () => {
    it("narrows the table to only the selected status", async () => {
      render(
        <FinanceCollectionsTab
          orders={[
            order({ id: "o-1", order_number: "ORD-1001", payment_status: "paid" }),
            order({ id: "o-2", order_number: "ORD-2002", payment_status: "failed" }),
          ]}
        />,
      )

      await userEvent.click(screen.getByRole("button", { name: /^All$/i }))
      await userEvent.click(await screen.findByRole("menuitemcheckbox", { name: "Failed" }))

      expect(screen.getByText("#ORD-2002")).toBeInTheDocument()
      expect(screen.queryByText("#ORD-1001")).not.toBeInTheDocument()
    })

    it("recalculates summary totals based on the filtered set", async () => {
      render(
        <FinanceCollectionsTab
          orders={[
            order({ id: "o-1", order_number: "ORD-1001", payment_status: "paid", total_amount: 10000 }),
            order({ id: "o-2", order_number: "ORD-2002", payment_status: "failed", total_amount: 5000 }),
          ]}
        />,
      )

      await userEvent.click(screen.getByRole("button", { name: /^All$/i }))
      await userEvent.click(await screen.findByRole("menuitemcheckbox", { name: "Paid" }))

      expect(within(summaryCard("Successful")).getByText("TZS 10,000")).toBeInTheDocument()
      expect(within(summaryCard("Failed")).getByText("TZS 0")).toBeInTheDocument()
    })
  })

  describe("date range filter", () => {
    it("excludes orders created before the selected period", async () => {
      const recent = order({ id: "o-1", order_number: "ORD-1001", created_at: new Date().toISOString() })
      const old = order({ id: "o-2", order_number: "ORD-2002", created_at: "2020-01-01T00:00:00.000Z" })

      render(<FinanceCollectionsTab orders={[recent, old]} />)
      await userEvent.click(screen.getByText("Today"))

      expect(screen.getByText("#ORD-1001")).toBeInTheDocument()
      expect(screen.queryByText("#ORD-2002")).not.toBeInTheDocument()
    })
  })
})

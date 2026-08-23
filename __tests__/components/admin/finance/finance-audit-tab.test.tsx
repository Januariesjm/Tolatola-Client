/**
 * Tests for FinanceAuditTab (components/admin/finance/finance-audit-tab.tsx).
 *
 * A pure, prop-driven view that stitches together one audit timeline per
 * order from three independent lists (orders, escrow transactions, payouts).
 * What's worth pinning: each of the four timeline steps (Collection,
 * Settlement, Disbursement, Payout) derives the right status from the
 * matching records -- or their absence -- and the free-text search narrows
 * by order number, customer, and vendor.
 */

import React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { FinanceAuditTab } from "@/components/admin/finance/finance-audit-tab"

function order(overrides: Record<string, unknown> = {}) {
  return {
    id: "o-1",
    order_number: "ORD-1001",
    status: "pending",
    payment_status: "paid",
    payment_method: "mobile-money",
    total_amount: 25000,
    created_at: "2026-01-10T08:30:00.000Z",
    users: { full_name: "Asha Mwinyi" },
    order_items: [{ products: { shops: { name: "Dodoma Crafts" } } }],
    ...overrides,
  }
}

function transaction(overrides: Record<string, unknown> = {}) {
  return {
    id: "tx-1",
    order_id: "o-1",
    status: "held",
    amount: 25000,
    created_at: "2026-01-10T09:00:00.000Z",
    released_at: null,
    ...overrides,
  }
}

function payout(overrides: Record<string, unknown> = {}) {
  return {
    id: "p-1",
    order_id: "o-1",
    status: "completed",
    created_at: "2026-01-11T09:00:00.000Z",
    ...overrides,
  }
}

/** The audit card for one order, scoped by its order number heading. */
function cardFor(orderNumber: string) {
  return screen.getByText(`Order #${orderNumber}`).closest('[data-slot="card"]') as HTMLElement
}

describe("FinanceAuditTab", () => {
  it("shows an empty state when there are no orders", () => {
    render(<FinanceAuditTab orders={[]} transactions={[]} payouts={[]} />)

    expect(screen.getByText("No audit records")).toBeInTheDocument()
  })

  it("renders the order header with customer, vendor, and amount", () => {
    render(<FinanceAuditTab orders={[order()]} transactions={[]} payouts={[]} />)

    expect(screen.getByText("Order #ORD-1001")).toBeInTheDocument()
    expect(screen.getByText(/Asha Mwinyi/)).toBeInTheDocument()
    expect(screen.getByText(/Dodoma Crafts/)).toBeInTheDocument()
    expect(screen.getByText("TZS 25,000")).toBeInTheDocument()
  })

  it("falls back to Guest and N/A when there is no customer or vendor", () => {
    render(
      <FinanceAuditTab
        orders={[order({ users: undefined, shipping_address: undefined, order_items: [] })]}
        transactions={[]}
        payouts={[]}
      />,
    )

    expect(screen.getByText(/Guest/)).toBeInTheDocument()
    expect(screen.getByText(/N\/A/)).toBeInTheDocument()
  })

  describe("Collection step", () => {
    it("is a success with the payment method when paid", () => {
      render(<FinanceAuditTab orders={[order({ payment_status: "paid" })]} transactions={[]} payouts={[]} />)

      const card = cardFor("ORD-1001")
      expect(within(card).getByText(/TZS 25,000 via mobile money/)).toBeInTheDocument()
    })

    it("shows a failure when the payment failed", () => {
      render(<FinanceAuditTab orders={[order({ payment_status: "failed" })]} transactions={[]} payouts={[]} />)

      expect(within(cardFor("ORD-1001")).getByText("Payment failed")).toBeInTheDocument()
    })

    it("shows pending copy while awaiting payment", () => {
      render(<FinanceAuditTab orders={[order({ payment_status: "pending" })]} transactions={[]} payouts={[]} />)

      expect(within(cardFor("ORD-1001")).getByText("Awaiting payment")).toBeInTheDocument()
    })
  })

  describe("Settlement step", () => {
    it("is a success with the settled date when the escrow record was released", () => {
      render(
        <FinanceAuditTab
          orders={[order()]}
          transactions={[transaction({ status: "released", released_at: "2026-01-12T00:00:00.000Z" })]}
          payouts={[]}
        />,
      )

      expect(within(cardFor("ORD-1001")).getByText(/Settled on/)).toBeInTheDocument()
    })

    it("shows a refund message when the escrow record was refunded", () => {
      render(<FinanceAuditTab orders={[order()]} transactions={[transaction({ status: "refunded" })]} payouts={[]} />)

      expect(within(cardFor("ORD-1001")).getByText("Funds refunded")).toBeInTheDocument()
    })

    it("shows the held amount while the escrow record is pending", () => {
      render(<FinanceAuditTab orders={[order()]} transactions={[transaction({ status: "held", amount: 25000 })]} payouts={[]} />)

      expect(within(cardFor("ORD-1001")).getByText("TZS 25,000 held")).toBeInTheDocument()
    })

    it("shows 'Awaiting settlement' when the order is paid but no escrow record exists yet", () => {
      render(<FinanceAuditTab orders={[order({ payment_status: "paid" })]} transactions={[]} payouts={[]} />)

      expect(within(cardFor("ORD-1001")).getByText("Awaiting settlement")).toBeInTheDocument()
    })

    it("marks settlement as not applicable when the order was never paid and has no escrow record", () => {
      render(<FinanceAuditTab orders={[order({ payment_status: "pending" })]} transactions={[]} payouts={[]} />)

      const notApplicable = within(cardFor("ORD-1001")).getAllByText("Not applicable")
      expect(notApplicable.length).toBeGreaterThan(0)
    })
  })

  describe("Disbursement step", () => {
    it("is a success once the order is delivered and paid", () => {
      render(<FinanceAuditTab orders={[order({ status: "delivered", payment_status: "paid" })]} transactions={[]} payouts={[]} />)

      expect(within(cardFor("ORD-1001")).getByText("Revenue split calculated")).toBeInTheDocument()
    })

    it("is pending while paid but not yet delivered", () => {
      render(<FinanceAuditTab orders={[order({ status: "shipped", payment_status: "paid" })]} transactions={[]} payouts={[]} />)

      expect(within(cardFor("ORD-1001")).getByText("Pending delivery confirmation")).toBeInTheDocument()
    })

    it("is not applicable when the order was never paid", () => {
      render(<FinanceAuditTab orders={[order({ status: "cancelled", payment_status: "failed" })]} transactions={[]} payouts={[]} />)

      const notApplicable = within(cardFor("ORD-1001")).getAllByText("Not applicable")
      expect(notApplicable.length).toBeGreaterThan(0)
    })
  })

  describe("Payout step", () => {
    it("is a success once all payouts for the order are completed", () => {
      render(
        <FinanceAuditTab
          orders={[order({ status: "delivered", payment_status: "paid" })]}
          transactions={[]}
          payouts={[payout({ status: "completed" })]}
        />,
      )

      expect(within(cardFor("ORD-1001")).getByText("1 payout(s) sent")).toBeInTheDocument()
    })

    it("flags a failure when any payout for the order failed", () => {
      render(
        <FinanceAuditTab
          orders={[order({ status: "delivered", payment_status: "paid" })]}
          transactions={[]}
          payouts={[payout({ id: "p-1", status: "completed" }), payout({ id: "p-2", status: "failed" })]}
        />,
      )

      expect(within(cardFor("ORD-1001")).getByText("Payout failed")).toBeInTheDocument()
    })

    it("shows the pending count while payouts are outstanding", () => {
      render(
        <FinanceAuditTab
          orders={[order({ status: "delivered", payment_status: "paid" })]}
          transactions={[]}
          payouts={[payout({ status: "pending" })]}
        />,
      )

      expect(within(cardFor("ORD-1001")).getByText("1 payout(s) pending")).toBeInTheDocument()
    })

    it("shows 'Awaiting payout processing' when disbursed but no payout record exists yet", () => {
      render(<FinanceAuditTab orders={[order({ status: "delivered", payment_status: "paid" })]} transactions={[]} payouts={[]} />)

      expect(within(cardFor("ORD-1001")).getByText("Awaiting payout processing")).toBeInTheDocument()
    })

    it("is not applicable when the order has not been disbursed and has no payout record", () => {
      render(<FinanceAuditTab orders={[order({ status: "pending", payment_status: "pending" })]} transactions={[]} payouts={[]} />)

      const notApplicable = within(cardFor("ORD-1001")).getAllByText("Not applicable")
      expect(notApplicable.length).toBeGreaterThan(0)
    })
  })

  describe("search", () => {
    const second = order({
      id: "o-2",
      order_number: "ORD-2002",
      users: { full_name: "Baraka John" },
      order_items: [{ products: { shops: { name: "Mbeya Grains" } } }],
    })

    it("filters by order number", async () => {
      render(<FinanceAuditTab orders={[order(), second]} transactions={[]} payouts={[]} />)

      await userEvent.type(screen.getByPlaceholderText(/search order/i), "2002")

      expect(screen.getByText("Order #ORD-2002")).toBeInTheDocument()
      expect(screen.queryByText("Order #ORD-1001")).not.toBeInTheDocument()
    })

    it("filters by customer name", async () => {
      render(<FinanceAuditTab orders={[order(), second]} transactions={[]} payouts={[]} />)

      await userEvent.type(screen.getByPlaceholderText(/search order/i), "baraka")

      expect(screen.getByText("Order #ORD-2002")).toBeInTheDocument()
      expect(screen.queryByText("Order #ORD-1001")).not.toBeInTheDocument()
    })

    it("filters by vendor name", async () => {
      render(<FinanceAuditTab orders={[order(), second]} transactions={[]} payouts={[]} />)

      await userEvent.type(screen.getByPlaceholderText(/search order/i), "mbeya")

      expect(screen.getByText("Order #ORD-2002")).toBeInTheDocument()
      expect(screen.queryByText("Order #ORD-1001")).not.toBeInTheDocument()
    })

    it("shows the no-match empty state when the search matches nothing", async () => {
      render(<FinanceAuditTab orders={[order()]} transactions={[]} payouts={[]} />)

      await userEvent.type(screen.getByPlaceholderText(/search order/i), "no-such-order")

      expect(screen.getByText("No audit records")).toBeInTheDocument()
      expect(screen.getByText("No orders match your search query.")).toBeInTheDocument()
    })
  })
})

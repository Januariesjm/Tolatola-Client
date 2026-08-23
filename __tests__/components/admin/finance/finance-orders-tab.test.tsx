/**
 * Tests for FinanceOrdersTab (components/admin/finance/finance-orders-tab.tsx).
 *
 * A pure, prop-driven view listing orders with a collapsible revenue
 * breakdown per row. What's worth pinning: the summary row renders and
 * toggles its expanded detail on click, the revenue split math
 * (TOLA_COMMISSION_RATE = 0.1, DELIVERY_FEE_SHARE_RATE = 0.85) is correct in
 * the expanded panel, the escrow lookup by order id feeds the "Escrow"
 * field, and search/status filters compose.
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
import { FinanceOrdersTab } from "@/components/admin/finance/finance-orders-tab"

function order(overrides: Record<string, unknown> = {}) {
  return {
    id: "o-1",
    order_number: "ORD-1001",
    status: "delivered",
    payment_status: "paid",
    payment_method: "mobile-money",
    total_amount: 20000,
    delivery_fee: 2000,
    created_at: "2026-01-10T08:30:00.000Z",
    users: { full_name: "Asha Mwinyi", email: "asha@example.com", phone: "0700000001" },
    shipping_address: { ward: "Kikuyu" },
    order_items: [{ products: { shops: { name: "Dodoma Crafts", phone: "0755000000" } } }],
    transporter_assignments: [{ status: "delivered", transporters: { business_name: "Juma Transport" } }],
    transporter_status: undefined,
    ...overrides,
  }
}

describe("FinanceOrdersTab", () => {
  it("shows the empty state when there are no orders", () => {
    render(<FinanceOrdersTab orders={[]} transactions={[]} payouts={[]} />)

    expect(screen.getByText("No orders found")).toBeInTheDocument()
    expect(screen.getByText("There are currently no orders in the system.")).toBeInTheDocument()
  })

  it("renders the summary row with order number, status, payment status and total, collapsed by default", () => {
    render(<FinanceOrdersTab orders={[order()]} transactions={[]} payouts={[]} />)

    expect(screen.getByText("#ORD-1001")).toBeInTheDocument()
    expect(screen.getByText("delivered")).toBeInTheDocument()
    expect(screen.getByText("paid")).toBeInTheDocument()
    expect(screen.getByText("TZS 20,000")).toBeInTheDocument()
    expect(screen.queryByText("Revenue Breakdown")).not.toBeInTheDocument()
  })

  it("expands to show customer, merchant, driver and payment/escrow details on click", async () => {
    render(<FinanceOrdersTab orders={[order()]} transactions={[{ order_id: "o-1", status: "held" }]} payouts={[]} />)

    await userEvent.click(screen.getByText("#ORD-1001"))

    expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument()
    expect(screen.getByText("asha@example.com")).toBeInTheDocument()
    expect(screen.getByText("Dodoma Crafts")).toBeInTheDocument()
    expect(screen.getByText("Juma Transport")).toBeInTheDocument()
    expect(screen.getByText("held")).toBeInTheDocument()
    expect(screen.getByText("Kikuyu")).toBeInTheDocument()
  })

  it("shows 'None' for escrow when no matching transaction exists", async () => {
    render(<FinanceOrdersTab orders={[order()]} transactions={[]} payouts={[]} />)

    await userEvent.click(screen.getByText("#ORD-1001"))

    expect(screen.getByText("None")).toBeInTheDocument()
  })

  it("collapses again when clicked a second time", async () => {
    render(<FinanceOrdersTab orders={[order()]} transactions={[]} payouts={[]} />)

    await userEvent.click(screen.getByText("#ORD-1001"))
    expect(screen.getByText("Revenue Breakdown")).toBeInTheDocument()

    await userEvent.click(screen.getByText("#ORD-1001"))
    expect(screen.queryByText("Revenue Breakdown")).not.toBeInTheDocument()
  })

  it("computes the revenue breakdown for the expanded order", async () => {
    // total 20000, deliveryFee 2000 -> productRevenue 18000
    // tolaCommission (product) = 1800, vendorShare = 16200
    // transporterShare = 2000 * 0.85 = 1700, tolaDeliveryShare = 300
    // combined tolaCommission = 1800 + 300 = 2100
    render(<FinanceOrdersTab orders={[order()]} transactions={[]} payouts={[]} />)

    await userEvent.click(screen.getByText("#ORD-1001"))

    const breakdown = screen.getByText("Revenue Breakdown").parentElement as HTMLElement
    expect(within(breakdown).getByText("TZS 16,200")).toBeInTheDocument()
    expect(within(breakdown).getByText("TZS 1,700")).toBeInTheDocument()
    expect(within(breakdown).getByText("TZS 2,100")).toBeInTheDocument()
    expect(within(breakdown).getByText("TZS 2,000")).toBeInTheDocument()
  })

  it("falls back to Guest, N/A merchant and Unassigned driver when data is missing", async () => {
    render(
      <FinanceOrdersTab
        orders={[order({ users: undefined, shipping_address: undefined, order_items: [], transporter_assignments: [] })]}
        transactions={[]}
        payouts={[]}
      />,
    )

    await userEvent.click(screen.getByText("#ORD-1001"))

    expect(screen.getByText("Guest")).toBeInTheDocument()
    expect(screen.getByText("N/A")).toBeInTheDocument()
    expect(screen.getByText("Unassigned")).toBeInTheDocument()
  })

  it("shows a transporter status badge only when set", async () => {
    render(<FinanceOrdersTab orders={[order({ transporter_status: "in_transit" })]} transactions={[]} payouts={[]} />)

    await userEvent.click(screen.getByText("#ORD-1001"))

    expect(screen.getByText("in transit")).toBeInTheDocument()
  })

  describe("search and status filter", () => {
    const second = order({
      id: "o-2",
      order_number: "ORD-2002",
      status: "pending",
      users: { full_name: "Baraka John" },
      order_items: [{ products: { shops: { name: "Mbeya Grains" } } }],
    })

    it("filters by order number", async () => {
      render(<FinanceOrdersTab orders={[order(), second]} transactions={[]} payouts={[]} />)

      await userEvent.type(screen.getByPlaceholderText(/search order/i), "2002")

      expect(screen.getByText("#ORD-2002")).toBeInTheDocument()
      expect(screen.queryByText("#ORD-1001")).not.toBeInTheDocument()
    })

    it("filters by customer name", async () => {
      render(<FinanceOrdersTab orders={[order(), second]} transactions={[]} payouts={[]} />)

      await userEvent.type(screen.getByPlaceholderText(/search order/i), "baraka")

      expect(screen.getByText("#ORD-2002")).toBeInTheDocument()
      expect(screen.queryByText("#ORD-1001")).not.toBeInTheDocument()
    })

    it("filters by vendor name", async () => {
      render(<FinanceOrdersTab orders={[order(), second]} transactions={[]} payouts={[]} />)

      await userEvent.type(screen.getByPlaceholderText(/search order/i), "mbeya")

      expect(screen.getByText("#ORD-2002")).toBeInTheDocument()
      expect(screen.queryByText("#ORD-1001")).not.toBeInTheDocument()
    })

    it("filters by status via the dropdown", async () => {
      render(<FinanceOrdersTab orders={[order(), second]} transactions={[]} payouts={[]} />)

      await userEvent.click(screen.getByRole("button", { name: /All Status/i }))
      await userEvent.click(await screen.findByRole("menuitemcheckbox", { name: "Pending" }))

      expect(screen.getByText("#ORD-2002")).toBeInTheDocument()
      expect(screen.queryByText("#ORD-1001")).not.toBeInTheDocument()
    })

    it("shows the filtered empty state with 'Try adjusting your filters' copy", async () => {
      render(<FinanceOrdersTab orders={[order()]} transactions={[]} payouts={[]} />)

      await userEvent.type(screen.getByPlaceholderText(/search order/i), "no-such-order")

      expect(screen.getByText("No orders found")).toBeInTheDocument()
      expect(screen.getByText(/Try adjusting your filters/)).toBeInTheDocument()
    })
  })

  describe("date range filter", () => {
    it("excludes orders created before the selected period", async () => {
      const recent = order({ id: "o-1", order_number: "ORD-1001", created_at: new Date().toISOString() })
      const old = order({ id: "o-2", order_number: "ORD-2002", created_at: "2020-01-01T00:00:00.000Z" })

      render(<FinanceOrdersTab orders={[recent, old]} transactions={[]} payouts={[]} />)
      await userEvent.click(screen.getByText("Today"))

      expect(screen.getByText("#ORD-1001")).toBeInTheDocument()
      expect(screen.queryByText("#ORD-2002")).not.toBeInTheDocument()
    })
  })
})

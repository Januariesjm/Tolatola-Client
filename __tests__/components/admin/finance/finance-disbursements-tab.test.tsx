/**
 * Tests for FinanceDisbursementsTab (components/admin/finance/finance-disbursements-tab.tsx).
 *
 * A pure, prop-driven view that computes a revenue split (vendor / transporter
 * / TOLA commission) for every paid order using fixed constants
 * (TOLA_COMMISSION_RATE = 0.1, DELIVERY_FEE_TRANSPORTER_SHARE = 0.85). What's
 * worth pinning: the split math itself, the two distinct empty states (no
 * paid orders at all vs. filters excluding everything), and that search/status
 * filters compose and recompute the aggregate totals.
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
import { FinanceDisbursementsTab } from "@/components/admin/finance/finance-disbursements-tab"

function order(overrides: Record<string, unknown> = {}) {
  return {
    id: "o-1",
    order_number: "ORD-1001",
    status: "delivered",
    payment_status: "paid",
    total_amount: 20000,
    delivery_fee: 2000,
    created_at: "2026-01-10T08:30:00.000Z",
    order_items: [{ products: { shops: { name: "Dodoma Crafts" } } }],
    transporter_assignments: [{ status: "delivered", transporters: { business_name: "Juma Transport" } }],
    ...overrides,
  }
}

function summaryCard(title: string) {
  const heading = screen.getByText(title, { selector: '[data-slot="card-title"]' })
  return heading.closest('[data-slot="card"]') as HTMLElement
}

describe("FinanceDisbursementsTab", () => {
  it("shows the no-paid-orders empty state when nothing has been paid", () => {
    render(<FinanceDisbursementsTab orders={[order({ payment_status: "pending" })]} />)

    expect(screen.getByText("No disbursement data")).toBeInTheDocument()
    expect(screen.getByText("Revenue splits will appear once orders are paid.")).toBeInTheDocument()
  })

  it("excludes unpaid orders entirely, even from the totals", () => {
    render(<FinanceDisbursementsTab orders={[order({ payment_status: "pending" })]} />)

    expect(within(summaryCard("Total Revenue")).getByText("TZS 0")).toBeInTheDocument()
  })

  it("computes the vendor/transporter/TOLA split for a paid order", () => {
    // total 20000, deliveryFee 2000 -> productRevenue 18000
    // tolaProductCommission = 1800, vendorShare = 16200
    // transporterShare = 2000 * 0.85 = 1700, tolaDeliveryCommission = 300
    // totalTolaCommission = 1800 + 300 = 2100
    render(<FinanceDisbursementsTab orders={[order()]} />)

    const row = screen.getByText("#ORD-1001").closest("tr") as HTMLElement
    expect(within(row).getByText("TZS 20,000")).toBeInTheDocument()
    expect(within(row).getByText("TZS 16,200")).toBeInTheDocument()
    expect(within(row).getByText("TZS 1,700")).toBeInTheDocument()
    expect(within(row).getByText("TZS 2,100")).toBeInTheDocument()
  })

  it("aggregates the split across multiple paid orders and computes percentages", () => {
    render(
      <FinanceDisbursementsTab
        orders={[
          order({ id: "o-1", order_number: "ORD-1001", total_amount: 20000, delivery_fee: 2000 }),
          order({ id: "o-2", order_number: "ORD-2002", total_amount: 10000, delivery_fee: 1000 }),
        ]}
      />,
    )

    // Totals: total = 30000, vendorShare = 16200 + 8100 = 24300
    expect(within(summaryCard("Total Revenue")).getByText("TZS 30,000")).toBeInTheDocument()
    expect(within(summaryCard("Total Revenue")).getByText("2 paid orders")).toBeInTheDocument()
    expect(within(summaryCard("Vendor Share")).getByText("TZS 24,300")).toBeInTheDocument()
    expect(within(summaryCard("Vendor Share")).getByText("81.0% of total")).toBeInTheDocument()
  })

  it("shows the driver name from the active transporter assignment, or Unassigned", () => {
    render(<FinanceDisbursementsTab orders={[order({ transporter_assignments: [] })]} />)

    const row = screen.getByText("#ORD-1001").closest("tr") as HTMLElement
    expect(within(row).getByText("Unassigned")).toBeInTheDocument()
  })

  it("falls back to N/A vendor name when order items are missing", () => {
    render(<FinanceDisbursementsTab orders={[order({ order_items: [] })]} />)

    const row = screen.getByText("#ORD-1001").closest("tr") as HTMLElement
    expect(within(row).getByText("N/A")).toBeInTheDocument()
  })

  describe("search and status filter", () => {
    const second = order({
      id: "o-2",
      order_number: "ORD-2002",
      status: "shipped",
      order_items: [{ products: { shops: { name: "Mbeya Grains" } } }],
      transporter_assignments: [{ status: "in_transit", transporters: { business_name: "Baraka Rides" } }],
    })

    it("filters by order number", async () => {
      render(<FinanceDisbursementsTab orders={[order(), second]} />)

      await userEvent.type(screen.getByPlaceholderText(/search order/i), "2002")

      expect(screen.getByText("#ORD-2002")).toBeInTheDocument()
      expect(screen.queryByText("#ORD-1001")).not.toBeInTheDocument()
    })

    it("filters by vendor name", async () => {
      render(<FinanceDisbursementsTab orders={[order(), second]} />)

      await userEvent.type(screen.getByPlaceholderText(/search order/i), "mbeya")

      expect(screen.getByText("#ORD-2002")).toBeInTheDocument()
      expect(screen.queryByText("#ORD-1001")).not.toBeInTheDocument()
    })

    it("filters by driver name", async () => {
      render(<FinanceDisbursementsTab orders={[order(), second]} />)

      await userEvent.type(screen.getByPlaceholderText(/search order/i), "baraka rides")

      expect(screen.getByText("#ORD-2002")).toBeInTheDocument()
      expect(screen.queryByText("#ORD-1001")).not.toBeInTheDocument()
    })

    it("filters by order status via the dropdown", async () => {
      render(<FinanceDisbursementsTab orders={[order(), second]} />)

      await userEvent.click(screen.getByRole("button", { name: /All Status/i }))
      await userEvent.click(await screen.findByRole("menuitemcheckbox", { name: "Shipped" }))

      expect(screen.getByText("#ORD-2002")).toBeInTheDocument()
      expect(screen.queryByText("#ORD-1001")).not.toBeInTheDocument()
    })

    it("shows the no-matches empty state, distinct from the no-paid-orders state, when filters exclude everything", async () => {
      render(<FinanceDisbursementsTab orders={[order()]} />)

      await userEvent.type(screen.getByPlaceholderText(/search order/i), "no-such-order")

      expect(screen.getByText("No matches found")).toBeInTheDocument()
      expect(screen.getByText("Clear all filters")).toBeInTheDocument()
    })

    it("clears search and status filters via 'Clear all filters'", async () => {
      render(<FinanceDisbursementsTab orders={[order()]} />)

      await userEvent.type(screen.getByPlaceholderText(/search order/i), "no-such-order")
      await userEvent.click(screen.getByText("Clear all filters"))

      expect(screen.getByText("#ORD-1001")).toBeInTheDocument()
    })
  })

  describe("date range filter", () => {
    it("excludes orders created before the selected period from disbursements and totals", async () => {
      const recent = order({ id: "o-1", order_number: "ORD-1001", created_at: new Date().toISOString() })
      const old = order({ id: "o-2", order_number: "ORD-2002", created_at: "2020-01-01T00:00:00.000Z" })

      render(<FinanceDisbursementsTab orders={[recent, old]} />)
      await userEvent.click(screen.getByText("Today"))

      expect(screen.getByText("#ORD-1001")).toBeInTheDocument()
      expect(screen.queryByText("#ORD-2002")).not.toBeInTheDocument()
    })
  })
})

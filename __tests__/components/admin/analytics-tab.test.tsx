/**
 * Tests for AnalyticsTab (components/admin/analytics-tab.tsx).
 *
 * A pure, prop-driven dashboard -- no fetching, no mutation. `stats` feeds the
 * key-metric cards and most of the performance-indicator percentages
 * directly; `orders` and `payouts` are re-derived through the date-range
 * filter (components/admin/date-range-filter.tsx, tested separately) to
 * produce the Orders/GMV/Secure Hold/Payouts figures and the Order
 * Completion Rate / Average Order Value indicators. `vendorTypesAnalytics`
 * drives an optional per-vendor-type breakdown section.
 *
 * What's worth pinning: the key metrics render from `stats` (with sane
 * fallbacks for the optional customer counts), the filtered figures are
 * recomputed from `orders`/`payouts` rather than read off `stats` directly,
 * clicking a date-range button narrows those filtered figures, every
 * percentage guards its own division by zero, and the vendor-type section is
 * both conditionally rendered and correctly computed (including the label
 * fallback for an unrecognized vendor type).
 */

import React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AnalyticsTab } from "@/components/admin/analytics-tab"

function baseStats(overrides: Record<string, unknown> = {}) {
  return {
    totalVendors: 10,
    activeVendors: 8,
    totalCustomers: 50,
    activeCustomers: 40,
    totalProducts: 20,
    approvedProducts: 15,
    totalOrders: 100,
    completedOrders: 80,
    totalGMV: 500000,
    totalSecureHold: 100000,
    totalPayouts: 300000,
    totalTransporters: 5,
    activeTransporters: 4,
    approvedTransporters: 3,
    totalDeliveries: 40,
    completedDeliveries: 30,
    totalDeliveryFees: 80000,
    totalTransporterEarnings: 60000,
    ...overrides,
  }
}

function order(overrides: Record<string, unknown> = {}) {
  return {
    status: "pending",
    payment_status: "paid",
    total_amount: 1000,
    created_at: "2026-01-10T08:30:00.000Z",
    ...overrides,
  }
}

/** The performance-indicator row for a given label. */
function indicatorRow(label: string) {
  return screen.getByText(label).closest(".p-4.border.rounded-lg") as HTMLElement
}

/** The key-metric card whose CardTitle matches the given text. */
function metricCard(titleText: string) {
  return screen.getByText(titleText).closest('[data-slot="card"]') as HTMLElement
}

describe("AnalyticsTab", () => {
  it("renders the key metric cards from stats, with active customer count", () => {
    render(<AnalyticsTab stats={baseStats()} />)

    expect(within(metricCard("Vendors / Customers")).getByText("10")).toBeInTheDocument()
    expect(screen.getByText("8 active • 40 active customers")).toBeInTheDocument()
    expect(within(metricCard("Transporters")).getByText("5")).toBeInTheDocument()
    expect(screen.getByText("4 active")).toBeInTheDocument()
    expect(within(metricCard("Products")).getByText("20")).toBeInTheDocument()
    expect(screen.getByText("15 approved")).toBeInTheDocument()
    expect(within(metricCard("Deliveries")).getByText("40")).toBeInTheDocument()
    expect(screen.getByText("30 completed")).toBeInTheDocument()
    expect(within(metricCard("Transporter Earnings")).getByText("TZS 60,000")).toBeInTheDocument()
  })

  it("defaults active customers to 0 when totalCustomers/activeCustomers are omitted", () => {
    const stats = baseStats()
    delete (stats as any).totalCustomers
    delete (stats as any).activeCustomers
    render(<AnalyticsTab stats={stats} />)

    expect(screen.getByText("8 active • 0 active customers")).toBeInTheDocument()
  })

  it("derives Orders, GMV, Secure Hold and Payouts from the orders/payouts props rather than stats", () => {
    const orders = [
      order({ status: "delivered", payment_status: "paid", total_amount: 1000 }),
      order({ status: "pending", payment_status: "paid", total_amount: 2000 }),
      order({ status: "cancelled", payment_status: "paid", total_amount: 5000 }),
      order({ status: "pending", payment_status: "pending", total_amount: 9000 }),
    ]
    const payouts = [
      { amount: 300, created_at: "2026-01-10T08:30:00.000Z" },
      { amount: 400, created_at: "2026-01-10T08:30:00.000Z" },
    ]

    render(<AnalyticsTab stats={baseStats({ totalGMV: 999999 })} orders={orders} payouts={payouts} />)

    // Orders card: 4 total, 1 delivered ("completed").
    expect(within(metricCard("Orders")).getByText("4")).toBeInTheDocument()
    expect(within(metricCard("Orders")).getByText("1 completed")).toBeInTheDocument()

    // GMV: sum of paid orders only (1000 + 2000 + 5000 = 8000); the 9000
    // unpaid order is excluded.
    expect(within(metricCard("Gross Merchandise Value")).getByText("TZS 8,000")).toBeInTheDocument()

    // Secure hold: paid, not delivered, not cancelled -> only the 2000 order.
    expect(within(metricCard("Secure Hold Balance")).getByText("TZS 2,000")).toBeInTheDocument()

    // Payouts: 300 + 400.
    expect(within(metricCard("Vendor Payouts")).getByText("TZS 700")).toBeInTheDocument()
  })

  it("narrows the filtered figures when a date-range button is clicked", async () => {
    const recent = order({ status: "delivered", payment_status: "paid", total_amount: 1000, created_at: new Date().toISOString() })
    const old = order({ status: "delivered", payment_status: "paid", total_amount: 4000, created_at: "2020-01-01T00:00:00.000Z" })

    render(<AnalyticsTab stats={baseStats()} orders={[recent, old]} />)

    // Before filtering: both orders count.
    expect(within(metricCard("Orders")).getByText("2")).toBeInTheDocument()
    expect(within(metricCard("Gross Merchandise Value")).getByText("TZS 5,000")).toBeInTheDocument()

    await userEvent.click(screen.getByText("Today"))

    // After filtering to "today": only the recent order remains.
    expect(within(metricCard("Orders")).getByText("1")).toBeInTheDocument()
    expect(within(metricCard("Gross Merchandise Value")).getByText("TZS 1,000")).toBeInTheDocument()
    expect(within(metricCard("Gross Merchandise Value")).queryByText("TZS 5,000")).not.toBeInTheDocument()
  })

  it("computes the order completion rate and average order value from filtered orders", () => {
    const orders = [
      order({ status: "delivered", payment_status: "paid", total_amount: 3000 }),
      order({ status: "pending", payment_status: "paid", total_amount: 1000 }),
    ]
    render(<AnalyticsTab stats={baseStats()} orders={orders} />)

    // 1 of 2 delivered = 50%.
    expect(within(indicatorRow("Order Completion Rate")).getByText("50%")).toBeInTheDocument()

    // Average order value: (3000 + 1000) / 2 = 2000.
    expect(within(indicatorRow("Average Order Value")).getByText("TZS 2,000")).toBeInTheDocument()
  })

  it("shows 0% / TZS 0 for every performance indicator when the underlying totals are zero", () => {
    render(
      <AnalyticsTab
        stats={baseStats({
          totalProducts: 0,
          approvedProducts: 0,
          totalVendors: 0,
          activeVendors: 0,
          totalTransporters: 0,
          approvedTransporters: 0,
          totalDeliveries: 0,
          completedDeliveries: 0,
          totalDeliveryFees: 0,
        })}
        orders={[]}
      />,
    )

    expect(within(indicatorRow("Order Completion Rate")).getByText("0%")).toBeInTheDocument()
    expect(within(indicatorRow("Delivery Completion Rate")).getByText("0%")).toBeInTheDocument()
    expect(within(indicatorRow("Product Approval Rate")).getByText("0%")).toBeInTheDocument()
    expect(within(indicatorRow("Vendor Activation Rate")).getByText("0%")).toBeInTheDocument()
    expect(within(indicatorRow("Transporter Activation Rate")).getByText("0%")).toBeInTheDocument()
    expect(within(indicatorRow("Average Order Value")).getByText("TZS 0")).toBeInTheDocument()
    expect(within(indicatorRow("Average Delivery Fee")).getByText("TZS 0")).toBeInTheDocument()
  })

  it("computes non-zero delivery, product-approval, vendor and transporter activation rates from stats", () => {
    render(
      <AnalyticsTab
        stats={baseStats({
          totalDeliveries: 40,
          completedDeliveries: 30,
          totalProducts: 20,
          approvedProducts: 15,
          totalVendors: 10,
          activeVendors: 8,
          totalTransporters: 5,
          approvedTransporters: 3,
          totalDeliveryFees: 80000,
        })}
      />,
    )

    expect(within(indicatorRow("Delivery Completion Rate")).getByText("75%")).toBeInTheDocument()
    expect(within(indicatorRow("Product Approval Rate")).getByText("75%")).toBeInTheDocument()
    expect(within(indicatorRow("Vendor Activation Rate")).getByText("80%")).toBeInTheDocument()
    expect(within(indicatorRow("Transporter Activation Rate")).getByText("60%")).toBeInTheDocument()
    expect(within(indicatorRow("Average Delivery Fee")).getByText("TZS 2,000")).toBeInTheDocument()
  })

  it("does not render the vendor type analytics section when no vendor type data is provided", () => {
    render(<AnalyticsTab stats={baseStats()} />)

    expect(screen.queryByText("Vendor Type Analytics")).not.toBeInTheDocument()
  })

  it("renders a known vendor type with its friendly label and computed rates", () => {
    render(
      <AnalyticsTab
        stats={baseStats({ totalGMV: 10000 })}
        vendorTypesAnalytics={{
          producer: {
            count: 4,
            approvedCount: 2,
            totalProducts: 10,
            approvedProducts: 6,
            totalSales: 5000,
            completedSales: 3000,
            totalOrders: 8,
            completedOrders: 4,
            averageOrderValue: 625,
          },
        }}
      />,
    )

    expect(screen.getByText("Vendor Type Analytics")).toBeInTheDocument()
    const section = screen.getByText("Producer").closest(".border.rounded-lg.p-6") as HTMLElement
    expect(section).toBeInTheDocument()

    expect(within(section).getByText("4")).toBeInTheDocument() // Total Vendors
    expect(within(section).getByText("2")).toBeInTheDocument() // Approved Vendors
    expect(within(section).getByText("50% approval rate")).toBeInTheDocument()
    expect(within(section).getByText("TZS 5,000")).toBeInTheDocument() // Total Sales
    expect(within(section).getByText("3,000 completed")).toBeInTheDocument()
    // Order completion: 4/8 = 50%; Sales contribution: 5000/10000 = 50%.
    expect(within(section).getAllByText("50%")).toHaveLength(2)
  })

  it("falls back to the raw vendor type key when it has no known friendly label", () => {
    render(
      <AnalyticsTab
        stats={baseStats()}
        vendorTypesAnalytics={{
          importer: {
            count: 0,
            approvedCount: 0,
            totalProducts: 0,
            approvedProducts: 0,
            totalSales: 0,
            completedSales: 0,
            totalOrders: 0,
            completedOrders: 0,
            averageOrderValue: 0,
          },
        }}
      />,
    )

    expect(screen.getByText("importer")).toBeInTheDocument()
    const section = screen.getByText("importer").closest(".border.rounded-lg.p-6") as HTMLElement
    // Zero vendors in this type -> approval rate guards its division by zero.
    expect(within(section).getByText("0% approval rate")).toBeInTheDocument()
  })
})

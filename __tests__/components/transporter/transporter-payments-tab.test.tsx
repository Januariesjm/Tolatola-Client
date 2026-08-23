/**
 * Tests for TransporterPaymentsTab (components/transporter/transporter-payments-tab.tsx).
 *
 * Purely presentational: it renders the two balance summary cards from props
 * and a payment history list (or an empty state), with a status badge whose
 * label/icon depends on the payment's status.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import { TransporterPaymentsTab } from "@/components/transporter/transporter-payments-tab"

function payment(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "p-1",
    payment_type: "delivery",
    amount: 5000,
    status: "available",
    created_at: "2026-01-15T10:30:00.000Z",
    ...overrides,
  }
}

const baseProps = {
  payments: [] as unknown[],
  availableBalance: 7000,
  pendingBalance: 1500,
  transporterId: "t-1",
}

describe("TransporterPaymentsTab", () => {
  it("shows the available and pending balances", () => {
    render(<TransporterPaymentsTab {...baseProps} />)

    expect(screen.getByText("7,000 TZS")).toBeInTheDocument()
    expect(screen.getByText("1,500 TZS")).toBeInTheDocument()
    expect(screen.getByText("Ready to withdraw")).toBeInTheDocument()
    expect(screen.getByText("Being processed")).toBeInTheDocument()
  })

  it("shows the empty state when there are no payments", () => {
    render(<TransporterPaymentsTab {...baseProps} />)

    expect(screen.getByText("No payments yet")).toBeInTheDocument()
  })

  it("renders a payment's description, formatted amount, and date", () => {
    render(<TransporterPaymentsTab {...baseProps} payments={[payment({ description: "Order TOLA-1001 payout", amount: 12500 })]} />)

    expect(screen.getByText("Order TOLA-1001 payout")).toBeInTheDocument()
    expect(screen.getByText("+12,500 TZS")).toBeInTheDocument()
    expect(screen.getByText(new RegExp(new Date("2026-01-15T10:30:00.000Z").toLocaleDateString()))).toBeInTheDocument()
  })

  it("falls back to a '<type> payment' label when there is no description", () => {
    render(<TransporterPaymentsTab {...baseProps} payments={[payment({ payment_type: "bonus", description: undefined })]} />)

    expect(screen.getByText("bonus payment")).toBeInTheDocument()
  })

  it("shows a pending badge with a clock icon", () => {
    render(<TransporterPaymentsTab {...baseProps} payments={[payment({ status: "pending" })]} />)

    const badge = screen.getByText("Pending")
    expect(badge).toBeInTheDocument()
    expect(badge?.querySelector("svg.lucide-clock")).toBeInTheDocument()
  })

  it("shows an available badge with a check icon", () => {
    render(<TransporterPaymentsTab {...baseProps} payments={[payment({ status: "available" })]} />)

    const badge = screen.getByText("Available")
    expect(badge?.querySelector("svg.lucide-circle-check-big, svg.lucide-check-circle")).toBeInTheDocument()
  })

  it("shows a withdrawn badge with no icon", () => {
    render(<TransporterPaymentsTab {...baseProps} payments={[payment({ status: "withdrawn" })]} />)

    const badge = screen.getByText("Withdrawn")
    expect(badge?.querySelector("svg")).not.toBeInTheDocument()
  })

  it("renders multiple payments in the list", () => {
    render(
      <TransporterPaymentsTab
        {...baseProps}
        payments={[payment({ id: "p-1", amount: 1000 }), payment({ id: "p-2", amount: 2000, status: "pending" })]}
      />,
    )

    expect(screen.getByText("+1,000 TZS")).toBeInTheDocument()
    expect(screen.getByText("+2,000 TZS")).toBeInTheDocument()
  })
})

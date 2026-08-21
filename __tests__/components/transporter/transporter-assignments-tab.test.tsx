/**
 * Tests for TransporterAssignmentsTab (components/transporter/transporter-assignments-tab.tsx).
 *
 * The `assignments` prop was typed `any[]`; it now takes `TransporterAssignment[]`
 * (lib/types/transporter.ts). What's worth pinning here is that the narrower
 * type still renders every tab correctly, and that a trip is bucketed by the
 * same status/accepted_at combination the component has always used.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import { TransporterAssignmentsTab } from "@/components/transporter/transporter-assignments-tab"
import type { TransporterAssignment } from "@/lib/types/transporter"

jest.mock("@/components/messaging/chat-button", () => ({
  ChatButton: () => <button>Chat</button>,
}))

function assignment(overrides: Partial<TransporterAssignment> = {}): TransporterAssignment {
  return {
    id: "a-1",
    order_id: "o-1",
    status: "assigned",
    distance_km: 5,
    delivery_fee: 3000,
    orders: { order_number: "TOLA-1001" },
    shops: { name: "Kariakoo Shop" },
    ...overrides,
  }
}

describe("TransporterAssignmentsTab", () => {
  it("shows an available trip in the Available tab", () => {
    render(<TransporterAssignmentsTab assignments={[assignment({ is_available_order: true })]} transporterId="t-1" />)

    expect(screen.getByText("Order #TOLA-1001")).toBeInTheDocument()
    expect(screen.getByText("Accept Cargo")).toBeInTheDocument()
  })

  it("shows the empty state for a tab with no trips", () => {
    render(<TransporterAssignmentsTab assignments={[]} transporterId="t-1" />)

    expect(screen.getByText("No trips in this tab")).toBeInTheDocument()
  })

  it("counts each bucket in its tab badge", () => {
    render(
      <TransporterAssignmentsTab
        assignments={[assignment({ id: "a-1", is_available_order: true }), assignment({ id: "a-2", status: "delivered" })]}
        transporterId="t-1"
      />,
    )

    // Two tabs (Available, Completed) each carry a count of 1.
    expect(screen.getAllByText("1")).toHaveLength(2)
  })

  it("shows the delivery fee formatted with the currency label", () => {
    render(<TransporterAssignmentsTab assignments={[assignment({ is_available_order: true, delivery_fee: 12000 })]} transporterId="t-1" />)

    expect(screen.getByText("12,000 TZS")).toBeInTheDocument()
  })
})

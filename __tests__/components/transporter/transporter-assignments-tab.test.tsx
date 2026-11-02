/**
 * Tests for TransporterAssignmentsTab (components/transporter/transporter-assignments-tab.tsx).
 *
 * The `assignments` prop was typed `any[]`; it now takes `TransporterAssignment[]`
 * (lib/types/transporter.ts). What's worth pinning here is that the narrower
 * type still renders every tab correctly, and that a trip is bucketed by the
 * same status/accepted_at combination the component has always used.
 */

import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { TransporterAssignmentsTab } from "@/components/transporter/transporter-assignments-tab"
import type { TransporterAssignment } from "@/lib/types/transporter"

const mockPush = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: jest.fn() }),
}))

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

  describe("in-app navigation", () => {
    function acceptedAssignment(overrides: Partial<TransporterAssignment> = {}): TransporterAssignment {
      return assignment({
        status: "accepted",
        accepted_at: "2026-02-01T10:00:00.000Z",
        shops: {
          name: "Kariakoo Shop",
          address: "Kariakoo",
          latitude: -6.8,
          longitude: 39.2,
        },
        orders: {
          order_number: "TOLA-1001",
          shipping_address: {
            latitude: -6.81,
            longitude: 39.21,
            address: "Mikocheni",
          },
          users: { full_name: "Amina Juma" },
        },
        ...overrides,
      })
    }

    function renderAccepted(trip: TransporterAssignment = acceptedAssignment()) {
      // `initialOrderId` opens the Accepted tab where the trip actually lives.
      render(<TransporterAssignmentsTab assignments={[trip]} transporterId="t-1" initialOrderId={trip.order_id} />)
    }

    it("launches the in-app navigator for the active leg", async () => {
      renderAccepted()

      fireEvent.click(await screen.findByRole("button", { name: /start pickup navigation/i }))

      expect(mockPush).toHaveBeenCalledWith("/transporter/navigate?assignmentId=a-1&target=auto")
    })

    it("previews the drop-off without leaving TOLA", async () => {
      renderAccepted()

      fireEvent.click(await screen.findByRole("button", { name: /preview drop-off destination/i }))

      expect(mockPush).toHaveBeenCalledWith("/transporter/navigate?assignmentId=a-1&target=dropoff")
    })

    it("offers per-stop in-app links and no external Google Maps hand-off", async () => {
      renderAccepted()

      expect(await screen.findByRole("button", { name: /navigate to pickup/i })).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /navigate to drop-off/i })).toBeInTheDocument()
      expect(document.querySelector('a[href*="google.com/maps"]')).toBeNull()
      expect(document.querySelector('a[href*="maps.google"]')).toBeNull()
    })

    it("tells the transporter where the package currently is", async () => {
      renderAccepted()

      expect(await screen.findByText("Product: Waiting at pickup")).toBeInTheDocument()
      expect(screen.getByText(/still at the merchant/i)).toBeInTheDocument()
    })

    it("switches to delivery wording once the package is on board", async () => {
      const trip = acceptedAssignment({ status: "picked_up" })
      render(<TransporterAssignmentsTab assignments={[trip]} transporterId="t-1" initialOrderId={trip.order_id} />)

      expect(await screen.findByText("Product: With you")).toBeInTheDocument()
      expect(await screen.findByRole("button", { name: /start delivery navigation/i })).toBeInTheDocument()
    })
  })
})

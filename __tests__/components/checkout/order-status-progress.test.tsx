/**
 * Tests for OrderStatusProgress (components/checkout/order-status-progress.tsx).
 *
 * A single `status` string drives both the horizontal summary and the
 * detailed vertical timeline through one status-to-step-index map, which
 * accepts several raw status spellings (upper/lower case, legacy aliases) for
 * the same logical step. What matters is that the map is forgiving, that an
 * unrecognised status doesn't crash the stepper, and that "currently in
 * progress" shows for exactly the current step -- each label appears twice
 * (once in each half of the stepper), so assertions are scoped to the
 * vertical timeline, identified by its own heading.
 */

import React from "react"
import { render, screen, within } from "@testing-library/react"
import { OrderStatusProgress } from "@/components/checkout/order-status-progress"

const LABELS = ["Order Received", "Payment Confirmed", "Processing Order", "Dispatched & Picked Up", "In Transit to You", "Delivered"]

/** The detailed vertical tracking list, scoped away from the horizontal summary that repeats the same labels. */
function timeline() {
  const heading = screen.getByText("Detailed Tracking Events")
  return heading.parentElement as HTMLElement
}

describe("OrderStatusProgress", () => {
  it("renders every step's label in the timeline", () => {
    render(<OrderStatusProgress status="pending" />)

    for (const label of LABELS) {
      expect(within(timeline()).getByText(label)).toBeInTheDocument()
    }
  })

  it("treats an unrecognised status as step 0 rather than crashing", () => {
    expect(() => render(<OrderStatusProgress status="some-unknown-status" />)).not.toThrow()
  })

  it.each([
    ["pending", "Order Received"],
    ["pending_payment", "Order Received"],
    ["confirmed", "Payment Confirmed"],
    ["paid", "Payment Confirmed"],
    ["preparing", "Processing Order"],
    ["ready_for_pickup", "Dispatched & Picked Up"],
    ["shipped", "In Transit to You"],
  ])("marks '%s' as currently in progress at the '%s' step", (status, label) => {
    render(<OrderStatusProgress status={status} />)

    const row = within(timeline()).getByText(label).closest("div.pt-0\\.5") as HTMLElement
    expect(within(row).getByText("Currently in progress...")).toBeInTheDocument()
  })

  it("shows no 'currently in progress' text once delivered", () => {
    render(<OrderStatusProgress status="delivered" />)

    expect(within(timeline()).queryByText("Currently in progress...")).not.toBeInTheDocument()
  })

  it.each([["DELIVERED"], ["delivered"], ["completed"]])("treats %s as the completed final state", (status) => {
    render(<OrderStatusProgress status={status} />)

    const deliveredRow = within(timeline()).getByText("Delivered").closest("div.pt-0\\.5") as HTMLElement
    expect(within(deliveredRow).queryByText("Currently in progress...")).not.toBeInTheDocument()
  })
})

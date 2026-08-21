/**
 * Tests for PaymentStatusOverlay
 * (components/transporter/payment-status-overlay.tsx).
 *
 * Presentational. What matters: it renders the message the caller gives it,
 * shows a control number two different ways depending on whether it's a link
 * or a number to copy, and calls onDone only once a control number exists
 * (before that, there's nothing for the transporter to confirm yet).
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PaymentStatusOverlay } from "@/components/transporter/payment-status-overlay"

const props = {
  controlNumber: "",
  statusMessage: "Sending payment request to your phone...",
  onDone: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
  Object.assign(navigator, { clipboard: { writeText: jest.fn() } })
})

describe("PaymentStatusOverlay", () => {
  it("shows the given status message", () => {
    render(<PaymentStatusOverlay {...props} />)

    expect(screen.getByText("Sending payment request to your phone...")).toBeInTheDocument()
  })

  it("shows a generic 'Confirming Payment' heading with no control number", () => {
    render(<PaymentStatusOverlay {...props} />)

    expect(screen.getByText("Confirming Payment")).toBeInTheDocument()
  })

  it("shows a security note instead of a confirm button before a control number exists", () => {
    render(<PaymentStatusOverlay {...props} />)

    expect(screen.getByText("Encrypted secure transaction protocol active")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "I have completed payment" })).not.toBeInTheDocument()
  })

  it("shows a 'Bank Settlement' heading once a control number arrives", () => {
    render(<PaymentStatusOverlay {...props} controlNumber="123456789" />)

    expect(screen.getByText("Bank Settlement")).toBeInTheDocument()
  })

  it("shows the raw control number for a numeric code", () => {
    render(<PaymentStatusOverlay {...props} controlNumber="123456789" />)

    expect(screen.getByText("123456789")).toBeInTheDocument()
    expect(screen.getByText("Control Number")).toBeInTheDocument()
  })

  it("copies the control number to the clipboard", async () => {
    render(<PaymentStatusOverlay {...props} controlNumber="123456789" />)

    await userEvent.click(screen.getByRole("button", { name: "Copy Number" }))

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("123456789")
  })

  it("shows a payment link button instead of a raw number when the control number is a URL", () => {
    render(<PaymentStatusOverlay {...props} controlNumber="https://pay.example/checkout/abc" />)

    expect(screen.getByRole("button", { name: "Complete Payment Now" })).toBeInTheDocument()
    expect(screen.queryByText("Control Number")).not.toBeInTheDocument()
  })

  it("opens the payment link in a new tab", async () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null)
    render(<PaymentStatusOverlay {...props} controlNumber="https://pay.example/checkout/abc" />)

    await userEvent.click(screen.getByRole("button", { name: "Complete Payment Now" }))

    expect(openSpy).toHaveBeenCalledWith("https://pay.example/checkout/abc", "_blank")
  })

  it("calls onDone once a control number exists and the transporter confirms", async () => {
    render(<PaymentStatusOverlay {...props} controlNumber="123456789" />)

    await userEvent.click(screen.getByRole("button", { name: "I have completed payment" }))

    expect(props.onDone).toHaveBeenCalledTimes(1)
  })
})

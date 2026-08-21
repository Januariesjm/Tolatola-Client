/**
 * Tests for VendorPaymentStatusOverlay
 * (components/vendor/payment-status-overlay.tsx).
 *
 * Presentational. Distinct from the transporter equivalent in one respect:
 * this one shows CRDB SimBanking dial instructions once a control number
 * arrives, so that path gets its own assertion.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { VendorPaymentStatusOverlay } from "@/components/vendor/payment-status-overlay"

const props = {
  controlNumber: "",
  statusMessage: "Payment initiated! Please confirm on your device. Your subscription will activate automatically once confirmed.",
  onDone: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
  Object.assign(navigator, { clipboard: { writeText: jest.fn() } })
})

describe("VendorPaymentStatusOverlay", () => {
  it("shows the given status message", () => {
    render(<VendorPaymentStatusOverlay {...props} />)

    expect(screen.getByText(props.statusMessage)).toBeInTheDocument()
  })

  it("shows a generic heading with no control number", () => {
    render(<VendorPaymentStatusOverlay {...props} />)

    expect(screen.getByText("Confirming Payment")).toBeInTheDocument()
  })

  it("shows a security note instead of a confirm button before a control number exists", () => {
    render(<VendorPaymentStatusOverlay {...props} />)

    expect(screen.getByText("Encrypted secure transaction protocol active")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "I have completed payment" })).not.toBeInTheDocument()
  })

  it("shows the CRDB dial-in instructions once a control number arrives", () => {
    render(<VendorPaymentStatusOverlay {...props} controlNumber="123456789" />)

    expect(screen.getByText("Bank Settlement")).toBeInTheDocument()
    expect(screen.getByText("Dial *150*03# (CRDB SimBanking)")).toBeInTheDocument()
  })

  it("copies the control number to the clipboard", async () => {
    render(<VendorPaymentStatusOverlay {...props} controlNumber="123456789" />)

    await userEvent.click(screen.getByRole("button", { name: "Copy Number" }))

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("123456789")
  })

  it("shows a payment link button instead of instructions when the control number is a URL", () => {
    render(<VendorPaymentStatusOverlay {...props} controlNumber="https://pay.example/checkout/abc" />)

    expect(screen.getByRole("button", { name: "Complete Payment Now" })).toBeInTheDocument()
    expect(screen.queryByText(/Dial \*150/)).not.toBeInTheDocument()
  })

  it("opens the payment link in a new tab", async () => {
    const openSpy = jest.spyOn(window, "open").mockImplementation(() => null)
    render(<VendorPaymentStatusOverlay {...props} controlNumber="https://pay.example/checkout/abc" />)

    await userEvent.click(screen.getByRole("button", { name: "Complete Payment Now" }))

    expect(openSpy).toHaveBeenCalledWith("https://pay.example/checkout/abc", "_blank")
  })

  it("calls onDone once a control number exists and the vendor confirms", async () => {
    render(<VendorPaymentStatusOverlay {...props} controlNumber="123456789" />)

    await userEvent.click(screen.getByRole("button", { name: "I have completed payment" }))

    expect(props.onDone).toHaveBeenCalledTimes(1)
  })
})

import React from "react"
import { render, screen } from "@testing-library/react"
import { PaymentProcessingOverlay } from "@/components/checkout/payment-processing-overlay"

/**
 * Tests for components/checkout/payment-processing-overlay.tsx.
 *
 * There are no props and no conditionals -- the component was previously
 * never rendered in any test, so it had 0% function coverage despite being
 * pure markup. Rendering it once and asserting on its content exercises the
 * whole thing.
 */

describe("PaymentProcessingOverlay", () => {
  it("renders the processing message and security notice", () => {
    render(<PaymentProcessingOverlay />)

    expect(screen.getByText("Processing Payment")).toBeInTheDocument()
    expect(screen.getByText(/Please wait while we process your payment/)).toBeInTheDocument()
    expect(screen.getByText(/Encrypted secure transaction protocol active/)).toBeInTheDocument()
  })
})

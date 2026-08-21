/**
 * Tests for VendorSubscriptionUpgradeDialog
 * (components/vendor/subscription-upgrade-dialog.tsx).
 *
 * Presentational: every value and handler comes from props. What matters is
 * the wiring between the three payment-method sections and their callbacks.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { VendorSubscriptionUpgradeDialog } from "@/components/vendor/subscription-upgrade-dialog"
import type { SubscriptionPlan } from "@/lib/types/subscription"

const plan: SubscriptionPlan = { id: "p-pro", name: "Pro", price: 25000 }

const props = {
  open: true,
  onOpenChange: jest.fn(),
  selectedPlan: plan,
  paymentMethod: "airtel-money",
  onPaymentMethodChange: jest.fn(),
  phoneNumber: "",
  onPhoneNumberChange: jest.fn(),
  cardNumber: "",
  onCardNumberChange: jest.fn(),
  expiryDate: "",
  onExpiryDateChange: jest.fn(),
  cvv: "",
  onCvvChange: jest.fn(),
  upgrading: false,
  onUpgrade: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("VendorSubscriptionUpgradeDialog", () => {
  it("renders nothing when closed", () => {
    render(<VendorSubscriptionUpgradeDialog {...props} open={false} />)

    expect(screen.queryByText("Choose your payment method to upgrade")).not.toBeInTheDocument()
  })

  it("shows the selected plan's name in the title", () => {
    render(<VendorSubscriptionUpgradeDialog {...props} />)

    expect(screen.getByText("Upgrade to Pro")).toBeInTheDocument()
  })

  it("shows the plan's price on the pay button", () => {
    render(<VendorSubscriptionUpgradeDialog {...props} />)

    expect(screen.getByRole("button", { name: "Pay 25,000 TZS" })).toBeInTheDocument()
  })

  it("reports a mobile money provider change", async () => {
    render(<VendorSubscriptionUpgradeDialog {...props} />)

    await userEvent.click(screen.getByText("EzyPesa"))

    expect(props.onPaymentMethodChange).toHaveBeenCalledWith("ezypesa")
  })

  it("reports a bank channel change once the bank section is expanded", async () => {
    render(<VendorSubscriptionUpgradeDialog {...props} paymentMethod="crdb-wakala" />)

    await userEvent.click(screen.getByText("Bank Transfer"))
    await userEvent.click(screen.getByText("crdb internet banking"))

    expect(props.onPaymentMethodChange).toHaveBeenCalledWith("crdb-internet-banking")
  })

  it("calls onUpgrade when the pay button is clicked", async () => {
    render(<VendorSubscriptionUpgradeDialog {...props} />)

    await userEvent.click(screen.getByRole("button", { name: "Pay 25,000 TZS" }))

    expect(props.onUpgrade).toHaveBeenCalledTimes(1)
  })

  it("disables both buttons while upgrading", () => {
    render(<VendorSubscriptionUpgradeDialog {...props} upgrading />)

    expect(screen.getByRole("button", { name: "Processing..." })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()
  })

  it("closes via Cancel", async () => {
    render(<VendorSubscriptionUpgradeDialog {...props} />)

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(props.onOpenChange).toHaveBeenCalledWith(false)
  })
})

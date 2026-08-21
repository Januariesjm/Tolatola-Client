/**
 * Tests for SubscriptionUpgradeDialog
 * (components/transporter/subscription-upgrade-dialog.tsx).
 *
 * Presentational: every value and handler comes from props. What matters here
 * is the wiring between the three payment-method sections and their callbacks,
 * and that the pay button reflects the selected plan's price and the
 * `upgrading` flag -- not the checkout request itself, which lives in the
 * parent tab.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SubscriptionUpgradeDialog } from "@/components/transporter/subscription-upgrade-dialog"
import type { SubscriptionPlan } from "@/lib/types/subscription"

const plan: SubscriptionPlan = { id: "p-basic", name: "Basic", price: 15000 }

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

describe("SubscriptionUpgradeDialog", () => {
  it("renders nothing when closed", () => {
    render(<SubscriptionUpgradeDialog {...props} open={false} />)

    expect(screen.queryByText("Upgrade Account")).not.toBeInTheDocument()
  })

  it("shows the selected plan's name and price", () => {
    render(<SubscriptionUpgradeDialog {...props} />)

    expect(screen.getByText("Basic Member")).toBeInTheDocument()
    expect(screen.getByText("15,000 TZS")).toBeInTheDocument()
  })

  it("shows the price on the pay button", () => {
    render(<SubscriptionUpgradeDialog {...props} />)

    expect(screen.getByRole("button", { name: "Pay 15,000 TZS" })).toBeInTheDocument()
  })

  it("reports a mobile money provider change", async () => {
    render(<SubscriptionUpgradeDialog {...props} />)

    await userEvent.click(screen.getByText("HaloPesa"))

    expect(props.onPaymentMethodChange).toHaveBeenCalledWith("halopesa")
  })

  it("reports each keystroke in the mobile money phone field", async () => {
    render(<SubscriptionUpgradeDialog {...props} />)

    await userEvent.type(screen.getByPlaceholderText("e.g. 2557..."), "2")

    expect(props.onPhoneNumberChange).toHaveBeenCalledWith("2")
  })

  it("reports a card network change once the card section is expanded", async () => {
    render(<SubscriptionUpgradeDialog {...props} paymentMethod="visa" />)

    await userEvent.click(screen.getByText("Card Payment"))
    await userEvent.click(screen.getByText("mastercard"))

    expect(props.onPaymentMethodChange).toHaveBeenCalledWith("mastercard")
  })

  it("reports card number, expiry and cvv keystrokes", async () => {
    render(<SubscriptionUpgradeDialog {...props} paymentMethod="visa" />)
    await userEvent.click(screen.getByText("Card Payment"))

    await userEvent.type(screen.getByPlaceholderText("0000 0000 0000 0000"), "4")
    await userEvent.type(screen.getByPlaceholderText("MM/YY"), "1")
    await userEvent.type(screen.getByPlaceholderText("123"), "9")

    expect(props.onCardNumberChange).toHaveBeenCalledWith("4")
    expect(props.onExpiryDateChange).toHaveBeenCalledWith("1")
    expect(props.onCvvChange).toHaveBeenCalledWith("9")
  })

  it("reports a bank channel change once the bank section is expanded", async () => {
    render(<SubscriptionUpgradeDialog {...props} paymentMethod="crdb-wakala" />)

    await userEvent.click(screen.getByText("Bank Transfer"))
    await userEvent.click(screen.getByText("crdb branch otc"))

    expect(props.onPaymentMethodChange).toHaveBeenCalledWith("crdb-branch-otc")
  })

  it("flags M-Pesa as under maintenance", () => {
    render(<SubscriptionUpgradeDialog {...props} />)

    expect(screen.getByText("Service Down")).toBeInTheDocument()
  })

  it("calls onUpgrade when the pay button is clicked", async () => {
    render(<SubscriptionUpgradeDialog {...props} />)

    await userEvent.click(screen.getByRole("button", { name: "Pay 15,000 TZS" }))

    expect(props.onUpgrade).toHaveBeenCalledTimes(1)
  })

  it("disables both buttons and shows progress while upgrading", () => {
    render(<SubscriptionUpgradeDialog {...props} upgrading />)

    expect(screen.getByRole("button", { name: "Processing..." })).toBeDisabled()
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled()
  })

  it("closes via the Cancel button", async () => {
    render(<SubscriptionUpgradeDialog {...props} />)

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(props.onOpenChange).toHaveBeenCalledWith(false)
  })
})

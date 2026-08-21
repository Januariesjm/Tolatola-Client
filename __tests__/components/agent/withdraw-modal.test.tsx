/**
 * Tests for WithdrawModal (components/agent/withdraw-modal.tsx).
 *
 * Presentational: every value and handler comes from props. What is worth
 * pinning here is the wiring -- typing calls the right callback, the quick
 * percent chips call onQuickPercent with the right fraction, and the submit
 * button reflects isSubmitLoading -- not the withdrawal logic itself, which is
 * covered where it lives (lib/agent/wallet.ts, hooks/use-agent-wallet.ts).
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { WithdrawModal } from "@/components/agent/withdraw-modal"

const props = {
  onClose: jest.fn(),
  onSubmit: jest.fn((e: React.FormEvent) => e.preventDefault()),
  withdrawableBalance: 50000,
  paymentMethod: "m-pesa",
  onPaymentMethodChange: jest.fn(),
  phoneNumber: "",
  onPhoneNumberChange: jest.fn(),
  withdrawAmount: "",
  onWithdrawAmountChange: jest.fn(),
  onQuickPercent: jest.fn(),
  calculatedFee: 0,
  payoutAfterFee: 0,
  isSubmitLoading: false,
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("WithdrawModal", () => {
  it("shows the withdrawable balance in the header", () => {
    render(<WithdrawModal {...props} />)

    expect(screen.getByText("Salio la Kutoa: TZS 50,000")).toBeInTheDocument()
  })

  it("calls onClose from the header dismiss button", async () => {
    render(<WithdrawModal {...props} />)

    await userEvent.click(screen.getByRole("button", { name: "" }))

    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it("calls onClose from the Ghairi (cancel) button", async () => {
    render(<WithdrawModal {...props} />)

    await userEvent.click(screen.getByRole("button", { name: "Ghairi" }))

    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it("reports a payment method change", async () => {
    render(<WithdrawModal {...props} />)

    await userEvent.click(screen.getByRole("button", { name: "Tigo Pesa" }))

    expect(props.onPaymentMethodChange).toHaveBeenCalledWith("tigo-pesa")
  })

  it("reports each keystroke in the phone field", async () => {
    render(<WithdrawModal {...props} />)

    await userEvent.type(screen.getByPlaceholderText("Mfano: 0754123456"), "0")

    expect(props.onPhoneNumberChange).toHaveBeenCalledWith("0")
  })

  it("reports each keystroke in the amount field", async () => {
    render(<WithdrawModal {...props} />)

    await userEvent.type(screen.getByPlaceholderText("Mfano: 10000"), "5")

    expect(props.onWithdrawAmountChange).toHaveBeenCalledWith("5")
  })

  it.each([
    ["25%", 0.25],
    ["50%", 0.5],
    ["75%", 0.75],
    ["Salio Lote (Max)", 1.0],
  ])("calls onQuickPercent(%2$s) for the %s chip", async (label, fraction) => {
    render(<WithdrawModal {...props} />)

    await userEvent.click(screen.getByRole("button", { name: label }))

    expect(props.onQuickPercent).toHaveBeenCalledWith(fraction)
  })

  it("shows the fee and net payout the caller computed", () => {
    render(<WithdrawModal {...props} withdrawAmount="10000" calculatedFee={1000} payoutAfterFee={9000} />)

    expect(screen.getByText("-TZS 1,000")).toBeInTheDocument()
    expect(screen.getByText("TZS 9,000")).toBeInTheDocument()
  })

  it("disables submit while an amount is present but the caller reports it as invalid", () => {
    // The disabled condition is duplicated from the parent's own guard, so this
    // pins that duplication rather than assuming it stays in sync.
    render(<WithdrawModal {...props} withdrawAmount="0" />)

    expect(screen.getByRole("button", { name: /Thibitisha Utoaji/ })).toBeDisabled()
  })

  it("enables submit once a positive amount is entered", () => {
    render(<WithdrawModal {...props} withdrawAmount="5000" />)

    expect(screen.getByRole("button", { name: /Thibitisha Utoaji/ })).toBeEnabled()
  })

  it("shows a progress state and disables submit while isSubmitLoading", () => {
    render(<WithdrawModal {...props} withdrawAmount="5000" isSubmitLoading />)

    expect(screen.getByRole("button", { name: /Inatuma/ })).toBeDisabled()
  })

  it("calls onSubmit when the form is submitted", async () => {
    // Both the amount and phone fields are `required`; native validation
    // blocks the submit event entirely with either left empty.
    render(<WithdrawModal {...props} withdrawAmount="5000" phoneNumber="255700000001" />)

    await userEvent.click(screen.getByRole("button", { name: /Thibitisha Utoaji/ }))

    expect(props.onSubmit).toHaveBeenCalledTimes(1)
  })
})

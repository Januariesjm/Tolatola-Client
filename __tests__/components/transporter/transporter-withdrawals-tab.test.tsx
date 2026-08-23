/**
 * Tests for TransporterWithdrawalsTab (components/transporter/transporter-withdrawals-tab.tsx).
 *
 * Covers the withdrawal request form (fee breakdown preview, validation via
 * `alert`, the submit call and its success/failure paths) and the withdrawal
 * history list (formatting and empty state).
 */

import React from "react"
import { render, screen, waitFor, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TransporterWithdrawalsTab } from "@/components/transporter/transporter-withdrawals-tab"

// Radix's Select calls `target.hasPointerCapture(...)` unconditionally on
// pointer-down, which throws "not a function" under jsdom without this.
if (typeof Element !== "undefined") {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {}
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {}
  }
}

const mockRefresh = jest.fn()
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh, push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}))

const mockPost = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiPost: (...args: unknown[]) => mockPost(...args),
}))

jest.mock("@/lib/logger", () => {
  const childLogger = { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() }
  return { logger: { child: jest.fn(() => childLogger) } }
})

function withdrawal(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "w-1",
    amount: 4500,
    payment_method: "airtel_money",
    status: "pending",
    created_at: "2026-01-15T10:30:00.000Z",
    ...overrides,
  }
}

const baseProps = {
  withdrawals: [] as unknown[],
  availableBalance: 10000,
}

let alertSpy: jest.SpyInstance

beforeEach(() => {
  jest.clearAllMocks()
  mockPost.mockResolvedValue({ success: true })
  alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {})
})

afterEach(() => {
  alertSpy.mockRestore()
})

async function fillAndSubmit(
  amount: string,
  { method = "Airtel Money", phone = "255700000001" }: { method?: string; phone?: string } = {},
) {
  await userEvent.type(screen.getByLabelText(/Amount to Withdraw/i), amount)
  await userEvent.click(screen.getByRole("combobox"))
  await userEvent.click(await screen.findByRole("option", { name: method }))
  await userEvent.type(screen.getByLabelText(/Phone Number/i), phone)
  await userEvent.click(screen.getByRole("button", { name: /Request Withdrawal/i }))
}

describe("TransporterWithdrawalsTab", () => {
  it("shows the available balance in the request form", () => {
    render(<TransporterWithdrawalsTab {...baseProps} />)

    expect(screen.getByText("10,000 TZS")).toBeInTheDocument()
  })

  it("shows the empty state when there are no withdrawals", () => {
    render(<TransporterWithdrawalsTab {...baseProps} />)

    expect(screen.getByText("No withdrawal requests yet")).toBeInTheDocument()
  })

  it("renders a withdrawal's payment method, amount, and date", () => {
    render(<TransporterWithdrawalsTab {...baseProps} withdrawals={[withdrawal()]} />)

    expect(screen.getByText("airtel money")).toBeInTheDocument()
    expect(screen.getByText("4,500 TZS")).toBeInTheDocument()
    expect(screen.getByText(new RegExp(new Date("2026-01-15T10:30:00.000Z").toLocaleDateString()))).toBeInTheDocument()
  })

  it("shows withdrawal notes when present", () => {
    render(<TransporterWithdrawalsTab {...baseProps} withdrawals={[withdrawal({ notes: "Rejected: wrong phone number" })]} />)

    expect(screen.getByText("Rejected: wrong phone number")).toBeInTheDocument()
  })

  it("shows a status badge for each withdrawal", () => {
    render(<TransporterWithdrawalsTab {...baseProps} withdrawals={[withdrawal({ status: "completed" })]} />)

    expect(screen.getByText("Completed")).toBeInTheDocument()
  })

  it("does not show a fee breakdown before an amount is entered", () => {
    render(<TransporterWithdrawalsTab {...baseProps} />)

    expect(screen.queryByText("Service Fee (10%):")).not.toBeInTheDocument()
  })

  it("shows the 10% service fee breakdown once an amount is entered", async () => {
    render(<TransporterWithdrawalsTab {...baseProps} />)

    await userEvent.type(screen.getByLabelText(/Amount to Withdraw/i), "5000")

    expect(screen.getByText("TZS 5,000")).toBeInTheDocument()
    expect(screen.getByText("- TZS 500")).toBeInTheDocument()
    expect(screen.getByText("TZS 4,500")).toBeInTheDocument()
  })

  it("disables the submit button when the available balance is zero", () => {
    render(<TransporterWithdrawalsTab {...baseProps} availableBalance={0} />)

    expect(screen.getByRole("button", { name: /Request Withdrawal/i })).toBeDisabled()
  })

  it("submits a withdrawal request with the entered amount, method, and phone", async () => {
    render(<TransporterWithdrawalsTab {...baseProps} />)

    await fillAndSubmit("3000")

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("transporters/withdrawals", {
        amount: 3000,
        payment_method: "airtel-money",
        payment_details: { phone_number: "255700000001" },
      }),
    )
  })

  it("shows a success alert, clears the form, and refreshes after a successful submit", async () => {
    render(<TransporterWithdrawalsTab {...baseProps} />)

    await fillAndSubmit("3000")

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith("Withdrawal request submitted successfully!"))
    expect(mockRefresh).toHaveBeenCalled()
    expect(screen.getByLabelText(/Amount to Withdraw/i)).toHaveValue(null)
    expect(screen.getByLabelText(/Phone Number/i)).toHaveValue("")
  })

  it("alerts with the error message when the submit call fails", async () => {
    mockPost.mockRejectedValue(new Error("Insufficient balance"))
    render(<TransporterWithdrawalsTab {...baseProps} />)

    await fillAndSubmit("3000")

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith("Insufficient balance"))
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it("rejects a withdrawal amount above the available balance without calling the API", async () => {
    // The amount input's `max` attribute mirrors availableBalance, so a real
    // click on the submit button would be blocked by native HTML5 constraint
    // validation before the handler ever ran. Submitting the form directly
    // bypasses that, exercising the component's own amount check instead.
    const { container } = render(<TransporterWithdrawalsTab {...baseProps} availableBalance={1000} />)

    await userEvent.type(screen.getByLabelText(/Amount to Withdraw/i), "5000")
    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(await screen.findByRole("option", { name: "Airtel Money" }))
    await userEvent.type(screen.getByLabelText(/Phone Number/i), "255700000001")
    fireEvent.submit(container.querySelector("form") as HTMLFormElement)

    await waitFor(() => expect(alertSpy).toHaveBeenCalledWith("Invalid withdrawal amount"))
    expect(mockPost).not.toHaveBeenCalled()
  })
})

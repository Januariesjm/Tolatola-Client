/**
 * Tests for VendorWalletTab (components/vendor/vendor-wallet-tab.tsx).
 *
 * Presentational + a single mutation (request payout) over two endpoints:
 * GET vendors/:id/wallet for balance/pending balance/history, and
 * POST vendors/:id/payouts to request a withdrawal. No dedicated data hook
 * here (unlike vendor-orders-tab), so clientApiGet/clientApiPost are mocked
 * directly and the component's own state machine is exercised as-is.
 *
 * jsdom has no Pointer Capture API, which Radix's Select calls unconditionally
 * on pointer-down; polyfilled below the same way __tests__/setup/
 * product-form-fixtures.ts and the language-switcher suite do it.
 */

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { VendorWalletTab } from "@/components/vendor/vendor-wallet-tab"

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

const mockGet = jest.fn()
const mockPost = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiGet: (...args: unknown[]) => mockGet(...args),
  clientApiPost: (...args: unknown[]) => mockPost(...args),
}))

const mockToast = jest.fn()
jest.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mockToast }) }))

const WALLET = {
  balance: 100000,
  pendingBalance: 25000,
  payouts: [
    { id: "p-1", amount: 50000, status: "completed", payment_method: "airtel-money", created_at: "2026-08-10T10:00:00Z" },
    { id: "p-2", amount: 20000, status: "pending", payment_method: "tigo-pesa", created_at: "2026-08-18T10:00:00Z" },
  ],
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  mockGet.mockResolvedValue(WALLET)
  mockPost.mockResolvedValue({ success: true })
})

afterEach(() => {
  jest.restoreAllMocks()
})

async function renderTab(vendorId = "v-1") {
  const view = render(<VendorWalletTab vendorId={vendorId} />)
  await waitFor(() => expect(screen.queryByText("Loading wallet data...")).not.toBeInTheDocument())
  return view
}

describe("VendorWalletTab", () => {
  it("shows a loading message before the wallet data resolves", () => {
    let resolve: (v: typeof WALLET) => void = () => {}
    mockGet.mockReturnValue(new Promise((r) => (resolve = r)))

    render(<VendorWalletTab vendorId="v-1" />)

    expect(screen.getByText("Loading wallet data...")).toBeInTheDocument()
    resolve(WALLET)
  })

  it("requests the vendor's wallet on mount and renders the balances", async () => {
    await renderTab("v-42")

    expect(mockGet).toHaveBeenCalledWith("vendors/v-42/wallet")
    expect(screen.getByText("TZS 100,000")).toBeInTheDocument()
    expect(screen.getByText("TZS 25,000")).toBeInTheDocument()
  })

  it("defaults balances to zero and shows an error toast when the wallet fails to load", async () => {
    mockGet.mockRejectedValue(new Error("500"))

    await renderTab()

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Error", description: "Could not load wallet data", variant: "destructive" }),
    )
    expect(screen.getAllByText("TZS 0")).toHaveLength(2)
  })

  it("shows an empty state when there are no payouts", async () => {
    mockGet.mockResolvedValue({ balance: 0, pendingBalance: 0, payouts: [] })

    await renderTab()

    expect(screen.getByText("No payouts yet")).toBeInTheDocument()
  })

  it("renders each payout's formatted amount, date, method and status", async () => {
    await renderTab()

    expect(screen.getByText("TZS 50,000")).toBeInTheDocument()
    expect(screen.getByText(/via airtel-money/)).toBeInTheDocument()
    expect(screen.getByText("TZS 20,000")).toBeInTheDocument()
    expect(screen.getByText(/via tigo-pesa/)).toBeInTheDocument()
    expect(screen.getByText("completed")).toBeInTheDocument()
    expect(screen.getByText("pending")).toBeInTheDocument()
  })

  it("filters payout history by the selected date period", async () => {
    // 2020-01-01 is before startOfYear() no matter when this test actually
    // runs, so the fixture doesn't need to fake the clock to be deterministic.
    mockGet.mockResolvedValue({
      balance: 100000,
      pendingBalance: 0,
      payouts: [
        { id: "p-old", amount: 5000, status: "completed", payment_method: "airtel-money", created_at: "2020-01-01T00:00:00Z" },
        { id: "p-recent", amount: 7000, status: "completed", payment_method: "airtel-money", created_at: new Date().toISOString() },
      ],
    })
    await renderTab()
    expect(screen.getByText("TZS 5,000")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "This Year" }))

    expect(screen.queryByText("TZS 5,000")).not.toBeInTheDocument()
    expect(screen.getByText("TZS 7,000")).toBeInTheDocument()
  })

  it("shows the fee breakdown once a positive amount is entered", async () => {
    await renderTab()

    await userEvent.type(screen.getByPlaceholderText("Enter amount"), "10000")

    expect(screen.getByText("TZS 10,000")).toBeInTheDocument()
    expect(screen.getByText("- TZS 500")).toBeInTheDocument() // 5% of 10000
    expect(screen.getByText("TZS 9,500")).toBeInTheDocument() // 95% of 10000
  })

  it("does not show a fee breakdown for a zero or invalid amount", async () => {
    await renderTab()

    await userEvent.type(screen.getByPlaceholderText("Enter amount"), "0")
    expect(screen.queryByText("Requested:")).not.toBeInTheDocument()
  })

  it("rejects the payout request when the amount is invalid", async () => {
    await renderTab()

    await userEvent.click(screen.getByRole("button", { name: /Request Payout/i }))

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Invalid amount", variant: "destructive" }))
    expect(mockPost).not.toHaveBeenCalled()
  })

  it("rejects the payout request when the amount exceeds the available balance", async () => {
    await renderTab()

    await userEvent.type(screen.getByPlaceholderText("Enter amount"), "999999")
    await userEvent.type(screen.getByPlaceholderText(/\+255/), "255700000001")
    await userEvent.click(screen.getByRole("button", { name: /Request Payout/i }))

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Insufficient balance", variant: "destructive" }))
    expect(mockPost).not.toHaveBeenCalled()
  })

  it("rejects the payout request when payment details are missing", async () => {
    await renderTab()

    await userEvent.type(screen.getByPlaceholderText("Enter amount"), "10000")
    await userEvent.click(screen.getByRole("button", { name: /Request Payout/i }))

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Missing details", variant: "destructive" }))
    expect(mockPost).not.toHaveBeenCalled()
  })

  it("submits a valid payout request with the amount, default payment method and details", async () => {
    await renderTab("v-7")

    await userEvent.type(screen.getByPlaceholderText("Enter amount"), "10000")
    await userEvent.type(screen.getByPlaceholderText(/\+255/), "255700000001")
    await userEvent.click(screen.getByRole("button", { name: /Request Payout/i }))

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("vendors/v-7/payouts", {
        amount: 10000,
        paymentMethod: "airtel-money",
        paymentDetails: "255700000001",
      }),
    )
    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Payout requested", description: expect.stringContaining("submitted") }),
      ),
    )
  })

  it("clears the amount and details fields and reloads the wallet after a successful request", async () => {
    await renderTab()

    const amountInput = screen.getByPlaceholderText("Enter amount") as HTMLInputElement
    const detailsInput = screen.getByPlaceholderText(/\+255/) as HTMLInputElement
    await userEvent.type(amountInput, "10000")
    await userEvent.type(detailsInput, "255700000001")
    await userEvent.click(screen.getByRole("button", { name: /Request Payout/i }))

    await waitFor(() => expect(amountInput.value).toBe(""))
    expect(detailsInput.value).toBe("")
    expect(mockGet).toHaveBeenCalledTimes(2)
  })

  it("shows an error toast and keeps the form filled when the payout request fails", async () => {
    mockPost.mockRejectedValue(new Error("boom"))
    await renderTab()

    const amountInput = screen.getByPlaceholderText("Enter amount") as HTMLInputElement
    await userEvent.type(amountInput, "10000")
    await userEvent.type(screen.getByPlaceholderText(/\+255/), "255700000001")
    await userEvent.click(screen.getByRole("button", { name: /Request Payout/i }))

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Error", description: "Failed to request payout. Please try again.", variant: "destructive" }),
      ),
    )
    expect(amountInput.value).toBe("10000")
  })

  it("disables the Request Payout button while the available balance is zero", async () => {
    mockGet.mockResolvedValue({ balance: 0, pendingBalance: 0, payouts: [] })
    await renderTab()

    expect(screen.getByRole("button", { name: /Request Payout/i })).toBeDisabled()
  })

  it("lets the vendor choose a different payment method before submitting", async () => {
    await renderTab("v-9")

    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(await screen.findByText("Bank Transfer"))

    await userEvent.type(screen.getByPlaceholderText("Enter amount"), "10000")
    await userEvent.type(screen.getByPlaceholderText(/\+255/), "255700000001")
    await userEvent.click(screen.getByRole("button", { name: /Request Payout/i }))

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("vendors/v-9/payouts", expect.objectContaining({ paymentMethod: "bank-transfer" })),
    )
  })
})

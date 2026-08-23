import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ClickPesaPayment } from "@/components/payment/clickpesa-payment"
import type { PaymentMethod } from "@/lib/clickpesa"

/**
 * Tests for components/payment/clickpesa-payment.tsx.
 *
 * This form's only job is to collect the right details for whichever payment
 * family the buyer picked (wallet phone number, card details, or nothing for
 * a bank channel), post them to the backend's ClickPesa-initiate endpoint,
 * and turn the response into onSuccess/onError. The three field sets are
 * mutually exclusive, so these tests pin which fields show per method,
 * exactly what gets posted, and both the success and failure fan-out
 * (including the fallbacks when the backend omits a message).
 */

const clientApiPost = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiPost: (...args: unknown[]) => clientApiPost(...args),
}))

const BASE_PROPS = {
  orderId: "order-1",
  amount: 25000,
}

function renderPayment(paymentMethod: PaymentMethod, overrides: Partial<Record<string, unknown>> = {}) {
  const onSuccess = jest.fn()
  const onError = jest.fn()
  const props = { ...BASE_PROPS, paymentMethod, onSuccess, onError, ...overrides }
  return { onSuccess, onError, ...render(<ClickPesaPayment {...(props as any)} />) }
}

beforeEach(() => {
  jest.clearAllMocks()
  window.alert = jest.fn()
  clientApiPost.mockResolvedValue({ success: true, transactionId: "txn-1" })
})

describe("ClickPesaPayment field sets per method", () => {
  it("shows the amount due", () => {
    renderPayment("m-pesa")

    expect(screen.getByText(/25,000 TZS/)).toBeInTheDocument()
  })

  it("shows only the phone number field for mobile money", () => {
    renderPayment("m-pesa")

    expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Card Number/i)).not.toBeInTheDocument()
  })

  it("shows only the card fields for a card network", () => {
    renderPayment("visa")

    expect(screen.getByLabelText(/Card Number/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Expiry Date/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/CVV/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Phone Number/i)).not.toBeInTheDocument()
  })

  it("shows bank transfer instructions and no input fields", () => {
    renderPayment("crdb-wakala")

    expect(screen.getByText(/generate a control number/i)).toBeInTheDocument()
    expect(screen.queryByLabelText(/Phone Number/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Card Number/i)).not.toBeInTheDocument()
  })

  it("still renders the Pay Now button for every method", () => {
    renderPayment("crdb-branch-otc")

    expect(screen.getByRole("button", { name: /Pay Now/i })).toBeInTheDocument()
  })
})

describe("ClickPesaPayment mobile money submission", () => {
  it("initiates a payment with only the phone number populated", async () => {
    renderPayment("m-pesa")
    await userEvent.type(screen.getByLabelText(/Phone Number/i), "0712345678")
    await userEvent.click(screen.getByRole("button", { name: /Pay Now/i }))

    await waitFor(() =>
      expect(clientApiPost).toHaveBeenCalledWith("payments/clickpesa/initiate", {
        orderId: "order-1",
        paymentMethod: "m-pesa",
        paymentDetails: { phoneNumber: "0712345678", cardNumber: undefined, expiryDate: undefined, cvv: undefined },
      }),
    )
  })

  it("reports success with the returned transaction id", async () => {
    const { onSuccess } = renderPayment("m-pesa")
    await userEvent.type(screen.getByLabelText(/Phone Number/i), "0712345678")
    await userEvent.click(screen.getByRole("button", { name: /Pay Now/i }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith("txn-1"))
  })

  it("falls back to pending when the response carries no transaction id", async () => {
    clientApiPost.mockResolvedValue({ success: true })
    const { onSuccess } = renderPayment("m-pesa")
    await userEvent.type(screen.getByLabelText(/Phone Number/i), "0712345678")
    await userEvent.click(screen.getByRole("button", { name: /Pay Now/i }))

    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith("pending"))
  })

  it("shows a processing state while the request is in flight, then clears it", async () => {
    let resolveRequest: (value: unknown) => void = () => {}
    clientApiPost.mockImplementation(() => new Promise((resolve) => (resolveRequest = resolve)))
    renderPayment("m-pesa")
    await userEvent.type(screen.getByLabelText(/Phone Number/i), "0712345678")
    await userEvent.click(screen.getByRole("button", { name: /Pay Now/i }))

    expect(await screen.findByText(/Processing/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Phone Number/i)).toBeDisabled()

    resolveRequest({ success: true, transactionId: "txn-1" })

    await waitFor(() => expect(screen.queryByText(/Processing/i)).not.toBeInTheDocument())
  })
})

describe("ClickPesaPayment card submission", () => {
  it("initiates a payment with only the card details populated", async () => {
    renderPayment("visa")
    await userEvent.type(screen.getByLabelText(/Card Number/i), "4111111111111111")
    await userEvent.type(screen.getByLabelText(/Expiry Date/i), "12/28")
    await userEvent.type(screen.getByLabelText(/CVV/i), "123")
    await userEvent.click(screen.getByRole("button", { name: /Pay Now/i }))

    await waitFor(() =>
      expect(clientApiPost).toHaveBeenCalledWith("payments/clickpesa/initiate", {
        orderId: "order-1",
        paymentMethod: "visa",
        paymentDetails: {
          phoneNumber: undefined,
          cardNumber: "4111111111111111",
          expiryDate: "12/28",
          cvv: "123",
        },
      }),
    )
  })
})

describe("ClickPesaPayment bank transfer submission", () => {
  it("initiates a payment with no extra details", async () => {
    renderPayment("crdb-wakala")
    await userEvent.click(screen.getByRole("button", { name: /Pay Now/i }))

    await waitFor(() =>
      expect(clientApiPost).toHaveBeenCalledWith("payments/clickpesa/initiate", {
        orderId: "order-1",
        paymentMethod: "crdb-wakala",
        paymentDetails: { phoneNumber: undefined, cardNumber: undefined, expiryDate: undefined, cvv: undefined },
      }),
    )
  })

  it("alerts the control number when the backend returns one", async () => {
    clientApiPost.mockResolvedValue({ success: true, controlNumber: "CTRL-123", transactionId: "txn-9" })
    const { onSuccess } = renderPayment("crdb-wakala")
    await userEvent.click(screen.getByRole("button", { name: /Pay Now/i }))

    await waitFor(() => expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("CTRL-123")))
    expect(onSuccess).toHaveBeenCalledWith("txn-9")
  })

  it("does not alert when the response carries no control number", async () => {
    renderPayment("crdb-wakala")
    await userEvent.click(screen.getByRole("button", { name: /Pay Now/i }))

    await waitFor(() => expect(clientApiPost).toHaveBeenCalled())
    expect(window.alert).not.toHaveBeenCalled()
  })
})

describe("ClickPesaPayment failure handling", () => {
  it("reports the provider's error message", async () => {
    clientApiPost.mockResolvedValue({ success: false, error: "insufficient funds" })
    const { onError } = renderPayment("m-pesa")
    await userEvent.type(screen.getByLabelText(/Phone Number/i), "0712345678")
    await userEvent.click(screen.getByRole("button", { name: /Pay Now/i }))

    await waitFor(() => expect(onError).toHaveBeenCalledWith("insufficient funds"))
  })

  it("falls back to the message field when there is no error field", async () => {
    clientApiPost.mockResolvedValue({ success: false, message: "try again later" })
    const { onError } = renderPayment("m-pesa")
    await userEvent.type(screen.getByLabelText(/Phone Number/i), "0712345678")
    await userEvent.click(screen.getByRole("button", { name: /Pay Now/i }))

    await waitFor(() => expect(onError).toHaveBeenCalledWith("try again later"))
  })

  it("falls back to a generic message when neither error nor message is present", async () => {
    clientApiPost.mockResolvedValue({ success: false })
    const { onError } = renderPayment("m-pesa")
    await userEvent.type(screen.getByLabelText(/Phone Number/i), "0712345678")
    await userEvent.click(screen.getByRole("button", { name: /Pay Now/i }))

    await waitFor(() => expect(onError).toHaveBeenCalledWith("Payment failed"))
  })

  it("reports a thrown error's message", async () => {
    clientApiPost.mockRejectedValue(new Error("network down"))
    const { onError } = renderPayment("m-pesa")
    await userEvent.type(screen.getByLabelText(/Phone Number/i), "0712345678")
    await userEvent.click(screen.getByRole("button", { name: /Pay Now/i }))

    await waitFor(() => expect(onError).toHaveBeenCalledWith("network down"))
  })

  it("falls back to a generic message when a thrown error has none", async () => {
    clientApiPost.mockRejectedValue({})
    const { onError } = renderPayment("m-pesa")
    await userEvent.type(screen.getByLabelText(/Phone Number/i), "0712345678")
    await userEvent.click(screen.getByRole("button", { name: /Pay Now/i }))

    await waitFor(() => expect(onError).toHaveBeenCalledWith("Payment failed"))
  })

  it("clears the processing state after a failure so the buyer can retry", async () => {
    clientApiPost.mockResolvedValue({ success: false, error: "declined" })
    renderPayment("m-pesa")
    await userEvent.type(screen.getByLabelText(/Phone Number/i), "0712345678")
    await userEvent.click(screen.getByRole("button", { name: /Pay Now/i }))

    await waitFor(() => expect(screen.getByRole("button", { name: /Pay Now/i })).not.toBeDisabled())
  })
})

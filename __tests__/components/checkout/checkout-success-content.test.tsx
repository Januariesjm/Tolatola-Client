import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CheckoutSuccessContent } from "@/components/checkout/checkout-success-content"

/**
 * Tests for components/checkout/checkout-success-content.tsx.
 *
 * This page is what a buyer sees immediately after paying, so the states that
 * matter are: cash-on-delivery never waits for a payment it will not receive;
 * a card or wallet order polls until the gateway confirms; and a failed payment
 * says so rather than silently spinning forever.
 *
 * It also clears the cart on mount as a safety net, which is the only thing
 * standing between a buyer and re-ordering what they just bought if checkout's
 * own clear did not run.
 */

const clientApiGet = jest.fn()
const clientApiPost = jest.fn()
const toast = jest.fn()

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }) }))
jest.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }))
jest.mock("@/lib/api-client", () => ({
  clientApiGet: (...args: unknown[]) => clientApiGet(...args),
  clientApiPost: (...args: unknown[]) => clientApiPost(...args),
}))

function order(overrides: Record<string, unknown> = {}) {
  return {
    id: "order-1",
    order_number: "TOLA-0001",
    status: "pending",
    payment_status: "pending",
    payment_method: "airtel-money",
    total_amount: 29435,
    subtotal: 24000,
    delivery_fee: 5000,
    created_at: "2026-02-01T10:00:00.000Z",
    shipping_address: { full_name: "Amina Juma", phone: "+255711223344", address: "Mikocheni, Kinondoni" },
    order_items: [{ id: "oi-1", quantity: 2, total_price: 24000, products: { name: "Kanga Fabric", price: 12000 } }],
    ...overrides,
  }
}

const USER = { id: "u1", email: "amina@example.com" }

beforeEach(() => {
  jest.clearAllMocks()
  // Default: the gateway has not confirmed yet, so polling finds nothing.
  clientApiGet.mockResolvedValue({ data: { payment_status: "pending", status: "pending" } })
  clientApiPost.mockResolvedValue({ success: true })
  localStorage.setItem("cart", JSON.stringify([{ product_id: "p1" }]))
})

describe("CheckoutSuccessContent confirmation header", () => {
  it("confirms the order was placed", () => {
    render(<CheckoutSuccessContent order={order()} user={USER} />)

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Order\s*Confirmed/i)
  })

  it("shows the order number", () => {
    render(<CheckoutSuccessContent order={order()} user={USER} />)

    expect(screen.getByText(/TOLA-0001/)).toBeInTheDocument()
  })

  it("clears the cart on mount, as a safety net", () => {
    render(<CheckoutSuccessContent order={order()} user={USER} />)

    expect(localStorage.getItem("cart")).toBeNull()
  })
})

describe("CheckoutSuccessContent cash on delivery", () => {
  const cod = () => order({ payment_method: "cash-on-delivery" })

  it("tells the buyer to prepare cash", () => {
    render(<CheckoutSuccessContent order={cod()} user={USER} />)

    expect(screen.getByText(/prepare cash for delivery/i)).toBeInTheDocument()
  })

  it("never polls for a payment that will not arrive", async () => {
    render(<CheckoutSuccessContent order={cod()} user={USER} />)

    await waitFor(() => expect(screen.getByText(/prepare cash for delivery/i)).toBeInTheDocument())
    expect(clientApiGet).not.toHaveBeenCalled()
  })

  it("shows no payment-processing banner", () => {
    render(<CheckoutSuccessContent order={cod()} user={USER} />)

    expect(screen.queryByText("Payment Processing")).not.toBeInTheDocument()
  })
})

describe("CheckoutSuccessContent payment polling", () => {
  it("shows a processing banner for an unconfirmed wallet payment", () => {
    render(<CheckoutSuccessContent order={order()} user={USER} />)

    expect(screen.getByText("Payment Processing")).toBeInTheDocument()
  })

  it("tells a wallet payer to approve the USSD prompt", () => {
    render(<CheckoutSuccessContent order={order({ payment_method: "m-pesa" })} user={USER} />)

    expect(screen.getByText(/approve the USSD prompt/i)).toBeInTheDocument()
  })

  it("tells a bank payer to use the control number", () => {
    render(<CheckoutSuccessContent order={order({ payment_method: "crdb-simbanking" })} user={USER} />)

    expect(screen.getByText(/control number/i)).toBeInTheDocument()
  })

  it("falls back to a generic message for an unrecognised method", () => {
    render(<CheckoutSuccessContent order={order({ payment_method: "visa" })} user={USER} />)

    expect(screen.getByText(/being verified/i)).toBeInTheDocument()
  })

  it("polls the payment status endpoint for the order", async () => {
    render(<CheckoutSuccessContent order={order()} user={USER} />)

    await waitFor(() => expect(clientApiGet).toHaveBeenCalledWith("payments/status/order-1"))
  })

  it("does not poll when the order is already paid", async () => {
    render(<CheckoutSuccessContent order={order({ payment_status: "paid" })} user={USER} />)

    await waitFor(() => expect(screen.queryByText("Payment Processing")).not.toBeInTheDocument())
    expect(clientApiGet).not.toHaveBeenCalled()
  })

  it("confirms the payment once the gateway reports it paid", async () => {
    clientApiGet.mockResolvedValue({ data: { payment_status: "paid", status: "confirmed" } })
    render(<CheckoutSuccessContent order={order()} user={USER} />)

    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Payment Confirmed ✓" })))
    await waitFor(() => expect(screen.queryByText("Payment Processing")).not.toBeInTheDocument())
  })

  it("treats a progressed order status as confirmation, even without payment_status", async () => {
    // The gateway sometimes advances the order without setting payment_status.
    clientApiGet.mockResolvedValue({ data: { status: "processing" } })
    render(<CheckoutSuccessContent order={order()} user={USER} />)

    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Payment Confirmed ✓" })))
  })

  it("reports a failed payment with the gateway's reason", async () => {
    clientApiGet.mockResolvedValue({ data: { payment_status: "failed", click_pesa_error: "Insufficient balance" } })
    render(<CheckoutSuccessContent order={order()} user={USER} />)

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Payment Issue", description: "Insufficient balance", variant: "destructive" }),
      ),
    )
  })

  it("falls back to a generic message when the gateway gives no reason", async () => {
    clientApiGet.mockResolvedValue({ data: { payment_status: "failed" } })
    render(<CheckoutSuccessContent order={order()} user={USER} />)

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Payment Issue", description: expect.stringContaining("contact support") }),
      ),
    )
  })

  it("accepts an unwrapped status response", async () => {
    // Some deployments return the fields at the top level rather than under `data`.
    clientApiGet.mockResolvedValue({ payment_status: "paid", status: "confirmed" })
    render(<CheckoutSuccessContent order={order()} user={USER} />)

    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Payment Confirmed ✓" })))
  })

  it("keeps waiting rather than erroring when the status call fails", async () => {
    clientApiGet.mockRejectedValue(new Error("network"))
    render(<CheckoutSuccessContent order={order()} user={USER} />)

    await waitFor(() => expect(clientApiGet).toHaveBeenCalled())
    expect(screen.getByText("Payment Processing")).toBeInTheDocument()
    expect(toast).not.toHaveBeenCalled()
  })
})

describe("CheckoutSuccessContent delivery confirmation", () => {
  it("offers confirmation once the order is dispatched", () => {
    render(<CheckoutSuccessContent order={order({ status: "dispatched", payment_status: "paid" })} user={USER} />)

    expect(screen.getByRole("button", { name: /Confirm Delivery/i })).toBeInTheDocument()
  })

  it.each(["shipped", "on_the_way"])("offers confirmation for a %s order", (status) => {
    render(<CheckoutSuccessContent order={order({ status, payment_status: "paid" })} user={USER} />)

    expect(screen.getByRole("button", { name: /Confirm Delivery/i })).toBeInTheDocument()
  })

  it("does not offer confirmation for an order still being prepared", () => {
    render(<CheckoutSuccessContent order={order({ status: "processing", payment_status: "paid" })} user={USER} />)

    expect(screen.queryByRole("button", { name: /Confirm Delivery/i })).not.toBeInTheDocument()
  })

  it("confirms delivery against the order and reports the funds release", async () => {
    render(<CheckoutSuccessContent order={order({ status: "dispatched", payment_status: "paid" })} user={USER} />)
    await userEvent.click(screen.getByRole("button", { name: /Confirm Delivery/i }))

    await waitFor(() => expect(clientApiPost).toHaveBeenCalledWith("orders/order-1/confirm-delivery"))
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Delivery Confirmed", description: expect.stringContaining("released") }),
      ),
    )
  })

  it("surfaces a confirmation failure without claiming success", async () => {
    clientApiPost.mockRejectedValue(new Error("gateway down"))
    render(<CheckoutSuccessContent order={order({ status: "dispatched", payment_status: "paid" })} user={USER} />)
    await userEvent.click(screen.getByRole("button", { name: /Confirm Delivery/i }))

    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Error", variant: "destructive" })))
    expect(toast).not.toHaveBeenCalledWith(expect.objectContaining({ title: "Delivery Confirmed" }))
  })

  it("hides the button again once delivery is confirmed", async () => {
    render(<CheckoutSuccessContent order={order({ status: "dispatched", payment_status: "paid" })} user={USER} />)
    await userEvent.click(screen.getByRole("button", { name: /Confirm Delivery/i }))

    await waitFor(() => expect(screen.queryByRole("button", { name: /Confirm Delivery/i })).not.toBeInTheDocument())
  })
})

describe("CheckoutSuccessContent order details", () => {
  it("shows the delivery recipient", () => {
    render(<CheckoutSuccessContent order={order()} user={USER} />)

    expect(screen.getByText("Amina Juma")).toBeInTheDocument()
  })

  it("lists the purchased items", () => {
    render(<CheckoutSuccessContent order={order()} user={USER} />)

    expect(screen.getByText("Kanga Fabric")).toBeInTheDocument()
  })

  it("renders without items, for an order whose join came back empty", () => {
    render(<CheckoutSuccessContent order={order({ order_items: [] })} user={USER} />)

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument()
  })

  it("renders without a shipping address", () => {
    render(<CheckoutSuccessContent order={order({ shipping_address: null })} user={USER} />)

    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument()
  })
})

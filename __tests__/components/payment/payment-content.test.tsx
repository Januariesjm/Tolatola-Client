import React from "react"
import { render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useRouter } from "next/navigation"
import { PaymentContent } from "@/components/payment/payment-content"

/**
 * Tests for components/payment/payment-content.tsx.
 *
 * This is the page shown right after checkout: it shows the order summary,
 * hands off to either the cash-on-delivery confirmation or the ClickPesa
 * form, and treats "payment completed" (however it was reached -- COD
 * confirmation, ClickPesa's onSuccess, an order that was already paid, or
 * its own status-polling fallback) as the single trigger that clears the
 * cart and redirects to the order-confirmation page. ClickPesaPayment itself
 * has its own suite, so it's stubbed here to isolate this component's own
 * branching and polling.
 */

const mockClickPesaPaymentSpy = jest.fn()
jest.mock("@/components/payment/clickpesa-payment", () => ({
  ClickPesaPayment: (props: any) => {
    mockClickPesaPaymentSpy(props)
    return (
      <div data-testid="clickpesa-payment">
        <button onClick={() => props.onSuccess("txn-1")}>Simulate Success</button>
        <button onClick={() => props.onError("Card declined")}>Simulate Error</button>
      </div>
    )
  },
}))

jest.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: jest.fn() }) }))

const clientApiGet = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiGet: (...args: unknown[]) => clientApiGet(...args),
  clientApiPost: jest.fn(),
}))

function makeOrder(overrides: Record<string, unknown> = {}) {
  return {
    id: "order-1",
    order_number: "TOLA-0001",
    payment_status: "pending",
    payment_method: "airtel-money",
    total_amount: 29435,
    subtotal: 24000,
    delivery_fee: 5000,
    order_items: [{ id: "oi-1", quantity: 2, unit_price: 10000, products: { name: "Kanga Fabric", images: [] } }],
    ...overrides,
  }
}

const USER = { id: "u1" }

beforeEach(() => {
  jest.clearAllMocks()
  clientApiGet.mockResolvedValue({ data: { payment_status: "pending", status: "pending" } })
  localStorage.setItem("cart", JSON.stringify([{ product_id: "p1" }]))
})

describe("PaymentContent order summary", () => {
  it("shows the order number in the header", () => {
    render(<PaymentContent order={makeOrder()} user={USER} />)

    expect(screen.getByText(/TOLA-0001/)).toBeInTheDocument()
  })

  it("lists the order items with quantity and line total", () => {
    render(<PaymentContent order={makeOrder()} user={USER} />)

    expect(screen.getByText("Kanga Fabric")).toBeInTheDocument()
    expect(screen.getByText("Qty: 2")).toBeInTheDocument()
    expect(screen.getByText("20,000 TZS")).toBeInTheDocument()
  })

  it("shows subtotal, delivery fee, and the final total", () => {
    render(<PaymentContent order={makeOrder()} user={USER} />)

    expect(screen.getAllByText(/24,000/).length).toBeGreaterThan(0)
    expect(screen.getByText(/5,000/)).toBeInTheDocument()
    expect(screen.getByText(/29,435/)).toBeInTheDocument()
  })
})

describe("PaymentContent cash-on-delivery", () => {
  // The initial `paymentCompleted` state is `true` for any COD order
  // (`order.payment_method === "cash-on-delivery"`, independent of
  // `payment_status`), so a COD order always renders the redirecting screen
  // immediately and clears the cart -- the "Post-Delivery Settlement" card
  // and its "Process Order Submission" button further down the component
  // are therefore unreachable given the current initial-state logic; these
  // tests pin the behavior that actually runs.
  it("skips the settlement card and redirects immediately", () => {
    render(<PaymentContent order={makeOrder({ payment_method: "cash-on-delivery" })} user={USER} />)

    expect(screen.getByText(/Redirecting to order confirmation/i)).toBeInTheDocument()
    expect(screen.queryByText("Post-Delivery Settlement")).not.toBeInTheDocument()
    expect(screen.queryByTestId("clickpesa-payment")).not.toBeInTheDocument()
  })

  it("clears the cart and redirects to the order's confirmation page", () => {
    render(<PaymentContent order={makeOrder({ payment_method: "cash-on-delivery" })} user={USER} />)

    expect(localStorage.getItem("cart")).toBeNull()
    expect(useRouter().push).toHaveBeenCalledWith("/checkout/success/order-1")
  })
})

describe("PaymentContent already-paid order", () => {
  it("skips straight to the redirecting state", () => {
    render(<PaymentContent order={makeOrder({ payment_status: "paid" })} user={USER} />)

    expect(screen.getByText(/Redirecting to order confirmation/i)).toBeInTheDocument()
    expect(useRouter().push).toHaveBeenCalledWith("/checkout/success/order-1")
  })
})

describe("PaymentContent ClickPesa integration", () => {
  it("renders ClickPesaPayment with the order's id, amount and method", () => {
    render(<PaymentContent order={makeOrder()} user={USER} />)

    expect(screen.getByTestId("clickpesa-payment")).toBeInTheDocument()
    expect(mockClickPesaPaymentSpy).toHaveBeenCalledWith(
      expect.objectContaining({ orderId: "order-1", amount: 29435, paymentMethod: "airtel-money" }),
    )
  })

  it("redirects once ClickPesaPayment reports success", () => {
    render(<PaymentContent order={makeOrder()} user={USER} />)

    act(() => {
      screen.getByRole("button", { name: /Simulate Success/i }).click()
    })

    expect(useRouter().push).toHaveBeenCalledWith("/checkout/success/order-1")
  })

  it("shows an error alert when ClickPesaPayment reports a failure, without redirecting", () => {
    render(<PaymentContent order={makeOrder()} user={USER} />)

    act(() => {
      screen.getByRole("button", { name: /Simulate Error/i }).click()
    })

    expect(screen.getByText("Payment Disrupted")).toBeInTheDocument()
    expect(screen.getByText("Card declined")).toBeInTheDocument()
    expect(useRouter().push).not.toHaveBeenCalled()
  })
})

describe("PaymentContent status polling", () => {
  it("does not poll for a cash-on-delivery order", async () => {
    jest.useFakeTimers()
    try {
      render(<PaymentContent order={makeOrder({ payment_method: "cash-on-delivery" })} user={USER} />)

      await act(async () => {
        jest.advanceTimersByTime(30000)
      })

      expect(clientApiGet).not.toHaveBeenCalled()
    } finally {
      jest.useRealTimers()
    }
  })

  it("polls the order's payment status on an interval", async () => {
    jest.useFakeTimers()
    try {
      render(<PaymentContent order={makeOrder()} user={USER} />)

      await act(async () => {
        jest.advanceTimersByTime(3000)
      })

      expect(clientApiGet).toHaveBeenCalledWith("payments/status/order-1")
    } finally {
      jest.useRealTimers()
    }
  })

  it("completes payment and redirects once polling finds a paid status", async () => {
    clientApiGet.mockResolvedValue({ data: { payment_status: "paid", status: "confirmed" } })
    jest.useFakeTimers()
    try {
      render(<PaymentContent order={makeOrder()} user={USER} />)

      await act(async () => {
        jest.advanceTimersByTime(3000)
      })

      expect(useRouter().push).toHaveBeenCalledWith("/checkout/success/order-1")
    } finally {
      jest.useRealTimers()
    }
  })

  it("shows an error and stops polling once it finds a failed status", async () => {
    clientApiGet.mockResolvedValue({ data: { payment_status: "failed", status: "pending" } })
    jest.useFakeTimers()
    try {
      render(<PaymentContent order={makeOrder()} user={USER} />)

      await act(async () => {
        jest.advanceTimersByTime(3000)
      })
      expect(screen.getByText(/Payment failed. Please try again./i)).toBeInTheDocument()
      const callsAfterFailure = clientApiGet.mock.calls.length

      await act(async () => {
        jest.advanceTimersByTime(15000)
      })

      expect(clientApiGet.mock.calls.length).toBe(callsAfterFailure)
    } finally {
      jest.useRealTimers()
    }
  })

  it("keeps polling silently through a transient fetch failure", async () => {
    clientApiGet.mockRejectedValueOnce(new Error("network blip"))
    jest.useFakeTimers()
    try {
      render(<PaymentContent order={makeOrder()} user={USER} />)

      await act(async () => {
        jest.advanceTimersByTime(3000)
      })
      expect(screen.queryByText("Payment Disrupted")).not.toBeInTheDocument()

      await act(async () => {
        jest.advanceTimersByTime(3000)
      })

      expect(clientApiGet.mock.calls.length).toBeGreaterThanOrEqual(2)
    } finally {
      jest.useRealTimers()
    }
  })

  it("stops polling after 40 attempts even without a terminal status", async () => {
    jest.useFakeTimers()
    try {
      render(<PaymentContent order={makeOrder()} user={USER} />)

      for (let i = 0; i < 40; i++) {
        await act(async () => {
          jest.advanceTimersByTime(3000)
        })
      }
      expect(clientApiGet.mock.calls.length).toBe(40)

      await act(async () => {
        jest.advanceTimersByTime(3000)
      })

      expect(clientApiGet.mock.calls.length).toBe(40)
    } finally {
      jest.useRealTimers()
    }
  })

  it("stops polling after the component unmounts", async () => {
    jest.useFakeTimers()
    try {
      const { unmount } = render(<PaymentContent order={makeOrder()} user={USER} />)
      unmount()

      await act(async () => {
        jest.advanceTimersByTime(30000)
      })

      expect(clientApiGet).not.toHaveBeenCalled()
    } finally {
      jest.useRealTimers()
    }
  })
})

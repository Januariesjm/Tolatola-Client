/**
 * Tests for the order banners (components/orders/order-status-banners.tsx).
 *
 * Each banner renders for exactly one order state, and two of them offer the
 * action that finalises payments and closes escrow. So what matters here is as
 * much when a banner does *not* render as when it does: offering confirmation on
 * an already-closed order would invite a double confirmation.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DeliveryConfirmationBanner, OrderPlacedBanner, VerifyReceiptBanner } from "@/components/orders/order-status-banners"
import type { Order } from "@/lib/schemas/order"

const order = (over: Partial<Order> = {}): Order =>
  ({
    id: "ord-1",
    status: "pending",
    delivery_confirmation_requested: false,
    ...over,
  }) as Order

const confirmState = { isConfirming: false, confirmError: null, onConfirm: jest.fn() }

beforeEach(() => {
  jest.clearAllMocks()
})

describe("OrderPlacedBanner", () => {
  it("renders while the order is pending", () => {
    render(<OrderPlacedBanner order={order({ status: "pending" })} />)

    expect(screen.getByText("Order Placed Successfully!")).toBeInTheDocument()
  })

  it.each([["shipped"], ["dispatched"], ["delivered"], ["completed"], ["cancelled"]])("renders nothing once the order is %s", (status) => {
    const { container } = render(<OrderPlacedBanner order={order({ status })} />)

    expect(container).toBeEmptyDOMElement()
  })

  it("renders nothing for a null status rather than throwing", () => {
    const { container } = render(<OrderPlacedBanner order={order({ status: null as unknown as string })} />)

    expect(container).toBeEmptyDOMElement()
  })
})

describe("DeliveryConfirmationBanner", () => {
  const requested = (over: Partial<Order> = {}) => order({ status: "shipped", delivery_confirmation_requested: true, ...over })

  it("renders when the transporter has requested confirmation", () => {
    render(<DeliveryConfirmationBanner order={requested()} {...confirmState} />)

    expect(screen.getByRole("button", { name: /confirm delivery/i })).toBeInTheDocument()
  })

  it("renders nothing when confirmation has not been requested", () => {
    const { container } = render(
      <DeliveryConfirmationBanner order={order({ status: "shipped", delivery_confirmation_requested: false })} {...confirmState} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it.each([["delivered"], ["completed"]])("renders nothing once the order is %s, so it cannot be confirmed twice", (status) => {
    // Confirming finalises payments and closes escrow. Past those two states the
    // action has already happened, and VerifyReceiptBanner covers `delivered`.
    const { container } = render(<DeliveryConfirmationBanner order={requested({ status })} {...confirmState} />)

    expect(container).toBeEmptyDOMElement()
  })

  it("calls onConfirm when the buyer confirms", async () => {
    const onConfirm = jest.fn()
    render(<DeliveryConfirmationBanner order={requested()} {...confirmState} onConfirm={onConfirm} />)

    await userEvent.click(screen.getByRole("button", { name: /confirm delivery/i }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it("disables the confirm button while the request is in flight", () => {
    render(<DeliveryConfirmationBanner order={requested()} {...confirmState} isConfirming />)

    expect(screen.getByRole("button", { name: /confirm delivery/i })).toBeDisabled()
  })

  it("shows a confirmation failure as an alert, not silently", () => {
    render(<DeliveryConfirmationBanner order={requested()} {...confirmState} confirmError="We couldn't confirm delivery." />)

    expect(screen.getByRole("alert")).toHaveTextContent("We couldn't confirm delivery.")
  })

  it("shows no alert when there is no error", () => {
    render(<DeliveryConfirmationBanner order={requested()} {...confirmState} />)

    expect(screen.queryByRole("alert")).not.toBeInTheDocument()
  })

  it("links reporting an issue to this order's complaint form", () => {
    render(<DeliveryConfirmationBanner order={requested({ id: "ord-99" })} {...confirmState} />)

    expect(screen.getByRole("link", { name: /report issue/i })).toHaveAttribute("href", "/track/complaint?orderId=ord-99")
  })
})

describe("VerifyReceiptBanner", () => {
  const state = { isConfirming: false, onConfirm: jest.fn() }

  it("renders once the order is delivered", () => {
    render(<VerifyReceiptBanner order={order({ status: "delivered" })} {...state} />)

    expect(screen.getByRole("button", { name: "Verify Receipt" })).toBeInTheDocument()
  })

  it.each([["pending"], ["shipped"], ["completed"]])("renders nothing while the order is %s", (status) => {
    const { container } = render(<VerifyReceiptBanner order={order({ status })} {...state} />)

    expect(container).toBeEmptyDOMElement()
  })

  it("calls onConfirm when the buyer verifies receipt", async () => {
    const onConfirm = jest.fn()
    render(<VerifyReceiptBanner order={order({ status: "delivered" })} isConfirming={false} onConfirm={onConfirm} />)

    await userEvent.click(screen.getByRole("button", { name: "Verify Receipt" }))

    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it("shows progress and disables the button while verifying", () => {
    render(<VerifyReceiptBanner order={order({ status: "delivered" })} isConfirming onConfirm={jest.fn()} />)

    const button = screen.getByRole("button", { name: "Verifying..." })
    expect(button).toBeDisabled()
  })
})

describe("the two confirm banners together", () => {
  it.each([
    ["shipped", 1, 0],
    ["delivered", 0, 1],
    ["completed", 0, 0],
  ])("on a %s order exactly the right one renders", async (status, expectConfirm, expectVerify) => {
    const subject = order({ status, delivery_confirmation_requested: true })

    render(
      <>
        <DeliveryConfirmationBanner order={subject} {...confirmState} />
        <VerifyReceiptBanner order={subject} isConfirming={false} onConfirm={jest.fn()} />
      </>,
    )

    expect(screen.queryAllByRole("button", { name: /confirm delivery/i })).toHaveLength(expectConfirm)
    expect(screen.queryAllByRole("button", { name: "Verify Receipt" })).toHaveLength(expectVerify)
  })
})

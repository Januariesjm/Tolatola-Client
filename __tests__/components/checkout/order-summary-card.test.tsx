import React from "react"
import { render, screen } from "@testing-library/react"
import { OrderSummaryCard } from "@/components/checkout/order-summary-card"
import type { CartItem } from "@/lib/types/checkout"

/**
 * Tests for components/checkout/order-summary-card.tsx.
 *
 * This is the last thing a buyer reads before paying, so the numbers and the
 * conditions under which the button is disabled are the behaviour that matters.
 * The button is disabled while a delivery quote is being calculated because the
 * totals on screen would not be the totals charged.
 */

function item(overrides: Partial<CartItem> = {}): CartItem {
  return {
    product_id: "p1",
    quantity: 2,
    product: { id: "p1", name: "Kanga Fabric", price: 12000, shop_id: "shop-1" },
    ...overrides,
  } as CartItem
}

const BASE = {
  cartItems: [item()],
  subtotal: 24000,
  deliveryFee: 5000,
  insuranceFee: 435,
  total: 29435,
  hasDeliveryQuotes: true,
  isLoading: false,
  isCalculatingDelivery: false,
  paymentMethod: "airtel-money",
  error: null,
}

describe("OrderSummaryCard totals", () => {
  /** Reads the amount rendered beside a fee label. */
  const amountFor = (label: string | RegExp) => screen.getByText(label).parentElement?.textContent

  it("shows the subtotal, delivery, protection fee and total", () => {
    render(<OrderSummaryCard {...BASE} />)

    expect(amountFor("Subtotal")).toContain("24,000 TZS")
    expect(amountFor("Delivery")).toContain("5,000 TZS")
    expect(amountFor(/Buyer Protection/)).toContain("435 TZS")
    expect(screen.getByText(/29,435/)).toBeInTheDocument()
  })

  it("says the delivery fee is pending before an address is chosen", () => {
    render(<OrderSummaryCard {...BASE} hasDeliveryQuotes={false} />)

    expect(screen.getByText("Awaiting Address")).toBeInTheDocument()
  })

  it("shows the quoted delivery fee once an address is chosen", () => {
    render(<OrderSummaryCard {...BASE} hasDeliveryQuotes />)

    expect(screen.queryByText("Awaiting Address")).not.toBeInTheDocument()
    expect(screen.getByText("Delivery").parentElement?.textContent).toContain("5,000 TZS")
  })

  it("shows a zero delivery fee for a pickup-only order rather than treating it as unquoted", () => {
    render(<OrderSummaryCard {...BASE} deliveryFee={0} hasDeliveryQuotes />)

    expect(screen.queryByText("Awaiting Address")).not.toBeInTheDocument()
    expect(screen.getByText("Delivery").parentElement?.textContent).toContain("0 TZS")
  })
})

describe("OrderSummaryCard line items", () => {
  it("shows the product, quantity and line total", () => {
    render(<OrderSummaryCard {...BASE} />)

    expect(screen.getByText("Kanga Fabric")).toBeInTheDocument()
    // The line total sits beside the quantity: 2 x 12,000.
    expect(screen.getByText("Qty: 2").parentElement?.textContent).toContain("24,000 TZS")
  })

  it("renders the same product twice when it is in two variants", () => {
    // Colour and size are part of the row's identity, so two variants are two
    // rows rather than one collapsed row with a wrong quantity.
    render(
      <OrderSummaryCard
        {...BASE}
        cartItems={[
          item({ selected_color: { name: "Red" }, selected_size: "S" }),
          item({ selected_color: { name: "Blue" }, selected_size: "M" }),
        ]}
      />,
    )

    expect(screen.getAllByText("Kanga Fabric")).toHaveLength(2)
    expect(screen.getByText("Red")).toBeInTheDocument()
    expect(screen.getByText("Blue")).toBeInTheDocument()
  })

  it("shows the selected size badge", () => {
    render(<OrderSummaryCard {...BASE} cartItems={[item({ selected_size: "XL" })]} />)

    expect(screen.getByText("XL")).toBeInTheDocument()
  })

  it("shows no variant badges for a product without them", () => {
    render(<OrderSummaryCard {...BASE} />)

    expect(screen.queryByText("XL")).not.toBeInTheDocument()
  })

  it("prefers the variant image over the product's own", () => {
    render(
      <OrderSummaryCard
        {...BASE}
        cartItems={[
          item({
            selected_color: { name: "Red", image: "https://cdn/red.jpg" },
            product: { id: "p1", name: "Kanga Fabric", price: 12000, images: ["https://cdn/default.jpg"] },
          }),
        ]}
      />,
    )

    expect(screen.getByRole("img", { name: "Kanga Fabric" })).toHaveAttribute("src", "https://cdn/red.jpg")
  })

  it("falls back to a placeholder when there is no image at all", () => {
    render(<OrderSummaryCard {...BASE} cartItems={[item({ product: { id: "p1", name: "Kanga Fabric", price: 12000 } })]} />)

    expect(screen.queryByRole("img")).not.toBeInTheDocument()
    expect(screen.getByText("Kanga Fabric")).toBeInTheDocument()
  })

  it("renders an empty cart without crashing", () => {
    render(<OrderSummaryCard {...BASE} cartItems={[]} />)

    expect(screen.getByText("Order Summary")).toBeInTheDocument()
  })
})

describe("OrderSummaryCard submit button", () => {
  const submitButton = () => screen.getByRole("button")

  it("is a submit button, so the surrounding form's handler runs", () => {
    render(<OrderSummaryCard {...BASE} />)

    expect(submitButton()).toHaveAttribute("type", "submit")
  })

  it("is enabled for a normal order", () => {
    render(<OrderSummaryCard {...BASE} />)

    expect(submitButton()).toBeEnabled()
    expect(submitButton()).toHaveTextContent("Complete Order")
  })

  it("is disabled while the order is being submitted", () => {
    render(<OrderSummaryCard {...BASE} isLoading />)

    expect(submitButton()).toBeDisabled()
  })

  it("is disabled while a delivery quote is still being calculated", () => {
    // The totals on screen would not be the totals charged.
    render(<OrderSummaryCard {...BASE} isCalculatingDelivery />)

    expect(submitButton()).toBeDisabled()
  })

  it("is disabled and explains itself for a payment method under maintenance", () => {
    render(<OrderSummaryCard {...BASE} paymentMethod="m-pesa" />)

    expect(submitButton()).toBeDisabled()
    expect(submitButton()).toHaveTextContent("Service Unavailable")
  })

  it("stays enabled for a selectable wallet", () => {
    render(<OrderSummaryCard {...BASE} paymentMethod="halopesa" />)

    expect(submitButton()).toBeEnabled()
  })
})

describe("OrderSummaryCard errors", () => {
  it("shows a submission failure", () => {
    render(<OrderSummaryCard {...BASE} error="Insufficient balance" />)

    expect(screen.getByText("Insufficient balance")).toBeInTheDocument()
  })

  it("shows nothing when there is no error", () => {
    render(<OrderSummaryCard {...BASE} />)

    expect(screen.queryByText("Protocol Error")).not.toBeInTheDocument()
  })
})

import React from "react"
import { render, screen } from "@testing-library/react"
import { DeliveryBreakdown } from "@/components/checkout/delivery-breakdown"
import type { ShopDeliveryMap } from "@/lib/checkout/build-order-payload"

/**
 * Tests for components/checkout/delivery-breakdown.tsx.
 *
 * The interesting behaviour is the `deliveryAvailable !== false` comparison:
 * an older quote shape omits the field entirely (treated as deliverable), a
 * quote can explicitly mark itself deliverable, and a quote can mark itself
 * pickup-only. All three switch the same set of labels and styles, so all
 * three are exercised rather than just the two obvious booleans.
 */

function delivery(overrides: Partial<ShopDeliveryMap[string]> = {}): ShopDeliveryMap[string] {
  return {
    distanceKm: 5,
    deliveryFee: 3000,
    shopName: "Shop One",
    shopLat: -6.8,
    shopLng: 39.2,
    transportMethod: "Bike",
    ...overrides,
  }
}

describe("DeliveryBreakdown empty state", () => {
  it("renders nothing when there are no shop deliveries", () => {
    const { container } = render(<DeliveryBreakdown shopDeliveries={{}} />)

    expect(container).toBeEmptyDOMElement()
  })
})

describe("DeliveryBreakdown deliverable legs", () => {
  it("renders the deliverable fee, distance and heading when deliveryAvailable is explicitly true", () => {
    render(
      <DeliveryBreakdown
        shopDeliveries={{
          "shop-1": delivery({ deliveryAvailable: true, distanceKm: 12, deliveryFee: 4500, duration: "20 mins" }),
        }}
      />,
    )

    expect(screen.getByText("Delivery Logistics Breakdown")).toBeInTheDocument()
    expect(screen.getByText("12 KM")).toBeInTheDocument()
    expect(screen.getByText("20 mins")).toBeInTheDocument()
    expect(screen.getByText("TZS 4,500")).toBeInTheDocument()
    expect(screen.queryByText("FREE")).not.toBeInTheDocument()
    expect(screen.queryByText(/Store Pickup Only/)).not.toBeInTheDocument()
  })

  it("treats a quote with no deliveryAvailable field as deliverable (legacy shape)", () => {
    render(<DeliveryBreakdown shopDeliveries={{ "shop-1": delivery({ deliveryAvailable: undefined }) }} />)

    expect(screen.getByText("TZS 3,000")).toBeInTheDocument()
    expect(screen.queryByText("FREE")).not.toBeInTheDocument()
  })

  it("falls back to 'Fast' when a deliverable leg has no duration", () => {
    render(<DeliveryBreakdown shopDeliveries={{ "shop-1": delivery({ deliveryAvailable: true, duration: undefined }) }} />)

    expect(screen.getByText("Fast")).toBeInTheDocument()
  })

  it("shows the transport method label", () => {
    render(<DeliveryBreakdown shopDeliveries={{ "shop-1": delivery({ transportMethod: "Motorbike" }) }} />)

    expect(screen.getByText("Motorbike")).toBeInTheDocument()
  })
})

describe("DeliveryBreakdown pickup-only legs", () => {
  it("shows Pickup/FREE and the pickup notice when deliveryAvailable is false", () => {
    render(<DeliveryBreakdown shopDeliveries={{ "shop-1": delivery({ deliveryAvailable: false }) }} />)

    expect(screen.getByText("Pickup")).toBeInTheDocument()
    expect(screen.getByText("FREE")).toBeInTheDocument()
    expect(screen.getByText(/Store Pickup Only/)).toBeInTheDocument()
    expect(screen.queryByText("TZS 3,000")).not.toBeInTheDocument()
  })
})

describe("DeliveryBreakdown multiple shops", () => {
  it("renders one card per shop, mixing deliverable and pickup-only legs", () => {
    render(
      <DeliveryBreakdown
        shopDeliveries={{
          "shop-1": delivery({ deliveryAvailable: true, deliveryFee: 2000 }),
          "shop-2": delivery({ deliveryAvailable: false }),
        }}
      />,
    )

    expect(screen.getByText("TZS 2,000")).toBeInTheDocument()
    expect(screen.getByText("FREE")).toBeInTheDocument()
    expect(screen.getAllByText("TOLA Verified Vendor")).toHaveLength(2)
  })
})

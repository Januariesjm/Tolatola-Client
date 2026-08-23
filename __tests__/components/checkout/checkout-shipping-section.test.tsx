import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CheckoutShippingSection, type CheckoutAddressData } from "@/components/checkout/checkout-shipping-section"
import type { ShopDeliveryMap } from "@/lib/checkout/build-order-payload"

/**
 * Tests for components/checkout/checkout-shipping-section.tsx.
 *
 * TanzaniaAddressForm and WebMapPicker both reach for `window.google` (see
 * checkout-content.test.tsx's identical mocks), so they're stubbed out here
 * too. The WebMapPicker stub exposes a button that fires `onLocationSelect`
 * with fixed coordinates, since the section's own `onLocationSelect` callback
 * (building a fallback address string from the address parts) is this file's
 * only non-trivial logic.
 */

let capturedOnLocationSelect: ((coords: { lat: number; lng: number }) => void) | null = null

jest.mock("@/components/checkout/tanzania-address-form", () => ({
  TanzaniaAddressForm: () => <div data-testid="tanzania-address-form">Address Form</div>,
}))
jest.mock("@/components/checkout/web-map-picker", () => ({
  WebMapPicker: ({ onLocationSelect }: { onLocationSelect: (coords: { lat: number; lng: number }) => void }) => {
    capturedOnLocationSelect = onLocationSelect
    return <div data-testid="web-map-picker">Map Picker</div>
  },
}))

function addressData(overrides: Partial<CheckoutAddressData> = {}): CheckoutAddressData {
  return {
    country: "Tanzania",
    region: "",
    district: "",
    ward: "",
    village: "",
    street: "",
    ...overrides,
  }
}

const BASE = {
  heading: "Contact & Delivery Address",
  fullName: "",
  onFullNameChange: jest.fn(),
  phone: "",
  onPhoneChange: jest.fn(),
  showGuestEmail: false,
  guestEmail: "",
  onGuestEmailChange: jest.fn(),
  addressData: addressData(),
  onAddressDataChange: jest.fn(),
  onAddressComplete: jest.fn(),
  latitude: null,
  longitude: null,
  isCalculatingDelivery: false,
  deliveryError: null,
  shopDeliveries: {} as ShopDeliveryMap,
}

beforeEach(() => {
  capturedOnLocationSelect = null
  jest.clearAllMocks()
})

describe("CheckoutShippingSection contact fields", () => {
  it("renders the heading", () => {
    render(<CheckoutShippingSection {...BASE} />)

    expect(screen.getByText("Contact & Delivery Address")).toBeInTheDocument()
  })

  it("calls onFullNameChange as the name field is typed", async () => {
    const onFullNameChange = jest.fn()
    render(<CheckoutShippingSection {...BASE} onFullNameChange={onFullNameChange} />)

    await userEvent.type(screen.getByLabelText(/Full Name/), "A")

    expect(onFullNameChange).toHaveBeenCalledWith("A")
  })

  it("calls onPhoneChange as the phone field is typed", async () => {
    const onPhoneChange = jest.fn()
    render(<CheckoutShippingSection {...BASE} onPhoneChange={onPhoneChange} />)

    await userEvent.type(screen.getByLabelText(/Phone Number/), "0")

    expect(onPhoneChange).toHaveBeenCalledWith("0")
  })
})

describe("CheckoutShippingSection guest email", () => {
  it("hides the guest email field when showGuestEmail is false", () => {
    render(<CheckoutShippingSection {...BASE} showGuestEmail={false} />)

    expect(screen.queryByLabelText(/Email Address/)).not.toBeInTheDocument()
  })

  it("shows the guest email field when showGuestEmail is true", () => {
    render(<CheckoutShippingSection {...BASE} showGuestEmail />)

    expect(screen.getByLabelText(/Email Address/)).toBeInTheDocument()
    expect(screen.getByText(/order confirmation and tracking details/)).toBeInTheDocument()
  })

  it("calls onGuestEmailChange as the guest email field is typed", async () => {
    const onGuestEmailChange = jest.fn()
    render(<CheckoutShippingSection {...BASE} showGuestEmail onGuestEmailChange={onGuestEmailChange} />)

    await userEvent.type(screen.getByLabelText(/Email Address/), "a")

    expect(onGuestEmailChange).toHaveBeenCalledWith("a")
  })
})

describe("CheckoutShippingSection delivery status", () => {
  it("shows the calculating indicator while isCalculatingDelivery is true", () => {
    render(<CheckoutShippingSection {...BASE} isCalculatingDelivery />)

    expect(screen.getByText("Calculating delivery fee...")).toBeInTheDocument()
  })

  it("hides the calculating indicator otherwise", () => {
    render(<CheckoutShippingSection {...BASE} isCalculatingDelivery={false} />)

    expect(screen.queryByText("Calculating delivery fee...")).not.toBeInTheDocument()
  })

  it("shows the delivery error message when one is set", () => {
    render(<CheckoutShippingSection {...BASE} deliveryError="No courier can reach this address" />)

    expect(screen.getByText("No courier can reach this address")).toBeInTheDocument()
  })

  it("shows no error message when deliveryError is null", () => {
    render(<CheckoutShippingSection {...BASE} deliveryError={null} />)

    expect(screen.queryByText(/No courier/)).not.toBeInTheDocument()
  })
})

describe("CheckoutShippingSection map pin fallback address", () => {
  it("joins the non-empty address parts into the fallback address on pin selection", () => {
    const onAddressComplete = jest.fn()
    render(
      <CheckoutShippingSection
        {...BASE}
        onAddressComplete={onAddressComplete}
        addressData={addressData({ street: "Mtaa wa Amani", ward: "Kinondoni", district: "Kinondoni", region: "Dar es Salaam" })}
      />,
    )

    capturedOnLocationSelect?.({ lat: -6.8, lng: 39.2 })

    expect(onAddressComplete).toHaveBeenCalledWith("Mtaa wa Amani, Kinondoni, Kinondoni, Dar es Salaam", { lat: -6.8, lng: 39.2 })
  })

  it("skips empty address parts when joining the fallback address", () => {
    const onAddressComplete = jest.fn()
    render(
      <CheckoutShippingSection
        {...BASE}
        onAddressComplete={onAddressComplete}
        addressData={addressData({ street: "", ward: "Kinondoni", district: "", region: "Dar es Salaam" })}
      />,
    )

    capturedOnLocationSelect?.({ lat: -6.8, lng: 39.2 })

    expect(onAddressComplete).toHaveBeenCalledWith("Kinondoni, Dar es Salaam", { lat: -6.8, lng: 39.2 })
  })

  it("falls back to 'Selected Pin' when every address part is empty", () => {
    const onAddressComplete = jest.fn()
    render(<CheckoutShippingSection {...BASE} onAddressComplete={onAddressComplete} addressData={addressData()} />)

    capturedOnLocationSelect?.({ lat: -6.8, lng: 39.2 })

    expect(onAddressComplete).toHaveBeenCalledWith("Selected Pin", { lat: -6.8, lng: 39.2 })
  })
})

describe("CheckoutShippingSection delivery breakdown", () => {
  it("renders nothing extra when there are no shop deliveries", () => {
    render(<CheckoutShippingSection {...BASE} shopDeliveries={{}} />)

    expect(screen.queryByText("Delivery Logistics Breakdown")).not.toBeInTheDocument()
  })

  it("renders the delivery breakdown for each shop when quotes exist", () => {
    render(
      <CheckoutShippingSection
        {...BASE}
        shopDeliveries={{
          "shop-1": {
            distanceKm: 5,
            deliveryFee: 3000,
            shopName: "Shop One",
            shopLat: -6.8,
            shopLng: 39.2,
            transportMethod: "Bike",
          },
        }}
      />,
    )

    expect(screen.getByText("Delivery Logistics Breakdown")).toBeInTheDocument()
  })
})

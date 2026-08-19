import React from "react"
import { render, screen } from "@testing-library/react"
import { CheckoutContent } from "@/components/checkout/checkout-content"

// Mock language context
jest.mock("@/lib/i18n/language-context", () => ({
  useLanguage: () => ({ t: (key: string) => key, language: "en" }),
}))

// Mock address form and map picker
jest.mock("@/components/checkout/tanzania-address-form", () => ({
  TanzaniaAddressForm: () => <div data-testid="tanzania-address-form">Address Form</div>,
}))
jest.mock("@/components/checkout/web-map-picker", () => ({
  WebMapPicker: () => <div data-testid="web-map-picker">Map Picker</div>,
}))

// Mock server actions maps and api-client
jest.mock("@/app/actions/maps", () => ({
  calculateDeliveryDistance: jest.fn(),
  calculateDeliveryDistanceByCoords: jest.fn(),
}))
jest.mock("@/lib/api-client", () => ({
  clientApiGet: jest.fn().mockResolvedValue({ data: [] }),
  clientApiPost: jest.fn().mockResolvedValue({ success: true }),
}))

describe("CheckoutContent component", () => {
  const mockUser = {
    id: "user-1",
    full_name: "Amina Juma",
    email: "amina@example.com",
    phone: "+255711223344",
  }

  beforeEach(() => {
    // Mock localStorage for cart
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === "cart" || key === "tola_cart") {
        return JSON.stringify([
          {
            product_id: "p1",
            quantity: 1,
            product: { id: "p1", name: "Kanga Fabric", price: 12000, shop_id: "shop-1" },
          },
        ])
      }
      return null
    })
  })

  it("renders order summary with cart items", () => {
    render(<CheckoutContent user={mockUser} />)

    expect(screen.getByText("Order Summary")).toBeInTheDocument()
    expect(screen.getByText("Kanga Fabric")).toBeInTheDocument()
    expect(screen.getAllByText("12,000 TZS").length).toBeGreaterThan(0)
  })

  it("renders address form", () => {
    render(<CheckoutContent user={mockUser} />)

    expect(screen.getByTestId("tanzania-address-form")).toBeInTheDocument()
  })

  it("renders complete order button", () => {
    render(<CheckoutContent user={mockUser} />)

    expect(screen.getByRole("button", { name: /complete order/i })).toBeInTheDocument()
  })
})

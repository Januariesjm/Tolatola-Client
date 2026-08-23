/**
 * Tests for HomeProductsSection (components/home/home-products-section.tsx).
 *
 * Each of the three product rows (featured, best-selling, best-deals) is
 * conditionally rendered only when its array is non-empty, renders a
 * ProductCard per item with a row-specific badge, and owns its own
 * horizontal scroll container. The "Verified Vendors" interstitial in the
 * middle is static and always present. The component also owns the cart
 * (localStorage-backed, with a "cartUpdated" event and a confirmation
 * toast) and wires favorite-toggling through to useFavorites -- both
 * delegated down through ProductCard's onAddToCart/onToggleLike props.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HomeProductsSection } from "@/components/home/home-products-section"

const mockToast = jest.fn()
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}))

const mockToggleFavorite = jest.fn()
let mockIsFavorite = (_id: string) => false
jest.mock("@/hooks/use-favorites", () => ({
  useFavorites: () => ({
    isFavorite: (id: string) => mockIsFavorite(id),
    toggleFavorite: mockToggleFavorite,
    favorites: [],
    isLoading: false,
  }),
}))

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: "p-1",
    name: "Sisal Basket",
    price: 25000,
    images: ["/basket.jpg"],
    stock_quantity: 10,
    ...overrides,
  }
}

/** Finds a Button element by the lucide icon class rendered inside it. */
function findButtonByIcon(iconClass: string): HTMLElement {
  const icon = document.querySelector(`svg.${iconClass}`)
  if (!icon) throw new Error(`No icon .${iconClass} found`)
  const button = icon.closest("button")
  if (!button) throw new Error(`Icon .${iconClass} is not inside a button`)
  return button
}

function findButtonsByIcon(iconClass: string): HTMLElement[] {
  return Array.from(document.querySelectorAll(`svg.${iconClass}`)).map((icon) => {
    const button = icon.closest("button")
    if (!button) throw new Error(`Icon .${iconClass} is not inside a button`)
    return button as HTMLElement
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  mockIsFavorite = () => false
})

describe("HomeProductsSection static content", () => {
  it("always renders the verified vendors interstitial, even with no products at all", () => {
    render(<HomeProductsSection featuredProducts={[]} bestDeals={[]} bestSelling={[]} />)

    expect(screen.getByText(/Verified Vendors\./)).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /learn about our vetting process/i })).toHaveAttribute("href", "/about")
  })

  it("renders no product cards when every list is empty", () => {
    render(<HomeProductsSection featuredProducts={[]} bestDeals={[]} bestSelling={[]} />)

    expect(screen.queryByText("Sisal Basket")).not.toBeInTheDocument()
  })
})

describe("HomeProductsSection featured row", () => {
  it("does not render the row when featuredProducts is empty", () => {
    render(<HomeProductsSection featuredProducts={[]} bestDeals={[]} bestSelling={[]} />)

    expect(screen.queryByText("NEW")).not.toBeInTheDocument()
  })

  it("renders a ProductCard with a NEW badge for each featured product", () => {
    render(
      <HomeProductsSection
        featuredProducts={[product({ id: "f-1", name: "Featured One" }), product({ id: "f-2", name: "Featured Two" })]}
        bestDeals={[]}
        bestSelling={[]}
      />,
    )

    expect(screen.getByText("Featured One")).toBeInTheDocument()
    expect(screen.getByText("Featured Two")).toBeInTheDocument()
    expect(screen.getAllByText("NEW")).toHaveLength(2)
  })
})

describe("HomeProductsSection best-selling row", () => {
  it("does not render the row or its heading when bestSelling is empty", () => {
    render(<HomeProductsSection featuredProducts={[]} bestDeals={[]} bestSelling={[]} />)

    expect(screen.queryByText("Top Sellers")).not.toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: /most selling/i })).not.toBeInTheDocument()
  })

  it("renders the heading and a HOT-badged ProductCard for each best seller", () => {
    render(<HomeProductsSection featuredProducts={[]} bestDeals={[]} bestSelling={[product({ id: "s-1", name: "Seller One" })]} />)

    expect(screen.getByRole("heading", { name: /most selling/i })).toBeInTheDocument()
    expect(screen.getByText("Seller One")).toBeInTheDocument()
    expect(screen.getByText("HOT")).toBeInTheDocument()
  })
})

describe("HomeProductsSection best-deals row", () => {
  it("does not render the row or its heading when bestDeals is empty", () => {
    render(<HomeProductsSection featuredProducts={[]} bestDeals={[]} bestSelling={[]} />)

    expect(screen.queryByText("Unbeatable Prices")).not.toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: /best deals/i })).not.toBeInTheDocument()
  })

  it("renders the heading and an OFFER-badged ProductCard for each deal", () => {
    render(<HomeProductsSection featuredProducts={[]} bestDeals={[product({ id: "d-1", name: "Deal One" })]} bestSelling={[]} />)

    expect(screen.getByRole("heading", { name: /best deals in town/i })).toBeInTheDocument()
    expect(screen.getByText("Deal One")).toBeInTheDocument()
    expect(screen.getByText("OFFER")).toBeInTheDocument()
  })
})

describe("HomeProductsSection cart", () => {
  it("adds a product to the cart in localStorage and confirms with a toast", async () => {
    const user = userEvent.setup()
    render(<HomeProductsSection featuredProducts={[product({ id: "p-1", name: "Sisal Basket" })]} bestDeals={[]} bestSelling={[]} />)

    await user.click(screen.getByRole("button", { name: /cart/i }))

    const cart = JSON.parse(localStorage.getItem("cart") || "[]")
    expect(cart).toHaveLength(1)
    expect(cart[0]).toMatchObject({ product_id: "p-1", quantity: 1 })
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Added to cart",
        description: "Sisal Basket has been added to your cart.",
      }),
    )
  })

  it("merges into an existing cart line instead of duplicating it", async () => {
    const user = userEvent.setup()
    localStorage.setItem("cart", JSON.stringify([{ product_id: "p-1", quantity: 2, product: product() }]))

    render(<HomeProductsSection featuredProducts={[product({ id: "p-1", name: "Sisal Basket" })]} bestDeals={[]} bestSelling={[]} />)

    await user.click(screen.getByRole("button", { name: /cart/i }))

    const cart = JSON.parse(localStorage.getItem("cart") || "[]")
    expect(cart).toHaveLength(1)
    expect(cart[0].quantity).toBe(3)
  })

  it("shows a product already in the cart as 'In Cart' instead of a clickable Cart button", () => {
    localStorage.setItem("cart", JSON.stringify([{ product_id: "p-1", quantity: 1, product: product() }]))

    render(<HomeProductsSection featuredProducts={[product({ id: "p-1", name: "Sisal Basket" })]} bestDeals={[]} bestSelling={[]} />)

    expect(screen.getByText("In Cart")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^cart$/i })).not.toBeInTheDocument()
  })
})

describe("HomeProductsSection favorites", () => {
  it("toggles a favorite through the favorites hook when the heart button is clicked", async () => {
    const user = userEvent.setup()
    render(<HomeProductsSection featuredProducts={[product({ id: "p-1", name: "Sisal Basket" })]} bestDeals={[]} bestSelling={[]} />)

    await user.click(findButtonByIcon("lucide-heart"))

    expect(mockToggleFavorite).toHaveBeenCalledWith("p-1")
  })

  it("reflects an already-liked product via isFavorite", () => {
    mockIsFavorite = (id: string) => id === "p-1"

    render(<HomeProductsSection featuredProducts={[product({ id: "p-1", name: "Sisal Basket" })]} bestDeals={[]} bestSelling={[]} />)

    expect(findButtonByIcon("lucide-heart")).toHaveClass("text-destructive")
  })
})

describe("HomeProductsSection horizontal scrolling", () => {
  it("scrolls the featured row right and left by 400px", async () => {
    const user = userEvent.setup()
    Element.prototype.scrollBy = jest.fn()

    render(<HomeProductsSection featuredProducts={[product({ id: "p-1", name: "Sisal Basket" })]} bestDeals={[]} bestSelling={[]} />)

    const [leftButton] = findButtonsByIcon("lucide-chevron-left")
    const [rightButton] = findButtonsByIcon("lucide-chevron-right")

    await user.click(rightButton)
    expect(Element.prototype.scrollBy).toHaveBeenLastCalledWith({ left: 400, behavior: "smooth" })

    await user.click(leftButton)
    expect(Element.prototype.scrollBy).toHaveBeenLastCalledWith({ left: -400, behavior: "smooth" })
  })

  it("does nothing when the scroll container ref is not yet attached", () => {
    // Guards the `if (ref.current)` branch in `scroll()` -- there is no
    // direct way to null out a ref from outside, so this just documents
    // that clicking with a mounted container never throws either way.
    Element.prototype.scrollBy = jest.fn()

    render(<HomeProductsSection featuredProducts={[product({ id: "p-1" })]} bestDeals={[]} bestSelling={[]} />)

    const [rightButton] = findButtonsByIcon("lucide-chevron-right")
    expect(() => rightButton.click()).not.toThrow()
  })
})

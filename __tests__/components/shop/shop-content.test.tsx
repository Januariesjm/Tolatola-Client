/**
 * Tests for ShopContent (components/shop/shop-content.tsx).
 *
 * The component itself does not filter products client-side -- the products
 * it is handed are already the result of whatever the caller decided to show
 * (category / search filtering happens server-side, and clicking a
 * subcategory just pushes a new URL for the server to re-render against).
 * What it *does* own, and what these tests focus on:
 *
 * - rendering the given products, and the empty state when there are none
 * - the search-results heading built from `searchQuery`
 * - the subcategory filter bar, and that clicking a pill pushes the right URL
 * - add-to-cart / favorite-toggle wiring through to ProductCard
 * - the "search by image" flow: loading state, results, empty state, and the
 *   failure path -- this is the one piece of real client logic in the file
 */

import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ShopContent } from "@/components/shop/shop-content"

const mockPush = jest.fn()
const mockReplace = jest.fn()
let mockSearchParams = new URLSearchParams()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
  useSearchParams: () => mockSearchParams,
}))

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

// Use the real English strings so selectors match the copy users actually see.
jest.mock("@/lib/i18n/language-context", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { translations } = require("@/lib/i18n/translations")
  return {
    useLanguage: () => ({
      t: (key: string) => translations.en[key] ?? key,
      language: "en",
      setLanguage: jest.fn(),
    }),
  }
})

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"

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

const electronics = { id: "cat-parent", slug: "electronics", name: "Electronics", parent_id: null }
const phones = { id: "cat-sub-1", slug: "phones", name: "Phones", parent_id: "cat-parent" }
const laptops = { id: "cat-sub-2", slug: "laptops", name: "Laptops", parent_id: "cat-parent" }
const categories = [electronics, phones, laptops]

/** Installs a fetch mock for the image search endpoint. */
function mockImageSearch(result: { body?: unknown } | "reject" | "pending") {
  if (result === "pending") {
    const fetchMock = jest.fn(() => new Promise(() => {}))
    global.fetch = fetchMock as unknown as typeof fetch
    return fetchMock
  }
  const fetchMock = jest.fn(async () => {
    if (result === "reject") throw new Error("network down")
    return { json: async () => result.body ?? { data: [] } } as Response
  })
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

beforeEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  sessionStorage.clear()
  mockSearchParams = new URLSearchParams()
  mockIsFavorite = () => false
  jest.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("ShopContent rendering", () => {
  it("renders each given product", () => {
    render(
      <ShopContent
        products={[product({ id: "p-1", name: "Sisal Basket" }), product({ id: "p-2", name: "Kitenge Shirt" })]}
        categories={[]}
        trendingProducts={[]}
      />,
    )

    expect(screen.getByText("Sisal Basket")).toBeInTheDocument()
    expect(screen.getByText("Kitenge Shirt")).toBeInTheDocument()
  })

  it("shows an empty state when there are no products", () => {
    render(<ShopContent products={[]} categories={[]} trendingProducts={[]} />)

    expect(screen.getByText("No products found")).toBeInTheDocument()
  })

  it("hints at adjusting filters when a search that returned nothing was given a query", () => {
    render(<ShopContent products={[]} categories={[]} trendingProducts={[]} searchQuery="unobtanium" />)

    expect(screen.getByText("Try adjusting your search or filters")).toBeInTheDocument()
  })

  it("shows a results heading with the count and the search term", () => {
    render(
      <ShopContent
        products={[product({ id: "p-1" }), product({ id: "p-2" })]}
        categories={[]}
        trendingProducts={[]}
        searchQuery="basket"
      />,
    )

    expect(screen.getByText(/2 products found for "basket"/)).toBeInTheDocument()
  })

  it("uses the singular form for a single result", () => {
    render(<ShopContent products={[product()]} categories={[]} trendingProducts={[]} searchQuery="basket" />)

    expect(screen.getByText(/1 product found for "basket"/)).toBeInTheDocument()
  })
})

describe("ShopContent subcategory filter bar", () => {
  it("does not render when no category is active", () => {
    render(<ShopContent products={[]} categories={categories} trendingProducts={[]} />)

    expect(screen.queryByText("Phones")).not.toBeInTheDocument()
  })

  it("shows sibling categories once a sub-category is active in the URL", () => {
    mockSearchParams = new URLSearchParams({ category: "phones" })

    render(<ShopContent products={[]} categories={categories} trendingProducts={[]} />)

    expect(screen.getByText("All Electronics")).toBeInTheDocument()
    expect(screen.getByText("Phones")).toBeInTheDocument()
    expect(screen.getByText("Laptops")).toBeInTheDocument()
  })

  it("pushes the new category onto the URL when a sibling pill is clicked", async () => {
    mockSearchParams = new URLSearchParams({ category: "phones" })

    render(<ShopContent products={[]} categories={categories} trendingProducts={[]} />)
    await userEvent.click(screen.getByText("Laptops"))

    expect(mockPush).toHaveBeenCalledWith("/shop?category=laptops", { scroll: false })
  })
})

describe("ShopContent cart and favorites", () => {
  it("adds a product to the cart and confirms with a toast", async () => {
    render(<ShopContent products={[product()]} categories={[]} trendingProducts={[]} />)

    await userEvent.click(screen.getByRole("button", { name: /cart/i }))

    await waitFor(() => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]")
      expect(cart).toHaveLength(1)
    })
    const cart = JSON.parse(localStorage.getItem("cart") || "[]")
    expect(cart[0]).toMatchObject({ product_id: "p-1", quantity: 1 })
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Added to cart" }))
  })

  it("merges into an existing cart line instead of duplicating it", async () => {
    localStorage.setItem("cart", JSON.stringify([{ product_id: "p-1", quantity: 2, product: product() }]))

    render(<ShopContent products={[product()]} categories={[]} trendingProducts={[]} />)
    await userEvent.click(screen.getByRole("button", { name: /cart/i }))

    await waitFor(() => {
      const cart = JSON.parse(localStorage.getItem("cart") || "[]")
      expect(cart).toHaveLength(1)
      expect(cart[0].quantity).toBe(3)
    })
  })

  it("marks a product already in the cart as in-cart", () => {
    localStorage.setItem("cart", JSON.stringify([{ product_id: "p-1", quantity: 1, product: product() }]))

    render(<ShopContent products={[product()]} categories={[]} trendingProducts={[]} />)

    expect(screen.getByText("In Cart")).toBeInTheDocument()
  })

  it("toggles a favorite through the favorites hook", async () => {
    render(<ShopContent products={[product()]} categories={[]} trendingProducts={[]} />)

    const heartButtons = screen.getAllByRole("button")
    const heartButton = heartButtons.find((b) => b.querySelector("svg.lucide-heart"))
    expect(heartButton).toBeTruthy()
    await userEvent.click(heartButton as HTMLElement)

    expect(mockToggleFavorite).toHaveBeenCalledWith("p-1")
  })
})

describe("ShopContent image search", () => {
  beforeEach(() => {
    sessionStorage.setItem("tolatola_image_search", "data:image/png;base64,abc123")
    mockSearchParams = new URLSearchParams({ imageSearch: "pending" })
  })

  it("shows a loading state while the image is being analyzed", () => {
    mockImageSearch("pending")

    render(<ShopContent products={[product()]} categories={[]} trendingProducts={[]} />)

    expect(screen.getByText(/AI is Analyzing Your Image/i)).toBeInTheDocument()
  })

  it("requests the search-by-image endpoint with the stored image", () => {
    const fetchMock = mockImageSearch("pending")

    render(<ShopContent products={[product()]} categories={[]} trendingProducts={[]} />)

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_BASE}/products/search-by-image`,
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ image: "data:image/png;base64,abc123" }),
      }),
    )
  })

  it("renders the matched products and clears the sessionStorage image once the search resolves", async () => {
    mockImageSearch({
      body: { data: [{ id: "p-9", name: "Matched Basket", price: 10000 }], analysis: "a woven basket", keywords: ["basket", "sisal"] },
    })

    render(<ShopContent products={[]} categories={[]} trendingProducts={[]} />)

    expect(await screen.findByText("Matched Basket")).toBeInTheDocument()
    expect(screen.getByText(/AI identified:/)).toBeInTheDocument()
    expect(screen.getByText("a woven basket")).toBeInTheDocument()
    expect(screen.getByText("basket")).toBeInTheDocument()
    expect(sessionStorage.getItem("tolatola_image_search")).toBeNull()
  })

  it("shows an image-specific empty state when nothing matches", async () => {
    mockImageSearch({ body: { data: [] } })

    render(<ShopContent products={[product()]} categories={[]} trendingProducts={[]} />)

    expect(await screen.findByText("No similar products found")).toBeInTheDocument()
    // the passed-in `products` prop must not leak through in image-search mode
    expect(screen.queryByText("Sisal Basket")).not.toBeInTheDocument()
  })

  it("reports a toast and clears results when the search fails", async () => {
    mockImageSearch("reject")

    render(<ShopContent products={[]} categories={[]} trendingProducts={[]} />)

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Image search failed", variant: "destructive" }),
      ),
    )
    expect(await screen.findByText("No similar products found")).toBeInTheDocument()
  })

  it("cleans up the URL instead of calling fetch when there is no stored image", () => {
    sessionStorage.removeItem("tolatola_image_search")
    const fetchMock = jest.fn()
    global.fetch = fetchMock as unknown as typeof fetch

    render(<ShopContent products={[product()]} categories={[]} trendingProducts={[]} />)

    expect(mockReplace).toHaveBeenCalledWith("/shop", { scroll: false })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("returns to the normal product list when the image search is cleared", async () => {
    mockImageSearch({ body: { data: [{ id: "p-9", name: "Matched Basket", price: 10000 }] } })

    render(<ShopContent products={[product({ id: "p-1", name: "Sisal Basket" })]} categories={[]} trendingProducts={[]} />)

    const clearButton = await screen.findByTitle("Clear image search")
    await userEvent.click(clearButton)

    expect(mockReplace).toHaveBeenCalledWith("/shop", { scroll: false })
  })
})

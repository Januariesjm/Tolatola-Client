/**
 * Tests for FavoritesContent (components/favorites/favorites-content.tsx).
 *
 * The component receives an initial `likes` list from the server (each entry
 * shaped like `{ id, products }`) and then reconciles it against the client's
 * `useFavorites()` id list: ids already backed by a product go straight to the
 * grid, ids missing a product get fetched via `clientApiGet`, and a skeleton
 * grid shows while that fetch is in flight. This suite covers:
 * - the empty state
 * - rendering a list of favorited products with correct data (price,
 *   discount badge, out-of-stock overlay)
 * - the loading skeleton and fetch-and-render path for a favorite whose
 *   product wasn't included in the initial `likes` prop
 * - removing a favorite (clicking the heart calls `toggleFavorite`, and the
 *   grid drops the item once the favorites id list no longer includes it)
 * - adding to cart (writes to localStorage and navigates to /cart)
 */

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useRouter } from "next/navigation"
import { FavoritesContent } from "@/components/favorites/favorites-content"

const mockToggleFavorite = jest.fn()
// Referenced inside the jest.mock factory below, so it must be named with a
// "mock" prefix (babel-plugin-jest-hoist only allows that pattern to cross the
// hoisting boundary). Tests mutate `favorites` directly and re-render to
// simulate the hook's state changing.
const mockUseFavoritesState: { favorites: string[] } = { favorites: [] }

jest.mock("@/hooks/use-favorites", () => ({
  useFavorites: () => ({
    favorites: mockUseFavoritesState.favorites,
    toggleFavorite: mockToggleFavorite,
  }),
}))

const mockClientApiGet = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiGet: (...args: unknown[]) => mockClientApiGet(...args),
}))

function makeLike(product: Record<string, any>) {
  return { id: `like-${product.id}`, products: product }
}

const basket = {
  id: "p-1",
  name: "Sisal Basket",
  price: 25000,
  images: ["/basket.jpg"],
  stock_quantity: 10,
}

const shirt = {
  id: "p-2",
  name: "Kitenge Shirt",
  price: 30000,
  compare_at_price: 40000,
  images: ["/shirt.jpg"],
  stock_quantity: 0,
}

beforeEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  mockUseFavoritesState.favorites = []
})

describe("FavoritesContent", () => {
  describe("empty state", () => {
    it("shows the empty curation message when there are no favorites", async () => {
      render(<FavoritesContent likes={[]} />)

      expect(await screen.findByText("Your curation is empty")).toBeInTheDocument()
      expect(screen.getByRole("link", { name: /start curation/i })).toHaveAttribute("href", "/shop")
      expect(screen.getByText(/0 masterpieces/i)).toBeInTheDocument()
    })
  })

  describe("rendering favorited products", () => {
    it("renders each favorite with its name and price", async () => {
      mockUseFavoritesState.favorites = ["p-1"]
      render(<FavoritesContent likes={[makeLike(basket)]} />)

      expect(await screen.findByText("Sisal Basket")).toBeInTheDocument()
      expect(screen.getByText(/TZS 25,000/)).toBeInTheDocument()
      expect(screen.getByText(/1 masterpiece\b/i)).toBeInTheDocument()
    })

    it("shows a discount badge and the crossed-out original price when discounted", async () => {
      mockUseFavoritesState.favorites = ["p-2"]
      render(<FavoritesContent likes={[makeLike(shirt)]} />)

      expect(await screen.findByText("Kitenge Shirt")).toBeInTheDocument()
      expect(screen.getByText("25% OFF")).toBeInTheDocument()
      expect(screen.getByText(/TZS 40,000/)).toBeInTheDocument()
    })

    it("disables add-to-cart and shows an out-of-stock overlay for a depleted product", async () => {
      mockUseFavoritesState.favorites = ["p-2"]
      render(<FavoritesContent likes={[makeLike(shirt)]} />)

      await screen.findByText("Kitenge Shirt")
      expect(screen.getAllByText("Out of Stock").length).toBeGreaterThan(0)
      const addButton = screen.getByRole("button", { name: /out of stock/i })
      expect(addButton).toBeDisabled()
    })

    it("links each card to its product detail page", async () => {
      mockUseFavoritesState.favorites = ["p-1"]
      render(<FavoritesContent likes={[makeLike(basket)]} />)

      await screen.findByText("Sisal Basket")
      const link = screen.getByRole("link", { name: /sisal basket/i })
      expect(link).toHaveAttribute("href", "/products/p-1")
    })
  })

  describe("fetching favorites missing from the initial list", () => {
    it("shows a loading skeleton while fetching, then renders the fetched product", async () => {
      let resolveFetch!: (value: { data: Record<string, any> }) => void
      mockClientApiGet.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveFetch = resolve
          }),
      )

      mockUseFavoritesState.favorites = ["p-3"]
      const { container } = render(<FavoritesContent likes={[]} />)

      await waitFor(() => expect(mockClientApiGet).toHaveBeenCalledWith("products/p-3"))
      expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0)
      expect(screen.queryByText("Your curation is empty")).not.toBeInTheDocument()

      resolveFetch({ data: { id: "p-3", name: "Woven Mat", price: 15000, stock_quantity: 4 } })

      expect(await screen.findByText("Woven Mat")).toBeInTheDocument()
      expect(container.querySelectorAll(".animate-pulse").length).toBe(0)
    })

    it("drops a favorite id whose product fetch failed instead of crashing", async () => {
      mockClientApiGet.mockRejectedValue(new Error("not found"))

      mockUseFavoritesState.favorites = ["p-404"]
      render(<FavoritesContent likes={[]} />)

      expect(await screen.findByText("Your curation is empty")).toBeInTheDocument()
    })
  })

  describe("removing a favorite", () => {
    it("calls toggleFavorite with the product id when the heart button is clicked", async () => {
      mockUseFavoritesState.favorites = ["p-1"]
      render(<FavoritesContent likes={[makeLike(basket)]} />)

      await screen.findByText("Sisal Basket")
      await userEvent.click(screen.getByTitle("Remove from favorites"))

      expect(mockToggleFavorite).toHaveBeenCalledWith("p-1")
    })

    it("drops the card from the grid once the favorites id list no longer includes it", async () => {
      mockUseFavoritesState.favorites = ["p-1", "p-2"]
      const { rerender } = render(<FavoritesContent likes={[makeLike(basket), makeLike(shirt)]} />)

      expect(await screen.findByText("Sisal Basket")).toBeInTheDocument()
      expect(screen.getByText("Kitenge Shirt")).toBeInTheDocument()

      // Simulate the toggleFavorite call completing and the hook's favorites
      // list updating -- the component itself doesn't remove items locally,
      // it re-derives displayLikes from the (mocked) favorites id list.
      mockUseFavoritesState.favorites = ["p-2"]
      rerender(<FavoritesContent likes={[makeLike(basket), makeLike(shirt)]} />)

      await waitFor(() => expect(screen.queryByText("Sisal Basket")).not.toBeInTheDocument())
      expect(screen.getByText("Kitenge Shirt")).toBeInTheDocument()
    })
  })

  describe("adding to cart", () => {
    it("writes the product to localStorage and navigates to the cart", async () => {
      const router = useRouter()
      mockUseFavoritesState.favorites = ["p-1"]
      render(<FavoritesContent likes={[makeLike(basket)]} />)

      await screen.findByText("Sisal Basket")
      await userEvent.click(screen.getByRole("button", { name: /add to cart/i }))

      const cart = JSON.parse(localStorage.getItem("cart") || "[]")
      expect(cart).toHaveLength(1)
      expect(cart[0]).toMatchObject({ product_id: "p-1", quantity: 1 })
      expect(router.push).toHaveBeenCalledWith("/cart")
    })
  })
})

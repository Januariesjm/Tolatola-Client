/**
 * Tests for ProductDetailContent (components/product/product-detail-content.tsx).
 *
 * Covers the three behaviors the component is responsible for beyond layout:
 * - add to cart, including the fashion variant gate and localStorage writes
 * - fashion colour/size selection and the price each resolves to
 * - the recommendations fetch, whose failure used to be swallowed by an empty
 *   `catch {}` and now logs and renders a fallback
 */

import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ProductDetailContent } from "@/components/product/product-detail-content"
import { setErrorReporter, type LogRecord } from "@/lib/logger"
import type { Product, Review } from "@/lib/types/product"

const mockToast = jest.fn()
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}))

const mockToggleFavorite = jest.fn()
jest.mock("@/hooks/use-favorites", () => ({
  useFavorites: () => ({
    isFavorite: () => false,
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

jest.mock("@/components/messaging/chat-button", () => ({
  ChatButton: () => <div data-testid="chat-button" />,
}))

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"

const simpleProduct: Product = {
  id: "p-1",
  name: "Sisal Basket",
  price: 25000,
  description: "Hand-woven basket.",
  images: ["/basket-1.jpg", "/basket-2.jpg"],
  stock_quantity: 10,
  unit: "piece",
  categories: { name: "Home", slug: "home" },
  shops: { id: "s-1", name: "Dodoma Crafts", region: "Dodoma", district: "Central" },
}

const fashionProduct: Product = {
  id: "p-2",
  name: "Kitenge Shirt",
  price: 40000,
  images: ["/shirt.jpg"],
  stock_quantity: 5,
  categories: { name: "Fashion", slug: "fashion" },
  colors: [
    { name: "Indigo", image: "/shirt-indigo.jpg" },
    { name: "Ochre", image: "/shirt-ochre.jpg", price: 45000 },
  ],
  sizes: ["S", "M", "L"],
  size_prices: { L: 52000 },
}

const reviews: Review[] = [
  { id: "r-1", rating: 5, comment: "Beautiful work", created_at: "2026-01-02", users: { full_name: "Asha" } },
  { id: "r-2", rating: 3, comment: "Good but slow delivery", created_at: "2026-01-03", users: null },
]

let reported: LogRecord[]

/** Installs a fetch mock for the recommendations endpoint. */
function mockRecommendations(result: { ok?: boolean; status?: number; body?: unknown } | "reject") {
  const fetchMock = jest.fn(async () => {
    if (result === "reject") throw new Error("network down")
    return {
      ok: result.ok ?? true,
      status: result.status ?? 200,
      json: async () => result.body ?? { data: [] },
    } as Response
  })
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

/**
 * Clicks the add-to-cart button. Its label switches to "In Your Cart" once the
 * product is already in the cart, so match either.
 */
async function clickAddToCart() {
  const button = await screen.findByRole("button", {
    name: /add product to cart|in your cart/i,
  })
  await userEvent.click(button)
}

/** Reads the cart back out of localStorage. */
function readCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]")
}

beforeEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  reported = []
  setErrorReporter((record) => reported.push(record))
  jest.spyOn(console, "error").mockImplementation(() => {})
  jest.spyOn(console, "log").mockImplementation(() => {})
  mockRecommendations({ body: { data: [] } })
})

afterEach(() => {
  setErrorReporter(null)
  jest.restoreAllMocks()
})

describe("ProductDetailContent", () => {
  describe("rendering", () => {
    it("shows the product name and price", async () => {
      render(<ProductDetailContent product={simpleProduct} reviews={[]} isLiked={false} />)

      expect(await screen.findByText("Sisal Basket")).toBeInTheDocument()
      expect(screen.getByText(/25,000/)).toBeInTheDocument()
    })

    it("renders the reviews it is given", async () => {
      render(<ProductDetailContent product={simpleProduct} reviews={reviews} isLiked={false} />)

      expect(await screen.findByText(/Beautiful work/)).toBeInTheDocument()
      expect(screen.getByText("Asha")).toBeInTheDocument()
    })

    it("falls back to a placeholder name for a review with no author", async () => {
      render(<ProductDetailContent product={simpleProduct} reviews={reviews} isLiked={false} />)

      expect(await screen.findByText("Merchant Client")).toBeInTheDocument()
    })
  })

  describe("add to cart", () => {
    it("writes the product to localStorage and confirms with a toast", async () => {
      render(<ProductDetailContent product={simpleProduct} reviews={[]} isLiked={false} />)

      await clickAddToCart()

      await waitFor(() => expect(readCart()).toHaveLength(1))
      const [item] = readCart()
      expect(item).toMatchObject({ product_id: "p-1", quantity: 1 })
      expect(item.product.price).toBe(25000)
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Added to cart" }))
    })

    it("merges quantity into an existing line instead of duplicating it", async () => {
      localStorage.setItem("cart", JSON.stringify([{ product_id: "p-1", quantity: 2, product: { ...simpleProduct } }]))

      render(<ProductDetailContent product={simpleProduct} reviews={[]} isLiked={false} />)
      await clickAddToCart()

      await waitFor(() => expect(readCart()[0].quantity).toBe(3))
      expect(readCart()).toHaveLength(1)
    })

    it("adds the selected quantity after using the increment control", async () => {
      render(<ProductDetailContent product={simpleProduct} reviews={[]} isLiked={false} />)
      await screen.findByText("Sisal Basket")

      const increment = screen.getByRole("button", { name: /increase quantity/i })
      await userEvent.click(increment)
      await userEvent.click(increment)
      await clickAddToCart()

      await waitFor(() => expect(readCart()[0].quantity).toBe(3))
    })
  })

  describe("fashion variants", () => {
    it("preselects the first colour and size", async () => {
      render(<ProductDetailContent product={fashionProduct} reviews={[]} isLiked={false} />)
      await screen.findByText("Kitenge Shirt")

      await clickAddToCart()

      await waitFor(() => expect(readCart()).toHaveLength(1))
      expect(readCart()[0]).toMatchObject({
        selected_color: { name: "Indigo" },
        selected_size: "S",
      })
    })

    it("uses the per-size price override when that size is selected", async () => {
      render(<ProductDetailContent product={fashionProduct} reviews={[]} isLiked={false} />)
      await screen.findByText("Kitenge Shirt")

      await userEvent.click(screen.getByRole("button", { name: /select size L/i }))
      await clickAddToCart()

      // size_prices.L wins over both the colour price and the base price.
      await waitFor(() => expect(readCart()[0].product.price).toBe(52000))
    })

    it("uses the colour price when the selected size has no override", async () => {
      render(<ProductDetailContent product={fashionProduct} reviews={[]} isLiked={false} />)
      await screen.findByText("Kitenge Shirt")

      await userEvent.click(screen.getByRole("button", { name: /select color ochre/i }))
      await clickAddToCart()

      await waitFor(() => expect(readCart()[0].product.price).toBe(45000))
    })

    it("keeps separate cart lines for different variants of the same product", async () => {
      localStorage.setItem(
        "cart",
        JSON.stringify([
          {
            product_id: "p-2",
            quantity: 1,
            selected_color: { name: "Ochre" },
            selected_size: "M",
            product: { ...fashionProduct },
          },
        ]),
      )

      render(<ProductDetailContent product={fashionProduct} reviews={[]} isLiked={false} />)
      await screen.findByText("Kitenge Shirt")

      // Defaults are Indigo / S, which differ from the stored Ochre / M line.
      await clickAddToCart()

      await waitFor(() => expect(readCart()).toHaveLength(2))
    })
  })

  describe("recommendations", () => {
    it("requests recommendations for the product", async () => {
      const fetchMock = mockRecommendations({ body: { data: [] } })
      render(<ProductDetailContent product={simpleProduct} reviews={[]} isLiked={false} />)

      await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(`${API_BASE}/products/p-1/recommendations`))
    })

    it("renders the recommended products it receives", async () => {
      mockRecommendations({
        body: { data: [{ id: "p-9", name: "Woven Mat", price: 15000, images: ["/mat.jpg"] }] },
      })

      render(<ProductDetailContent product={simpleProduct} reviews={[]} isLiked={false} />)

      expect(await screen.findByText("Woven Mat")).toBeInTheDocument()
      const link = screen.getByRole("link", { name: /woven mat/i })
      expect(link).toHaveAttribute("href", "/product/p-9")
    })

    it("logs and shows a fallback when the fetch rejects", async () => {
      mockRecommendations("reject")

      render(<ProductDetailContent product={simpleProduct} reviews={[]} isLiked={false} />)

      const fallback = await screen.findByRole("status")
      expect(within(fallback).getByText(/couldn't load recommendations/i)).toBeInTheDocument()

      expect(reported).toHaveLength(1)
      expect(reported[0]).toMatchObject({
        scope: "product.detail",
        message: "failed to load recommendations",
        context: { productId: "p-1" },
      })
    })

    it("treats a non-OK response as a failure rather than 'no recommendations'", async () => {
      // This is the regression the empty `catch {}` hid: a 500 looked exactly
      // like a product with nothing to recommend.
      mockRecommendations({ ok: false, status: 500 })

      render(<ProductDetailContent product={simpleProduct} reviews={[]} isLiked={false} />)

      expect(await screen.findByRole("status")).toBeInTheDocument()
      expect(reported.map((r) => r.message)).toContain("failed to load recommendations")
      expect(reported[0].error?.message).toContain("500")
    })

    it("shows neither the list nor the fallback when there are genuinely none", async () => {
      mockRecommendations({ body: { data: [] } })

      render(<ProductDetailContent product={simpleProduct} reviews={[]} isLiked={false} />)
      await screen.findByText("Sisal Basket")

      await waitFor(() => expect(global.fetch).toHaveBeenCalled())
      expect(screen.queryByRole("status")).not.toBeInTheDocument()
      expect(screen.queryByText(/You May Also Like/i)).not.toBeInTheDocument()
      expect(reported).toHaveLength(0)
    })
  })

  describe("images", () => {
    it("renders the first image by default", async () => {
      render(<ProductDetailContent product={simpleProduct} reviews={[]} isLiked={false} />)

      const hero = await screen.findByAltText("Sisal Basket")
      expect(hero).toHaveAttribute("src", "/basket-1.jpg")
    })

    it("never renders an image without a src when the product has none", async () => {
      const noImages: Product = { ...simpleProduct, images: null }

      render(<ProductDetailContent product={noImages} reviews={[]} isLiked={false} />)
      await screen.findByText("Sisal Basket")

      expect(screen.queryByAltText("Sisal Basket")).not.toBeInTheDocument()
    })
  })
})

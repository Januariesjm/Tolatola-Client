/**
 * Tests for useProductDetail (hooks/use-product-detail.ts).
 *
 * Extracted from product-detail-content.tsx. The rules worth pinning are the
 * price resolution order (size override > colour price > base), the cart-merge
 * predicate that decides whether a variant is a new line, and the
 * recommendations failure path.
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import { setErrorReporter, type LogRecord } from "@/lib/logger"
import type { Product, Review } from "@/lib/types/product"

const mockToast = jest.fn()
jest.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mockToast }) }))

import { useProductDetail } from "@/hooks/use-product-detail"

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"

const simple: Product = {
  id: "p-1",
  name: "Sisal Basket",
  price: 25000,
  images: ["/a.jpg", "/b.jpg"],
  stock_quantity: 10,
  categories: { name: "Home", slug: "home" },
  shops: { id: "s-1", name: "Dodoma Crafts", region: "Dodoma", district: "Central", ward: "Kikuyu" },
}

const fashion: Product = {
  id: "p-2",
  name: "Kitenge Shirt",
  price: 40000,
  images: ["/s.jpg"],
  categories: { name: "Fashion", slug: "fashion" },
  colors: [
    { name: "Indigo", image: "/i.jpg" },
    { name: "Ochre", image: "/o.jpg", price: 45000 },
  ],
  sizes: ["S", "M", "L"],
  size_prices: { L: 52000 },
}

const reviews: Review[] = [
  { id: "r-1", rating: 5, comment: "a", created_at: "2026-01-01" },
  { id: "r-2", rating: 2, comment: "b", created_at: "2026-01-02" },
]

let reported: LogRecord[]

function mockRecommendations(result: { ok?: boolean; status?: number; body?: unknown } | "reject") {
  const fetchMock = jest.fn(async () => {
    if (result === "reject") throw new Error("network down")
    return { ok: result.ok ?? true, status: result.status ?? 200, json: async () => result.body ?? { data: [] } } as Response
  })
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

const readCart = () => JSON.parse(localStorage.getItem("cart") || "[]")

function setup(product: Product, list: Review[] = []) {
  return renderHook(() => useProductDetail({ product, reviews: list }))
}

beforeEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  reported = []
  setErrorReporter((r) => reported.push(r))
  jest.spyOn(console, "error").mockImplementation(() => {})
  jest.spyOn(console, "warn").mockImplementation(() => {})
  jest.spyOn(console, "log").mockImplementation(() => {})
  mockRecommendations({ body: { data: [] } })
})

afterEach(() => {
  setErrorReporter(null)
  jest.restoreAllMocks()
})

describe("useProductDetail", () => {
  describe("derived values", () => {
    it("averages the review ratings", async () => {
      const { result } = setup(simple, reviews)
      expect(result.current.averageRating).toBe(3.5)
    })

    it("reports zero when there are no reviews", () => {
      expect(setup(simple).result.current.averageRating).toBe(0)
    })

    it("detects fashion from the category", () => {
      expect(setup(fashion).result.current.isFashion).toBeTruthy()
      expect(setup(simple).result.current.isFashion).toBeFalsy()
    })

    it("detects fashion from the presence of colours alone", () => {
      const withColors: Product = { ...simple, colors: [{ name: "Red", image: "" }] }
      expect(setup(withColors).result.current.isFashion).toBeTruthy()
    })

    it("detects a service product", () => {
      expect(setup({ ...simple, categories: { name: "Services", slug: "services" } }).result.current.isService).toBe(true)
      expect(setup(simple).result.current.isService).toBe(false)
    })

    it("builds the location from the shop when the product has none", () => {
      expect(setup(simple).result.current.productLocation).toBe("Kikuyu, Central, Dodoma")
    })

    it("prefers an explicit product location", () => {
      expect(setup({ ...simple, location: "Arusha" }).result.current.productLocation).toBe("Arusha")
    })

    it("shows the first image by default and null when there are none", () => {
      expect(setup(simple).result.current.displayedImage).toBe("/a.jpg")
      expect(setup({ ...simple, images: null }).result.current.displayedImage).toBeNull()
    })
  })

  describe("price resolution", () => {
    it("uses the base price for a non-fashion product", () => {
      expect(setup(simple).result.current.resolvedPrice).toBe(25000)
    })

    it("uses the size override when that size is selected", async () => {
      const { result } = setup(fashion)
      await waitFor(() => expect(result.current.selectedSize).toBe("S"))

      act(() => result.current.setSelectedSize("L"))

      expect(result.current.resolvedPrice).toBe(52000)
    })

    it("uses the colour price when the size has no override", async () => {
      const { result } = setup(fashion)
      await waitFor(() => expect(result.current.selectedColor?.name).toBe("Indigo"))

      act(() => result.current.setSelectedColor({ name: "Ochre", image: "/o.jpg", price: 45000 }))

      expect(result.current.resolvedPrice).toBe(45000)
    })

    it("lets a size override beat a colour price", async () => {
      const { result } = setup(fashion)
      await waitFor(() => expect(result.current.selectedSize).toBe("S"))

      act(() => result.current.setSelectedColor({ name: "Ochre", image: "/o.jpg", price: 45000 }))
      act(() => result.current.setSelectedSize("L"))

      expect(result.current.resolvedPrice).toBe(52000)
    })
  })

  describe("variant preselection", () => {
    it("selects the first colour and size for fashion", async () => {
      const { result } = setup(fashion)

      await waitFor(() => expect(result.current.selectedColor?.name).toBe("Indigo"))
      expect(result.current.selectedSize).toBe("S")
      expect(result.current.selectedImageUrl).toBe("/i.jpg")
    })

    it("selects nothing for a non-fashion product", () => {
      const { result } = setup(simple)

      expect(result.current.selectedColor).toBeNull()
      expect(result.current.selectedSize).toBeNull()
    })
  })

  describe("cart membership", () => {
    it("starts false with an empty cart", () => {
      expect(setup(simple).result.current.isInCart).toBe(false)
    })

    it("starts true when the product is already in the cart", () => {
      localStorage.setItem("cart", JSON.stringify([{ product_id: "p-1", quantity: 1 }]))

      expect(setup(simple).result.current.isInCart).toBe(true)
    })

    it("treats a corrupt cart as empty instead of throwing", () => {
      localStorage.setItem("cart", "{not json")

      expect(() => setup(simple)).not.toThrow()
      expect(setup(simple).result.current.isInCart).toBe(false)
    })

    it("treats a non-array cart as empty", () => {
      localStorage.setItem("cart", JSON.stringify({ nope: true }))

      expect(setup(simple).result.current.isInCart).toBe(false)
    })

    it("re-reads the cart on the cartUpdated event", async () => {
      const { result } = setup(simple)
      expect(result.current.isInCart).toBe(false)

      act(() => {
        localStorage.setItem("cart", JSON.stringify([{ product_id: "p-1", quantity: 1 }]))
        window.dispatchEvent(new Event("cartUpdated"))
      })

      await waitFor(() => expect(result.current.isInCart).toBe(true))
    })
  })

  describe("handleAddToCart", () => {
    it("adds the product with the resolved price", async () => {
      const { result } = setup(simple)

      await act(async () => {
        await result.current.handleAddToCart()
      })

      expect(readCart()[0]).toMatchObject({ product_id: "p-1", quantity: 1 })
      expect(readCart()[0].product.price).toBe(25000)
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Added to cart" }))
    })

    it("adds the chosen quantity", async () => {
      const { result } = setup(simple)
      act(() => result.current.setQuantity(4))

      await act(async () => {
        await result.current.handleAddToCart()
      })

      expect(readCart()[0].quantity).toBe(4)
    })

    it("merges into an existing line rather than duplicating", async () => {
      localStorage.setItem("cart", JSON.stringify([{ product_id: "p-1", quantity: 2, product: { ...simple } }]))
      const { result } = setup(simple)

      await act(async () => {
        await result.current.handleAddToCart()
      })

      expect(readCart()).toHaveLength(1)
      expect(readCart()[0].quantity).toBe(3)
    })

    it("keeps a different fashion variant as its own line", async () => {
      localStorage.setItem(
        "cart",
        JSON.stringify([
          { product_id: "p-2", quantity: 1, selected_color: { name: "Ochre" }, selected_size: "M", product: { ...fashion } },
        ]),
      )
      const { result } = setup(fashion)
      await waitFor(() => expect(result.current.selectedSize).toBe("S"))

      await act(async () => {
        await result.current.handleAddToCart()
      })

      expect(readCart()).toHaveLength(2)
    })

    it("re-fills a cleared variant, which is why the Select Color guard cannot fire", async () => {
      // handleAddToCart guards on `colors.length > 0 && !selectedColor`, but the
      // preselection effect depends on selectedColor and immediately restores
      // it. For a product that HAS colours the guard is therefore unreachable —
      // documented here rather than asserted, so nobody "fixes" the effect and
      // silently changes checkout behaviour.
      const { result } = setup(fashion)
      await waitFor(() => expect(result.current.selectedColor?.name).toBe("Indigo"))

      act(() => result.current.setSelectedColor(null))

      await waitFor(() => expect(result.current.selectedColor?.name).toBe("Indigo"))
    })

    it("re-fills a cleared size for the same reason", async () => {
      const { result } = setup(fashion)
      await waitFor(() => expect(result.current.selectedSize).toBe("S"))

      act(() => result.current.setSelectedSize(null))

      await waitFor(() => expect(result.current.selectedSize).toBe("S"))
    })

    it("adds a fashion product once its variants are preselected", async () => {
      const { result } = setup(fashion)
      await waitFor(() => expect(result.current.selectedSize).toBe("S"))

      await act(async () => {
        await result.current.handleAddToCart()
      })

      expect(readCart()[0]).toMatchObject({ selected_color: { name: "Indigo" }, selected_size: "S" })
    })

    it("marks the product as in the cart", async () => {
      const { result } = setup(simple)

      await act(async () => {
        await result.current.handleAddToCart()
      })

      expect(result.current.isInCart).toBe(true)
    })
  })

  describe("recommendations", () => {
    it("requests them for the product", async () => {
      const fetchMock = mockRecommendations({ body: { data: [] } })
      setup(simple)

      await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(`${API_BASE}/products/p-1/recommendations`))
    })

    it("stores what it receives", async () => {
      mockRecommendations({ body: { data: [{ id: "p-9", name: "Mat", price: 1000 }] } })
      const { result } = setup(simple)

      await waitFor(() => expect(result.current.recommendations).toHaveLength(1))
      expect(result.current.recommendationsFailed).toBe(false)
    })

    it("flags a failure and logs when the request rejects", async () => {
      mockRecommendations("reject")
      const { result } = setup(simple)

      await waitFor(() => expect(result.current.recommendationsFailed).toBe(true))
      expect(result.current.recommendations).toEqual([])
      expect(reported.map((r) => r.message)).toContain("failed to load recommendations")
    })

    it("treats a non-OK response as a failure, not as 'none'", async () => {
      mockRecommendations({ ok: false, status: 500 })
      const { result } = setup(simple)

      await waitFor(() => expect(result.current.recommendationsFailed).toBe(true))
      expect(reported[0].error?.message).toContain("500")
    })
  })
})

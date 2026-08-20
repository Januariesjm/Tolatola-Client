/**
 * Tests for useCheckoutDelivery (hooks/use-checkout-delivery.ts).
 *
 * Extracted from checkout-content.tsx. The delivery-quoting paths decide what
 * the buyer is charged and had no coverage at all -- in particular the two
 * error branches (no route found, and the calculation throwing) and the
 * re-quote when the buyer switches transport method.
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import { setErrorReporter, type LogRecord } from "@/lib/logger"

const mockPush = jest.fn()
// The router object must be STABLE across renders. The hook's mount effect
// depends on `router`, so returning a fresh object per call makes the effect
// re-run forever (Next's real useRouter is stable).
const mockRouter = { push: mockPush, refresh: jest.fn(), replace: jest.fn() }
jest.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/checkout",
  useSearchParams: () => new URLSearchParams(),
}))

const mockDistanceByCoords = jest.fn()
jest.mock("@/app/actions/maps", () => ({
  calculateDeliveryDistanceByCoords: (...a: unknown[]) => mockDistanceByCoords(...a),
  calculateDeliveryDistance: jest.fn(),
}))

const mockApiGet = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiGet: (...a: unknown[]) => mockApiGet(...a),
}))

import { INSURANCE_RATE, useCheckoutDelivery } from "@/hooks/use-checkout-delivery"

const COORDS = { lat: -6.8, lng: 39.2 }

const cartLine = (over: Record<string, unknown> = {}) => ({
  quantity: 2,
  product: {
    id: "p-1",
    name: "Sisal Basket",
    price: 10000,
    weight: 3,
    shop_id: "shop-1",
    delivery_available: true,
    shops: { latitude: -6.1, longitude: 35.7, name: "Dodoma Crafts" },
    ...over,
  },
})

const METHOD = { id: "m-1", name: "Boda", rate_per_kg: 500 }

let reported: LogRecord[]

function seedCart(items: unknown[]) {
  localStorage.setItem("cart", JSON.stringify(items))
}

beforeEach(() => {
  jest.clearAllMocks()
  localStorage.clear()
  reported = []
  setErrorReporter((r) => reported.push(r))
  jest.spyOn(console, "error").mockImplementation(() => {})
  jest.spyOn(console, "log").mockImplementation(() => {})
  mockApiGet.mockResolvedValue({ data: [METHOD] })
  mockDistanceByCoords.mockResolvedValue({ distanceKm: 10, duration: "30 mins" })
})

afterEach(() => {
  setErrorReporter(null)
  jest.restoreAllMocks()
})

describe("useCheckoutDelivery", () => {
  describe("initial load", () => {
    it("loads the cart from localStorage", async () => {
      seedCart([cartLine()])
      const { result } = renderHook(() => useCheckoutDelivery())

      await waitFor(() => expect(result.current.cartItems).toHaveLength(1))
      expect(mockPush).not.toHaveBeenCalled()
    })

    it("redirects to the cart when it is empty", async () => {
      seedCart([])
      renderHook(() => useCheckoutDelivery())

      await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/cart"))
    })

    it("preselects the first transport method", async () => {
      seedCart([cartLine()])
      const { result } = renderHook(() => useCheckoutDelivery())

      await waitFor(() => expect(result.current.selectedTransportId).toBe("m-1"))
      expect(result.current.transportMethods).toHaveLength(1)
    })

    it("degrades to no transport methods when the request fails", async () => {
      seedCart([cartLine()])
      mockApiGet.mockRejectedValue(new Error("503"))
      const { result } = renderHook(() => useCheckoutDelivery())

      await waitFor(() => expect(result.current.transportMethods).toEqual([]))
    })
  })

  describe("totals", () => {
    it("sums the cart by price x quantity", async () => {
      seedCart([cartLine(), cartLine({ price: 5000 })])
      const { result } = renderHook(() => useCheckoutDelivery())

      // 10000x2 + 5000x2
      await waitFor(() => expect(result.current.subtotal).toBe(30000))
    })

    it("charges insurance on goods plus delivery", async () => {
      seedCart([cartLine()])
      const { result } = renderHook(() => useCheckoutDelivery())
      await waitFor(() => expect(result.current.subtotal).toBe(20000))

      await act(async () => {
        await result.current.handleAddressComplete("12 Samora Ave", COORDS)
      })

      const { subtotal, deliveryFee, insuranceFee, total } = result.current
      expect(insuranceFee).toBe(Math.round((subtotal + deliveryFee) * INSURANCE_RATE))
      expect(total).toBe(subtotal + deliveryFee + insuranceFee)
    })

    it("has a zero delivery fee before an address is entered", async () => {
      seedCart([cartLine()])
      const { result } = renderHook(() => useCheckoutDelivery())

      await waitFor(() => expect(result.current.subtotal).toBe(20000))
      expect(result.current.deliveryFee).toBe(0)
    })
  })

  describe("handleAddressComplete", () => {
    it("quotes each shop and prices it by weight", async () => {
      seedCart([cartLine()])
      const { result } = renderHook(() => useCheckoutDelivery())
      await waitFor(() => expect(result.current.selectedTransportId).toBe("m-1"))

      await act(async () => {
        await result.current.handleAddressComplete("12 Samora Ave", COORDS)
      })

      expect(mockDistanceByCoords).toHaveBeenCalledWith(COORDS.lat, COORDS.lng, -6.1, 35.7)
      // 3kg x 2 = 6kg at 500/kg
      expect(result.current.shopDeliveries["shop-1"].deliveryFee).toBe(3000)
      expect(result.current.deliveryFee).toBe(3000)
      expect(result.current.deliveryError).toBeNull()
    })

    it("records the address and coordinates", async () => {
      seedCart([cartLine()])
      const { result } = renderHook(() => useCheckoutDelivery())

      await act(async () => {
        await result.current.handleAddressComplete("12 Samora Ave", COORDS)
      })

      expect(result.current.fullAddress).toBe("12 Samora Ave")
      expect(result.current.latitude).toBe(COORDS.lat)
      expect(result.current.longitude).toBe(COORDS.lng)
    })

    it("stores the address but quotes nothing without coordinates", async () => {
      seedCart([cartLine()])
      const { result } = renderHook(() => useCheckoutDelivery())

      await act(async () => {
        await result.current.handleAddressComplete("Somewhere vague")
      })

      expect(result.current.fullAddress).toBe("Somewhere vague")
      expect(mockDistanceByCoords).not.toHaveBeenCalled()
      expect(result.current.shopDeliveries).toEqual({})
    })

    it("quotes every shop in a multi-shop cart", async () => {
      seedCart([cartLine(), cartLine({ shop_id: "shop-2", shops: { latitude: -3.3, longitude: 36.6, name: "Arusha Goods" } })])
      const { result } = renderHook(() => useCheckoutDelivery())
      await waitFor(() => expect(result.current.cartItems).toHaveLength(2))

      await act(async () => {
        await result.current.handleAddressComplete("12 Samora Ave", COORDS)
      })

      expect(Object.keys(result.current.shopDeliveries).sort()).toEqual(["shop-1", "shop-2"])
    })

    it("marks a pickup-only shop as Store Pickup with no fee", async () => {
      seedCart([cartLine({ delivery_available: false })])
      const { result } = renderHook(() => useCheckoutDelivery())
      await waitFor(() => expect(result.current.cartItems).toHaveLength(1))

      await act(async () => {
        await result.current.handleAddressComplete("12 Samora Ave", COORDS)
      })

      expect(result.current.shopDeliveries["shop-1"].transportMethod).toBe("Store Pickup")
      expect(result.current.shopDeliveries["shop-1"].deliveryFee).toBe(0)
    })

    it("surfaces an error when no route can be determined", async () => {
      // The distance lookup resolving null for every shop.
      mockDistanceByCoords.mockResolvedValue(null)
      seedCart([cartLine()])
      const { result } = renderHook(() => useCheckoutDelivery())
      await waitFor(() => expect(result.current.cartItems).toHaveLength(1))

      await act(async () => {
        await result.current.handleAddressComplete("12 Samora Ave", COORDS)
      })

      expect(result.current.deliveryError).toMatch(/could not determine routes/i)
      expect(result.current.shopDeliveries).toEqual({})
    })

    it("surfaces an error and logs when the calculation throws", async () => {
      mockDistanceByCoords.mockRejectedValue(new Error("maps api down"))
      seedCart([cartLine()])
      const { result } = renderHook(() => useCheckoutDelivery())
      await waitFor(() => expect(result.current.cartItems).toHaveLength(1))

      await act(async () => {
        await result.current.handleAddressComplete("12 Samora Ave", COORDS)
      })

      expect(result.current.deliveryError).toMatch(/logistics calculation failed/i)
      expect(result.current.shopDeliveries).toEqual({})
      expect(reported.map((r) => r.message)).toContain("delivery calculation failed")
    })

    it("clears the calculating flag on both the success and failure paths", async () => {
      seedCart([cartLine()])
      const { result } = renderHook(() => useCheckoutDelivery())
      await waitFor(() => expect(result.current.cartItems).toHaveLength(1))

      await act(async () => {
        await result.current.handleAddressComplete("12 Samora Ave", COORDS)
      })
      expect(result.current.isCalculatingDelivery).toBe(false)

      mockDistanceByCoords.mockRejectedValue(new Error("down"))
      await act(async () => {
        await result.current.handleAddressComplete("12 Samora Ave", COORDS)
      })
      expect(result.current.isCalculatingDelivery).toBe(false)
    })

    it("clears a previous error when a retry succeeds", async () => {
      mockDistanceByCoords.mockRejectedValueOnce(new Error("down"))
      seedCart([cartLine()])
      const { result } = renderHook(() => useCheckoutDelivery())
      await waitFor(() => expect(result.current.cartItems).toHaveLength(1))

      await act(async () => {
        await result.current.handleAddressComplete("12 Samora Ave", COORDS)
      })
      expect(result.current.deliveryError).not.toBeNull()

      await act(async () => {
        await result.current.handleAddressComplete("12 Samora Ave", COORDS)
      })
      expect(result.current.deliveryError).toBeNull()
    })
  })

  describe("switching transport method", () => {
    it("re-prices existing quotes without re-fetching distances", async () => {
      seedCart([cartLine()])
      mockApiGet.mockResolvedValue({
        data: [METHOD, { id: "m-2", name: "Truck", rate_per_kg: 1000 }],
      })
      const { result } = renderHook(() => useCheckoutDelivery())
      await waitFor(() => expect(result.current.selectedTransportId).toBe("m-1"))

      await act(async () => {
        await result.current.handleAddressComplete("12 Samora Ave", COORDS)
      })
      expect(result.current.deliveryFee).toBe(3000)

      const distanceCalls = mockDistanceByCoords.mock.calls.length
      act(() => result.current.setSelectedTransportId("m-2"))

      // 6kg at 1000/kg, and no new distance lookup.
      await waitFor(() => expect(result.current.deliveryFee).toBe(6000))
      expect(mockDistanceByCoords.mock.calls.length).toBe(distanceCalls)
      expect(result.current.shopDeliveries["shop-1"].transportMethod).toBe("Truck")
    })
  })
})

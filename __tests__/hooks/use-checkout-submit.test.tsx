/**
 * Tests for hooks/use-checkout-submit.ts.
 *
 * Extracted from handleSubmit in checkout-content.tsx. This covers the parts
 * that were previously unreachable without rendering the whole form: the
 * validation short-circuit, the cash-on-delivery branch that skips payment
 * entirely, the hosted-page redirect for cards, and what happens to the cart
 * when payment fails.
 */

import type React from "react"

import { act, renderHook } from "@testing-library/react"
import { useCheckoutSubmit, type UseCheckoutSubmitOptions } from "@/hooks/use-checkout-submit"
import type { CartItem } from "@/lib/types/checkout"

const push = jest.fn()
const toast = jest.fn()
const clientApiPost = jest.fn()
const navigateToExternalUrl = jest.fn()

jest.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))
jest.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast }) }))
jest.mock("@/lib/api-client", () => ({ clientApiPost: (...args: unknown[]) => clientApiPost(...args) }))
jest.mock("@/lib/browser-navigation", () => ({ navigateToExternalUrl: (url: string) => navigateToExternalUrl(url) }))

const CART: CartItem[] = [
  {
    product_id: "p1",
    quantity: 2,
    product: { id: "p1", name: "Kanga Fabric", price: 12000, shop_id: "shop-1" },
  } as CartItem,
]

const SHOP_DELIVERIES = {
  "shop-1": {
    distanceKm: 10,
    deliveryFee: 5000,
    shopName: "Tola Shop",
    shopLat: -6.8,
    shopLng: 39.28,
    transportMethodId: "tm-1",
    deliveryAvailable: true,
  },
}

/** A form state that passes every validation rule. */
function validOptions(overrides: Partial<UseCheckoutSubmitOptions> = {}): UseCheckoutSubmitOptions {
  return {
    user: { id: "u1", email: "amina@example.com" },
    cartItems: CART,
    shopDeliveries: SHOP_DELIVERIES,
    fullName: "Amina Juma",
    phone: "+255711223344",
    guestEmail: "",
    fullAddress: "Mikocheni, Kinondoni",
    addressData: {
      country: "Tanzania",
      region: "Dar es Salaam",
      district: "Kinondoni",
      ward: "Mikocheni",
      village: "",
      street: "Plot 12",
    },
    latitude: -6.79,
    longitude: 39.25,
    deliveryFee: 5000,
    insuranceFee: 435,
    total: 29435,
    paymentMethod: "airtel-money",
    paymentPhoneNumber: "255711223344",
    cardDetails: { number: "", expiry: "", cvv: "" },
    selectedTransportId: "tm-1",
    isNavigatingAway: { current: false },
    ...overrides,
  }
}

const submitEvent = { preventDefault: jest.fn() } as unknown as React.FormEvent

async function submit(options: UseCheckoutSubmitOptions) {
  const hook = renderHook(() => useCheckoutSubmit(options))
  await act(async () => {
    await hook.result.current.handleSubmit(submitEvent)
  })
  return hook
}

beforeEach(() => {
  jest.clearAllMocks()
  localStorage.setItem("cart", JSON.stringify(CART))
})

describe("useCheckoutSubmit validation", () => {
  it("toasts and posts nothing when the form is invalid", async () => {
    await submit(validOptions({ fullName: "" }))

    expect(clientApiPost).not.toHaveBeenCalled()
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Name Required", variant: "destructive" }))
  })

  it("blocks a payment method under maintenance", async () => {
    await submit(validOptions({ paymentMethod: "m-pesa" }))

    expect(clientApiPost).not.toHaveBeenCalled()
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Maintenance" }))
  })

  it("blocks submission when no delivery has been quoted", async () => {
    await submit(validOptions({ shopDeliveries: {} }))

    expect(clientApiPost).not.toHaveBeenCalled()
    expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Logistics Required" }))
  })

  it("leaves the cart intact when validation fails", async () => {
    await submit(validOptions({ fullName: "" }))

    expect(localStorage.getItem("cart")).not.toBeNull()
  })
})

describe("useCheckoutSubmit cash on delivery", () => {
  beforeEach(() => {
    clientApiPost.mockResolvedValue({ order: { id: "order-1" } })
  })

  it("creates the order and goes straight to success without initiating payment", async () => {
    await submit(validOptions({ paymentMethod: "cash-on-delivery" }))

    expect(clientApiPost).toHaveBeenCalledTimes(1)
    expect(clientApiPost).toHaveBeenCalledWith("orders", expect.anything())
    expect(push).toHaveBeenCalledWith("/checkout/success/order-1")
  })

  it("clears the cart and flags the redirect as intentional", async () => {
    const options = validOptions({ paymentMethod: "cash-on-delivery" })
    await submit(options)

    expect(localStorage.getItem("cart")).toBeNull()
    expect(options.isNavigatingAway.current).toBe(true)
  })
})

describe("useCheckoutSubmit mobile money", () => {
  it("creates the order, then initiates payment, in that order", async () => {
    clientApiPost.mockResolvedValueOnce({ order: { id: "order-2" } }).mockResolvedValueOnce({ success: true, message: "ok" })

    await submit(validOptions())

    expect(clientApiPost.mock.calls.map((c) => c[0])).toEqual(["orders", "payments/clickpesa/initiate"])
    expect(push).toHaveBeenCalledWith("/checkout/success/order-2")
  })

  it("passes the order id to the payment call", async () => {
    clientApiPost.mockResolvedValueOnce({ order: { id: "order-3" } }).mockResolvedValueOnce({ success: true, message: "ok" })

    await submit(validOptions())

    expect(clientApiPost).toHaveBeenLastCalledWith(
      "payments/clickpesa/initiate",
      expect.objectContaining({ orderId: "order-3", paymentMethod: "airtel-money" }),
    )
  })

  it("accepts a top-level id when the API does not wrap the order", async () => {
    clientApiPost.mockResolvedValueOnce({ id: "order-4" }).mockResolvedValueOnce({ success: true, message: "ok" })

    await submit(validOptions())

    expect(push).toHaveBeenCalledWith("/checkout/success/order-4")
  })
})

describe("useCheckoutSubmit card payments", () => {
  const cardOptions = () =>
    validOptions({
      paymentMethod: "visa",
      cardDetails: { number: "4111111111111111", expiry: "12/28", cvv: "123" },
    })

  it("redirects to the hosted payment page when one is returned", async () => {
    clientApiPost
      .mockResolvedValueOnce({ order: { id: "order-5" } })
      .mockResolvedValueOnce({ success: true, message: "ok", controlNumber: "https://pay.clickpesa.com/abc" })

    await submit(cardOptions())

    expect(navigateToExternalUrl).toHaveBeenCalledWith("https://pay.clickpesa.com/abc")
    expect(push).not.toHaveBeenCalled()
  })

  it("falls back to the success page when the control number is not a URL", async () => {
    clientApiPost
      .mockResolvedValueOnce({ order: { id: "order-6" } })
      .mockResolvedValueOnce({ success: true, message: "ok", controlNumber: "991234567" })

    await submit(cardOptions())

    expect(navigateToExternalUrl).not.toHaveBeenCalled()
    expect(push).toHaveBeenCalledWith("/checkout/success/order-6")
  })
})

describe("useCheckoutSubmit failures", () => {
  it("surfaces the payment failure message and stops awaiting payment", async () => {
    clientApiPost
      .mockResolvedValueOnce({ order: { id: "order-7" } })
      .mockResolvedValueOnce({ success: false, message: "Insufficient balance" })

    const { result } = await submit(validOptions())

    expect(result.current.error).toBe("Insufficient balance")
    expect(result.current.isAwaitingPayment).toBe(false)
    expect(push).not.toHaveBeenCalled()
  })

  it("keeps the cart when payment fails, so the buyer can retry", async () => {
    clientApiPost.mockResolvedValueOnce({ order: { id: "order-8" } }).mockResolvedValueOnce({ success: false, message: "Declined" })

    await submit(validOptions())

    expect(localStorage.getItem("cart")).not.toBeNull()
  })

  it("reports a missing order id rather than initiating payment for nothing", async () => {
    clientApiPost.mockResolvedValueOnce({ success: true })

    const { result } = await submit(validOptions())

    expect(result.current.error).toBe("Order ID not returned from API")
    expect(clientApiPost).toHaveBeenCalledTimes(1)
  })

  it("surfaces a thrown network error", async () => {
    clientApiPost.mockRejectedValueOnce(new Error("Network unreachable"))

    const { result } = await submit(validOptions())

    expect(result.current.error).toBe("Network unreachable")
  })

  it("clears the loading flag after a failure", async () => {
    clientApiPost.mockRejectedValueOnce(new Error("boom"))

    const { result } = await submit(validOptions())

    expect(result.current.isLoading).toBe(false)
  })
})

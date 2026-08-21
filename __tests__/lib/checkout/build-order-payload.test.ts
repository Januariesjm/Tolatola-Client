/**
 * Tests for lib/checkout/build-order-payload.ts.
 *
 * Extracted from handleSubmit in checkout-content.tsx. The rule worth guarding
 * is the delivery fee being charged once per shop rather than once per line
 * item: the server sums line items, so getting this wrong overcharges the buyer
 * silently and in proportion to their basket size.
 */

import { DEFAULT_SHOP_ID, buildOrderItems, buildOrderPayload, buildPaymentDetails } from "@/lib/checkout/build-order-payload"
import type { ShopDelivery } from "@/lib/checkout/delivery-grouping"
import type { CartItem } from "@/lib/types/checkout"

function cartItem(overrides: Partial<CartItem> & { shopId?: string | undefined } = {}): CartItem {
  // `"shopId" in overrides` rather than a default value, so a test can pass
  // `shopId: undefined` to model a product with no shop.
  const shopId = "shopId" in overrides ? overrides.shopId : "shop-1"
  const { shopId: _ignored, ...rest } = overrides

  return {
    product_id: "p1",
    quantity: 1,
    product: { id: "p1", name: "Kanga Fabric", price: 12000, shop_id: shopId },
    ...rest,
  } as CartItem
}

function delivery(overrides: Partial<ShopDelivery> = {}): ShopDelivery {
  return {
    distanceKm: 10,
    deliveryFee: 5000,
    shopName: "Tola Shop",
    shopLat: -6.8,
    shopLng: 39.28,
    transportMethodId: "tm-1",
    deliveryAvailable: true,
    ...overrides,
  }
}

describe("buildOrderItems", () => {
  it("charges a shop's delivery fee on the first item only", () => {
    const items = buildOrderItems([cartItem({ product_id: "p1" }), cartItem({ product_id: "p2" }), cartItem({ product_id: "p3" })], {
      "shop-1": delivery({ deliveryFee: 5000 }),
    })

    expect(items.map((i) => i.delivery_fee)).toEqual([5000, 0, 0])
  })

  it("charges each shop separately", () => {
    const items = buildOrderItems([cartItem({ shopId: "shop-1" }), cartItem({ shopId: "shop-2" }), cartItem({ shopId: "shop-1" })], {
      "shop-1": delivery({ deliveryFee: 5000 }),
      "shop-2": delivery({ deliveryFee: 3000 }),
    })

    expect(items.map((i) => [i.shop_id, i.delivery_fee])).toEqual([
      ["shop-1", 5000],
      ["shop-2", 3000],
      ["shop-1", 0],
    ])
  })

  it("totals the line-item fees to exactly the per-shop fees", () => {
    const items = buildOrderItems(
      [cartItem({ shopId: "shop-1" }), cartItem({ shopId: "shop-1" }), cartItem({ shopId: "shop-2" }), cartItem({ shopId: "shop-2" })],
      { "shop-1": delivery({ deliveryFee: 5000 }), "shop-2": delivery({ deliveryFee: 3000 }) },
    )

    expect(items.reduce((sum, i) => sum + i.delivery_fee, 0)).toBe(8000)
  })

  it("falls back to a placeholder shop id when the product has none", () => {
    const items = buildOrderItems([cartItem({ shopId: undefined })], { [DEFAULT_SHOP_ID]: delivery({ deliveryFee: 1500 }) })

    expect(items[0].shop_id).toBe(DEFAULT_SHOP_ID)
    expect(items[0].delivery_fee).toBe(1500)
  })

  it("zeroes fee and distance for a shop with no quote", () => {
    const items = buildOrderItems([cartItem()], {})

    expect(items[0]).toMatchObject({
      delivery_fee: 0,
      delivery_distance_km: 0,
      pickup_latitude: undefined,
      pickup_longitude: undefined,
    })
  })

  it("carries the pickup coordinates and distance from the quote", () => {
    const items = buildOrderItems([cartItem()], { "shop-1": delivery({ distanceKm: 42, shopLat: -1.1, shopLng: 2.2 }) })

    expect(items[0]).toMatchObject({ delivery_distance_km: 42, pickup_latitude: -1.1, pickup_longitude: 2.2 })
  })

  it("falls back to product.id when the item has no product_id", () => {
    const item = cartItem()
    // @ts-expect-error deliberately modelling a cart row written before product_id existed
    delete item.product_id

    expect(buildOrderItems([item], {})[0].product_id).toBe("p1")
  })

  it("normalises absent variants to null rather than undefined", () => {
    const items = buildOrderItems([cartItem()], {})

    expect(items[0].selected_color).toBeNull()
    expect(items[0].selected_size).toBeNull()
  })

  it("preserves selected variants", () => {
    const items = buildOrderItems([cartItem({ selected_color: { name: "Red" }, selected_size: "XL" })], {})

    expect(items[0]).toMatchObject({ selected_color: { name: "Red" }, selected_size: "XL" })
  })
})

describe("buildPaymentDetails", () => {
  const card = { number: "4111111111111111", expiry: "12/28", cvv: "123" }

  it("sends only the phone number for mobile money", () => {
    expect(buildPaymentDetails("airtel-money", "255711000000", card)).toEqual({
      phoneNumber: "255711000000",
      cardNumber: undefined,
      expiryDate: undefined,
      cvv: undefined,
    })
  })

  it("sends only the card fields for a card", () => {
    expect(buildPaymentDetails("visa", "255711000000", card)).toEqual({
      phoneNumber: undefined,
      cardNumber: "4111111111111111",
      expiryDate: "12/28",
      cvv: "123",
    })
  })

  it("sends neither for bank transfer", () => {
    expect(buildPaymentDetails("crdb-wakala", "255711000000", card)).toEqual({
      phoneNumber: undefined,
      cardNumber: undefined,
      expiryDate: undefined,
      cvv: undefined,
    })
  })
})

describe("buildOrderPayload", () => {
  const base = {
    cartItems: [cartItem()],
    shopDeliveries: { "shop-1": delivery() },
    fullName: "Amina Juma",
    phone: "+255711223344",
    fullAddress: "Mikocheni, Kinondoni, Dar es Salaam",
    addressData: {
      country: "Tanzania",
      region: "Dar es Salaam",
      district: "Kinondoni",
      ward: "Mikocheni",
      village: "",
      street: "Plot 12",
    },
    guestEmail: "",
    userEmail: "amina@example.com",
    latitude: -6.79,
    longitude: 39.25,
    deliveryFee: 5000,
    insuranceFee: 255,
    total: 17255,
    paymentMethod: "airtel-money",
    paymentPhoneNumber: "255711223344",
    cardDetails: { number: "", expiry: "", cvv: "" },
    selectedTransportId: "tm-9",
  }

  it("maps the address form onto the shipping address", () => {
    expect(buildOrderPayload(base).shippingAddress).toMatchObject({
      full_name: "Amina Juma",
      phone: "+255711223344",
      address: "Mikocheni, Kinondoni, Dar es Salaam",
      country: "Tanzania",
      region: "Dar es Salaam",
      district: "Kinondoni",
      ward: "Mikocheni",
      street: "Plot 12",
      latitude: -6.79,
      longitude: 39.25,
    })
  })

  it("prefers the guest email over the account email", () => {
    expect(buildOrderPayload({ ...base, guestEmail: "guest@example.com" }).shippingAddress.email).toBe("guest@example.com")
  })

  it("falls back to the account email for a signed-in buyer", () => {
    expect(buildOrderPayload(base).shippingAddress.email).toBe("amina@example.com")
  })

  it("sums the quoted distances when a delivery is being charged", () => {
    const payload = buildOrderPayload({
      ...base,
      shopDeliveries: { "shop-1": delivery({ distanceKm: 10 }), "shop-2": delivery({ distanceKm: 15 }) },
    })

    expect(payload.shippingAddress.delivery_distance_km).toBe(25)
  })

  it("reports zero distance for a pickup-only order", () => {
    const payload = buildOrderPayload({
      ...base,
      deliveryFee: 0,
      shopDeliveries: { "shop-1": delivery({ distanceKm: 10, deliveryFee: 0, deliveryAvailable: false }) },
    })

    expect(payload.shippingAddress.delivery_distance_km).toBe(0)
  })

  it("uses the quote's transport method over the current dropdown value", () => {
    const payload = buildOrderPayload({ ...base, shopDeliveries: { "shop-1": delivery({ transportMethodId: "tm-quoted" }) } })

    expect(payload.transportMethodId).toBe("tm-quoted")
  })

  it("falls back to the selected transport method when the quote has none", () => {
    const payload = buildOrderPayload({ ...base, shopDeliveries: { "shop-1": delivery({ transportMethodId: null }) } })

    expect(payload.transportMethodId).toBe("tm-9")
  })

  it("sends a null transport method when there is neither", () => {
    const payload = buildOrderPayload({ ...base, shopDeliveries: {}, selectedTransportId: "" })

    expect(payload.transportMethodId).toBeNull()
  })

  it("carries the totals through unchanged", () => {
    const payload = buildOrderPayload(base)

    expect(payload).toMatchObject({ totalAmount: 17255, insuranceFee: 255, deliveryFee: 5000 })
  })
})

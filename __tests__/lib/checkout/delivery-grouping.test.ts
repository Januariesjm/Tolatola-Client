/**
 * Tests for cart-to-shop grouping and delivery re-pricing
 * (lib/checkout/delivery-grouping.ts).
 *
 * This arithmetic decides what the buyer is charged for delivery, and it used
 * to exist twice inside checkout-content.tsx -- once in the address handler and
 * once in the transport-method effect.
 */

import {
  DEFAULT_SHOP_ID,
  FALLBACK_SHOP_LAT,
  FALLBACK_SHOP_LNG,
  groupCartByShop,
  repriceShopDeliveries,
  shopWeights,
  type GroupableCartItem,
  type ShopDelivery,
} from "@/lib/checkout/delivery-grouping"

function item(overrides: Partial<GroupableCartItem["product"]> = {}, quantity = 1): GroupableCartItem {
  return {
    quantity,
    product: {
      shop_id: "shop-1",
      weight: 2,
      delivery_available: true,
      shops: { latitude: -6.1, longitude: 35.7, name: "Dodoma Crafts" },
      ...overrides,
    },
  }
}

describe("groupCartByShop", () => {
  it("returns nothing for an empty cart", () => {
    expect(groupCartByShop([])).toEqual({})
  })

  it("sums weight across lines from the same shop, times quantity", () => {
    const groups = groupCartByShop([item({}, 2), item({ weight: 3 }, 1)])

    // 2kg x 2 + 3kg x 1
    expect(groups["shop-1"].weight).toBe(7)
  })

  it("keeps shops separate", () => {
    const groups = groupCartByShop([item({ shop_id: "shop-1" }), item({ shop_id: "shop-2", weight: 5 })])

    expect(Object.keys(groups).sort()).toEqual(["shop-1", "shop-2"])
    expect(groups["shop-2"].weight).toBe(5)
  })

  it("treats a weightless product as 1kg", () => {
    expect(groupCartByShop([item({ weight: null }, 3)])["shop-1"].weight).toBe(3)
    expect(groupCartByShop([item({ weight: 0 }, 2)])["shop-1"].weight).toBe(2)
  })

  it("buckets a product with no shop id under the default shop", () => {
    const groups = groupCartByShop([item({ shop_id: null })])

    expect(groups[DEFAULT_SHOP_ID]).toBeDefined()
  })

  it("carries the shop's coordinates and name through", () => {
    const groups = groupCartByShop([item()])

    expect(groups["shop-1"]).toMatchObject({ lat: -6.1, lng: 35.7, name: "Dodoma Crafts" })
  })

  it("falls back to Dar es Salaam when the shop has no location", () => {
    const groups = groupCartByShop([item({ shops: { latitude: null, longitude: null, name: null } })])

    expect(groups["shop-1"]).toMatchObject({
      lat: FALLBACK_SHOP_LAT,
      lng: FALLBACK_SHOP_LNG,
      name: "Unknown Shop",
    })
  })

  it("handles a product with no shop join at all", () => {
    expect(() => groupCartByShop([item({ shops: null })])).not.toThrow()
    expect(groupCartByShop([item({ shops: null })])["shop-1"].lat).toBe(FALLBACK_SHOP_LAT)
  })

  it("marks a shop pickup-only if ANY of its lines is pickup-only", () => {
    const groups = groupCartByShop([item({ delivery_available: true }), item({ delivery_available: false })])

    expect(groups["shop-1"].deliveryAvailable).toBe(false)
  })

  it("stays deliverable when delivery_available is merely absent", () => {
    // Only an explicit `false` means pickup-only.
    const groups = groupCartByShop([item({ delivery_available: null })])

    expect(groups["shop-1"].deliveryAvailable).toBe(true)
  })

  it("does not let one shop's pickup-only flag leak to another", () => {
    const groups = groupCartByShop([
      item({ shop_id: "shop-1", delivery_available: false }),
      item({ shop_id: "shop-2", delivery_available: true }),
    ])

    expect(groups["shop-1"].deliveryAvailable).toBe(false)
    expect(groups["shop-2"].deliveryAvailable).toBe(true)
  })
})

describe("shopWeights", () => {
  it("agrees with groupCartByShop, which is the point of sharing it", () => {
    const cart = [item({}, 2), item({ shop_id: "shop-2", weight: 4 }, 3)]
    const groups = groupCartByShop(cart)

    expect(shopWeights(cart)).toEqual({
      "shop-1": groups["shop-1"].weight,
      "shop-2": groups["shop-2"].weight,
    })
  })

  it("returns an empty map for an empty cart", () => {
    expect(shopWeights([])).toEqual({})
  })
})

describe("repriceShopDeliveries", () => {
  const leg = (overrides: Partial<ShopDelivery> = {}): ShopDelivery => ({
    distanceKm: 10,
    deliveryFee: 0,
    shopName: "Dodoma Crafts",
    shopLat: -6.1,
    shopLng: 35.7,
    deliveryAvailable: true,
    ...overrides,
  })

  const perKg = { id: "m-1", name: "Boda", rate_per_kg: 500 }
  const perKm = { id: "m-2", name: "Truck", rate_per_km: 800 }

  it("prices by weight when the method has a per-kg rate", () => {
    const out = repriceShopDeliveries({ "shop-1": leg() }, { "shop-1": 4 }, perKg)

    expect(out["shop-1"].deliveryFee).toBe(2000)
    expect(out["shop-1"].transportMethod).toBe("Boda")
    expect(out["shop-1"].transportMethodId).toBe("m-1")
  })

  it("prices by distance when the method has only a per-km rate", () => {
    const out = repriceShopDeliveries({ "shop-1": leg({ distanceKm: 3 }) }, { "shop-1": 4 }, perKm)

    expect(out["shop-1"].deliveryFee).toBe(2400)
  })

  it("keeps distances untouched — only the price and label change", () => {
    const out = repriceShopDeliveries({ "shop-1": leg({ distanceKm: 12, duration: "25 mins" }) }, { "shop-1": 1 }, perKg)

    expect(out["shop-1"].distanceKm).toBe(12)
    expect(out["shop-1"].duration).toBe("25 mins")
  })

  it("charges nothing and says Store Pickup for a pickup-only shop", () => {
    const out = repriceShopDeliveries({ "shop-1": leg({ deliveryAvailable: false }) }, { "shop-1": 10 }, perKg)

    expect(out["shop-1"].deliveryFee).toBe(0)
    expect(out["shop-1"].transportMethod).toBe("Store Pickup")
    expect(out["shop-1"].transportMethodId).toBeNull()
  })

  it("treats a leg with no deliveryAvailable flag as deliverable", () => {
    const out = repriceShopDeliveries({ "shop-1": leg({ deliveryAvailable: undefined }) }, { "shop-1": 2 }, perKg)

    expect(out["shop-1"].transportMethod).toBe("Boda")
  })

  it("treats a shop with no recorded weight as zero, not NaN", () => {
    const out = repriceShopDeliveries({ "shop-1": leg() }, {}, perKg)

    expect(Number.isNaN(out["shop-1"].deliveryFee)).toBe(false)
  })

  it("prices every shop in the map", () => {
    const out = repriceShopDeliveries({ "shop-1": leg(), "shop-2": leg({ deliveryAvailable: false }) }, { "shop-1": 2, "shop-2": 2 }, perKg)

    expect(out["shop-1"].deliveryFee).toBe(1000)
    expect(out["shop-2"].deliveryFee).toBe(0)
  })

  it("does not mutate the input map", () => {
    const input = { "shop-1": leg({ deliveryFee: 123 }) }
    repriceShopDeliveries(input, { "shop-1": 4 }, perKg)

    expect(input["shop-1"].deliveryFee).toBe(123)
  })

  it("falls back to a baseline when the method has no rates at all", () => {
    const out = repriceShopDeliveries({ "shop-1": leg({ distanceKm: 3 }) }, { "shop-1": 1 }, undefined)

    expect(out["shop-1"].deliveryFee).toBe(3000)
  })
})

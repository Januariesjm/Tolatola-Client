/**
 * Grouping and re-pricing of a cart by shop, for checkout delivery.
 *
 * Extracted from components/checkout/checkout-content.tsx, which grouped the
 * cart inside an async handler and then re-derived the same per-shop weights a
 * second time inside an effect. Two copies of the same arithmetic on the number
 * that decides what the buyer is charged is a bug waiting to happen, so both
 * now come from here.
 *
 * Pure: no fetching, no React. Distance lookups stay in the component.
 */

import { calculateFee, type TransportMethodRate } from "./delivery"

/** Shop coordinates as joined onto a cart line's product. */
interface CartProductShop {
  latitude?: number | null
  longitude?: number | null
  name?: string | null
}

/** The product fields grouping depends on. */
interface CartProduct {
  shop_id?: string | null
  weight?: number | null
  delivery_available?: boolean | null
  shops?: CartProductShop | null
}

/** One cart line, as far as delivery grouping is concerned. */
export interface GroupableCartItem {
  quantity: number
  product: CartProduct
}

/** Aggregated per-shop figures used to price that shop's leg of the delivery. */
export interface ShopGroup {
  weight: number
  lat: number
  lng: number
  name: string
  /** False when any line from this shop is pickup-only. */
  deliveryAvailable: boolean
}

/** Shop id used when a product carries none. */
export const DEFAULT_SHOP_ID = "default_shop"

/** Fallback coordinates (Dar es Salaam) for a shop with no location on file. */
export const FALLBACK_SHOP_LAT = -6.7924
export const FALLBACK_SHOP_LNG = 39.2083

/**
 * Groups cart lines by shop, summing chargeable weight.
 *
 * A line with no weight counts as 1kg, matching the original behaviour. One
 * pickup-only line makes the whole shop's portion pickup-only, because a single
 * courier leg either happens or it does not.
 */
export function groupCartByShop(items: GroupableCartItem[]): Record<string, ShopGroup> {
  const groups: Record<string, ShopGroup> = {}

  for (const item of items) {
    const shopId = item.product.shop_id || DEFAULT_SHOP_ID

    if (!groups[shopId]) {
      const shop = item.product.shops
      groups[shopId] = {
        weight: 0,
        lat: shop?.latitude || FALLBACK_SHOP_LAT,
        lng: shop?.longitude || FALLBACK_SHOP_LNG,
        name: shop?.name || "Unknown Shop",
        deliveryAvailable: true,
      }
    }

    groups[shopId].weight += (item.product.weight || 1) * item.quantity

    if (item.product.delivery_available === false) {
      groups[shopId].deliveryAvailable = false
    }
  }

  return groups
}

/** Chargeable weight per shop, derived from the same grouping. */
export function shopWeights(items: GroupableCartItem[]): Record<string, number> {
  const groups = groupCartByShop(items)
  return Object.fromEntries(Object.entries(groups).map(([shopId, group]) => [shopId, group.weight]))
}

/** A priced delivery leg for one shop. */
export interface ShopDelivery {
  distanceKm: number
  deliveryFee: number
  duration?: string
  transportMethod?: string
  transportMethodId?: string | null
  shopName: string
  shopLat: number
  shopLng: number
  lat?: number
  lng?: number
  deliveryAvailable?: boolean
}

/**
 * Re-prices existing delivery legs after the buyer picks a different transport
 * method. Distances are kept; only the fee and the method label change.
 *
 * A shop marked pickup-only keeps a zero fee and the "Store Pickup" label
 * regardless of the selected method.
 */
export function repriceShopDeliveries(
  deliveries: Record<string, ShopDelivery>,
  weights: Record<string, number>,
  method: TransportMethodRate | undefined,
): Record<string, ShopDelivery> {
  const updated: Record<string, ShopDelivery> = { ...deliveries }

  for (const shopId of Object.keys(updated)) {
    const leg = updated[shopId]
    const isDeliverable = leg.deliveryAvailable !== false

    updated[shopId] = {
      ...leg,
      deliveryFee: calculateFee(method, leg.distanceKm, weights[shopId] || 0, isDeliverable),
      transportMethod: isDeliverable ? method?.name : "Store Pickup",
      transportMethodId: isDeliverable ? method?.id : null,
    }
  }

  return updated
}

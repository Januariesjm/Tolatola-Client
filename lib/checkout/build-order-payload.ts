/**
 * Builds the request body posted to `orders` when a buyer places an order.
 *
 * Extracted from the middle of handleSubmit in
 * components/checkout/checkout-content.tsx, where ~55 lines of payload assembly
 * sat between the validation guard and the two network calls. It is worth having
 * on its own because of one rule that is easy to break and impossible to see
 * from the markup: a shop's delivery fee is attached to only the *first* line
 * item from that shop. Every other item from the same shop carries
 * `delivery_fee: 0`, because the server sums the line items and would otherwise
 * charge the buyer the delivery fee once per item.
 *
 * As a pure function that rule is pinned by tests instead of resting on a
 * mutable lookup declared inside an async handler.
 */

import { isCard, isMobileMoney, type CheckoutAddress, type CheckoutCardDetails } from "@/lib/checkout/validate-checkout-form"
import type { ShopDelivery } from "@/lib/checkout/delivery-grouping"
import type { CartItem } from "@/lib/types/checkout"

/** Per-shop delivery quotes, keyed by shop id. */
export type ShopDeliveryMap = Record<string, ShopDelivery>

/** Shop id used for cart items that carry no shop, matching the original handler. */
export const DEFAULT_SHOP_ID = "default_shop"

/** Everything the payload is assembled from. */
export interface BuildOrderPayloadInput {
  cartItems: CartItem[]
  shopDeliveries: ShopDeliveryMap
  fullName: string
  phone: string
  /** Resolved single-line address string from the address form. */
  fullAddress: string
  addressData: CheckoutAddress & { country?: string; village?: string }
  /** Guest email; falls back to the signed-in user's email. */
  guestEmail: string
  userEmail?: string
  latitude: number | null
  longitude: number | null
  deliveryFee: number
  insuranceFee: number
  total: number
  paymentMethod: string
  paymentPhoneNumber: string
  cardDetails: CheckoutCardDetails
  selectedTransportId: string
}

/** One line item as the orders endpoint expects it. */
export interface OrderPayloadItem {
  product_id: string | undefined
  quantity: number
  price: number
  shop_id: string
  /** Non-zero on the first item from each shop only -- see the module comment. */
  delivery_fee: number
  delivery_distance_km: number
  pickup_latitude: number | undefined
  pickup_longitude: number | undefined
  selected_color: CartItem["selected_color"] | null
  selected_size: string | null
}

export interface OrderPayloadShippingAddress {
  full_name: string
  phone: string
  address: string
  country?: string
  region?: string
  district?: string
  ward?: string
  village?: string
  street?: string
  email?: string
  latitude: number | null
  longitude: number | null
  delivery_distance_km: number
  delivery_fee: number
}

export interface OrderPayload {
  items: OrderPayloadItem[]
  shippingAddress: OrderPayloadShippingAddress
  totalAmount: number
  insuranceFee: number
  paymentMethod: string
  paymentDetails: {
    phoneNumber?: string
    cardNumber?: string
    expiryDate?: string
    cvv?: string
  }
  transportMethodId: string | null
  deliveryFee: number
}

/**
 * Maps the cart to order line items, charging each shop's delivery fee once.
 *
 * Exported separately so the fee-once rule can be tested without building the
 * whole payload.
 */
export function buildOrderItems(cartItems: CartItem[], shopDeliveries: ShopDeliveryMap): OrderPayloadItem[] {
  const shopsAlreadyCharged = new Set<string>()

  return cartItems.map((item) => {
    const shopId = item.product.shop_id || DEFAULT_SHOP_ID
    const delivery = shopDeliveries[shopId]

    const deliveryFee = shopsAlreadyCharged.has(shopId) ? 0 : delivery?.deliveryFee || 0
    shopsAlreadyCharged.add(shopId)

    return {
      product_id: item.product_id || item.product?.id,
      quantity: item.quantity,
      price: item.product.price,
      shop_id: shopId,
      delivery_fee: deliveryFee,
      delivery_distance_km: delivery?.distanceKm || 0,
      pickup_latitude: delivery?.shopLat,
      pickup_longitude: delivery?.shopLng,
      selected_color: item.selected_color || null,
      selected_size: item.selected_size || null,
    }
  })
}

/**
 * Payment credentials for the order record, narrowed to the fields the selected
 * method actually uses so a card number never rides along on a wallet payment.
 */
export function buildPaymentDetails(
  paymentMethod: string,
  paymentPhoneNumber: string,
  cardDetails: CheckoutCardDetails,
): OrderPayload["paymentDetails"] {
  return {
    phoneNumber: isMobileMoney(paymentMethod) ? paymentPhoneNumber : undefined,
    cardNumber: isCard(paymentMethod) ? cardDetails.number : undefined,
    expiryDate: isCard(paymentMethod) ? cardDetails.expiry : undefined,
    cvv: isCard(paymentMethod) ? cardDetails.cvv : undefined,
  }
}

/** Assembles the full order request body. */
export function buildOrderPayload(input: BuildOrderPayloadInput): OrderPayload {
  const deliveries = Object.values(input.shopDeliveries)

  return {
    items: buildOrderItems(input.cartItems, input.shopDeliveries),
    shippingAddress: {
      full_name: input.fullName,
      phone: input.phone,
      address: input.fullAddress,
      country: input.addressData.country,
      region: input.addressData.region,
      district: input.addressData.district,
      ward: input.addressData.ward,
      village: input.addressData.village,
      street: input.addressData.street,
      email: input.guestEmail || input.userEmail,
      latitude: input.latitude,
      longitude: input.longitude,
      // Reported only when something is actually being delivered; a
      // pickup-only order has distances but no fee, and the server treats a
      // non-zero distance as chargeable.
      delivery_distance_km: input.deliveryFee > 0 ? deliveries.reduce((sum, d) => sum + d.distanceKm, 0) : 0,
      delivery_fee: input.deliveryFee,
    },
    totalAmount: input.total,
    insuranceFee: input.insuranceFee,
    paymentMethod: input.paymentMethod,
    paymentDetails: buildPaymentDetails(input.paymentMethod, input.paymentPhoneNumber, input.cardDetails),
    // The quote's own transport method wins: the buyer can change the dropdown
    // after a quote is calculated, and the quote is what was priced.
    transportMethodId: deliveries[0]?.transportMethodId || input.selectedTransportId || null,
    deliveryFee: input.deliveryFee,
  }
}

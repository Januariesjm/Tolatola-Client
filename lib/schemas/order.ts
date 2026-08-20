import { z } from "zod"

/**
 * Order shapes for the order detail page.
 *
 * Zod rather than a bare interface for two reasons: the payload crosses a trust
 * boundary (it comes back from the API / Supabase), and the schemas double as
 * the runtime validators used by the order API routes.
 *
 * Everything past `id` is lenient on purpose. Orders are joined together from
 * several tables and older rows predate columns like `delivery_pin`, so a
 * strict schema would reject rows the UI renders perfectly well. The point here
 * is a typed, *predictable* shape -- not rejecting real data.
 */

/** Where an order is being delivered. */
export const shippingAddressSchema = z.object({
  full_name: z.string().nullish(),
  phone: z.string().nullish(),
  address: z.string().nullish(),
  city: z.string().nullish(),
  region: z.string().nullish(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
})

/** The shop a line item was bought from, joined through products. */
export const orderItemShopSchema = z.object({
  id: z.string().nullish(),
  name: z.string().nullish(),
  address: z.string().nullish(),
  district: z.string().nullish(),
  region: z.string().nullish(),
  phone: z.string().nullish(),
  logo_url: z.string().nullish(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  users: z.object({ phone: z.string().nullish() }).nullish(),
  vendors: z
    .object({
      business_name: z.string().nullish(),
      user_id: z.string().nullish(),
      users: z.object({ phone: z.string().nullish() }).nullish(),
    })
    .nullish(),
})

/** Product snapshot attached to a line item. */
export const orderItemProductSchema = z.object({
  name: z.string().nullish(),
  price: z.number().nullish(),
  images: z.array(z.string()).nullish(),
  primary_image_url: z.string().nullish(),
  category_name: z.string().nullish(),
  categories: z.object({ name: z.string().nullish(), slug: z.string().nullish() }).nullish(),
  shops: orderItemShopSchema.nullish(),
})

export const orderItemSchema = z.object({
  id: z.string(),
  product_id: z.string().nullish(),
  quantity: z.number(),
  total_price: z.number(),
  products: orderItemProductSchema.nullish(),
})

/** Transport method chosen for the order. */
export const transportMethodSchema = z.object({
  name: z.string().nullish(),
  provider_type: z.string().nullish(),
})

/** Live position of the assigned transporter, used by the tracking map. */
export const transporterAssignmentSchema = z.object({
  transporters: z
    .object({
      current_location: z.object({ lat: z.number(), lng: z.number() }).nullish(),
      users: z.object({ full_name: z.string().nullish(), phone: z.string().nullish() }).nullish(),
    })
    .nullish(),
})

export const orderSchema = z.object({
  id: z.string(),
  order_number: z.string().nullish(),
  status: z.string().nullish(),
  payment_status: z.string().nullish(),
  payment_method: z.string().nullish(),
  total_amount: z.number(),
  subtotal: z.number().nullish(),
  delivery_fee: z.number().nullish(),
  created_at: z.string(),
  /** Set once the transporter asks the buyer to confirm receipt. */
  delivery_confirmation_requested: z.boolean().nullish(),
  /** PIN the buyer reads out to the transporter on handover. */
  delivery_pin: z.string().nullish(),
  shipping_address: shippingAddressSchema.nullish(),
  order_items: z.array(orderItemSchema).nullish(),
  transport_methods: transportMethodSchema.nullish(),
  transporter_assignments: z.array(transporterAssignmentSchema).nullish(),
})

export type ShippingAddress = z.infer<typeof shippingAddressSchema>
export type OrderItem = z.infer<typeof orderItemSchema>
export type TransportMethod = z.infer<typeof transportMethodSchema>
export type TransporterAssignment = z.infer<typeof transporterAssignmentSchema>
export type Order = z.infer<typeof orderSchema>

/** Body accepted by POST /api/orders/confirm-delivery. */
export const confirmDeliveryRequestSchema = z.object({
  orderId: z.string().min(1, "orderId is required"),
})

export type ConfirmDeliveryRequest = z.infer<typeof confirmDeliveryRequestSchema>

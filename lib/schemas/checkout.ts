import { z } from "zod"

export const checkoutItemSchema = z.object({
  product_id: z.string().min(1, "Product ID required"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  price: z.number().nonnegative("Price cannot be negative"),
  selected_color: z.object({ name: z.string(), image: z.string().optional() }).optional(),
  selected_size: z.string().optional(),
})

export const checkoutOrderSchema = z.object({
  full_name: z.string().min(2, "Full name required"),
  phone: z.string().min(7, "Phone number required"),
  email: z.string().email().optional().or(z.literal("")),
  payment_method: z.string().min(1, "Payment method required"),
  payment_phone_number: z.string().optional(),
  items: z.array(checkoutItemSchema).min(1, "At least one item required"),
  subtotal: z.number().nonnegative(),
  delivery_fee: z.number().nonnegative(),
  insurance_fee: z.number().nonnegative(),
  total_amount: z.number().positive("Total amount must be greater than 0"),
  address: z.object({
    country: z.string().default("Tanzania"),
    region: z.string().min(1, "Region required"),
    district: z.string().min(1, "District required"),
    ward: z.string().optional(),
    village: z.string().optional(),
    street: z.string().optional(),
    latitude: z.number().optional().nullable(),
    longitude: z.number().optional().nullable(),
  }),
})

export type CheckoutOrderInput = z.infer<typeof checkoutOrderSchema>

/**
 * Body accepted by POST /api/orders.
 *
 * Distinct from `checkoutOrderSchema` above, which describes the snake_case
 * shape used elsewhere. This one matches what lib/checkout/build-order-payload
 * actually posts, and it is what the route validates.
 *
 * The handler previously destructured this straight out of `request.json()` and
 * then called `items.map(...)`, so a body with no `items` array threw a
 * TypeError that surfaced as an opaque 500 -- after the order row had already
 * been inserted, leaving an order with no line items.
 *
 * `totalAmount - deliveryFee` becomes the stored subtotal, so both are required
 * numbers: `undefined` there would write NaN into the ledger.
 */
export const createOrderItemSchema = z.object({
  product_id: z.string().min(1, "product_id is required"),
  quantity: z.number().int().positive("quantity must be greater than 0"),
  price: z.number().nonnegative("price cannot be negative"),
  shop_id: z.string().min(1, "shop_id is required"),
  delivery_fee: z.number().nonnegative().default(0),
  delivery_distance_km: z.number().nonnegative().default(0),
  pickup_latitude: z.number().nullish(),
  pickup_longitude: z.number().nullish(),
  selected_color: z.object({ name: z.string(), image: z.string().optional() }).nullish(),
  selected_size: z.string().nullish(),
})

/**
 * Delivery address as posted at checkout.
 *
 * Lenient past the contact fields: the address parts come from an autocomplete
 * that legitimately leaves ward or village blank in some regions, and this is
 * stored as a jsonb column rather than queried on.
 */
export const createOrderShippingAddressSchema = z.object({
  full_name: z.string().min(1, "full_name is required"),
  phone: z.string().min(1, "phone is required"),
  address: z.string().nullish(),
  country: z.string().nullish(),
  region: z.string().nullish(),
  district: z.string().nullish(),
  ward: z.string().nullish(),
  village: z.string().nullish(),
  street: z.string().nullish(),
  email: z.string().nullish(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  delivery_distance_km: z.number().nonnegative().nullish(),
  delivery_fee: z.number().nonnegative().nullish(),
})

export const createOrderRequestSchema = z.object({
  items: z.array(createOrderItemSchema).min(1, "At least one item is required"),
  shippingAddress: createOrderShippingAddressSchema,
  totalAmount: z.number().positive("totalAmount must be greater than 0"),
  insuranceFee: z.number().nonnegative().optional(),
  paymentMethod: z.string().min(1, "paymentMethod is required"),
  /** Opaque here: the payment provider owns this shape. */
  paymentDetails: z.unknown().optional(),
  transportMethodId: z.string().nullish(),
  deliveryFee: z.number().nonnegative("deliveryFee cannot be negative"),
})

export type CreateOrderItem = z.infer<typeof createOrderItemSchema>
export type CreateOrderRequest = z.infer<typeof createOrderRequestSchema>

export const orderResponseSchema = z.object({
  success: z.boolean(),
  order_id: z.string().optional(),
  order_number: z.string().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
})

export type OrderResponse = z.infer<typeof orderResponseSchema>

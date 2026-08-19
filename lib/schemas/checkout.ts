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

export const orderResponseSchema = z.object({
  success: z.boolean(),
  order_id: z.string().optional(),
  order_number: z.string().optional(),
  message: z.string().optional(),
  error: z.string().optional(),
})

export type OrderResponse = z.infer<typeof orderResponseSchema>

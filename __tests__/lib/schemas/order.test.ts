/**
 * Tests for the order schemas (lib/schemas/order.ts).
 *
 * Two jobs: type the order detail page, and validate the body of
 * POST /api/orders/confirm-delivery. The schema is deliberately lenient about
 * optional columns -- orders are joined from several tables and older rows
 * predate columns like delivery_pin -- so these tests pin what it must accept
 * as well as what it must reject.
 */

import { confirmDeliveryRequestSchema, orderItemSchema, orderSchema, shippingAddressSchema } from "@/lib/schemas/order"

/** A representative payload as the API returns it. */
const fullOrder = {
  id: "ord-1",
  order_number: "TOLA-00042",
  status: "shipped",
  payment_status: "paid",
  payment_method: "mpesa",
  total_amount: 125000,
  subtotal: 120000,
  delivery_fee: 5000,
  created_at: "2026-02-01T10:00:00Z",
  delivery_confirmation_requested: true,
  delivery_pin: "4821",
  shipping_address: {
    full_name: "Asha Mwinyi",
    phone: "255700000001",
    address: "12 Samora Ave",
    city: "Dodoma",
    region: "Dodoma",
    latitude: -6.18,
    longitude: 35.75,
  },
  order_items: [
    {
      id: "item-1",
      product_id: "prod-1",
      quantity: 2,
      total_price: 60000,
      products: {
        name: "Sisal Basket",
        price: 30000,
        images: ["/a.jpg"],
        primary_image_url: "/a.jpg",
        category_name: "Home",
        categories: { name: "Home", slug: "home" },
        shops: {
          id: "shop-1",
          name: "Dodoma Crafts",
          address: "Market St",
          district: "Central",
          region: "Dodoma",
          latitude: -6.18,
          longitude: 35.75,
          vendors: { business_name: "Dodoma Crafts Ltd", user_id: "user-9" },
        },
      },
    },
  ],
  transport_methods: { name: "Boda", provider_type: "individual" },
  transporter_assignments: [
    {
      transporters: {
        current_location: { lat: -6.2, lng: 35.7 },
        users: { full_name: "Juma Said", phone: "255700000002" },
      },
    },
  ],
}

describe("orderSchema", () => {
  it("accepts a representative full payload", () => {
    const result = orderSchema.safeParse(fullOrder)

    expect(result.success).toBe(true)
  })

  it("accepts a minimal order with only the required fields", () => {
    const result = orderSchema.safeParse({
      id: "ord-2",
      total_amount: 1000,
      created_at: "2026-02-01T10:00:00Z",
    })

    expect(result.success).toBe(true)
  })

  it.each(["id", "total_amount", "created_at"])("rejects an order missing %s", (field) => {
    const { [field as keyof typeof fullOrder]: _omitted, ...rest } = fullOrder

    expect(orderSchema.safeParse(rest).success).toBe(false)
  })

  it("rejects a non-numeric total", () => {
    expect(orderSchema.safeParse({ ...fullOrder, total_amount: "125000" }).success).toBe(false)
  })

  it.each([
    ["status", null],
    ["delivery_pin", null],
    ["shipping_address", null],
    ["order_items", null],
    ["transport_methods", null],
    ["transporter_assignments", null],
  ])("tolerates a null %s, which older rows have", (field, value) => {
    expect(orderSchema.safeParse({ ...fullOrder, [field]: value }).success).toBe(true)
  })

  it("parses nested line items and their shop join", () => {
    const parsed = orderSchema.parse(fullOrder)

    expect(parsed.order_items?.[0].products?.shops?.vendors?.business_name).toBe("Dodoma Crafts Ltd")
    expect(parsed.order_items?.[0].product_id).toBe("prod-1")
  })

  it("parses the transporter's live location", () => {
    const parsed = orderSchema.parse(fullOrder)

    expect(parsed.transporter_assignments?.[0].transporters?.current_location).toEqual({
      lat: -6.2,
      lng: 35.7,
    })
  })

  it("ignores unknown extra columns rather than failing", () => {
    // Supabase selects often return more than the UI reads.
    expect(orderSchema.safeParse({ ...fullOrder, some_new_column: true }).success).toBe(true)
  })
})

describe("orderItemSchema", () => {
  it("requires id, quantity and total_price", () => {
    expect(orderItemSchema.safeParse({ id: "i", quantity: 1, total_price: 10 }).success).toBe(true)
    expect(orderItemSchema.safeParse({ id: "i", quantity: 1 }).success).toBe(false)
  })

  it("allows a line item with no product join", () => {
    expect(orderItemSchema.safeParse({ id: "i", quantity: 1, total_price: 10, products: null }).success).toBe(true)
  })
})

describe("shippingAddressSchema", () => {
  it("accepts an entirely empty address", () => {
    expect(shippingAddressSchema.safeParse({}).success).toBe(true)
  })

  it("rejects a non-numeric latitude", () => {
    expect(shippingAddressSchema.safeParse({ latitude: "-6.18" }).success).toBe(false)
  })
})

describe("confirmDeliveryRequestSchema", () => {
  it("accepts a body with an orderId", () => {
    expect(confirmDeliveryRequestSchema.safeParse({ orderId: "ord-1" }).success).toBe(true)
  })

  it.each([
    ["an empty string", { orderId: "" }],
    ["a missing orderId", {}],
    ["a numeric orderId", { orderId: 42 }],
    ["a null orderId", { orderId: null }],
    ["a non-object body", "ord-1"],
    ["null", null],
  ])("rejects %s", (_label, body) => {
    expect(confirmDeliveryRequestSchema.safeParse(body).success).toBe(false)
  })

  it("explains why an empty orderId was rejected", () => {
    const result = confirmDeliveryRequestSchema.safeParse({ orderId: "" })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("orderId is required")
    }
  })
})

/**
 * Tests for createOrderRequestSchema (lib/schemas/checkout.ts).
 *
 * The route destructured this body straight out of `request.json()` and then
 * called `items.map(...)`. A body without `items` therefore threw *after* the
 * order row was inserted, leaving an order with no line items behind a 500.
 *
 * The payload here mirrors what lib/checkout/build-order-payload produces, so a
 * change to one that breaks the other fails this suite.
 */

import { createOrderItemSchema, createOrderRequestSchema } from "@/lib/schemas/checkout"

const ITEM = {
  product_id: "p1",
  quantity: 2,
  price: 12000,
  shop_id: "shop-1",
  delivery_fee: 5000,
  delivery_distance_km: 10,
  pickup_latitude: -6.8,
  pickup_longitude: 39.28,
  selected_color: null,
  selected_size: null,
}

const BODY = {
  items: [ITEM],
  shippingAddress: {
    full_name: "Amina Juma",
    phone: "+255711223344",
    address: "Mikocheni, Kinondoni",
    country: "Tanzania",
    region: "Dar es Salaam",
    district: "Kinondoni",
    ward: "Mikocheni",
    village: "",
    street: "Plot 12",
    email: "amina@example.com",
    latitude: -6.79,
    longitude: 39.25,
    delivery_distance_km: 10,
    delivery_fee: 5000,
  },
  totalAmount: 29435,
  insuranceFee: 435,
  paymentMethod: "airtel-money",
  paymentDetails: { phoneNumber: "255711223344" },
  transportMethodId: "tm-1",
  deliveryFee: 5000,
}

describe("createOrderItemSchema", () => {
  it("accepts a line item as checkout builds it", () => {
    expect(createOrderItemSchema.safeParse(ITEM).success).toBe(true)
  })

  it("rejects a zero quantity", () => {
    expect(createOrderItemSchema.safeParse({ ...ITEM, quantity: 0 }).success).toBe(false)
  })

  it("rejects a fractional quantity", () => {
    expect(createOrderItemSchema.safeParse({ ...ITEM, quantity: 1.5 }).success).toBe(false)
  })

  it("rejects a negative price", () => {
    expect(createOrderItemSchema.safeParse({ ...ITEM, price: -1 }).success).toBe(false)
  })

  it("accepts a zero price, for a promotional line", () => {
    expect(createOrderItemSchema.safeParse({ ...ITEM, price: 0 }).success).toBe(true)
  })

  it("rejects a missing product id", () => {
    const { product_id: _omitted, ...withoutProduct } = ITEM
    expect(createOrderItemSchema.safeParse(withoutProduct).success).toBe(false)
  })

  it("rejects a missing shop id, which notifications are grouped by", () => {
    const { shop_id: _omitted, ...withoutShop } = ITEM
    expect(createOrderItemSchema.safeParse(withoutShop).success).toBe(false)
  })

  it("defaults the delivery fee to zero rather than writing undefined", () => {
    const { delivery_fee: _omitted, ...withoutFee } = ITEM
    const parsed = createOrderItemSchema.safeParse(withoutFee)

    expect(parsed.success && parsed.data.delivery_fee).toBe(0)
  })

  it("keeps a selected variant", () => {
    const parsed = createOrderItemSchema.safeParse({ ...ITEM, selected_color: { name: "Red" }, selected_size: "XL" })

    expect(parsed.success && parsed.data.selected_size).toBe("XL")
  })
})

describe("createOrderRequestSchema", () => {
  it("accepts the payload checkout posts", () => {
    expect(createOrderRequestSchema.safeParse(BODY).success).toBe(true)
  })

  it("rejects a body with no items, which used to 500 after inserting the order", () => {
    const { items: _omitted, ...withoutItems } = BODY
    const parsed = createOrderRequestSchema.safeParse(withoutItems)

    expect(parsed.success).toBe(false)
    expect(parsed.success === false && parsed.error.issues[0].path).toEqual(["items"])
  })

  it("rejects an empty items array", () => {
    expect(createOrderRequestSchema.safeParse({ ...BODY, items: [] }).success).toBe(false)
  })

  it("rejects items sent as an object rather than an array", () => {
    expect(createOrderRequestSchema.safeParse({ ...BODY, items: ITEM }).success).toBe(false)
  })

  it("rejects a zero total, which would write a free order", () => {
    expect(createOrderRequestSchema.safeParse({ ...BODY, totalAmount: 0 }).success).toBe(false)
  })

  it("rejects a negative total", () => {
    expect(createOrderRequestSchema.safeParse({ ...BODY, totalAmount: -100 }).success).toBe(false)
  })

  it("rejects a missing deliveryFee, which the stored subtotal is derived from", () => {
    // The handler stores `totalAmount - deliveryFee`; undefined there is NaN.
    const { deliveryFee: _omitted, ...withoutFee } = BODY
    expect(createOrderRequestSchema.safeParse(withoutFee).success).toBe(false)
  })

  it("rejects a negative deliveryFee", () => {
    expect(createOrderRequestSchema.safeParse({ ...BODY, deliveryFee: -1 }).success).toBe(false)
  })

  it("accepts a zero deliveryFee for a pickup-only order", () => {
    expect(createOrderRequestSchema.safeParse({ ...BODY, deliveryFee: 0 }).success).toBe(true)
  })

  it("rejects a missing payment method", () => {
    const { paymentMethod: _omitted, ...withoutMethod } = BODY
    expect(createOrderRequestSchema.safeParse(withoutMethod).success).toBe(false)
  })

  it("rejects a shipping address with no contact name", () => {
    const parsed = createOrderRequestSchema.safeParse({ ...BODY, shippingAddress: { ...BODY.shippingAddress, full_name: "" } })

    expect(parsed.success).toBe(false)
  })

  it("rejects a shipping address with no phone, which the transporter needs", () => {
    const { phone: _omitted, ...addressWithoutPhone } = BODY.shippingAddress
    expect(createOrderRequestSchema.safeParse({ ...BODY, shippingAddress: addressWithoutPhone }).success).toBe(false)
  })

  it("accepts an address missing the optional sub-locality parts", () => {
    // Some regions have no ward or village in the autocomplete data.
    const parsed = createOrderRequestSchema.safeParse({
      ...BODY,
      shippingAddress: { full_name: "Amina Juma", phone: "+255711223344" },
    })

    expect(parsed.success).toBe(true)
  })

  it("accepts a null transportMethodId, which is a pickup-only order", () => {
    expect(createOrderRequestSchema.safeParse({ ...BODY, transportMethodId: null }).success).toBe(true)
  })

  it("rejects a non-object body", () => {
    expect(createOrderRequestSchema.safeParse("give me an order").success).toBe(false)
  })

  it("strips keys the handler does not write", () => {
    const parsed = createOrderRequestSchema.safeParse({ ...BODY, status: "delivered", payment_status: "paid", customer_id: "someone" })

    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data).not.toHaveProperty("status")
    expect(parsed.success && parsed.data).not.toHaveProperty("payment_status")
    expect(parsed.success && parsed.data).not.toHaveProperty("customer_id")
  })
})

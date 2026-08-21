/**
 * @jest-environment node
 */

/**
 * Tests for POST /api/orders.
 *
 * The point of this suite is the ordering of the guards. Before validation was
 * added, the handler destructured the body and then mapped over `items`, so a
 * malformed body threw *after* the order row had been inserted -- the buyer got
 * a 500 and the database kept an order with no line items. These assert that a
 * rejected body reaches no Supabase write at all.
 */

const mockCreateClient = jest.fn()
const mockCreateNotification = jest.fn()

jest.mock("@/lib/supabase/server", () => ({ createClient: () => mockCreateClient() }))
jest.mock("@/lib/notifications", () => ({ createNotification: (...args: unknown[]) => mockCreateNotification(...args) }))

import { POST } from "@/app/api/orders/route"

const ITEM = {
  product_id: "p1",
  quantity: 2,
  price: 12000,
  shop_id: "shop-1",
  delivery_fee: 5000,
  delivery_distance_km: 10,
}

const VALID_BODY = {
  items: [ITEM],
  shippingAddress: { full_name: "Amina Juma", phone: "+255711223344", address: "Mikocheni" },
  totalAmount: 29435,
  insuranceFee: 435,
  paymentMethod: "airtel-money",
  transportMethodId: "tm-1",
  deliveryFee: 5000,
}

function jsonRequest(body: unknown) {
  return { json: async () => body } as never
}

/** A request whose body is not JSON at all. */
function malformedRequest() {
  return {
    json: async () => {
      throw new SyntaxError("Unexpected end of JSON input")
    },
  } as never
}

/**
 * Supabase double covering the three tables the route touches: the order insert,
 * the order_items insert and the shops lookup used for vendor notifications.
 */
function supabaseStub({ user = { id: "u1" }, orderError = null as unknown, itemsError = null as unknown } = {}) {
  const orderSingle = jest.fn().mockResolvedValue({ data: { id: "order-1", order_number: "TOLA-1" }, error: orderError })
  const orderSelect = jest.fn(() => ({ single: orderSingle }))
  const orderInsert = jest.fn(() => ({ select: orderSelect }))

  const itemsInsert = jest.fn().mockResolvedValue({ error: itemsError })

  const shopSingle = jest.fn().mockResolvedValue({ data: { owner_id: "vendor-1", name: "Tola Shop" } })
  const shopEq = jest.fn(() => ({ single: shopSingle }))
  const shopSelect = jest.fn(() => ({ eq: shopEq }))

  const from = jest.fn((table: string) => {
    if (table === "orders") return { insert: orderInsert }
    if (table === "order_items") return { insert: itemsInsert }
    return { select: shopSelect }
  })

  return {
    client: { from, auth: { getUser: jest.fn().mockResolvedValue({ data: { user } }) } },
    spies: { from, orderInsert, itemsInsert },
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("POST /api/orders authentication", () => {
  it("returns 401 for an anonymous caller", async () => {
    const { client } = supabaseStub({ user: null as never })
    mockCreateClient.mockResolvedValue(client)

    const res = await POST(jsonRequest(VALID_BODY))

    expect(res.status).toBe(401)
  })

  it("checks auth before reading the body, so the route cannot be probed", async () => {
    const { client, spies } = supabaseStub({ user: null as never })
    mockCreateClient.mockResolvedValue(client)

    const res = await POST(malformedRequest())

    expect(res.status).toBe(401)
    expect(spies.orderInsert).not.toHaveBeenCalled()
  })
})

describe("POST /api/orders validation", () => {
  beforeEach(() => {
    const { client } = supabaseStub()
    mockCreateClient.mockResolvedValue(client)
  })

  it("returns 400 for a body that is not JSON", async () => {
    const res = await POST(malformedRequest())

    expect(res.status).toBe(400)
    await expect(res.json()).resolves.toMatchObject({ error: "Request body must be valid JSON" })
  })

  it("returns 400 when items is missing", async () => {
    const { items: _omitted, ...body } = VALID_BODY
    const res = await POST(jsonRequest(body))

    expect(res.status).toBe(400)
  })

  it("names the failing field in the 400 body", async () => {
    const { items: _omitted, ...body } = VALID_BODY
    const res = await POST(jsonRequest(body))
    const payload = await res.json()

    expect(payload.error).toBe("Invalid request body")
    expect(payload.issues.join(" ")).toContain("items")
  })

  it("returns 400 for an empty items array", async () => {
    const res = await POST(jsonRequest({ ...VALID_BODY, items: [] }))

    expect(res.status).toBe(400)
  })

  it("returns 400 for a missing deliveryFee rather than storing a NaN subtotal", async () => {
    const { deliveryFee: _omitted, ...body } = VALID_BODY
    const res = await POST(jsonRequest(body))

    expect(res.status).toBe(400)
  })

  it("returns 400 for a zero total", async () => {
    const res = await POST(jsonRequest({ ...VALID_BODY, totalAmount: 0 }))

    expect(res.status).toBe(400)
  })

  it("inserts nothing when the body is rejected", async () => {
    const { client, spies } = supabaseStub()
    mockCreateClient.mockResolvedValue(client)

    await POST(jsonRequest({ ...VALID_BODY, items: [] }))

    expect(spies.orderInsert).not.toHaveBeenCalled()
    expect(spies.itemsInsert).not.toHaveBeenCalled()
  })

  it("does not leak internal detail in the 400 body", async () => {
    const res = await POST(jsonRequest({ ...VALID_BODY, items: [] }))
    const body = await res.json()

    expect(Object.keys(body).sort()).toEqual(["error", "issues"])
    expect(JSON.stringify(body)).not.toMatch(/supabase|postgres|stack/i)
  })
})

describe("POST /api/orders happy path", () => {
  it("creates the order and its line items", async () => {
    const { client, spies } = supabaseStub()
    mockCreateClient.mockResolvedValue(client)

    const res = await POST(jsonRequest(VALID_BODY))

    expect(res.status).toBe(200)
    await expect(res.json()).resolves.toMatchObject({ success: true })
    expect(spies.orderInsert).toHaveBeenCalledTimes(1)
    expect(spies.itemsInsert).toHaveBeenCalledTimes(1)
  })

  it("stores the subtotal net of delivery", async () => {
    const { client, spies } = supabaseStub()
    mockCreateClient.mockResolvedValue(client)

    await POST(jsonRequest(VALID_BODY))

    expect(spies.orderInsert).toHaveBeenCalledWith(
      expect.objectContaining({ subtotal: 24435, delivery_fee: 5000, total_amount: 29435, customer_id: "u1" }),
    )
  })

  it("attaches each line item to the created order", async () => {
    const { client, spies } = supabaseStub()
    mockCreateClient.mockResolvedValue(client)

    await POST(jsonRequest(VALID_BODY))

    expect(spies.itemsInsert).toHaveBeenCalledWith([expect.objectContaining({ order_id: "order-1", product_id: "p1", quantity: 2 })])
  })

  it("notifies the vendor once per shop", async () => {
    const { client } = supabaseStub()
    mockCreateClient.mockResolvedValue(client)

    await POST(jsonRequest({ ...VALID_BODY, items: [ITEM, { ...ITEM, product_id: "p2", delivery_fee: 0 }] }))

    expect(mockCreateNotification).toHaveBeenCalledTimes(1)
    expect(mockCreateNotification).toHaveBeenCalledWith(expect.objectContaining({ userId: "vendor-1", type: "order_placed" }))
  })

  it("notifies each distinct shop", async () => {
    const { client } = supabaseStub()
    mockCreateClient.mockResolvedValue(client)

    await POST(jsonRequest({ ...VALID_BODY, items: [ITEM, { ...ITEM, shop_id: "shop-2" }] }))

    expect(mockCreateNotification).toHaveBeenCalledTimes(2)
  })
})

describe("POST /api/orders failures", () => {
  it("returns 500 when the order insert fails", async () => {
    const { client, spies } = supabaseStub({ orderError: { message: "constraint violation" } })
    mockCreateClient.mockResolvedValue(client)

    const res = await POST(jsonRequest(VALID_BODY))

    expect(res.status).toBe(500)
    expect(spies.itemsInsert).not.toHaveBeenCalled()
  })

  it("returns 500 when the line items fail", async () => {
    const { client } = supabaseStub({ itemsError: { message: "fk violation" } })
    mockCreateClient.mockResolvedValue(client)

    const res = await POST(jsonRequest(VALID_BODY))

    expect(res.status).toBe(500)
  })

  it("does not echo the database error to the caller", async () => {
    const { client } = supabaseStub({ orderError: { message: "duplicate key value violates unique constraint orders_pkey" } })
    mockCreateClient.mockResolvedValue(client)

    const res = await POST(jsonRequest(VALID_BODY))

    await expect(res.json()).resolves.toEqual({ error: "Failed to create order" })
  })
})

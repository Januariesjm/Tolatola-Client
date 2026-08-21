/**
 * Tests for OrderService (lib/services/order.service.ts).
 *
 * This is the order-placement and transporter-auto-assignment logic, so the
 * behaviour worth pinning is the arithmetic (subtotal, stock decrement), the
 * failure paths (each insert can fail independently and must surface as a
 * message rather than an unhandled rejection), and the transporter ranking
 * rule -- subscription tier first, rating as the tiebreak.
 */

type TableName = string

/** A minimal Supabase query-builder double: enough chaining to satisfy each call site. */
function makeClient(responses: Partial<Record<TableName, unknown>> = {}) {
  const calls: Array<{ table: string; method: string; args: unknown[] }> = []

  const chain = (table: string) => {
    const result = responses[table] ?? { data: null, error: null }
    const handler: Record<string, jest.Mock> = {}
    const record = (method: string, args: unknown[]) => calls.push({ table, method, args })

    handler.insert = jest.fn((...args) => {
      record("insert", args)
      return chainable
    })
    handler.select = jest.fn((...args) => {
      record("select", args)
      return chainable
    })
    handler.update = jest.fn((...args) => {
      record("update", args)
      return chainable
    })
    handler.eq = jest.fn((...args) => {
      record("eq", args)
      return chainable
    })
    handler.order = jest.fn((...args) => {
      record("order", args)
      return Promise.resolve(result)
    })
    handler.single = jest.fn(async () => {
      record("single", [])
      return result
    })
    // A bare await on the chain (no .single()) resolves like a thenable.
    const chainable: any = { ...handler, then: (resolve: (v: unknown) => void) => resolve(result) }
    return chainable
  }

  const from = jest.fn((table: string) => chain(table))
  calls.length = 0 // constructing chain() above records nothing; keep calls clean
  return { client: { from }, calls }
}

let nextClient: ReturnType<typeof makeClient>["client"]
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => nextClient),
}))

import { OrderService } from "@/lib/services/order.service"

const service = () => new OrderService()

const baseParams = {
  userId: "u-1",
  items: [
    { product_id: "p-1", quantity: 2, price: 10000, shop_id: "shop-1" },
    { product_id: "p-2", quantity: 1, price: 5000, shop_id: "shop-1" },
  ],
  shippingAddress: { full_name: "Asha", phone: "255700000001", address: "12 Samora Ave", city: "Dodoma", region: "Dodoma" },
  totalAmount: 25000,
  paymentMethod: "mpesa",
  transportMethodId: null as string | null,
  deliveryFee: 5000,
}

beforeEach(() => {
  jest.spyOn(console, "log").mockImplementation(() => {})
  jest.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("createOrder", () => {
  it("computes the subtotal from item price times quantity, not the total the caller passed", async () => {
    const { client, calls } = makeClient({ orders: { data: { id: "ord-1" }, error: null } })
    nextClient = client

    await service().createOrder(baseParams)

    const insert = calls.find((c) => c.table === "orders" && c.method === "insert")
    // 2*10000 + 1*5000 = 25000, independent of the (also 25000) totalAmount passed in.
    expect((insert?.args[0] as { subtotal: number }).subtotal).toBe(25000)
  })

  it.each([
    ["cash-on-delivery", "pending"],
    ["mpesa", "pending_payment"],
    ["visa", "pending_payment"],
  ])("sets order status %s -> %s", async (paymentMethod, expectedStatus) => {
    const { client, calls } = makeClient({ orders: { data: { id: "ord-1" }, error: null } })
    nextClient = client

    await service().createOrder({ ...baseParams, paymentMethod })

    const insert = calls.find((c) => c.table === "orders" && c.method === "insert")
    expect((insert?.args[0] as { status: string }).status).toBe(expectedStatus)
  })

  it("creates one order item and one escrow per line item", async () => {
    const { client, calls } = makeClient({
      orders: { data: { id: "ord-1" }, error: null },
      products: { data: { stock_quantity: 10 }, error: null },
    })
    nextClient = client

    await service().createOrder(baseParams)

    expect(calls.filter((c) => c.table === "order_items" && c.method === "insert")).toHaveLength(2)
    expect(calls.filter((c) => c.table === "escrows" && c.method === "insert")).toHaveLength(2)
  })

  it("decrements stock by the ordered quantity", async () => {
    const { client, calls } = makeClient({
      orders: { data: { id: "ord-1" }, error: null },
      products: { data: { stock_quantity: 10 }, error: null },
    })
    nextClient = client

    await service().createOrder({ ...baseParams, items: [baseParams.items[0]] })

    const update = calls.find((c) => c.table === "products" && c.method === "update")
    expect((update?.args[0] as { stock_quantity: number }).stock_quantity).toBe(8)
  })

  it("does not touch stock for a product that no longer exists", async () => {
    const { client, calls } = makeClient({
      orders: { data: { id: "ord-1" }, error: null },
      products: { data: null, error: null },
    })
    nextClient = client

    await service().createOrder({ ...baseParams, items: [baseParams.items[0]] })

    expect(calls.filter((c) => c.table === "products" && c.method === "update")).toHaveLength(0)
  })

  it("reports failure rather than throwing when the order insert errors", async () => {
    const { client } = makeClient({ orders: { data: null, error: { message: "duplicate order_number" } } })
    nextClient = client

    const result = await service().createOrder(baseParams)

    expect(result).toEqual({ success: false, error: expect.stringContaining("duplicate order_number") })
  })

  it("reports failure when an order item insert errors", async () => {
    const { client } = makeClient({
      orders: { data: { id: "ord-1" }, error: null },
      order_items: { data: null, error: { message: "fk violation" } },
    })
    nextClient = client

    const result = await service().createOrder(baseParams)

    expect(result).toEqual({ success: false, error: expect.stringContaining("fk violation") })
  })

  it("reports failure when the escrow insert errors", async () => {
    const { client } = makeClient({
      orders: { data: { id: "ord-1" }, error: null },
      escrows: { data: null, error: { message: "escrow write failed" } },
    })
    nextClient = client

    const result = await service().createOrder(baseParams)

    expect(result).toEqual({ success: false, error: expect.stringContaining("escrow write failed") })
  })

  it("does not attempt transporter assignment when no transport method was chosen", async () => {
    const { client, calls } = makeClient({ orders: { data: { id: "ord-1" }, error: null } })
    nextClient = client

    await service().createOrder({ ...baseParams, transportMethodId: null })

    expect(calls.some((c) => c.table === "transport_methods")).toBe(false)
  })
})

describe("getOrder", () => {
  it("returns the order on success", async () => {
    const { client } = makeClient({ orders: { data: { id: "ord-1", order_number: "TOLA-1" }, error: null } })
    nextClient = client

    await expect(service().getOrder("ord-1")).resolves.toEqual({ id: "ord-1", order_number: "TOLA-1" })
  })

  it("throws with the underlying message when the query fails", async () => {
    const { client } = makeClient({ orders: { data: null, error: { message: "row not found" } } })
    nextClient = client

    await expect(service().getOrder("missing")).rejects.toThrow("row not found")
  })
})

describe("updateOrderStatus", () => {
  it("reports success on a clean update", async () => {
    const { client } = makeClient({ orders: { data: null, error: null } })
    nextClient = client

    await expect(service().updateOrderStatus("ord-1", "shipped")).resolves.toEqual({ success: true })
  })

  it("throws with the underlying message when the update fails", async () => {
    const { client } = makeClient({ orders: { data: null, error: { message: "constraint violation" } } })
    nextClient = client

    await expect(service().updateOrderStatus("ord-1", "shipped")).rejects.toThrow("constraint violation")
  })
})

describe("assignTransporter", () => {
  const transporterA = { id: "t-a", rating: 4, transporter_subscriptions: [{ status: "active", plan: { display_order: 2 } }] }
  const transporterB = { id: "t-b", rating: 5, transporter_subscriptions: [{ status: "active", plan: { display_order: 1 } }] }
  const transporterC = { id: "t-c", rating: 4.9, transporter_subscriptions: [{ status: "expired", plan: { display_order: 1 } }] }

  it("picks the transporter on the higher-priority subscription tier over a higher rating", async () => {
    const { client, calls } = makeClient({
      transport_methods: { data: { vehicle_type: "motorcycle" }, error: null },
      transporters: { data: [transporterA, transporterB], error: null },
    })
    nextClient = client

    const result = await service().assignTransporter("ord-1", "tm-1")

    expect(result).toMatchObject({ success: true, transporter: { id: "t-b" } })
    const assignment = calls.find((c) => c.table === "transporter_assignments" && c.method === "insert")
    expect((assignment?.args[0] as { transporter_id: string }).transporter_id).toBe("t-b")
  })

  it("falls back to rating within the same tier, and ignores a subscription that is not active", async () => {
    const { client } = makeClient({
      transport_methods: { data: { vehicle_type: "motorcycle" }, error: null },
      // transporterC's subscription is "expired", so it ranks by the 999
      // fallback tier despite the underlying plan being display_order 1.
      transporters: { data: [transporterC, transporterA], error: null },
    })
    nextClient = client

    const result = await service().assignTransporter("ord-1", "tm-1")

    expect(result).toMatchObject({ success: true, transporter: { id: "t-a" } })
  })

  it("marks the chosen transporter busy", async () => {
    const { client, calls } = makeClient({
      transport_methods: { data: { vehicle_type: "motorcycle" }, error: null },
      transporters: { data: [transporterA], error: null },
    })
    nextClient = client

    await service().assignTransporter("ord-1", "tm-1")

    const busy = calls.find((c) => c.table === "transporters" && c.method === "update")
    expect(busy?.args[0]).toEqual({ availability_status: "busy" })
  })

  it("reports no available transporter without throwing", async () => {
    const { client } = makeClient({
      transport_methods: { data: { vehicle_type: "motorcycle" }, error: null },
      transporters: { data: [], error: null },
    })
    nextClient = client

    await expect(service().assignTransporter("ord-1", "tm-1")).resolves.toEqual({
      success: false,
      message: "No available transporter",
    })
  })

  it("reports failure when the transport method does not exist", async () => {
    const { client } = makeClient({ transport_methods: { data: null, error: null } })
    nextClient = client

    const result = await service().assignTransporter("ord-1", "missing")

    expect(result).toEqual({ success: false, error: "Transport method not found" })
  })

  it("reports failure when fetching eligible transporters errors", async () => {
    const { client } = makeClient({
      transport_methods: { data: { vehicle_type: "motorcycle" }, error: null },
      transporters: { data: null, error: { message: "query timeout" } },
    })
    nextClient = client

    const result = await service().assignTransporter("ord-1", "tm-1")

    expect(result).toEqual({ success: false, error: "query timeout" })
  })

  it("treats a missing rating as a 5 rather than a 0, so an unrated transporter is not penalised", async () => {
    const unrated = { id: "t-unrated", rating: null, transporter_subscriptions: [{ status: "active", plan: { display_order: 1 } }] }
    const rated4 = { id: "t-4", rating: 4, transporter_subscriptions: [{ status: "active", plan: { display_order: 1 } }] }
    const { client } = makeClient({
      transport_methods: { data: { vehicle_type: "motorcycle" }, error: null },
      transporters: { data: [rated4, unrated], error: null },
    })
    nextClient = client

    const result = await service().assignTransporter("ord-1", "tm-1")

    expect(result).toMatchObject({ transporter: { id: "t-unrated" } })
  })
})

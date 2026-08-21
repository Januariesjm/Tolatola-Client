/**
 * @jest-environment node
 */

/**
 * Tests for POST /api/payouts/request.
 *
 * `amount` is money leaving escrow for a vendor, so the schema's
 * `.positive()` guard against zero, negative and NaN amounts is the case that
 * matters most here, alongside vendor-ownership being checked before any
 * payout row is created.
 */

const mockCreateClient = jest.fn()
jest.mock("@/lib/supabase/server", () => ({ createClient: () => mockCreateClient() }))

import { POST } from "@/app/api/payouts/request/route"

const jsonRequest = (body: unknown) => ({ json: async () => body }) as never

function supabaseStub({ user = { id: "u-1" } as { id: string } | null, ownsVendor = true, insertError = null as unknown } = {}) {
  const vendorSingle = jest.fn().mockResolvedValue({ data: ownsVendor ? { id: "v-1" } : null })
  const vendorEq2 = jest.fn(() => ({ single: vendorSingle }))
  const vendorEq1 = jest.fn(() => ({ eq: vendorEq2 }))
  const vendorSelect = jest.fn(() => ({ eq: vendorEq1 }))

  const insertSingle = jest.fn().mockResolvedValue({ data: { id: "payout-1" }, error: insertError })
  const insertSelect = jest.fn(() => ({ single: insertSingle }))
  const insert = jest.fn(() => ({ select: insertSelect }))

  return {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user } }) },
    from: jest.fn((table: string) => {
      if (table === "vendors") return { select: vendorSelect }
      if (table === "payouts") return { insert }
      return {}
    }),
    spies: { insert },
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("POST /api/payouts/request", () => {
  it.each([[0], [-500], [Number.NaN]])("rejects a non-positive amount (%p) with 400", async (amount) => {
    mockCreateClient.mockResolvedValue(supabaseStub())

    const response = await POST(jsonRequest({ vendorId: "v-1", amount, paymentMethod: "m-pesa" }))

    expect(response.status).toBe(400)
  })

  it("rejects a body missing vendorId", async () => {
    mockCreateClient.mockResolvedValue(supabaseStub())

    const response = await POST(jsonRequest({ amount: 10000, paymentMethod: "m-pesa" }))

    expect(response.status).toBe(400)
  })

  it("rejects a caller who does not own the vendor, before creating a payout", async () => {
    const stub = supabaseStub({ ownsVendor: false })
    mockCreateClient.mockResolvedValue(stub)

    const response = await POST(jsonRequest({ vendorId: "v-1", amount: 10000, paymentMethod: "m-pesa" }))

    expect(response.status).toBe(404)
    expect(stub.spies.insert).not.toHaveBeenCalled()
  })

  it("rejects an unauthenticated caller", async () => {
    mockCreateClient.mockResolvedValue(supabaseStub({ user: null }))

    const response = await POST(jsonRequest({ vendorId: "v-1", amount: 10000, paymentMethod: "m-pesa" }))

    expect(response.status).toBe(401)
  })

  it("creates a pending payout for a valid, owned request", async () => {
    const stub = supabaseStub()
    mockCreateClient.mockResolvedValue(stub)

    const response = await POST(jsonRequest({ vendorId: "v-1", amount: 10000, paymentMethod: "m-pesa" }))

    expect(response.status).toBe(200)
    expect(stub.spies.insert).toHaveBeenCalledWith(
      expect.objectContaining({ vendor_id: "v-1", amount: 10000, payment_method: "m-pesa", status: "pending" }),
    )
  })
})

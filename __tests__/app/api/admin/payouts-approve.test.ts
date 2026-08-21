/**
 * @jest-environment node
 */

/**
 * Tests for POST /api/admin/payouts/approve.
 *
 * A malformed body -- missing payoutId, or a userType outside the enum -- must
 * be rejected before the backend approval call is ever made.
 */

const mockCreateClient = jest.fn()
jest.mock("@/lib/supabase/server", () => ({ createClient: () => mockCreateClient() }))

import { POST } from "@/app/api/admin/payouts/approve/route"

const jsonRequest = (body: unknown) => ({ json: async () => body }) as never

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  mockCreateClient.mockResolvedValue({
    auth: { getSession: jest.fn().mockResolvedValue({ data: { session: { access_token: "tok" } } }) },
  })
  global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({}) })) as unknown as typeof fetch
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("POST /api/admin/payouts/approve", () => {
  it("rejects a body missing payoutId with 400, without calling the backend", async () => {
    const response = await POST(jsonRequest({ userType: "vendor" }))

    expect(response.status).toBe(400)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it("rejects a userType outside the vendor/transporter enum", async () => {
    const response = await POST(jsonRequest({ payoutId: "po-1", userType: "admin" }))

    expect(response.status).toBe(400)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it("requires a session before approving", async () => {
    mockCreateClient.mockResolvedValue({ auth: { getSession: jest.fn().mockResolvedValue({ data: { session: null } }) } })

    const response = await POST(jsonRequest({ payoutId: "po-1", userType: "vendor" }))

    expect(response.status).toBe(401)
  })

  it("forwards a valid request to the backend with the caller's token", async () => {
    const response = await POST(jsonRequest({ payoutId: "po-1", userType: "vendor" }))

    expect(response.status).toBe(200)
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/admin/payouts/po-1/approve"),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer tok" }) }),
    )
  })

  it("surfaces the backend's own error message on a non-OK response", async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      status: 409,
      text: async () => JSON.stringify({ error: "already approved" }),
    })) as unknown as typeof fetch

    const response = await POST(jsonRequest({ payoutId: "po-1", userType: "vendor" }))

    expect(response.status).toBe(409)
    const body = await response.json()
    expect(body.error).toBe("already approved")
  })
})

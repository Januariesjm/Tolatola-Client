/**
 * @jest-environment node
 */

/**
 * Tests for POST /api/profile/update.
 *
 * Writes straight to the caller's own row (`.eq("id", user.id)`, never a
 * client-supplied id), so the case worth pinning is that an empty full_name is
 * rejected before the write, not that some other user's row could be reached.
 */

const mockCreateClient = jest.fn()
jest.mock("@/lib/supabase/server", () => ({ createClient: () => mockCreateClient() }))

import { POST } from "@/app/api/profile/update/route"

const jsonRequest = (body: unknown) => ({ json: async () => body }) as never

function supabaseStub(user: { id: string } | null = { id: "u-1" }) {
  const eq = jest.fn().mockResolvedValue({ error: null })
  const update = jest.fn(() => ({ eq }))
  return {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user } }) },
    from: jest.fn(() => ({ update })),
    spies: { update, eq },
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("POST /api/profile/update", () => {
  it("rejects a body with an empty full_name, with 400", async () => {
    mockCreateClient.mockResolvedValue(supabaseStub())

    const response = await POST(jsonRequest({ full_name: "" }))

    expect(response.status).toBe(400)
  })

  it("rejects a body missing full_name entirely", async () => {
    mockCreateClient.mockResolvedValue(supabaseStub())

    const response = await POST(jsonRequest({ phone: "255700000001" }))

    expect(response.status).toBe(400)
  })

  it("rejects an unauthenticated caller", async () => {
    mockCreateClient.mockResolvedValue(supabaseStub(null))

    const response = await POST(jsonRequest({ full_name: "Asha Mwinyi" }))

    expect(response.status).toBe(401)
  })

  it("updates only the caller's own row", async () => {
    const stub = supabaseStub()
    mockCreateClient.mockResolvedValue(stub)

    const response = await POST(jsonRequest({ full_name: "Asha Mwinyi", phone: "255700000001" }))

    expect(response.status).toBe(200)
    expect(stub.spies.update).toHaveBeenCalledWith(expect.objectContaining({ full_name: "Asha Mwinyi", phone: "255700000001" }))
    expect(stub.spies.eq).toHaveBeenCalledWith("id", "u-1")
  })

  it("reports failure rather than throwing when the update errors", async () => {
    const eq = jest.fn().mockResolvedValue({ error: { message: "constraint violation" } })
    mockCreateClient.mockResolvedValue({
      auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "u-1" } } }) },
      from: jest.fn(() => ({ update: jest.fn(() => ({ eq })) })),
    })

    const response = await POST(jsonRequest({ full_name: "Asha Mwinyi" }))

    expect(response.status).toBe(500)
  })
})

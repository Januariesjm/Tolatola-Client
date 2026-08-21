/**
 * @jest-environment node
 */

/**
 * Tests for POST /api/admin/assign-role.
 *
 * Grants admin access, so what matters most: a malformed body is rejected
 * with 400 before anything is touched, and only a Super Admin can call it.
 */

const mockCreateClient = jest.fn()
jest.mock("@/lib/supabase/server", () => ({ createClient: () => mockCreateClient() }))

const mockGetUserAdminRole = jest.fn()
jest.mock("@/lib/admin/roles", () => ({ getUserAdminRole: (...args: unknown[]) => mockGetUserAdminRole(...args) }))

import { POST } from "@/app/api/admin/assign-role/route"

const jsonRequest = (body: unknown) => ({ json: async () => body }) as never

function supabaseStub() {
  const maybeSingle = jest.fn().mockResolvedValue({ data: { id: "role-1", role_name: "Support" } })
  const roleEq = jest.fn(() => ({ maybeSingle }))
  const roleSelect = jest.fn(() => ({ eq: roleEq }))

  const userSingle = jest.fn().mockResolvedValue({ data: { email: "a@example.com", full_name: "Asha" } })
  const userEqSelect = jest.fn(() => ({ single: userSingle }))
  const userSelect = jest.fn(() => ({ eq: userEqSelect }))

  const updateEq = jest.fn().mockResolvedValue({ error: null })
  const update = jest.fn(() => ({ eq: updateEq }))

  const insert = jest.fn().mockResolvedValue({ error: null })

  return {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { id: "u-1" } } }) },
    from: jest.fn((table: string) => {
      if (table === "admin_roles") return { select: roleSelect }
      if (table === "users") return { select: userSelect, update }
      if (table === "admin_notifications") return { insert }
      return {}
    }),
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  jest.spyOn(console, "log").mockImplementation(() => {})
  mockCreateClient.mockResolvedValue(supabaseStub())
  mockGetUserAdminRole.mockResolvedValue({ roleName: "Super Admin" })
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("POST /api/admin/assign-role", () => {
  it("rejects a body missing roleId with 400", async () => {
    const response = await POST(jsonRequest({ userId: "u-2" }))

    expect(response.status).toBe(400)
  })

  it("rejects a body with an empty userId", async () => {
    const response = await POST(jsonRequest({ userId: "", roleId: "550e8400-e29b-41d4-a716-446655440000" }))

    expect(response.status).toBe(400)
  })

  it("rejects a roleId that is not a UUID, after passing schema validation", async () => {
    const response = await POST(jsonRequest({ userId: "u-2", roleId: "not-a-uuid" }))

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.error).toContain("Invalid role ID format")
  })

  it("rejects a non-Super-Admin caller", async () => {
    mockGetUserAdminRole.mockResolvedValue({ roleName: "Support Agent" })

    const response = await POST(jsonRequest({ userId: "u-2", roleId: "550e8400-e29b-41d4-a716-446655440000" }))

    expect(response.status).toBe(403)
  })

  it("assigns the role for a valid request from a Super Admin", async () => {
    const response = await POST(jsonRequest({ userId: "u-2", roleId: "550e8400-e29b-41d4-a716-446655440000" }))

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.success).toBe(true)
  })
})

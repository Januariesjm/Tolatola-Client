/**
 * Tests for the admin access checks (lib/admin/middleware.ts).
 *
 * checkAdminAccess is the gate in front of admin-only routes, so the important
 * property is that it fails closed: any missing role, missing permission or
 * thrown error must deny access rather than fall through to allowed.
 */

const mockGetUserAdminRole = jest.fn()
jest.mock("@/lib/admin/roles", () => ({
  getUserAdminRole: (...args: unknown[]) => mockGetUserAdminRole(...args),
  hasPermission: (permissions: string[], required: string) => permissions.includes(required),
}))

const mockCreateClient = jest.fn()
jest.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}))

import { checkAdminAccess, getAllAdminUsers } from "@/lib/admin/middleware"

const financeRole = {
  roleId: "r-1",
  roleName: "Finance Admin",
  accessLevel: 70,
  permissions: ["view_dashboard", "manage_payouts"],
  userId: "user-1",
  userEmail: "fin@tolatola.co",
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => jest.restoreAllMocks())

describe("checkAdminAccess", () => {
  it("allows an admin holding the required permission", async () => {
    mockGetUserAdminRole.mockResolvedValue(financeRole)

    await expect(checkAdminAccess("user-1", "manage_payouts")).resolves.toEqual({
      allowed: true,
      adminRole: financeRole,
    })
  })

  it("denies a user with no admin role", async () => {
    mockGetUserAdminRole.mockResolvedValue(null)

    await expect(checkAdminAccess("user-1", "manage_payouts")).resolves.toEqual({
      allowed: false,
      reason: "User is not an admin",
    })
  })

  it("denies an admin missing the required permission", async () => {
    mockGetUserAdminRole.mockResolvedValue(financeRole)

    await expect(checkAdminAccess("user-1", "manage_admins")).resolves.toEqual({
      allowed: false,
      reason: "User does not have required permission",
    })
  })

  it("fails closed when the role lookup throws", async () => {
    mockGetUserAdminRole.mockRejectedValue(new Error("network down"))

    await expect(checkAdminAccess("user-1", "manage_payouts")).resolves.toEqual({
      allowed: false,
      reason: "Error checking admin access",
    })
  })

  it("denies an admin whose permission list is empty", async () => {
    mockGetUserAdminRole.mockResolvedValue({ ...financeRole, permissions: [] })

    const result = await checkAdminAccess("user-1", "view_dashboard")

    expect(result.allowed).toBe(false)
  })

  it("never returns allowed:true without a role attached", async () => {
    mockGetUserAdminRole.mockResolvedValue(financeRole)

    const result = await checkAdminAccess("user-1", "manage_payouts")

    expect(result.allowed).toBe(true)
    expect(result.adminRole).toBeDefined()
  })
})

describe("getAllAdminUsers", () => {
  /** Builds the select().not().order() chain the function walks. */
  function chain(result: { data?: unknown; error?: unknown }) {
    const order = jest.fn().mockResolvedValue(result)
    const not = jest.fn(() => ({ order }))
    const select = jest.fn(() => ({ not }))
    return { client: { from: jest.fn(() => ({ select })) }, spies: { select, not, order } }
  }

  it("returns the admin rows", async () => {
    const rows = [{ id: "u-1", email: "a@b.c" }]
    const { client } = chain({ data: rows, error: null })
    mockCreateClient.mockResolvedValue(client)

    await expect(getAllAdminUsers()).resolves.toEqual(rows)
  })

  it("filters to users that have an admin role, newest first", async () => {
    const { client, spies } = chain({ data: [], error: null })
    mockCreateClient.mockResolvedValue(client)

    await getAllAdminUsers()

    expect(spies.not).toHaveBeenCalledWith("admin_role_id", "is", null)
    expect(spies.order).toHaveBeenCalledWith("created_at", { ascending: false })
  })

  it("returns an empty array when the query yields no data", async () => {
    const { client } = chain({ data: null, error: null })
    mockCreateClient.mockResolvedValue(client)

    await expect(getAllAdminUsers()).resolves.toEqual([])
  })

  it("propagates a query error instead of returning a partial list", async () => {
    const { client } = chain({ data: null, error: { message: "permission denied" } })
    mockCreateClient.mockResolvedValue(client)

    await expect(getAllAdminUsers()).rejects.toEqual({ message: "permission denied" })
  })
})

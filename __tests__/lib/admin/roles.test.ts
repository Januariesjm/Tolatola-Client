/**
 * Tests for admin role definitions and lookup (lib/admin/roles.ts).
 *
 * The role table decides what every admin can reach, so these tests pin the
 * privilege ordering, guard against a role silently gaining permissions it was
 * never granted, and cover the API-backed lookup's failure paths.
 */

const mockServerApiGet = jest.fn()
jest.mock("@/lib/api-server", () => ({
  serverApiGet: (...args: unknown[]) => mockServerApiGet(...args),
}))

import { ALL_PERMISSIONS, ROLE_DEFINITIONS, getUserAdminRole, hasPermission } from "@/lib/admin/roles"

type RoleName = keyof typeof ROLE_DEFINITIONS

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => jest.restoreAllMocks())

describe("ROLE_DEFINITIONS", () => {
  const roleNames = Object.keys(ROLE_DEFINITIONS) as RoleName[]

  it("gives Super Admin every permission", () => {
    expect(ROLE_DEFINITIONS["Super Admin"].permissions).toEqual(ALL_PERMISSIONS)
  })

  it("grants only permissions that exist in ALL_PERMISSIONS", () => {
    for (const name of roleNames) {
      for (const permission of ROLE_DEFINITIONS[name].permissions) {
        expect(ALL_PERMISSIONS).toContain(permission)
      }
    }
  })

  it("gives every role a unique access level", () => {
    const levels = roleNames.map((n) => ROLE_DEFINITIONS[n].accessLevel)
    expect(new Set(levels).size).toBe(levels.length)
  })

  it("ranks Super Admin highest", () => {
    const levels = roleNames.map((n) => ROLE_DEFINITIONS[n].accessLevel)
    expect(ROLE_DEFINITIONS["Super Admin"].accessLevel).toBe(Math.max(...levels))
  })

  it("gives every role a non-empty description and at least view_dashboard", () => {
    for (const name of roleNames) {
      expect(ROLE_DEFINITIONS[name].description).toBeTruthy()
      expect(ROLE_DEFINITIONS[name].permissions).toContain("view_dashboard")
    }
  })

  it("keeps manage_admins exclusive to Super Admin", () => {
    const holders = roleNames.filter((n) => ROLE_DEFINITIONS[n].permissions.includes("manage_admins"))
    expect(holders).toEqual(["Super Admin"])
  })

  it("keeps payout and transaction control out of non-finance operational roles", () => {
    for (const name of ["Vendor Manager", "Marketing & Support"] as RoleName[]) {
      expect(ROLE_DEFINITIONS[name].permissions).not.toContain("manage_payouts")
      expect(ROLE_DEFINITIONS[name].permissions).not.toContain("manage_transactions")
    }
  })

  it("lists no permission twice within a role", () => {
    for (const name of roleNames) {
      const permissions = ROLE_DEFINITIONS[name].permissions
      expect(new Set(permissions).size).toBe(permissions.length)
    }
  })
})

describe("hasPermission", () => {
  it("returns true when the permission is present", () => {
    expect(hasPermission(["manage_orders", "view_analytics"], "manage_orders")).toBe(true)
  })

  it("returns false when it is absent", () => {
    expect(hasPermission(["view_analytics"], "manage_orders")).toBe(false)
  })

  it("returns false for an empty permission list", () => {
    expect(hasPermission([], "manage_orders")).toBe(false)
  })

  it("is case sensitive", () => {
    expect(hasPermission(["manage_orders"], "MANAGE_ORDERS")).toBe(false)
  })

  it("does not match on a prefix", () => {
    expect(hasPermission(["manage_orders_extra"], "manage_orders")).toBe(false)
  })
})

describe("getUserAdminRole", () => {
  const role = {
    id: "role-1",
    role_name: "Finance Admin",
    access_level: 70,
    permissions: ["view_dashboard", "manage_payouts"],
  }
  const user = { id: "user-1", email: "fin@tolatola.co", full_name: "Fin Admin" }

  it("maps the API response onto the role shape", async () => {
    mockServerApiGet.mockResolvedValue({ adminRole: role, user })

    await expect(getUserAdminRole()).resolves.toEqual({
      roleId: "role-1",
      roleName: "Finance Admin",
      accessLevel: 70,
      permissions: ["view_dashboard", "manage_payouts"],
      userId: "user-1",
      userEmail: "fin@tolatola.co",
      userName: "Fin Admin",
    })
  })

  it("asks the backend for the caller's own role", async () => {
    mockServerApiGet.mockResolvedValue({ adminRole: role, user })

    await getUserAdminRole("ignored-user-id")

    expect(mockServerApiGet).toHaveBeenCalledWith("admin/roles")
  })

  it("returns null when the response has no role", async () => {
    mockServerApiGet.mockResolvedValue({ user })

    await expect(getUserAdminRole()).resolves.toBeNull()
  })

  it("returns null when the response has no user", async () => {
    mockServerApiGet.mockResolvedValue({ adminRole: role })

    await expect(getUserAdminRole()).resolves.toBeNull()
  })

  it("returns null instead of throwing when the request fails", async () => {
    mockServerApiGet.mockRejectedValue(new Error("401 unauthorized"))

    await expect(getUserAdminRole()).resolves.toBeNull()
  })

  it("coerces a non-array permissions field to an empty list", async () => {
    mockServerApiGet.mockResolvedValue({
      adminRole: { ...role, permissions: "manage_payouts" },
      user,
    })

    const result = await getUserAdminRole()

    expect(result?.permissions).toEqual([])
  })

  it("tolerates a missing full_name", async () => {
    mockServerApiGet.mockResolvedValue({
      adminRole: role,
      user: { id: "user-1", email: "fin@tolatola.co" },
    })

    const result = await getUserAdminRole()

    expect(result?.userName).toBeUndefined()
    expect(result?.userId).toBe("user-1")
  })
})

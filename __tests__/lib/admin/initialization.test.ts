/**
 * Tests for admin initialization utilities (lib/admin/initialization.ts).
 *
 * verifyAdminSetup exists to give an admin a diagnosable message instead of a
 * raw Supabase error when a migration script has not been run; getAdminStatistics
 * must not blow up the dashboard when a query returns nothing.
 */

type TableResponse = { data: unknown; error: unknown }

function makeClient(responses: Record<string, TableResponse>) {
  const from = jest.fn((table: string) => {
    const response = responses[table] ?? { data: null, error: null }
    const builder: any = {
      select: jest.fn(() => builder),
      limit: jest.fn(() => Promise.resolve(response)),
      order: jest.fn(() => Promise.resolve(response)),
      not: jest.fn(() => Promise.resolve(response)),
    }
    return builder
  })
  return { from }
}

let nextClient: ReturnType<typeof makeClient>
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(async () => nextClient),
}))

import { getAdminStatistics, verifyAdminSetup } from "@/lib/admin/initialization"

beforeEach(() => {
  jest.spyOn(console, "log").mockImplementation(() => {})
  jest.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("verifyAdminSetup", () => {
  it("reports success when every table and column check passes", async () => {
    nextClient = makeClient({
      admin_roles: { data: [{ id: "r-1" }], error: null },
      admin_permissions: { data: [{ id: "p-1" }], error: null },
      users: { data: [{ admin_role_id: null }], error: null },
    })

    await expect(verifyAdminSetup()).resolves.toEqual({ status: "success", message: "Admin system is properly set up" })
  })

  it("reports which migration is missing when admin_roles cannot be read", async () => {
    nextClient = makeClient({ admin_roles: { data: null, error: { message: "relation does not exist" } } })

    const result = await verifyAdminSetup()

    expect(result.status).toBe("error")
    expect(result.message).toContain("script 015")
  })

  it("reports the same missing-migration message when admin_permissions is absent", async () => {
    nextClient = makeClient({
      admin_roles: { data: [], error: null },
      admin_permissions: { data: null, error: { message: "relation does not exist" } },
    })

    const result = await verifyAdminSetup()

    expect(result.status).toBe("error")
    expect(result.message).toContain("script 015")
  })

  it("names script 017 specifically when the users table is missing admin_role_id", async () => {
    nextClient = makeClient({
      admin_roles: { data: [], error: null },
      admin_permissions: { data: [], error: null },
      users: { data: null, error: { message: 'column "admin_role_id" does not exist' } },
    })

    const result = await verifyAdminSetup()

    expect(result.status).toBe("error")
    expect(result.message).toContain("script 017")
  })

  it("still reports success when the users check errors for an unrelated reason", async () => {
    // The admin_role_id-specific branch is the only one that turns a users-table
    // error into a failure; anything else falls through to the success path.
    nextClient = makeClient({
      admin_roles: { data: [], error: null },
      admin_permissions: { data: [], error: null },
      users: { data: null, error: { message: "connection reset" } },
    })

    await expect(verifyAdminSetup()).resolves.toEqual({ status: "success", message: "Admin system is properly set up" })
  })

  it("catches a thrown error rather than propagating it", async () => {
    nextClient = {
      from: jest.fn(() => {
        throw new Error("client init failed")
      }),
    } as any

    await expect(verifyAdminSetup()).resolves.toEqual({ status: "error", message: "Error verifying admin setup" })
  })
})

describe("getAdminStatistics", () => {
  it("counts admins per role", async () => {
    nextClient = makeClient({
      admin_roles: { data: [{ id: "r-1", role_name: "Support", access_level: 1 }], error: null },
      users: {
        data: [
          { id: "u-1", email: "a@example.com", admin_roles: { role_name: "Support", access_level: 1 } },
          { id: "u-2", email: "b@example.com", admin_roles: { role_name: "Support", access_level: 1 } },
          { id: "u-3", email: "c@example.com", admin_roles: { role_name: "Ops", access_level: 2 } },
        ],
        error: null,
      },
    })

    const stats = await getAdminStatistics()

    expect(stats.totalRoles).toBe(1)
    expect(stats.totalAdmins).toBe(3)
    expect(stats.adminsByRole).toEqual({ Support: 2, Ops: 1 })
  })

  it("groups an admin with no joined role under 'Unknown' instead of dropping it", async () => {
    nextClient = makeClient({
      admin_roles: { data: [], error: null },
      users: { data: [{ id: "u-1", email: "a@example.com", admin_roles: null }], error: null },
    })

    const stats = await getAdminStatistics()

    expect(stats.adminsByRole).toEqual({ Unknown: 1 })
  })

  it("returns zeroed, non-null statistics when both queries return nothing", async () => {
    nextClient = makeClient({ admin_roles: { data: null, error: null }, users: { data: null, error: null } })

    await expect(getAdminStatistics()).resolves.toEqual({
      totalRoles: 0,
      totalAdmins: 0,
      roles: [],
      adminsByRole: {},
      admins: [],
    })
  })

  it("returns the same zeroed shape rather than throwing when the client itself fails", async () => {
    nextClient = {
      from: jest.fn(() => {
        throw new Error("client init failed")
      }),
    } as any

    await expect(getAdminStatistics()).resolves.toEqual({
      totalRoles: 0,
      totalAdmins: 0,
      roles: [],
      adminsByRole: {},
      admins: [],
    })
  })
})

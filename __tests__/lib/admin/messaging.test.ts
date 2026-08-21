/**
 * Tests for the admin messaging list rules (lib/admin/messaging.ts).
 */

import {
  filterActivityLogs,
  filterRecipients,
  mapCustomers,
  mapTransporters,
  mapVendors,
  type ActivityLog,
  type UserDetails,
} from "@/lib/admin/messaging"

describe("mapCustomers", () => {
  it("uses the customer's own id as both id and recipientId", () => {
    const [user] = mapCustomers([{ id: "c-1", full_name: "Asha Mwinyi", email: "asha@example.com", phone: "255700000001" }])

    expect(user).toEqual({ id: "c-1", name: "Asha Mwinyi", email: "asha@example.com", phone: "255700000001", recipientId: "c-1" })
  })

  it("falls back to 'Unnamed Customer' when full_name is missing", () => {
    expect(mapCustomers([{ id: "c-1", email: "a@example.com" }])[0].name).toBe("Unnamed Customer")
  })
})

describe("mapVendors", () => {
  it("prefers the business name, falling back to the joined user's name", () => {
    expect(mapVendors([{ id: "v-1", business_name: "Dodoma Crafts", users: { full_name: "Asha" } }])[0].name).toBe("Dodoma Crafts")
    expect(mapVendors([{ id: "v-1", users: { full_name: "Asha" } }])[0].name).toBe("Asha")
  })

  it("sends to the joined user's id, not the vendor row's own id", () => {
    expect(mapVendors([{ id: "v-1", user_id: "u-1" }])[0].recipientId).toBe("u-1")
  })

  it("falls back to the vendor row's own id when there is no joined user id", () => {
    expect(mapVendors([{ id: "v-1" }])[0].recipientId).toBe("v-1")
  })

  it("prefers the vendor row's own phone over the joined user's", () => {
    expect(mapVendors([{ id: "v-1", phone: "255700000001", users: { phone: "255700000002" } }])[0].phone).toBe("255700000001")
  })
})

describe("mapTransporters", () => {
  it("sends to the joined user's id", () => {
    expect(mapTransporters([{ id: "t-1", user_id: "u-1" }])[0].recipientId).toBe("u-1")
  })

  it("prefers the joined user's name, falling back to the business name", () => {
    expect(mapTransporters([{ id: "t-1", business_name: "Fast Movers", users: { full_name: "Baraka" } }])[0].name).toBe("Baraka")
  })
})

describe("filterRecipients", () => {
  const users: UserDetails[] = [
    { id: "1", name: "Asha Mwinyi", email: "asha@example.com", phone: "255700000001", recipientId: "1" },
    { id: "2", name: "Baraka Juma", email: "baraka@example.com", phone: "255700000002", recipientId: "2" },
  ]

  it("returns nothing for a blank query, so no suggestions show before the admin types", () => {
    expect(filterRecipients(users, "")).toEqual([])
    expect(filterRecipients(users, "   ")).toEqual([])
  })

  it("matches on name, email or phone", () => {
    expect(filterRecipients(users, "asha").map((u) => u.id)).toEqual(["1"])
    expect(filterRecipients(users, "baraka@example").map((u) => u.id)).toEqual(["2"])
    expect(filterRecipients(users, "255700000001").map((u) => u.id)).toEqual(["1"])
  })

  it("caps results at 5", () => {
    const many = Array.from({ length: 8 }, (_, i) => ({ id: `${i}`, name: `Match ${i}`, email: "x@example.com", recipientId: `${i}` }))

    expect(filterRecipients(many, "match")).toHaveLength(5)
  })
})

describe("filterActivityLogs", () => {
  const log = (over: Partial<ActivityLog["details"]> = {}, admin = "Admin One"): ActivityLog =>
    ({
      id: "l-1",
      admin_id: "a-1",
      action: "send_message",
      resource: "user",
      details: {
        recipient_user_id: "u-1",
        recipient_email: "asha@example.com",
        recipient_name: "Asha Mwinyi",
        subject: "Welcome",
        channels: { sendEmail: true, sendInApp: false },
        ...over,
      },
      created_at: "2026-02-01T10:00:00Z",
      admin: { full_name: admin, email: "admin@example.com" },
    }) as ActivityLog

  it("returns everything for a blank query", () => {
    expect(filterActivityLogs([log()], "")).toHaveLength(1)
  })

  it.each([
    ["recipient name", "asha"],
    ["recipient email", "asha@example"],
    ["subject", "welcome"],
    ["sending admin", "admin one"],
  ])("matches on %s", (_field, query) => {
    expect(filterActivityLogs([log()], query)).toHaveLength(1)
  })

  it("excludes a log that matches nothing", () => {
    expect(filterActivityLogs([log()], "zzz")).toEqual([])
  })
})

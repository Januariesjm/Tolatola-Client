/**
 * Tests for the API request schemas (lib/schemas/api.ts).
 *
 * These guard the boundaries where an unchecked id or amount used to flow
 * straight into a Supabase query or a payout ledger.
 */

import { assignRoleSchema, createAdminSchema, payoutDecisionSchema, payoutRequestSchema, revokeRoleSchema } from "@/lib/schemas/api"

describe("assignRoleSchema", () => {
  it("accepts a userId and roleId", () => {
    expect(assignRoleSchema.safeParse({ userId: "u-1", roleId: "r-1" }).success).toBe(true)
  })

  it.each([
    ["a missing userId", { roleId: "r-1" }],
    ["a missing roleId", { userId: "u-1" }],
    ["an empty userId", { userId: "", roleId: "r-1" }],
    ["a numeric userId", { userId: 1, roleId: "r-1" }],
    ["a null body", null],
  ])("rejects %s", (_label, body) => {
    expect(assignRoleSchema.safeParse(body).success).toBe(false)
  })

  it("accepts a non-uuid id, since the tables mix key types", () => {
    expect(assignRoleSchema.safeParse({ userId: "admin-legacy-7", roleId: "super" }).success).toBe(true)
  })
})

describe("revokeRoleSchema", () => {
  it("treats reason as optional", () => {
    expect(revokeRoleSchema.safeParse({ userId: "u-1" }).success).toBe(true)
    expect(revokeRoleSchema.safeParse({ userId: "u-1", reason: "left the team" }).success).toBe(true)
  })

  it("still requires the userId", () => {
    expect(revokeRoleSchema.safeParse({ reason: "why" }).success).toBe(false)
  })
})

describe("payoutDecisionSchema", () => {
  it.each(["vendor", "transporter"])("accepts userType %s", (userType) => {
    expect(payoutDecisionSchema.safeParse({ payoutId: "p-1", userType }).success).toBe(true)
  })

  it.each([
    ["an unknown userType", { payoutId: "p-1", userType: "admin" }],
    ["a missing userType", { payoutId: "p-1" }],
    ["a missing payoutId", { userType: "vendor" }],
  ])("rejects %s", (_label, body) => {
    expect(payoutDecisionSchema.safeParse(body).success).toBe(false)
  })
})

describe("payoutRequestSchema", () => {
  it("accepts a well-formed payout request", () => {
    const result = payoutRequestSchema.safeParse({
      vendorId: "v-1",
      amount: 50000,
      paymentMethod: "mpesa",
      paymentDetails: { phone: "255700000001" },
    })

    expect(result.success).toBe(true)
  })

  it.each([
    ["zero", 0],
    ["a negative amount", -100],
    ["NaN", Number.NaN],
    ["a numeric string", "50000"],
  ])("rejects %s so it cannot reach the ledger", (_label, amount) => {
    const result = payoutRequestSchema.safeParse({
      vendorId: "v-1",
      amount,
      paymentMethod: "mpesa",
    })

    expect(result.success).toBe(false)
  })

  it("treats paymentDetails as optional", () => {
    expect(payoutRequestSchema.safeParse({ vendorId: "v-1", amount: 1, paymentMethod: "mpesa" }).success).toBe(true)
  })
})

describe("createAdminSchema", () => {
  const valid = {
    email: "admin@tolatola.co",
    password: "a-long-enough-password",
    fullName: "Ada Admin",
    setupKey: "correct-horse",
  }

  it("accepts a complete request", () => {
    expect(createAdminSchema.safeParse(valid).success).toBe(true)
  })

  it.each([
    ["a malformed email", { ...valid, email: "not-an-email" }],
    ["a short password", { ...valid, password: "short" }],
    ["an empty fullName", { ...valid, fullName: "" }],
    ["a missing setupKey", { ...valid, setupKey: undefined }],
  ])("rejects %s", (_label, body) => {
    expect(createAdminSchema.safeParse(body).success).toBe(false)
  })

  it("explains a short password specifically", () => {
    const result = createAdminSchema.safeParse({ ...valid, password: "short" })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("Password must be at least 8 characters")
    }
  })

  it("accepts a password of exactly the minimum length", () => {
    expect(createAdminSchema.safeParse({ ...valid, password: "12345678" }).success).toBe(true)
  })
})

/**
 * Tests for the withdrawal request schema (lib/validation/withdrawal.ts).
 *
 * This backs `validateWithdrawal` in lib/agent/wallet.ts, whose own tests pin
 * the Swahili-titled rejection shape and priority order end to end. What is
 * worth testing here directly is the schema and `firstWithdrawalIssueCode` in
 * isolation: that exactly one issue is raised per invalid input, in the
 * documented priority, and that a well-formed request parses clean.
 */

import { firstWithdrawalIssueCode, MIN_PHONE_DIGITS, withdrawalRequestSchema } from "@/lib/validation/withdrawal"

const valid = { amount: "5000", balance: 10000, phoneNumber: "255700000001" }

describe("withdrawalRequestSchema", () => {
  it("accepts a well-formed request", () => {
    expect(withdrawalRequestSchema.safeParse(valid).success).toBe(true)
  })

  it("accepts withdrawing exactly the full balance", () => {
    expect(withdrawalRequestSchema.safeParse({ ...valid, amount: "10000" }).success).toBe(true)
  })

  it.each([["0"], [""], ["-100"], ["abc"]])("rejects the amount %p with a single issue", (amount) => {
    const result = withdrawalRequestSchema.safeParse({ ...valid, amount })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toHaveLength(1)
      expect(result.error.issues[0].path).toEqual(["amount"])
    }
  })

  it("rejects an amount over the balance, naming the amount field", () => {
    const result = withdrawalRequestSchema.safeParse({ ...valid, amount: "20000" })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].path).toEqual(["amount"])
  })

  it.each([[""], ["12345678"], ["   "]])("rejects the phone number %p", (phoneNumber) => {
    const result = withdrawalRequestSchema.safeParse({ ...valid, phoneNumber })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].path).toEqual(["phoneNumber"])
  })

  it("accepts a phone number of exactly the minimum length", () => {
    expect(withdrawalRequestSchema.safeParse({ ...valid, phoneNumber: "1".repeat(MIN_PHONE_DIGITS) }).success).toBe(true)
  })

  it("stops at the amount issue when the amount, balance and phone are all invalid", () => {
    const result = withdrawalRequestSchema.safeParse({ amount: "0", balance: 0, phoneNumber: "" })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toHaveLength(1)
      expect(result.error.issues[0].path).toEqual(["amount"])
    }
  })

  it("stops at the balance issue once the amount is valid but the phone is also missing", () => {
    const result = withdrawalRequestSchema.safeParse({ amount: "5000", balance: 100, phoneNumber: "" })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues).toHaveLength(1)
      expect(result.error.issues[0].message).toContain("balance")
    }
  })
})

describe("firstWithdrawalIssueCode", () => {
  it("returns null for a successful parse", () => {
    expect(firstWithdrawalIssueCode(withdrawalRequestSchema.safeParse(valid))).toBeNull()
  })

  it.each([
    ["0", 10000, "255700000001", "invalid_amount"],
    ["20000", 10000, "255700000001", "insufficient_balance"],
    ["5000", 10000, "123", "invalid_phone"],
  ] as const)("maps amount=%p balance=%p phone=%p to %s", (amount, balance, phoneNumber, expected) => {
    expect(firstWithdrawalIssueCode(withdrawalRequestSchema.safeParse({ amount, balance, phoneNumber }))).toBe(expected)
  })
})

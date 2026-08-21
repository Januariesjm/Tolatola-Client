/**
 * Tests for agent wallet arithmetic (lib/agent/wallet.ts).
 *
 * This is money logic — the balances an agent sees and the 10% fee deducted from
 * a payout — and it had no coverage while it lived inside a 679-line component.
 */

import {
  WITHDRAWAL_FEE_RATE,
  expectedPayout,
  fetchAgentWallet,
  formatTzs,
  lifetimeEarnings,
  paidBalance,
  pendingBalance,
  quickPercentAmount,
  sumCommissions,
  validateWithdrawal,
  withdrawalFee,
} from "@/lib/agent/wallet"
import type { AgentCommissionRecord } from "@/lib/types/agent"

const commission = (status: string, amount: number | string): AgentCommissionRecord => ({
  id: `c-${status}-${amount}`,
  amount,
  status,
  created_at: "2026-02-01",
})

const ledger: AgentCommissionRecord[] = [
  commission("paid", 10000),
  commission("paid", "5000"),
  commission("approved", 3000),
  commission("pending", 2000),
  commission("rejected", 9999),
]

describe("sumCommissions", () => {
  it("sums only the requested statuses", () => {
    expect(sumCommissions(ledger, ["pending"])).toBe(2000)
  })

  it("coerces numeric strings, which some endpoints return", () => {
    expect(sumCommissions([commission("paid", "2500")], ["paid"])).toBe(2500)
  })

  it("treats an unparseable amount as zero instead of producing NaN", () => {
    expect(sumCommissions([commission("paid", "abc"), commission("paid", 100)], ["paid"])).toBe(100)
  })

  it("returns 0 for an empty ledger", () => {
    expect(sumCommissions([], ["paid"])).toBe(0)
  })

  it("returns 0 when no status matches", () => {
    expect(sumCommissions(ledger, ["nonexistent"])).toBe(0)
  })
})

describe("balances", () => {
  it("counts paid and approved as lifetime earnings", () => {
    // 10000 + 5000 + 3000
    expect(lifetimeEarnings(ledger)).toBe(18000)
  })

  it("counts only pending as the pending balance", () => {
    expect(pendingBalance(ledger)).toBe(2000)
  })

  it("counts only paid as the paid balance", () => {
    expect(paidBalance(ledger)).toBe(15000)
  })

  it("excludes rejected commissions from every balance", () => {
    const rejectedOnly = [commission("rejected", 9999)]

    expect(lifetimeEarnings(rejectedOnly)).toBe(0)
    expect(pendingBalance(rejectedOnly)).toBe(0)
    expect(paidBalance(rejectedOnly)).toBe(0)
  })

  it("keeps paid a subset of lifetime earnings", () => {
    expect(paidBalance(ledger)).toBeLessThanOrEqual(lifetimeEarnings(ledger))
  })
})

describe("formatTzs", () => {
  it("adds thousands separators", () => {
    expect(formatTzs(25000)).toBe("TZS 25,000")
  })

  it("formats a numeric STRING the same as a number", () => {
    // The bug this guards: a string reaching .toLocaleString() rendered
    // "TZS 25000" with no separators.
    expect(formatTzs("25000")).toBe("TZS 25,000")
  })

  it.each([[null], [undefined], [""], ["abc"]])("renders %p as zero", (value) => {
    expect(formatTzs(value as number | string | null)).toBe("TZS 0")
  })

  it("renders zero as zero", () => {
    expect(formatTzs(0)).toBe("TZS 0")
  })
})

describe("quickPercentAmount", () => {
  it("takes a percentage of the balance", () => {
    expect(quickPercentAmount(10000, 0.5)).toBe(5000)
  })

  it("floors rather than rounds, so a shortcut can never exceed the balance", () => {
    expect(quickPercentAmount(999, 0.5)).toBe(499)
    expect(quickPercentAmount(100, 1)).toBe(100)
  })

  it.each([[0], [-500]])("returns 0 for the balance %p", (balance) => {
    expect(quickPercentAmount(balance, 0.5)).toBe(0)
  })
})

describe("withdrawalFee and expectedPayout", () => {
  it("charges the documented rate", () => {
    expect(WITHDRAWAL_FEE_RATE).toBe(0.1)
    expect(withdrawalFee(10000)).toBe(1000)
  })

  it("rounds the fee", () => {
    expect(withdrawalFee(1005)).toBe(101)
    expect(withdrawalFee(1004)).toBe(100)
  })

  it("accepts a string amount", () => {
    expect(withdrawalFee("10000")).toBe(1000)
  })

  it("pays out the amount less the fee", () => {
    expect(expectedPayout(10000)).toBe(9000)
  })

  it("never returns a negative payout", () => {
    expect(expectedPayout(0)).toBe(0)
    expect(expectedPayout(-500)).toBe(0)
  })

  it("keeps fee plus payout equal to the gross", () => {
    for (const gross of [1, 7, 999, 1005, 25000]) {
      expect(withdrawalFee(gross) + expectedPayout(gross)).toBe(gross)
    }
  })

  it.each([[null], [undefined], ["abc"]])("treats %p as zero", (value) => {
    expect(withdrawalFee(value as unknown as number)).toBe(0)
    expect(expectedPayout(value as unknown as number)).toBe(0)
  })
})

describe("validateWithdrawal", () => {
  const valid = { amount: "5000", balance: 10000, phoneNumber: "255700000001" }

  it("accepts a well-formed request", () => {
    expect(validateWithdrawal(valid)).toBeNull()
  })

  it("allows withdrawing the entire balance", () => {
    expect(validateWithdrawal({ ...valid, amount: "10000" })).toBeNull()
  })

  it.each([["0"], [""], ["-100"], ["abc"]])("rejects the amount %p", (amount) => {
    expect(validateWithdrawal({ ...valid, amount })?.title).toBe("Kosa la Uingizaji")
  })

  it("rejects more than the balance and names the balance", () => {
    const rejection = validateWithdrawal({ ...valid, amount: "20000" })

    expect(rejection?.title).toBe("Salio Halitoshi")
    expect(rejection?.description).toContain("TZS 10,000")
  })

  it.each([[""], ["12345678"], ["   "]])("rejects the phone number %p", (phoneNumber) => {
    expect(validateWithdrawal({ ...valid, phoneNumber })?.title).toBe("Namba ya Simu Inahitajika")
  })

  it("accepts a phone number of exactly the minimum length", () => {
    expect(validateWithdrawal({ ...valid, phoneNumber: "123456789" })).toBeNull()
  })

  it("checks the amount before the balance and the balance before the phone", () => {
    // All three wrong: the amount complaint wins.
    expect(validateWithdrawal({ amount: "0", balance: 0, phoneNumber: "" })?.title).toBe("Kosa la Uingizaji")
    // Amount fine, balance short, phone missing: the balance complaint wins.
    expect(validateWithdrawal({ amount: "5000", balance: 100, phoneNumber: "" })?.title).toBe("Salio Halitoshi")
  })
})

describe("fetchAgentWallet", () => {
  const wallet = {
    lifetimeEarnings: 1,
    pendingBalance: 2,
    withdrawableBalance: 3,
    paidBalance: 4,
    commissions: [],
    withdrawals: [],
  }

  function mockFetch(result: { ok?: boolean; body?: unknown }) {
    const fetchMock = jest.fn(async () => ({
      ok: result.ok ?? true,
      json: async () => result.body ?? {},
    }))
    global.fetch = fetchMock as unknown as typeof fetch
    return fetchMock
  }

  it("returns the wallet on success", async () => {
    mockFetch({ body: { success: true, wallet } })

    await expect(fetchAgentWallet("tok")).resolves.toEqual(wallet)
  })

  it("sends the bearer token when there is one", async () => {
    const fetchMock = mockFetch({ body: { success: true, wallet } })

    await fetchAgentWallet("tok-123")

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/agents/wallet"),
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer tok-123" }) }),
    )
  })

  it("omits the header when there is no token", async () => {
    const fetchMock = mockFetch({ body: { success: true, wallet } })

    await fetchAgentWallet(null)

    const headers = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].headers as Record<string, string>
    expect(headers.Authorization).toBeUndefined()
  })

  it.each([
    ["a non-OK response", { ok: false }],
    ["success:false", { body: { success: false, wallet } }],
    ["a missing wallet", { body: { success: true } }],
  ])("returns null for %s, so the caller keeps its existing balances", async (_label, result) => {
    mockFetch(result)

    await expect(fetchAgentWallet("tok")).resolves.toBeNull()
  })
})

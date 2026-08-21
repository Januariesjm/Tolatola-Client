/**
 * Tests for the agent wallet types (lib/types/agent.ts).
 *
 * emptyWalletStats is what the commission tab renders before
 * `GET /agents/wallet` resolves, so its fallbacks decide whether the balances
 * show a real number or a blank on first paint.
 */

import { emptyWalletStats, type AgentCommissionRecord } from "@/lib/types/agent"

const commission = (over: Partial<AgentCommissionRecord> = {}): AgentCommissionRecord => ({
  id: "c-1",
  amount: 5000,
  status: "paid",
  created_at: "2026-02-01",
  ...over,
})

describe("emptyWalletStats", () => {
  it("seeds the balances from the server-rendered summary", () => {
    const stats = emptyWalletStats({ totalEarnings: 90000, pendingCommission: 20000, paidCommission: 70000 })

    expect(stats).toMatchObject({ lifetimeEarnings: 90000, pendingBalance: 20000, paidBalance: 70000 })
  })

  it("starts withdrawable at zero, since only the wallet endpoint knows it", () => {
    const stats = emptyWalletStats({ totalEarnings: 90000 })

    expect(stats.withdrawableBalance).toBe(0)
  })

  it("carries the server-rendered commissions through", () => {
    const stats = emptyWalletStats(null, [commission(), commission({ id: "c-2" })])

    expect(stats.commissions.map((c) => c.id)).toEqual(["c-1", "c-2"])
  })

  it("starts with no withdrawals", () => {
    expect(emptyWalletStats(null).withdrawals).toEqual([])
  })

  it.each([[null], [undefined]])("defaults every balance to 0 for a %p summary", (summary) => {
    const stats = emptyWalletStats(summary)

    expect(stats).toMatchObject({
      lifetimeEarnings: 0,
      pendingBalance: 0,
      withdrawableBalance: 0,
      paidBalance: 0,
    })
  })

  it("treats null totals as 0 rather than rendering null", () => {
    const stats = emptyWalletStats({ totalEarnings: null, pendingCommission: null, paidCommission: null })

    expect(stats.lifetimeEarnings).toBe(0)
    expect(stats.pendingBalance).toBe(0)
  })

  it("defaults commissions to an empty list", () => {
    expect(emptyWalletStats({ totalEarnings: 1 }).commissions).toEqual([])
  })

  it("accepts a commission amount as a string, which the API does return", () => {
    const stats = emptyWalletStats(null, [commission({ amount: "12500" })])

    expect(stats.commissions[0].amount).toBe("12500")
    // The tab coerces before formatting; this documents that strings are valid.
    expect(Number(stats.commissions[0].amount)).toBe(12500)
  })
})

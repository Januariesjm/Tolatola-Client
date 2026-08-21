import type { AgentCommissionRecord, AgentWalletStats } from "@/lib/types/agent"
import { firstWithdrawalIssueCode, withdrawalRequestSchema } from "@/lib/validation/withdrawal"

/**
 * Agent wallet arithmetic and withdrawal rules.
 *
 * Extracted from components/agent/agent-commission-tab.tsx. This is money
 * logic — the balances an agent sees and the fee deducted from a payout — and it
 * had no tests while it lived inside a 679-line component.
 *
 * Pure: no React, no fetching.
 */

/** Service fee taken from a withdrawal, as a fraction of the gross amount. */
export const WITHDRAWAL_FEE_RATE = 0.1

/** Commission statuses that count as money the agent has actually earned. */
export const EARNED_STATUSES = ["paid", "approved"] as const

/**
 * Sums commission amounts for the given statuses.
 *
 * `amount` arrives as a number or a numeric string depending on the endpoint, so
 * it is coerced rather than trusted.
 */
export function sumCommissions(commissions: AgentCommissionRecord[], statuses: readonly string[]): number {
  return commissions.filter((c) => statuses.includes(c.status)).reduce((sum, c) => sum + (Number(c.amount) || 0), 0)
}

/** Everything earned: paid out plus approved-but-not-yet-paid. */
export const lifetimeEarnings = (commissions: AgentCommissionRecord[]) => sumCommissions(commissions, EARNED_STATUSES)

/** Awaiting approval, so not yet withdrawable. */
export const pendingBalance = (commissions: AgentCommissionRecord[]) => sumCommissions(commissions, ["pending"])

/** Already paid out. */
export const paidBalance = (commissions: AgentCommissionRecord[]) => sumCommissions(commissions, ["paid"])

/**
 * Formats an amount as Tanzanian shillings.
 *
 * Coerces first: amounts arrive as numeric strings from some endpoints, and a
 * string reaching `.toLocaleString()` renders without thousands separators —
 * "TZS 25000" rather than "TZS 25,000".
 */
export function formatTzs(amount?: number | string | null): string {
  return `TZS ${(Number(amount) || 0).toLocaleString()}`
}

/**
 * Amount for a "withdraw N%" shortcut.
 *
 * Floored so a shortcut can never propose more than the balance through a
 * rounding artefact.
 */
export function quickPercentAmount(balance: number, percent: number): number {
  if (!balance || balance <= 0) return 0
  return Math.floor(balance * percent)
}

/** Service fee for a gross withdrawal amount. */
export function withdrawalFee(amount: number | string): number {
  const gross = Number(amount) || 0
  return Math.round(gross * WITHDRAWAL_FEE_RATE)
}

/** What the agent actually receives, never negative. */
export function expectedPayout(amount: number | string): number {
  const gross = Number(amount) || 0
  return Math.max(0, gross - withdrawalFee(gross))
}

export interface WithdrawalRequest {
  amount: string
  balance: number
  phoneNumber: string
}

/** A rejection reason, ready to feed a toast. */
export interface WithdrawalRejection {
  title: string
  description: string
}

/** Swahili title and description for each schema rejection code. */
const REJECTION_COPY: Record<Exclude<ReturnType<typeof firstWithdrawalIssueCode>, null>, (balance: number) => WithdrawalRejection> = {
  invalid_amount: () => ({ title: "Kosa la Uingizaji", description: "Tafadhali weka kiasi sahihi cha kutoa." }),
  insufficient_balance: (balance) => ({
    title: "Salio Halitoshi",
    description: `Kiasi unachotaka kutoa kinazidi salio lako la sasa la kutoa la ${formatTzs(balance)}`,
  }),
  invalid_phone: () => ({ title: "Namba ya Simu Inahitajika", description: "Tafadhali weka namba sahihi ya simu ya kupokelea fedha." }),
}

/**
 * Returns the first reason a withdrawal cannot be submitted, or null when it
 * can. Order matters: amount validity, then sufficient balance, then phone --
 * enforced by `withdrawalRequestSchema`, which this only translates into the
 * Swahili-titled shape the withdrawal dialog renders.
 */
export function validateWithdrawal(request: WithdrawalRequest): WithdrawalRejection | null {
  const result = withdrawalRequestSchema.safeParse(request)
  const code = firstWithdrawalIssueCode(result)
  return code ? REJECTION_COPY[code](request.balance) : null
}

/** Envelope returned by `GET /agents/wallet`. */
interface WalletResponse {
  success?: boolean
  wallet?: AgentWalletStats | null
}

/**
 * Fetches the agent's wallet, or null when it cannot be read.
 *
 * Returns null rather than throwing so the caller keeps the server-rendered
 * balances it already had instead of blanking them.
 */
export async function fetchAgentWallet(accessToken?: string | null): Promise<AgentWalletStats | null> {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"

  const response = await fetch(`${apiBase}/agents/wallet`, {
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
  })

  if (!response.ok) return null

  const data: WalletResponse = await response.json()
  return data.success && data.wallet ? data.wallet : null
}

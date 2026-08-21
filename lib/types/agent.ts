import type { CommissionStatus } from "@/lib/admin/agent-types"

/**
 * Shapes the agent-facing dashboard receives, as returned by
 * `GET /agents/wallet` and the agent dashboard's server-side queries.
 *
 * Distinct from lib/admin/agent-types.ts, which describes the same domain from
 * the *admin* side (a list of all agents with their totals). This file is the
 * single agent's own view: their commissions, withdrawals and wallet balances.
 * `CommissionStatus` is reused from there rather than redefined.
 */

/** The registration that earned a commission, joined onto the row. */
export interface AgentRegistrationSummary {
  full_name?: string | null
  /** "vendor" | "customer" | "transporter" in practice. */
  registration_type?: string | null
}

/** One commission the agent has earned. */
export interface AgentCommissionRecord {
  id: string
  /** The agent who earned it; used for the masked wallet card number. */
  agent_id?: string | null
  amount: number | string
  status: CommissionStatus
  created_at: string
  commission_type?: string | null
  description?: string | null
  agent_registrations?: AgentRegistrationSummary | null
}

/** Payout statuses a withdrawal moves through. */
export type WithdrawalStatus = "pending" | "processing" | "paid" | "rejected" | (string & {})

/** One withdrawal request against the agent's wallet. */
export interface AgentWithdrawal {
  id: string
  /** Gross amount requested. */
  amount: number | string
  /** Net amount after the service fee. */
  payout_amount?: number | string | null
  service_fee?: number | string | null
  payment_method?: string | null
  /** Provider-specific details; only the phone number is rendered. */
  payment_details?: { phoneNumber?: string | null } | null
  status: WithdrawalStatus
  created_at: string
}

/**
 * Wallet balances plus the two histories, as `GET /agents/wallet` returns them
 * under `wallet`.
 */
export interface AgentWalletStats {
  lifetimeEarnings: number
  pendingBalance: number
  /** What the agent may actually withdraw right now. */
  withdrawableBalance: number
  paidBalance: number
  commissions: AgentCommissionRecord[]
  withdrawals: AgentWithdrawal[]
}

/** Response envelope for `GET /agents/wallet`. */
export interface AgentWalletResponse {
  success?: boolean
  wallet?: AgentWalletStats | null
}

/**
 * Server-rendered totals passed into the tab before the wallet request
 * resolves, so the balances are not blank on first paint.
 */
export interface AgentCommissionSummary {
  totalEarnings?: number | null
  pendingCommission?: number | null
  paidCommission?: number | null
}

/** One row of the agent leaderboard. */
export interface AgentLeaderboardEntry {
  agent_id?: string | null
  agent_code?: string | null
  full_name?: string | null
  total_registrations?: number | null
  total_commission?: number | null
  rank?: number | null
}

/** Wallet state before the first `GET /agents/wallet` response arrives. */
export function emptyWalletStats(summary?: AgentCommissionSummary | null, commissions: AgentCommissionRecord[] = []): AgentWalletStats {
  return {
    lifetimeEarnings: summary?.totalEarnings || 0,
    pendingBalance: summary?.pendingCommission || 0,
    withdrawableBalance: 0,
    paidBalance: summary?.paidCommission || 0,
    commissions,
    withdrawals: [],
  }
}

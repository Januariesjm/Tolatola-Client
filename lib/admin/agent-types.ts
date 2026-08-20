/**
 * Shapes returned by the admin agent-management endpoints
 * (`/admin/agents`, `/admin/agents/commissions`,
 * `/admin/agents/commission-rates`, `/admin/agents/stats`).
 *
 * Nested relations are optional/nullable because the backend only includes a
 * join when it is selected, and the UI already renders these defensively
 * (`agent.users?.full_name || "Sales Agent"`). Keeping the types honest about
 * that is the point -- they describe the payload as received, not as hoped for.
 *
 * For the create-agent request body and the Zod validation of a single agent
 * record, see lib/schemas/agent.ts.
 */

/** Joined `users` row: the person behind an agent record. */
export interface AgentUserSummary {
  full_name?: string | null
  email?: string | null
}

/** Joined `agent_roles` row. */
export interface AgentRoleSummary {
  role_name?: string | null
}

/**
 * Agent status. Widened to `string` on purpose: the UI compares against
 * "active" but must not break if the backend introduces another state.
 */
export type AgentStatus = "active" | "suspended" | "pending" | (string & {})

export interface AdminAgent {
  id: string
  agent_code: string
  status: AgentStatus
  region?: string | null
  total_registrations: number
  total_commission: number
  users?: AgentUserSummary | null
  agent_roles?: AgentRoleSummary | null
}

/** Commission payout states the UI renders distinct styling for. */
export type CommissionStatus = "pending" | "approved" | "paid" | "rejected" | (string & {})

export interface AgentCommission {
  id: string
  amount: number
  status: CommissionStatus
  created_at: string
  agents?: {
    agent_code?: string | null
    users?: AgentUserSummary | null
  } | null
  agent_registrations?: {
    full_name?: string | null
    registration_type?: string | null
  } | null
}

/** One editable referral commission rate, keyed by registration type. */
export interface AgentCommissionRate {
  registration_type: string
  amount: number
}

export interface AgentStats {
  totalAgents: number
  activeAgents: number
  suspendedAgents: number
  totalRegistrations: number
  totalCommission: number
}

export const EMPTY_AGENT_STATS: AgentStats = {
  totalAgents: 0,
  activeAgents: 0,
  suspendedAgents: 0,
  totalRegistrations: 0,
  totalCommission: 0,
}

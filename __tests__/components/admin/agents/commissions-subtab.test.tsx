/**
 * Tests for CommissionsSubTab (components/admin/agents/commissions-subtab.tsx).
 *
 * Presentational. What matters: the action offered depends on the
 * commission's own status (pending -> approve/reject, approved -> disburse,
 * anything else -> no action), and each calls back with the right decision.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CommissionsSubTab } from "@/components/admin/agents/commissions-subtab"
import type { AgentCommission } from "@/lib/admin/agent-types"

const commission = (over: Partial<AgentCommission> = {}): AgentCommission =>
  ({
    id: "c-1",
    amount: 5000,
    status: "pending",
    created_at: "2026-02-01T00:00:00Z",
    agents: { agent_code: "AGT-001", users: { full_name: "Asha Mwinyi" } },
    ...over,
  }) as AgentCommission

const props = {
  commissions: [commission()],
  isLoading: false,
  isActionLoading: null as string | null,
  onApproveCommission: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("CommissionsSubTab", () => {
  it("shows a loading state", () => {
    render(<CommissionsSubTab {...props} isLoading />)

    expect(screen.getByText("Loading commission queue...")).toBeInTheDocument()
  })

  it("shows an empty state with nothing awaiting approval", () => {
    render(<CommissionsSubTab {...props} commissions={[]} />)

    expect(screen.getByText("No commissions awaiting approval at this time.")).toBeInTheDocument()
  })

  it("offers approve and reject for a pending commission", async () => {
    render(<CommissionsSubTab {...props} />)

    await userEvent.click(screen.getByRole("button", { name: /approve/i }))

    expect(props.onApproveCommission).toHaveBeenCalledWith("c-1", "approved")
  })

  it("reports a rejection", async () => {
    render(<CommissionsSubTab {...props} />)

    await userEvent.click(screen.getByRole("button", { name: "Reject" }))

    expect(props.onApproveCommission).toHaveBeenCalledWith("c-1", "rejected")
  })

  it("offers only Disburse for an approved commission", async () => {
    render(<CommissionsSubTab {...props} commissions={[commission({ status: "approved" })]} />)

    expect(screen.queryByRole("button", { name: /approve/i })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole("button", { name: /disburse/i }))

    expect(props.onApproveCommission).toHaveBeenCalledWith("c-1", "paid")
  })

  it("offers no action for an already-paid commission", () => {
    render(<CommissionsSubTab {...props} commissions={[commission({ status: "paid" })]} />)

    expect(screen.getByText("No Action Needed")).toBeInTheDocument()
  })
})

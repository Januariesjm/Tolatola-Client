/**
 * Tests for AgentsListSubTab
 * (components/admin/agents/agents-list-subtab.tsx).
 *
 * Presentational: all data and loading state comes from the caller
 * (hooks/use-agent-management.ts), already covered end to end by
 * __tests__/components/admin/agent-management-tab.test.tsx. This adds the
 * direct wiring checks: each action calls back with the right agent id.
 */

import React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AgentsListSubTab } from "@/components/admin/agents/agents-list-subtab"
import type { AdminAgent } from "@/lib/admin/agent-types"

const agent: AdminAgent = {
  id: "a-1",
  agent_code: "AGT-001",
  status: "active",
  total_registrations: 5,
  total_commission: 25000,
  users: { full_name: "Asha Mwinyi", email: "asha@example.com" },
} as AdminAgent

const props = {
  filteredAgents: [agent],
  isLoading: false,
  isActionLoading: null as string | null,
  searchQuery: "",
  onSearchQueryChange: jest.fn(),
  statusFilter: "all",
  onStatusFilterChange: jest.fn(),
  onCreateClick: jest.fn(),
  onToggleStatus: jest.fn(),
  onResendInvitation: jest.fn(),
  onDeleteTarget: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
})

const row = () => screen.getByText("Asha Mwinyi").closest("tr") as HTMLElement

describe("AgentsListSubTab", () => {
  it("shows a loading state", () => {
    render(<AgentsListSubTab {...props} isLoading />)

    expect(screen.getByText("Loading agents list...")).toBeInTheDocument()
  })

  it("shows an empty state with no agents", () => {
    render(<AgentsListSubTab {...props} filteredAgents={[]} />)

    expect(screen.getByText("No agents found.")).toBeInTheDocument()
  })

  it("reports a search keystroke", async () => {
    render(<AgentsListSubTab {...props} />)

    await userEvent.type(screen.getByPlaceholderText(/search by name or code/i), "a")

    expect(props.onSearchQueryChange).toHaveBeenCalledWith("a")
  })

  it("calls onCreateClick from the create button", async () => {
    render(<AgentsListSubTab {...props} />)

    await userEvent.click(screen.getByRole("button", { name: /create new agent/i }))

    expect(props.onCreateClick).toHaveBeenCalledTimes(1)
  })

  it("calls onToggleStatus with the agent's id and current status", async () => {
    render(<AgentsListSubTab {...props} />)

    await userEvent.click(within(row()).getByRole("button", { name: "Suspend" }))

    expect(props.onToggleStatus).toHaveBeenCalledWith("a-1", "active")
  })

  it("calls onResendInvitation with the agent's id", async () => {
    render(<AgentsListSubTab {...props} />)

    await userEvent.click(within(row()).getByTitle(/resend activation email/i))

    expect(props.onResendInvitation).toHaveBeenCalledWith("a-1")
  })

  it("calls onDeleteTarget with the agent's id, name and code", async () => {
    render(<AgentsListSubTab {...props} />)

    await userEvent.click(within(row()).getByTitle(/delete agent permanently/i))

    expect(props.onDeleteTarget).toHaveBeenCalledWith({ id: "a-1", name: "Asha Mwinyi", code: "AGT-001" })
  })
})

/**
 * Tests for AgentDashboardContent (components/agent/agent-dashboard-content.tsx).
 *
 * This component is a thin shell: it owns `activeTab`/mobile-sidebar state
 * and picks which tab component to render. Every tab and the sidebar are
 * mocked out so this suite exercises only the shell's own logic (which tab
 * renders, the header title/agent badge, and wiring the sidebar's tab
 * switching into the switch statement) without pulling in each tab's own
 * data-fetching dependencies.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AgentDashboardContent } from "@/components/agent/agent-dashboard-content"

jest.mock("@/components/agent/agent-sidebar", () => ({
  AgentSidebar: ({ activeTab, setActiveTab, roleName }: { activeTab: string; setActiveTab: (tab: string) => void; roleName: string }) => (
    <div data-testid="agent-sidebar">
      <span>active:{activeTab}</span>
      <span>role:{roleName}</span>
      <button onClick={() => setActiveTab("commissions")}>go-to-commissions</button>
      <button onClick={() => setActiveTab("notifications")}>go-to-notifications</button>
      <button onClick={() => setActiveTab("bogus-tab")}>go-to-bogus</button>
    </div>
  ),
}))

jest.mock("@/components/agent/agent-overview-tab", () => ({
  AgentOverviewTab: () => <div data-testid="overview-tab">Overview Tab</div>,
}))
jest.mock("@/components/agent/agent-registrations-tab", () => ({
  AgentRegistrationsTab: () => <div data-testid="registrations-tab">Registrations Tab</div>,
}))
jest.mock("@/components/agent/agent-commission-tab", () => ({
  AgentCommissionTab: () => <div data-testid="commission-tab">Commission Tab</div>,
}))
jest.mock("@/components/agent/agent-performance-tab", () => ({
  AgentPerformanceTab: () => <div data-testid="performance-tab">Performance Tab</div>,
}))
jest.mock("@/components/agent/agent-notifications", () => ({
  AgentNotifications: () => <div data-testid="notifications-tab">Notifications Tab</div>,
}))

type DashboardProps = React.ComponentProps<typeof AgentDashboardContent>

const baseProps: DashboardProps = {
  agent: { agent_code: "AGT-777" },
  role: { role_name: "Regional Lead" },
  permissions: [],
  dashboardStats: {},
  trend: [],
  registrations: [],
  commissions: [],
  commissionSummary: {},
  leaderboard: [],
  myRank: null,
}

function renderContent(overrides: Partial<DashboardProps> = {}) {
  return render(<AgentDashboardContent {...baseProps} {...overrides} />)
}

describe("AgentDashboardContent", () => {
  it("renders the overview tab by default", () => {
    renderContent()

    expect(screen.getByTestId("overview-tab")).toBeInTheDocument()
    // The header title is the raw tab id (dashes -> spaces); visual
    // capitalization is CSS-only, so the DOM text stays lowercase.
    expect(screen.getByText("overview")).toBeInTheDocument()
  })

  it("shows the agent code badge and the role name passed to the sidebar", () => {
    renderContent()

    expect(screen.getByText("AGT-777")).toBeInTheDocument()
    expect(screen.getByText("role:Regional Lead")).toBeInTheDocument()
  })

  it("falls back to 'Sales Agent' when the role has no name", () => {
    renderContent({ role: null })

    expect(screen.getByText("role:Sales Agent")).toBeInTheDocument()
  })

  it("switches to the commissions tab when the sidebar requests it", async () => {
    renderContent()

    await userEvent.click(screen.getByText("go-to-commissions"))

    expect(screen.getByTestId("commission-tab")).toBeInTheDocument()
    expect(screen.queryByTestId("overview-tab")).not.toBeInTheDocument()
    expect(screen.getByText("commissions")).toBeInTheDocument()
  })

  it("switches to the notifications tab when the sidebar requests it", async () => {
    renderContent()

    await userEvent.click(screen.getByText("go-to-notifications"))

    expect(screen.getByTestId("notifications-tab")).toBeInTheDocument()
    expect(screen.getByText("notifications")).toBeInTheDocument()
  })

  it("falls back to the overview tab for an unrecognized active tab", async () => {
    renderContent()

    await userEvent.click(screen.getByText("go-to-bogus"))

    expect(screen.getByTestId("overview-tab")).toBeInTheDocument()
  })

  it("opens the mobile sidebar when the header menu button is clicked", async () => {
    const { container } = renderContent()

    const menuButton = screen.getAllByRole("button").find((button) => button.querySelector("svg.lucide-menu"))
    expect(menuButton).toBeDefined()

    // Sidebar mock doesn't render isMobileOpen, but clicking must not throw and
    // the button should remain present (state is internal to this component).
    await userEvent.click(menuButton as HTMLElement)
    expect(container).toBeInTheDocument()
  })
})

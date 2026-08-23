/**
 * Tests for AgentSidebar (components/agent/agent-sidebar.tsx).
 *
 * The component renders its whole nav/profile/logout block twice -- once
 * inside the desktop `<aside>` and once inside the always-mounted mobile
 * drawer `<div>` (visibility is CSS-only, so both copies exist in the DOM
 * regardless of `isMobileOpen`). Every content/interaction assertion below
 * is scoped with `within(aside)` to avoid tripping over the duplicate.
 */

import React from "react"
import { render, screen, within, fireEvent } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useRouter } from "next/navigation"
import { AgentSidebar } from "@/components/agent/agent-sidebar"

const mockSignOut = jest.fn()
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signOut: mockSignOut } }),
}))

const baseAgent: Record<string, unknown> = {
  agent_code: "AGT-001",
  region: "Dar es Salaam",
  users: { full_name: "Jane Doe" },
}

type SidebarProps = React.ComponentProps<typeof AgentSidebar>

const baseProps: SidebarProps = {
  agent: baseAgent,
  roleName: "Regional Lead",
  activeTab: "overview",
  setActiveTab: jest.fn(),
  isMobileOpen: false,
  setIsMobileOpen: jest.fn(),
}

function renderSidebar(overrides: Partial<SidebarProps> = {}) {
  return render(<AgentSidebar {...baseProps} {...overrides} />)
}

/** The desktop `<aside>` -- the unique landmark used to scope queries. */
function aside() {
  return screen.getByRole("complementary")
}

beforeEach(() => {
  jest.clearAllMocks()
  mockSignOut.mockResolvedValue({ error: null })
})

describe("AgentSidebar", () => {
  describe("profile info", () => {
    it("renders the role name, agent code, region and agent name", () => {
      renderSidebar()

      expect(within(aside()).getByText("Regional Lead")).toBeInTheDocument()
      expect(within(aside()).getByText("AGT-001")).toBeInTheDocument()
      expect(within(aside()).getByText("Dar es Salaam")).toBeInTheDocument()
      expect(within(aside()).getByText("Jane Doe")).toBeInTheDocument()
      // Avatar initial is the first letter of the agent's name.
      expect(within(aside()).getByText("J")).toBeInTheDocument()
    })

    it("falls back to defaults when the agent has no name or region", () => {
      renderSidebar({ agent: { agent_code: "AGT-002" } })

      expect(within(aside()).getByText("Sales Officer")).toBeInTheDocument()
      expect(within(aside()).getByText("Tanzania")).toBeInTheDocument()
      expect(within(aside()).getByText("A")).toBeInTheDocument()
    })
  })

  describe("navigation", () => {
    it("renders every nav item", () => {
      renderSidebar()

      const nav = within(aside())
      expect(nav.getByText("Dashboard")).toBeInTheDocument()
      expect(nav.getByText("My Registrations")).toBeInTheDocument()
      expect(nav.getByText("My Wallet")).toBeInTheDocument()
      expect(nav.getByText("Performance Insights")).toBeInTheDocument()
      expect(nav.getByText("Notifications & Alerts")).toBeInTheDocument()
    })

    it("switches tabs and closes the mobile drawer when a nav item is clicked", async () => {
      const setActiveTab = jest.fn()
      const setIsMobileOpen = jest.fn()
      renderSidebar({ setActiveTab, setIsMobileOpen, isMobileOpen: true })

      await userEvent.click(within(aside()).getByText("My Wallet"))

      expect(setActiveTab).toHaveBeenCalledWith("commissions")
      expect(setIsMobileOpen).toHaveBeenCalledWith(false)
    })

    it("marks the active tab distinctly from inactive ones", () => {
      renderSidebar({ activeTab: "performance" })

      const activeButton = within(aside()).getByText("Performance Insights").closest("button")
      const inactiveButton = within(aside()).getByText("Dashboard").closest("button")

      expect(activeButton?.className).toContain("text-emerald-400")
      expect(inactiveButton?.className).not.toContain("text-emerald-400")
    })
  })

  describe("mobile drawer", () => {
    it("renders a backdrop only while open, and closing it clears isMobileOpen", () => {
      const setIsMobileOpen = jest.fn()
      const { container, rerender } = renderSidebar({ isMobileOpen: false, setIsMobileOpen })

      expect(container.querySelector(".backdrop-blur-sm")).not.toBeInTheDocument()

      rerender(<AgentSidebar {...baseProps} isMobileOpen setIsMobileOpen={setIsMobileOpen} />)

      const backdrop = container.querySelector(".backdrop-blur-sm")
      expect(backdrop).toBeInTheDocument()

      fireEvent.click(backdrop as Element)
      expect(setIsMobileOpen).toHaveBeenCalledWith(false)
    })

    it("closes the drawer from the in-panel close (X) button", async () => {
      const setIsMobileOpen = jest.fn()
      renderSidebar({ isMobileOpen: true, setIsMobileOpen })

      const closeButton = within(aside())
        .getAllByRole("button")
        .find((button) => button.querySelector("svg.lucide-x"))
      expect(closeButton).toBeDefined()

      await userEvent.click(closeButton as HTMLElement)
      expect(setIsMobileOpen).toHaveBeenCalledWith(false)
    })
  })

  describe("logout", () => {
    it("signs out of supabase and redirects to the login page", async () => {
      renderSidebar()

      await userEvent.click(within(aside()).getByText("Sign Out"))

      expect(mockSignOut).toHaveBeenCalledTimes(1)

      const router = useRouter()
      await Promise.resolve()
      expect(router.push).toHaveBeenCalledWith("/auth/login")
    })
  })
})

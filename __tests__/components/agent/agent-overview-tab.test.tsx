/**
 * Tests for AgentOverviewTab (components/agent/agent-overview-tab.tsx).
 *
 * Covers the welcome/referral card (link loading, copy-to-clipboard,
 * WhatsApp share url), the KPI cards derived from registrations/commissions,
 * the date-range filter narrowing those KPIs, and the recent-registrations
 * table (including its empty state and the "View All" tab switch).
 */

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { subDays } from "date-fns"
import { AgentOverviewTab } from "@/components/agent/agent-overview-tab"

const mockGetSession = jest.fn()
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { getSession: mockGetSession } }),
}))

const agent: { agent_code: string; status: string; users?: { full_name: string } } = {
  agent_code: "AG-100",
  status: "active",
  users: { full_name: "Jane Doe" },
}

const registration = (over: Record<string, unknown> = {}) => ({
  id: "r-1",
  full_name: "Baraka Juma",
  registration_type: "vendor",
  phone: "0754123456",
  status: "active",
  created_at: new Date().toISOString(),
  ...over,
})

const commission = (over: Record<string, unknown> = {}) => ({
  id: "c-1",
  amount: 1000,
  status: "paid",
  created_at: new Date().toISOString(),
  ...over,
})

function mockFetch(opts: { ok?: boolean; referralLink?: string; referralCode?: string } = {}) {
  const fetchMock = jest.fn(async () => ({
    ok: opts.ok ?? true,
    json: async () => ({
      referral_link: opts.referralLink ?? "https://tolatola.co/r/ABC123",
      referral_code: opts.referralCode ?? "ABC123",
    }),
  })) as unknown as typeof fetch
  global.fetch = fetchMock
  return fetchMock
}

const baseProps = {
  stats: {},
  agent,
  setActiveTab: jest.fn(),
  registrations: [] as ReturnType<typeof registration>[],
  commissions: [] as ReturnType<typeof commission>[],
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetSession.mockResolvedValue({ data: { session: { access_token: "tok" } } })
  Object.assign(navigator, { clipboard: { writeText: jest.fn() } })
  mockFetch()
})

const renderTab = (over: Partial<typeof baseProps> = {}) => render(<AgentOverviewTab {...baseProps} {...over} />)

/** Reads a KPI card's value by its title, since several cards can share a bare number. */
const kpiValue = (title: string) => screen.getByText(title).closest('[data-slot="card"]')?.querySelector(".text-xl, .text-2xl")?.textContent

describe("AgentOverviewTab", () => {
  describe("welcome banner", () => {
    it("greets the agent by name and shows their code and status", async () => {
      renderTab()
      await waitFor(() => expect(screen.getByText("https://tolatola.co/r/ABC123")).toBeInTheDocument())

      expect(screen.getByText(/Welcome back, Jane Doe!/)).toBeInTheDocument()
      expect(screen.getByText("AG-100")).toBeInTheDocument()
      expect(screen.getByText("active")).toBeInTheDocument()
    })

    it("falls back to a generic greeting when the agent has no linked user name", async () => {
      renderTab({ agent: { ...agent, users: undefined } })
      await waitFor(() => expect(screen.getByText("https://tolatola.co/r/ABC123")).toBeInTheDocument())

      expect(screen.getByText(/Welcome back, Sales Officer!/)).toBeInTheDocument()
    })
  })

  describe("referral link", () => {
    it("shows a loading placeholder before the referral link resolves", () => {
      renderTab()

      expect(screen.getByText("Generating link...")).toBeInTheDocument()
    })

    it("renders the fetched referral link once loaded", async () => {
      renderTab()

      await waitFor(() => expect(screen.getByText("https://tolatola.co/r/ABC123")).toBeInTheDocument())
    })

    it("falls back to a locally-built link when the referral request fails", async () => {
      mockFetch({ ok: false })
      renderTab()

      await waitFor(() => expect(screen.queryByText("Generating link...")).not.toBeInTheDocument())
      expect(screen.getByText("https://tolatola.co/auth/sign-up?ref=AG-100")).toBeInTheDocument()
    })

    it("copies the referral link to the clipboard and reverts the label after a delay", async () => {
      renderTab()
      await waitFor(() => expect(screen.getByText("https://tolatola.co/r/ABC123")).toBeInTheDocument())

      const copyButton = screen.getByRole("button", { name: "Copy Link" })
      await userEvent.click(copyButton)

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("https://tolatola.co/r/ABC123")
      expect(screen.getByRole("button", { name: "Copied!" })).toBeInTheDocument()

      await waitFor(() => expect(screen.getByRole("button", { name: "Copy Link" })).toBeInTheDocument(), { timeout: 3000 })
    })

    it("builds a WhatsApp share link containing the referral link", async () => {
      renderTab()
      await waitFor(() => expect(screen.getByText("https://tolatola.co/r/ABC123")).toBeInTheDocument())

      const whatsapp = screen.getByRole("link", { name: "WhatsApp" })
      expect(whatsapp).toHaveAttribute("href", expect.stringContaining(encodeURIComponent("https://tolatola.co/r/ABC123")))
      expect(whatsapp).toHaveAttribute("target", "_blank")
    })
  })

  describe("KPI cards", () => {
    it("counts registrations by category and commission totals", async () => {
      renderTab({
        registrations: [
          registration({ id: "1", registration_type: "vendor", status: "active" }),
          registration({ id: "2", registration_type: "customer", status: "pending" }),
          registration({ id: "3", registration_type: "transporter", status: "active" }),
        ],
        commissions: [commission({ amount: 1000, status: "paid" }), commission({ amount: 500, status: "pending" })],
      })
      await waitFor(() => expect(screen.getByText("https://tolatola.co/r/ABC123")).toBeInTheDocument())

      expect(kpiValue("Total Registrations")).toBe("3")
      expect(kpiValue("Active Registrations")).toBe("2")
      expect(kpiValue("Total Commission Earned")).toBe("TZS 1,500")
      expect(kpiValue("Pending Commission")).toBe("TZS 500")
    })

    it("renders zeroed KPI cards when there is no data", async () => {
      renderTab()
      await waitFor(() => expect(screen.getByText("https://tolatola.co/r/ABC123")).toBeInTheDocument())

      expect(kpiValue("Total Commission Earned")).toBe("TZS 0")
      expect(kpiValue("Pending Commission")).toBe("TZS 0")
      expect(kpiValue("Total Registrations")).toBe("0")
      expect(kpiValue("Vendors Registered")).toBe("0")
      expect(kpiValue("Customers Registered")).toBe("0")
      expect(kpiValue("Transporters Registered")).toBe("0")
      expect(kpiValue("Active Registrations")).toBe("0")
      expect(kpiValue("Monthly Registrations")).toBe("0")
    })
  })

  describe("date range filter", () => {
    it("narrows the KPI counts and recent list to the selected period", async () => {
      renderTab({
        registrations: [
          registration({ id: "recent", full_name: "Recent Person", created_at: new Date().toISOString() }),
          registration({ id: "old", full_name: "Old Person", created_at: subDays(new Date(), 400).toISOString() }),
        ],
      })

      // "all" is the default period, so both rows show.
      expect(screen.getByText("Recent Person")).toBeInTheDocument()
      expect(screen.getByText("Old Person")).toBeInTheDocument()

      await userEvent.click(screen.getByRole("button", { name: "This Week" }))

      expect(screen.getByText("Recent Person")).toBeInTheDocument()
      expect(screen.queryByText("Old Person")).not.toBeInTheDocument()
    })
  })

  describe("recent registrations table", () => {
    it("shows an empty state with a shortcut to copy the referral link", async () => {
      renderTab()
      await waitFor(() => expect(screen.getByText("https://tolatola.co/r/ABC123")).toBeInTheDocument())

      expect(screen.getByText("You haven't registered any users yet.")).toBeInTheDocument()

      await userEvent.click(screen.getByRole("button", { name: "Copy Referral Link" }))
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("https://tolatola.co/r/ABC123")
    })

    it("lists at most the 5 most recent registrations", async () => {
      const registrations = Array.from({ length: 7 }, (_, i) => registration({ id: `r-${i}`, full_name: `Person ${i}` }))
      renderTab({ registrations })
      await waitFor(() => expect(screen.getByText("https://tolatola.co/r/ABC123")).toBeInTheDocument())

      expect(screen.getByText("Person 0")).toBeInTheDocument()
      expect(screen.getByText("Person 4")).toBeInTheDocument()
      expect(screen.queryByText("Person 5")).not.toBeInTheDocument()
      expect(screen.queryByText("Person 6")).not.toBeInTheDocument()
    })

    it("renders the category and status badges for a registration", async () => {
      renderTab({ registrations: [registration({ registration_type: "customer", status: "pending" })] })
      await waitFor(() => expect(screen.getByText("https://tolatola.co/r/ABC123")).toBeInTheDocument())

      expect(screen.getByText("customer")).toBeInTheDocument()
      expect(screen.getByText("pending")).toBeInTheDocument()
    })

    it("switches to the registrations tab when 'View All' is clicked", async () => {
      const setActiveTab = jest.fn()
      renderTab({ registrations: [registration()], setActiveTab })

      await userEvent.click(screen.getByRole("button", { name: /View All/ }))

      expect(setActiveTab).toHaveBeenCalledWith("registrations")
    })
  })
})

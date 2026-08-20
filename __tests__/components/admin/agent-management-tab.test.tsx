/**
 * Tests for AgentManagementTab (components/admin/agent-management-tab.tsx).
 *
 * Covers the three destructive / stateful handlers with fetch mocked:
 * - handleToggleStatus  : active <-> suspended, and the failure path
 * - handleDeleteAgent   : permanent delete, confirmation dialog, failure path
 * - handleUpdateRates   : editing and saving referral commission rates
 *
 * The component fetches stats/agents/commissions/rates on mount, so each test
 * seeds those four responses and then asserts on the request the handler makes.
 */

import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AgentManagementTab } from "@/components/admin/agent-management-tab"
import { setErrorReporter, type LogRecord } from "@/lib/logger"
import type { AdminAgent, AgentCommissionRate, AgentStats } from "@/lib/admin/agent-types"

const mockToast = jest.fn()
jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}))

// Overrides the global Supabase mock from jest.setup.ts so a test can make the
// session lookup fail, which is the one path that reaches the component's outer
// catch (each individual fetch swallows its own rejection).
const mockGetSession = jest.fn()
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { getSession: mockGetSession } }),
}))

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000/api"

const activeAgent: AdminAgent = {
  id: "agent-1",
  agent_code: "AG-001",
  status: "active",
  region: "Dar es Salaam",
  total_registrations: 12,
  total_commission: 60000,
  users: { full_name: "Asha Mwinyi", email: "asha@tolatola.co" },
  agent_roles: { role_name: "Sales Agent" },
}

const suspendedAgent: AdminAgent = {
  ...activeAgent,
  id: "agent-2",
  agent_code: "AG-002",
  status: "suspended",
  users: { full_name: "Juma Said", email: "juma@tolatola.co" },
}

const stats: AgentStats = {
  totalAgents: 2,
  activeAgents: 1,
  suspendedAgents: 1,
  totalRegistrations: 20,
  totalCommission: 90000,
}

const rates: AgentCommissionRate[] = [
  { registration_type: "vendor", amount: 5000 },
  { registration_type: "customer", amount: 1000 },
]

type FetchResult = { ok?: boolean; status?: number; body?: unknown }

/**
 * Routes fetch by URL + method so a test only has to declare the call it cares
 * about. `overrides` entries are matched in order and win over the defaults.
 */
function mockFetch(
  overrides: Array<{ match: (url: string, method: string) => boolean } & FetchResult> = [],
  agents: AdminAgent[] = [activeAgent, suspendedAgent],
) {
  const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input)
    const method = (init?.method || "GET").toUpperCase()

    const override = overrides.find((o) => o.match(url, method))
    const result: FetchResult = override ?? matchDefault(url, method, agents)

    return {
      ok: result.ok ?? true,
      status: result.status ?? (result.ok === false ? 500 : 200),
      json: async () => result.body ?? {},
    } as Response
  })

  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

function matchDefault(url: string, method: string, agents: AdminAgent[]): FetchResult {
  if (method === "GET" && url.endsWith("/admin/agents/stats")) return { body: { stats } }
  if (method === "GET" && url.endsWith("/admin/agents/commission-rates")) {
    return { body: { data: rates } }
  }
  if (method === "GET" && url.endsWith("/admin/agents/commissions")) return { body: { data: [] } }
  if (method === "GET" && url.endsWith("/admin/agents")) return { body: { data: agents } }
  return { body: { success: true } }
}

/** Finds the table row for an agent code. */
function rowFor(agentCode: string) {
  return screen.getByText(agentCode).closest("tr") as HTMLElement
}

let reported: LogRecord[]

beforeEach(() => {
  jest.clearAllMocks()
  reported = []
  setErrorReporter((record) => reported.push(record))
  jest.spyOn(console, "error").mockImplementation(() => {})
  jest.spyOn(console, "log").mockImplementation(() => {})
  mockGetSession.mockResolvedValue({ data: { session: { access_token: "token-123" } } })
})

afterEach(() => {
  setErrorReporter(null)
  jest.restoreAllMocks()
})

describe("AgentManagementTab", () => {
  describe("initial load", () => {
    it("renders agents returned by the API and the stats row", async () => {
      mockFetch()
      render(<AgentManagementTab initialAgents={[]} />)

      expect(await screen.findByText("AG-001")).toBeInTheDocument()
      expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument()
      expect(screen.getByText("AG-002")).toBeInTheDocument()
    })

    it("shows a loading state while the initial fetch is in flight", () => {
      // Never-resolving fetch: the mount effect sets isLoading before any
      // response arrives, so initialAgents is not painted.
      global.fetch = jest.fn(() => new Promise<Response>(() => {})) as unknown as typeof fetch

      render(<AgentManagementTab initialAgents={[activeAgent]} />)

      expect(screen.getByText(/loading agents list/i)).toBeInTheDocument()
    })

    it("renders the empty state without crashing when every request rejects", async () => {
      // Each fetch in fetchAllData has its own .catch, so a network outage
      // degrades to empty lists rather than reaching the outer handler.
      global.fetch = jest.fn(async () => {
        throw new Error("network down")
      }) as unknown as typeof fetch

      render(<AgentManagementTab initialAgents={[activeAgent]} />)

      expect(await screen.findByText(/no agents found/i)).toBeInTheDocument()
      expect(mockToast).not.toHaveBeenCalled()
    })

    it("reports a load failure through the logger when the session lookup fails", async () => {
      mockGetSession.mockRejectedValue(new Error("supabase unreachable"))
      mockFetch()

      render(<AgentManagementTab initialAgents={[]} />)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Loading Failed", variant: "destructive" }))
      })
      expect(reported).toHaveLength(1)
      expect(reported[0]).toMatchObject({
        scope: "admin.agent-management",
        message: "failed to load agent data",
        error: { message: "supabase unreachable" },
      })
    })
  })

  describe("handleToggleStatus", () => {
    it("suspends an active agent via the activate endpoint", async () => {
      const fetchMock = mockFetch()
      render(<AgentManagementTab initialAgents={[]} />)
      await screen.findByText("AG-001")

      // The first action button in the row is the status toggle.
      const buttons = within(rowFor("AG-001")).getAllByRole("button")
      await userEvent.click(buttons[0])

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          `${API_BASE}/admin/agents/agent-1/activate`,
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ status: "suspended" }),
          }),
        )
      })
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Agent Status Updated",
          description: "Agent is now suspended.",
        }),
      )
    })

    it("reactivates a suspended agent", async () => {
      const fetchMock = mockFetch()
      render(<AgentManagementTab initialAgents={[]} />)
      await screen.findByText("AG-002")

      const buttons = within(rowFor("AG-002")).getAllByRole("button")
      await userEvent.click(buttons[0])

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          `${API_BASE}/admin/agents/agent-2/activate`,
          expect.objectContaining({ body: JSON.stringify({ status: "active" }) }),
        )
      })
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ description: "Agent is now active." }))
    })

    it("toasts and logs when the status update fails, without claiming success", async () => {
      mockFetch([{ match: (url, method) => method === "POST" && url.includes("/activate"), ok: false }])
      render(<AgentManagementTab initialAgents={[]} />)
      await screen.findByText("AG-001")

      const buttons = within(rowFor("AG-001")).getAllByRole("button")
      await userEvent.click(buttons[0])

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Failed", variant: "destructive" }))
      })
      expect(mockToast).not.toHaveBeenCalledWith(expect.objectContaining({ title: "Agent Status Updated" }))
      expect(reported.map((r) => r.message)).toContain("failed to update agent status")
      expect(reported[0].context).toMatchObject({
        agentId: "agent-1",
        nextStatus: "suspended",
      })
    })
  })

  describe("handleDeleteAgent", () => {
    /** Opens the delete confirmation dialog for an agent row. */
    async function openDeleteDialog(agentCode: string) {
      const buttons = within(rowFor(agentCode)).getAllByRole("button")
      // Status toggle, resend invitation, then delete.
      await userEvent.click(buttons[buttons.length - 1])
      return screen.findByRole("dialog")
    }

    it("asks for confirmation before deleting", async () => {
      const fetchMock = mockFetch()
      render(<AgentManagementTab initialAgents={[]} />)
      await screen.findByText("AG-001")

      await openDeleteDialog("AG-001")

      expect(fetchMock).not.toHaveBeenCalledWith(`${API_BASE}/admin/agents/agent-1`, expect.objectContaining({ method: "DELETE" }))
    })

    it("deletes the agent when confirmed", async () => {
      const fetchMock = mockFetch([
        {
          match: (url, method) => method === "DELETE" && url.endsWith("/admin/agents/agent-1"),
          body: { message: "Agent removed." },
        },
      ])
      render(<AgentManagementTab initialAgents={[]} />)
      await screen.findByText("AG-001")

      const dialog = await openDeleteDialog("AG-001")
      const confirm = within(dialog)
        .getAllByRole("button")
        .find((b) => /delete/i.test(b.textContent || "")) as HTMLElement
      await userEvent.click(confirm)

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(`${API_BASE}/admin/agents/agent-1`, expect.objectContaining({ method: "DELETE" }))
      })
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Agent Deleted", description: "Agent removed." }))
    })

    it("surfaces the API error message and logs the agent id on failure", async () => {
      mockFetch([
        {
          match: (url, method) => method === "DELETE" && url.endsWith("/admin/agents/agent-1"),
          ok: false,
          body: { error: "Agent has unpaid commissions" },
        },
      ])
      render(<AgentManagementTab initialAgents={[]} />)
      await screen.findByText("AG-001")

      const dialog = await openDeleteDialog("AG-001")
      const confirm = within(dialog)
        .getAllByRole("button")
        .find((b) => /delete/i.test(b.textContent || "")) as HTMLElement
      await userEvent.click(confirm)

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Delete Failed",
            description: "Agent has unpaid commissions",
            variant: "destructive",
          }),
        )
      })
      expect(reported.map((r) => r.message)).toContain("failed to delete agent")
      expect(reported[0].context).toMatchObject({ agentId: "agent-1" })
    })
  })

  describe("handleUpdateRates", () => {
    /** Switches to the Rates sub-tab and waits for the inputs to appear. */
    async function openRatesTab() {
      await userEvent.click(screen.getByRole("button", { name: /rates/i }))
      return waitFor(() => {
        const inputs = screen.getAllByRole("spinbutton")
        expect(inputs).toHaveLength(rates.length)
        return inputs as HTMLInputElement[]
      })
    }

    it("saves the current rates with a PUT", async () => {
      const fetchMock = mockFetch()
      render(<AgentManagementTab initialAgents={[]} />)
      await screen.findByText("AG-001")

      await openRatesTab()
      await userEvent.click(screen.getByRole("button", { name: /save commission rates/i }))

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          `${API_BASE}/admin/agents/commission-rates`,
          expect.objectContaining({ method: "PUT", body: JSON.stringify({ rates }) }),
        )
      })
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Rates Updated Successfully" }))
    })

    it("sends an edited amount as a number, not a string", async () => {
      const fetchMock = mockFetch()
      render(<AgentManagementTab initialAgents={[]} />)
      await screen.findByText("AG-001")

      const inputs = await openRatesTab()
      await userEvent.clear(inputs[0])
      await userEvent.type(inputs[0], "7500")
      await userEvent.click(screen.getByRole("button", { name: /save commission rates/i }))

      await waitFor(() => {
        const putCall = fetchMock.mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method === "PUT")
        expect(putCall).toBeDefined()
        const body = JSON.parse(String((putCall?.[1] as RequestInit).body))
        expect(body.rates).toEqual([
          { registration_type: "vendor", amount: 7500 },
          { registration_type: "customer", amount: 1000 },
        ])
      })
    })

    it("treats a cleared amount as 0 rather than NaN", async () => {
      const fetchMock = mockFetch()
      render(<AgentManagementTab initialAgents={[]} />)
      await screen.findByText("AG-001")

      const inputs = await openRatesTab()
      await userEvent.clear(inputs[1])
      await userEvent.click(screen.getByRole("button", { name: /save commission rates/i }))

      await waitFor(() => {
        const putCall = fetchMock.mock.calls.find(([, init]) => (init as RequestInit | undefined)?.method === "PUT")
        const body = JSON.parse(String((putCall?.[1] as RequestInit).body))
        expect(body.rates[1]).toEqual({ registration_type: "customer", amount: 0 })
      })
    })

    it("shows the API error and logs it when the save fails", async () => {
      mockFetch([
        {
          match: (url, method) => method === "PUT" && url.endsWith("/commission-rates"),
          ok: false,
          body: { error: "Rates are locked during payout" },
        },
      ])
      render(<AgentManagementTab initialAgents={[]} />)
      await screen.findByText("AG-001")

      await openRatesTab()
      await userEvent.click(screen.getByRole("button", { name: /save commission rates/i }))

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            title: "Update Failed",
            description: "Rates are locked during payout",
            variant: "destructive",
          }),
        )
      })
      expect(reported.map((r) => r.message)).toContain("failed to update commission rates")
    })

    it("shows an empty state when no rates are configured", async () => {
      mockFetch([
        {
          match: (url, method) => method === "GET" && url.endsWith("/commission-rates"),
          body: { data: [] },
        },
      ])
      render(<AgentManagementTab initialAgents={[]} />)
      await screen.findByText("AG-001")

      await userEvent.click(screen.getByRole("button", { name: /rates/i }))

      expect(await screen.findByText(/no commission rates configured/i)).toBeInTheDocument()
    })
  })
})

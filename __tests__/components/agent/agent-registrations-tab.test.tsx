/**
 * Tests for AgentRegistrationsTab (components/agent/agent-registrations-tab.tsx).
 *
 * Covers the initial table render (including empty state), status/category
 * badges and GPS/location formatting, the search-and-filter form submitting
 * a query to the server, the manual refresh button, the loading state while
 * a request is in flight, and the error-toast path that leaves the existing
 * rows in place.
 */

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AgentRegistrationsTab } from "@/components/agent/agent-registrations-tab"

const mockToast = jest.fn()
jest.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast: mockToast }) }))

const mockGetSession = jest.fn()
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { getSession: mockGetSession } }),
}))

const registration = (over: Record<string, unknown> = {}) => ({
  id: "r-1",
  full_name: "Baraka Juma",
  email: "baraka@example.com",
  registration_type: "vendor",
  phone: "0754123456",
  area: "Kariakoo",
  district: "Ilala",
  gps_latitude: -6.816,
  gps_longitude: 39.288,
  status: "active",
  created_at: "2026-02-01T00:00:00Z",
  ...over,
})

const agent = { agent_code: "AG-1" }

function mockFetch(opts: { ok?: boolean; data?: unknown[] } = {}) {
  const fetchMock = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => ({
    ok: opts.ok ?? true,
    json: async () => ({ data: opts.data ?? [registration({ id: "new-1", full_name: "Fetched Person" })] }),
  }))
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetSession.mockResolvedValue({ data: { session: { access_token: "tok" } } })
  mockFetch()
})

describe("AgentRegistrationsTab", () => {
  describe("initial render", () => {
    it("shows the empty state when there are no registrations", () => {
      render(<AgentRegistrationsTab initialRegistrations={[]} agent={agent} />)

      expect(screen.getByText("No users found matching these filters.")).toBeInTheDocument()
      expect(screen.getByText("Total Registrations (0)")).toBeInTheDocument()
    })

    it("lists the registrations passed in and the total count", () => {
      render(
        <AgentRegistrationsTab
          initialRegistrations={[registration(), registration({ id: "r-2", full_name: "Second Person" })]}
          agent={agent}
        />,
      )

      expect(screen.getByText("Total Registrations (2)")).toBeInTheDocument()
      expect(screen.getByText("Baraka Juma")).toBeInTheDocument()
      expect(screen.getByText("Second Person")).toBeInTheDocument()
    })

    it("shows the email, or a fallback when the registration has none", () => {
      render(<AgentRegistrationsTab initialRegistrations={[registration({ email: null })]} agent={agent} />)

      expect(screen.getByText("No Email")).toBeInTheDocument()
    })

    it("formats GPS coordinates to 4 decimal places when present", () => {
      render(
        <AgentRegistrationsTab initialRegistrations={[registration({ gps_latitude: -6.81599, gps_longitude: 39.28841 })]} agent={agent} />,
      )

      expect(screen.getByText("-6.8160, 39.2884")).toBeInTheDocument()
    })

    it("shows 'Not captured' when GPS coordinates are missing", () => {
      render(<AgentRegistrationsTab initialRegistrations={[registration({ gps_latitude: null, gps_longitude: null })]} agent={agent} />)

      expect(screen.getByText("Not captured")).toBeInTheDocument()
    })

    it("falls back to the region, then 'Tanzania', when there is no district", () => {
      render(<AgentRegistrationsTab initialRegistrations={[registration({ district: null, region: "Dar es Salaam" })]} agent={agent} />)
      expect(screen.getByText("Kariakoo, Dar es Salaam")).toBeInTheDocument()

      render(
        <AgentRegistrationsTab
          initialRegistrations={[registration({ id: "r-3", area: null, district: null, region: null })]}
          agent={agent}
        />,
      )
      expect(screen.getByText("Tanzania")).toBeInTheDocument()
    })

    it.each([
      ["active", "active"],
      ["pending", "pending"],
      ["rejected", "rejected"],
    ])("shows the '%s' status badge", (status) => {
      render(<AgentRegistrationsTab initialRegistrations={[registration({ status })]} agent={agent} />)
      expect(screen.getByText(status)).toBeInTheDocument()
    })

    it.each(["vendor", "customer", "transporter"])("shows the '%s' category badge", (type) => {
      render(<AgentRegistrationsTab initialRegistrations={[registration({ registration_type: type })]} agent={agent} />)
      expect(screen.getByText(type)).toBeInTheDocument()
    })
  })

  describe("search and filters", () => {
    it("submits the search term, type filter, and status filter as query params", async () => {
      const fetchMock = mockFetch()
      render(<AgentRegistrationsTab initialRegistrations={[]} agent={agent} />)

      await userEvent.type(screen.getByPlaceholderText("Search by Name, Phone, or Email..."), "Baraka")
      await userEvent.selectOptions(screen.getByDisplayValue("All"), "vendor")
      await userEvent.click(screen.getByRole("button", { name: "Search" }))

      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
      const [url] = fetchMock.mock.calls[0]
      expect(String(url)).toContain("agents/registrations?")
      expect(String(url)).toContain("type=vendor")
      expect(String(url)).toContain("search=Baraka")
    })

    it("replaces the table with the rows returned by a search", async () => {
      mockFetch({ data: [registration({ id: "new-1", full_name: "Fetched Person" })] })
      render(<AgentRegistrationsTab initialRegistrations={[registration({ full_name: "Original Person" })]} agent={agent} />)

      await userEvent.click(screen.getByRole("button", { name: "Search" }))

      await waitFor(() => expect(screen.getByText("Fetched Person")).toBeInTheDocument())
      expect(screen.queryByText("Original Person")).not.toBeInTheDocument()
      expect(screen.getByText("Total Registrations (1)")).toBeInTheDocument()
    })

    it("refetches with the current filters when the refresh button is clicked", async () => {
      const fetchMock = mockFetch()
      render(<AgentRegistrationsTab initialRegistrations={[]} agent={agent} />)

      const refreshButton = screen.getAllByRole("button").find((b) => b.getAttribute("type") === "button")!
      await userEvent.click(refreshButton)

      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    })

    it("shows a loading indicator while a request is in flight", async () => {
      let resolveFetch!: (value: unknown) => void
      const fetchMock = jest.fn(() => new Promise((resolve) => (resolveFetch = resolve)))
      global.fetch = fetchMock as unknown as typeof fetch

      render(<AgentRegistrationsTab initialRegistrations={[]} agent={agent} />)
      await userEvent.click(screen.getByRole("button", { name: "Search" }))

      await waitFor(() => expect(fetchMock).toHaveBeenCalled())
      expect(screen.getByText("Loading list...")).toBeInTheDocument()

      resolveFetch({ ok: true, json: async () => ({ data: [] }) })
      await waitFor(() => expect(screen.queryByText("Loading list...")).not.toBeInTheDocument())
    })

    it("shows a destructive toast and keeps the existing rows when the request fails", async () => {
      mockFetch({ ok: false })
      render(<AgentRegistrationsTab initialRegistrations={[registration({ full_name: "Original Person" })]} agent={agent} />)

      await userEvent.click(screen.getByRole("button", { name: "Search" }))

      await waitFor(() =>
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: "Load Error", description: "Failed to fetch registrations list.", variant: "destructive" }),
        ),
      )
      expect(screen.getByText("Original Person")).toBeInTheDocument()
    })
  })
})

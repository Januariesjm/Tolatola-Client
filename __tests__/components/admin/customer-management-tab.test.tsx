/**
 * Tests for CustomerManagementTab (components/admin/customer-management-tab.tsx).
 *
 * Fetches its own data on mount (unlike its KYC-tab siblings, which are
 * prop-driven), then supports client-side search across name/email/phone, a
 * details dialog, permanent deletion (guarded by a native `confirm()`), and
 * opening the shared AdminMessageDialog. What's worth pinning: the loading ->
 * loaded transition, a failed fetch surfacing a destructive toast without
 * leaving the spinner up, the search filter, the derived stat cards (total,
 * with-phone, recent), delete removing the row and closing any open dialog,
 * a cancelled `confirm()` doing nothing, and a failed delete leaving the row
 * in place with a destructive toast.
 */

import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CustomerManagementTab } from "@/components/admin/customer-management-tab"
import { setErrorReporter, type LogRecord } from "@/lib/logger"

const mockGet = jest.fn()
const mockDelete = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiGet: (...args: unknown[]) => mockGet(...args),
  clientApiDelete: (...args: unknown[]) => mockDelete(...args),
}))

const mockToast = jest.fn()
jest.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mockToast }) }))

jest.mock("@/components/admin/message-dialog", () => ({
  AdminMessageDialog: ({ recipientName, isOpen }: { recipientName: string; isOpen: boolean }) =>
    isOpen ? <div data-testid="msg-dialog">{recipientName}</div> : null,
}))

function customer(overrides: Record<string, unknown> = {}) {
  return {
    id: "c-1",
    email: "asha@example.com",
    full_name: "Asha Mwinyi",
    phone: "255700000001",
    created_at: "2026-01-05T10:00:00Z",
    ...overrides,
  }
}

let reported: LogRecord[]

beforeEach(() => {
  jest.clearAllMocks()
  reported = []
  setErrorReporter((record) => reported.push(record))
  jest.spyOn(console, "error").mockImplementation(() => {})
  jest.spyOn(window, "confirm").mockReturnValue(true)
  mockGet.mockResolvedValue({ data: [customer()] })
  mockDelete.mockResolvedValue({})
})

afterEach(() => {
  setErrorReporter(null)
  jest.restoreAllMocks()
})

async function renderTab() {
  const view = render(<CustomerManagementTab />)
  await waitFor(() => expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument())
  return view
}

const cardFor = (name: string) => screen.getAllByText(name)[0].closest("div.group") as HTMLElement

describe("CustomerManagementTab", () => {
  describe("loading", () => {
    it("shows a spinner while the initial fetch is in flight", () => {
      mockGet.mockImplementation(() => new Promise(() => {}))
      render(<CustomerManagementTab />)

      expect(document.querySelector(".animate-spin")).toBeInTheDocument()
    })

    it("requests the admin customer list", async () => {
      await renderTab()

      expect(mockGet).toHaveBeenCalledWith("admin/customers")
    })

    it("shows a destructive toast and clears the spinner when the fetch fails", async () => {
      mockGet.mockRejectedValue(new Error("500"))

      render(<CustomerManagementTab />)

      await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: "destructive" })))
      expect(reported.map((r) => r.message)).toContain("error fetching customers")
      expect(document.querySelector(".animate-spin")).not.toBeInTheDocument()
      expect(screen.getByText("0 Total Customers")).toBeInTheDocument()
    })

    it("tolerates a response with no data array", async () => {
      mockGet.mockResolvedValue({})

      render(<CustomerManagementTab />)

      await waitFor(() => expect(screen.getByText("0 Total Customers")).toBeInTheDocument())
    })
  })

  describe("rendering the list", () => {
    it("shows the empty state when there are no customers", async () => {
      mockGet.mockResolvedValue({ data: [] })
      render(<CustomerManagementTab />)

      await waitFor(() => expect(screen.getByText("No customers found")).toBeInTheDocument())
      expect(screen.getByText("Registered customers will appear here")).toBeInTheDocument()
    })

    it("renders a customer's name, email, phone and join date", async () => {
      await renderTab()

      expect(screen.getAllByText("Asha Mwinyi").length).toBeGreaterThan(0)
      expect(screen.getAllByText("asha@example.com").length).toBeGreaterThan(0)
      expect(screen.getByText("255700000001")).toBeInTheDocument()
      expect(screen.getByText(/Joined/)).toBeInTheDocument()
    })

    it("falls back to 'Unnamed Customer' and 'N/A' phone", async () => {
      mockGet.mockResolvedValue({ data: [customer({ full_name: undefined, phone: undefined })] })
      render(<CustomerManagementTab />)

      await waitFor(() => expect(screen.getByText("Unnamed Customer")).toBeInTheDocument())
      expect(screen.getByText("N/A")).toBeInTheDocument()
    })

    it("computes the total, with-phone and recent-registration stat cards", async () => {
      const now = new Date().toISOString()
      mockGet.mockResolvedValue({
        data: [
          customer({ id: "c-1", phone: "255700000001", created_at: now }),
          customer({ id: "c-2", full_name: "Baraka John", phone: undefined, created_at: "2020-01-01T00:00:00Z" }),
        ],
      })
      render(<CustomerManagementTab />)
      await waitFor(() => expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument())

      expect(screen.getByText("2 Total Customers")).toBeInTheDocument()
      expect(screen.getByText("Total Customers")).toBeInTheDocument()
      expect(screen.getByText("With Phone").nextSibling).toHaveTextContent("1")
      expect(screen.getByText("Recent Registrations").nextSibling).toHaveTextContent("1")
    })

    it("numbers customer cards sequentially starting at 1", async () => {
      mockGet.mockResolvedValue({ data: [customer({ id: "c-1" }), customer({ id: "c-2", full_name: "Baraka John" })] })
      render(<CustomerManagementTab />)

      await waitFor(() => expect(screen.getByText("#1")).toBeInTheDocument())
      expect(screen.getByText("#2")).toBeInTheDocument()
    })
  })

  describe("search", () => {
    beforeEach(() => {
      mockGet.mockResolvedValue({
        data: [
          customer({ id: "c-1" }),
          customer({ id: "c-2", full_name: "Baraka John", email: "baraka@example.com", phone: "255711111111" }),
        ],
      })
    })

    it("narrows the list to matching customers by name", async () => {
      render(<CustomerManagementTab />)
      await waitFor(() => expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument())

      await userEvent.type(screen.getByPlaceholderText(/search customers/i), "baraka")

      await waitFor(() => expect(screen.queryByText("Asha Mwinyi")).not.toBeInTheDocument())
      expect(screen.getByText("Baraka John")).toBeInTheDocument()
    })

    it("matches by email and by phone too", async () => {
      render(<CustomerManagementTab />)
      await waitFor(() => expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument())
      const input = screen.getByPlaceholderText(/search customers/i)

      await userEvent.type(input, "711111111")
      await waitFor(() => expect(screen.queryByText("Asha Mwinyi")).not.toBeInTheDocument())
      await userEvent.clear(input)

      await userEvent.type(input, "baraka@example.com")
      await waitFor(() => expect(screen.queryByText("Asha Mwinyi")).not.toBeInTheDocument())
      expect(screen.getByText("Baraka John")).toBeInTheDocument()
    })

    it("keeps the total count showing every customer, not just the matches", async () => {
      render(<CustomerManagementTab />)
      await waitFor(() => expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument())

      await userEvent.type(screen.getByPlaceholderText(/search customers/i), "baraka")

      await waitFor(() => expect(screen.getByText("2 Total Customers")).toBeInTheDocument())
    })

    it("shows the search-specific empty state when nothing matches", async () => {
      render(<CustomerManagementTab />)
      await waitFor(() => expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument())

      await userEvent.type(screen.getByPlaceholderText(/search customers/i), "no-such-customer")

      await waitFor(() => expect(screen.getByText("No customers found matching your search")).toBeInTheDocument())
      expect(screen.getByText("Try adjusting your search terms")).toBeInTheDocument()
    })

    it("restores the full list when the query is cleared", async () => {
      render(<CustomerManagementTab />)
      await waitFor(() => expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument())
      const input = screen.getByPlaceholderText(/search customers/i)

      await userEvent.type(input, "baraka")
      await waitFor(() => expect(screen.queryByText("Asha Mwinyi")).not.toBeInTheDocument())
      await userEvent.clear(input)

      await waitFor(() => expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument())
    })
  })

  describe("details dialog", () => {
    it("opens showing the clicked customer's full information", async () => {
      await renderTab()

      await userEvent.click(within(cardFor("Asha Mwinyi")).getByRole("button", { name: /details/i }))

      const dialog = await screen.findByRole("dialog")
      expect(within(dialog).getByText("Full information for Asha Mwinyi")).toBeInTheDocument()
      expect(within(dialog).getByText("255700000001")).toBeInTheDocument()
    })

    it("closes via the Close button", async () => {
      await renderTab()
      await userEvent.click(within(cardFor("Asha Mwinyi")).getByRole("button", { name: /details/i }))
      const dialog = await screen.findByRole("dialog")

      // Two controls share the accessible name "Close": the footer button and
      // Radix's own dialog-close icon (sr-only "Close" span). The footer one
      // comes first in DOM order.
      await userEvent.click(within(dialog).getAllByRole("button", { name: /^close$/i })[0])

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    })

    it("opens the message dialog from within the details dialog and closes the details dialog", async () => {
      await renderTab()
      await userEvent.click(within(cardFor("Asha Mwinyi")).getByRole("button", { name: /details/i }))
      const dialog = await screen.findByRole("dialog")

      await userEvent.click(within(dialog).getByRole("button", { name: /send message/i }))

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
      expect(screen.getByTestId("msg-dialog")).toHaveTextContent("Asha Mwinyi")
    })
  })

  describe("messaging from the card", () => {
    it("opens the message dialog for the clicked customer", async () => {
      await renderTab()

      await userEvent.click(within(cardFor("Asha Mwinyi")).getByRole("button", { name: /message/i }))

      expect(screen.getByTestId("msg-dialog")).toHaveTextContent("Asha Mwinyi")
    })
  })

  describe("deleting", () => {
    it("asks for confirmation, then deletes and removes the row", async () => {
      await renderTab()

      await userEvent.click(within(cardFor("Asha Mwinyi")).getByRole("button", { name: /delete customer permanently/i }))

      expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining("Asha Mwinyi"))
      await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("admin/customers/c-1"))
      await waitFor(() => expect(screen.queryByText("Asha Mwinyi")).not.toBeInTheDocument())
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Customer Deleted" }))
    })

    it("does nothing when the confirmation is cancelled", async () => {
      jest.spyOn(window, "confirm").mockReturnValue(false)
      await renderTab()

      await userEvent.click(within(cardFor("Asha Mwinyi")).getByRole("button", { name: /delete customer permanently/i }))

      expect(mockDelete).not.toHaveBeenCalled()
      expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument()
    })

    it("shows a destructive toast and keeps the row when delete fails", async () => {
      mockDelete.mockRejectedValue(new Error("foreign key violation"))
      await renderTab()

      await userEvent.click(within(cardFor("Asha Mwinyi")).getByRole("button", { name: /delete customer permanently/i }))

      await waitFor(() => expect(reported.map((r) => r.message)).toContain("error deleting customer"))
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: "destructive" }))
      expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument()
    })

    it("deletes from within the details dialog and closes it", async () => {
      await renderTab()
      await userEvent.click(within(cardFor("Asha Mwinyi")).getByRole("button", { name: /details/i }))
      const dialog = await screen.findByRole("dialog")

      await userEvent.click(within(dialog).getByRole("button", { name: /^delete customer$/i }))

      await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("admin/customers/c-1"))
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
      expect(screen.queryByText("Asha Mwinyi")).not.toBeInTheDocument()
    })
  })
})

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SupportTicketsTab } from "@/components/admin/support-tickets-tab"

/**
 * Tests for components/admin/support-tickets-tab.tsx.
 *
 * The behaviour worth pinning here is the department scoping, because getting it
 * wrong leaks tickets across teams: a department-scoped admin must see only their
 * own queue, and a Super Admin must see everything. Two quirks are deliberate and
 * easy to "fix" into bugs -- a ticket with no department counts as "general", and
 * the "vendor" filter also matches "logistics".
 *
 * The permanent-delete confirmation is covered too, since it destroys tickets and
 * their chat history with no undo.
 */

const markRead = jest.fn()
const deleteAllResolvedTickets = jest.fn()
const deleteTicketPermanently = jest.fn()
const getOrCreateConversation = jest.fn()
const toast = jest.fn()
const refresh = jest.fn()

jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh, push: jest.fn() }) }))
jest.mock("@/hooks/use-toast", () => ({ toast: (...args: unknown[]) => toast(...args) }))
jest.mock("@/hooks/use-ticket-message-counts", () => ({
  useTicketMessageCounts: () => ({ counts: {}, unread: {}, markRead }),
}))
jest.mock("@/components/messaging/chat-dialog", () => ({
  ChatDialog: ({ open }: { open: boolean }) => (open ? <div data-testid="chat-dialog">Chat</div> : null),
}))
jest.mock("@/app/actions/messaging", () => ({
  getOrCreateConversation: (...args: unknown[]) => getOrCreateConversation(...args),
}))
jest.mock("@/app/actions/support", () => ({
  deleteAllResolvedTickets: () => deleteAllResolvedTickets(),
  deleteTicketPermanently: (id: string) => deleteTicketPermanently(id),
}))

interface TicketOverrides {
  id?: string
  subject?: string
  description?: string
  status?: string
  priority?: string
  department?: string
  conversation_id?: string | null
  users?: { full_name?: string; email?: string } | null
  guest_name?: string
}

function ticket(overrides: TicketOverrides = {}) {
  return {
    id: "t-1",
    subject: "Order never arrived",
    description: "My parcel is late",
    status: "open",
    priority: "medium",
    created_at: "2026-02-01T10:00:00.000Z",
    conversation_id: "conv-1",
    users: { full_name: "Amina Juma", email: "amina@example.com" },
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  deleteAllResolvedTickets.mockResolvedValue({ count: 2 })
  deleteTicketPermanently.mockResolvedValue({ success: true })
  getOrCreateConversation.mockResolvedValue({ conversation: { id: "conv-new" } })
})

describe("SupportTicketsTab rendering", () => {
  it("lists the tickets it is given", () => {
    render(<SupportTicketsTab tickets={[ticket(), ticket({ id: "t-2", subject: "Refund request" })]} />)

    expect(screen.getByText("Order never arrived")).toBeInTheDocument()
    expect(screen.getByText("Refund request")).toBeInTheDocument()
  })

  it("shows an empty state when there are no tickets", () => {
    render(<SupportTicketsTab tickets={[]} />)

    expect(screen.getByText("No support tickets found")).toBeInTheDocument()
  })

  it("labels the dashboard with the admin's role by default", () => {
    render(<SupportTicketsTab tickets={[]} roleName="IT Support" />)

    expect(screen.getByRole("heading", { name: /IT Support Support Dashboard/i })).toBeInTheDocument()
  })

  it("labels the dashboard as organization-wide for a Super Admin", () => {
    render(<SupportTicketsTab tickets={[]} isSuperAdmin />)

    expect(screen.getByRole("heading", { name: /Organization Support Dashboard/i })).toBeInTheDocument()
  })

  it("reports the scoped ticket total", () => {
    render(<SupportTicketsTab tickets={[ticket(), ticket({ id: "t-2" }), ticket({ id: "t-3" })]} isSuperAdmin />)

    expect(screen.getByText("Total Tickets:").parentElement).toHaveTextContent("3")
  })

  it("shows the requester's name", () => {
    render(<SupportTicketsTab tickets={[ticket()]} />)

    expect(screen.getByText(/Amina Juma/)).toBeInTheDocument()
  })

  it("falls back to the guest name for a ticket opened without an account", () => {
    render(<SupportTicketsTab tickets={[ticket({ users: null, guest_name: "Walk-in Guest" })]} />)

    expect(screen.getByText(/Walk-in Guest/)).toBeInTheDocument()
  })
})

describe("SupportTicketsTab department scoping", () => {
  const spread = [
    ticket({ id: "g", subject: "General question", department: "general" }),
    ticket({ id: "i", subject: "Login broken", department: "it" }),
    ticket({ id: "f", subject: "Payout missing", department: "finance" }),
    ticket({ id: "l", subject: "Driver late", department: "logistics" }),
  ]

  it("shows a department-scoped admin only their own queue", () => {
    render(<SupportTicketsTab tickets={spread} department="it" />)

    expect(screen.getByText("Login broken")).toBeInTheDocument()
    expect(screen.queryByText("Payout missing")).not.toBeInTheDocument()
    expect(screen.queryByText("General question")).not.toBeInTheDocument()
  })

  it("honours an admin scoped to several departments", () => {
    render(<SupportTicketsTab tickets={spread} department="it,finance" />)

    expect(screen.getByText("Login broken")).toBeInTheDocument()
    expect(screen.getByText("Payout missing")).toBeInTheDocument()
    expect(screen.queryByText("Driver late")).not.toBeInTheDocument()
  })

  it("tolerates whitespace in a multi-department scope", () => {
    render(<SupportTicketsTab tickets={spread} department="it , finance" />)

    expect(screen.getByText("Login broken")).toBeInTheDocument()
    expect(screen.getByText("Payout missing")).toBeInTheDocument()
  })

  it("treats a ticket with no department as general", () => {
    render(<SupportTicketsTab tickets={[ticket({ subject: "Unrouted", department: undefined })]} department="general" />)

    expect(screen.getByText("Unrouted")).toBeInTheDocument()
  })

  it("hides an undepartmented ticket from a non-general queue", () => {
    render(<SupportTicketsTab tickets={[ticket({ subject: "Unrouted", department: undefined })]} department="finance" />)

    expect(screen.queryByText("Unrouted")).not.toBeInTheDocument()
  })

  it("shows a Super Admin every department", () => {
    render(<SupportTicketsTab tickets={spread} isSuperAdmin />)

    for (const subject of ["General question", "Login broken", "Payout missing", "Driver late"]) {
      expect(screen.getByText(subject)).toBeInTheDocument()
    }
  })

  it("shows all tickets when neither scope nor Super Admin is set", () => {
    render(<SupportTicketsTab tickets={spread} />)

    expect(screen.getByText("Payout missing")).toBeInTheDocument()
    expect(screen.getByText("Driver late")).toBeInTheDocument()
  })
})

describe("SupportTicketsTab search", () => {
  const tickets = [
    ticket({ id: "a", subject: "Order never arrived", description: "late parcel", users: { full_name: "Amina Juma" } }),
    ticket({ id: "b", subject: "Refund request", description: "want my money back", users: { full_name: "Baraka Moshi" } }),
  ]

  it("filters by subject", async () => {
    render(<SupportTicketsTab tickets={tickets} />)
    await userEvent.type(screen.getByPlaceholderText(/Search tickets/i), "refund")

    expect(screen.getByText("Refund request")).toBeInTheDocument()
    expect(screen.queryByText("Order never arrived")).not.toBeInTheDocument()
  })

  it("filters by requester name", async () => {
    render(<SupportTicketsTab tickets={tickets} />)
    await userEvent.type(screen.getByPlaceholderText(/Search tickets/i), "baraka")

    expect(screen.getByText("Refund request")).toBeInTheDocument()
    expect(screen.queryByText("Order never arrived")).not.toBeInTheDocument()
  })

  it("filters by description text", async () => {
    render(<SupportTicketsTab tickets={tickets} />)
    await userEvent.type(screen.getByPlaceholderText(/Search tickets/i), "parcel")

    expect(screen.getByText("Order never arrived")).toBeInTheDocument()
    expect(screen.queryByText("Refund request")).not.toBeInTheDocument()
  })

  it("is case-insensitive", async () => {
    render(<SupportTicketsTab tickets={tickets} />)
    await userEvent.type(screen.getByPlaceholderText(/Search tickets/i), "AMINA")

    expect(screen.getByText("Order never arrived")).toBeInTheDocument()
  })

  it("shows the empty state when nothing matches", async () => {
    render(<SupportTicketsTab tickets={tickets} />)
    await userEvent.type(screen.getByPlaceholderText(/Search tickets/i), "zzzznomatch")

    expect(screen.getByText("No support tickets found")).toBeInTheDocument()
  })
})

describe("SupportTicketsTab bulk delete", () => {
  const withResolved = [ticket({ id: "r1", status: "resolved" }), ticket({ id: "r2", status: "completed" }), ticket({ id: "o1" })]

  it("offers the bulk delete only when something is resolved", () => {
    render(<SupportTicketsTab tickets={[ticket({ status: "open" })]} />)

    expect(screen.queryByRole("button", { name: /Delete All Resolved/i })).not.toBeInTheDocument()
  })

  it("counts resolved, completed and closed tickets together", () => {
    render(<SupportTicketsTab tickets={[...withResolved, ticket({ id: "c1", status: "closed" })]} />)

    expect(screen.getByRole("button", { name: /Delete All Resolved \(3\)/i })).toBeInTheDocument()
  })

  it("asks for confirmation and warns the action cannot be undone", async () => {
    render(<SupportTicketsTab tickets={withResolved} />)
    await userEvent.click(screen.getByRole("button", { name: /Delete All Resolved/i }))

    expect(screen.getByText(/This action cannot be undone/i)).toBeInTheDocument()
  })

  it("deletes nothing until the confirmation is accepted", async () => {
    render(<SupportTicketsTab tickets={withResolved} />)
    await userEvent.click(screen.getByRole("button", { name: /Delete All Resolved/i }))

    expect(deleteAllResolvedTickets).not.toHaveBeenCalled()
  })

  it("deletes and refreshes once confirmed", async () => {
    render(<SupportTicketsTab tickets={withResolved} />)
    await userEvent.click(screen.getByRole("button", { name: /Delete All Resolved/i }))
    await userEvent.click(screen.getByRole("button", { name: /Yes, Delete Permanently/i }))

    await waitFor(() => expect(deleteAllResolvedTickets).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(refresh).toHaveBeenCalled())
  })

  it("reports how many were removed", async () => {
    render(<SupportTicketsTab tickets={withResolved} />)
    await userEvent.click(screen.getByRole("button", { name: /Delete All Resolved/i }))
    await userEvent.click(screen.getByRole("button", { name: /Yes, Delete Permanently/i }))

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Resolved Tickets Deleted", description: expect.stringContaining("2") }),
      ),
    )
  })

  it("surfaces a failure and does not refresh", async () => {
    deleteAllResolvedTickets.mockResolvedValue({ error: "permission denied" })
    render(<SupportTicketsTab tickets={withResolved} />)
    await userEvent.click(screen.getByRole("button", { name: /Delete All Resolved/i }))
    await userEvent.click(screen.getByRole("button", { name: /Yes, Delete Permanently/i }))

    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Delete Failed", variant: "destructive" })))
    expect(refresh).not.toHaveBeenCalled()
  })

  it("surfaces a thrown error", async () => {
    deleteAllResolvedTickets.mockRejectedValue(new Error("network down"))
    render(<SupportTicketsTab tickets={withResolved} />)
    await userEvent.click(screen.getByRole("button", { name: /Delete All Resolved/i }))
    await userEvent.click(screen.getByRole("button", { name: /Yes, Delete Permanently/i }))

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Error", description: "network down", variant: "destructive" })),
    )
  })
})

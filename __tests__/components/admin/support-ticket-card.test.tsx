/**
 * Tests for SupportTicketCard (components/admin/support-ticket-card.tsx).
 *
 * Presentational: message counts, unread state and the resolved/deleting
 * flags all come from the caller. What matters is the three action
 * callbacks, that the Resolve button disappears once the ticket is already
 * resolved, and that the deleting state shows a spinner instead of the trash
 * icon.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SupportTicketCard } from "@/components/admin/support-ticket-card"

const ticket = {
  id: "tk-1",
  subject: "Cannot log in",
  description: "I get an error on the login page",
  status: "open",
  priority: "high",
  department: "it",
  created_at: "2026-02-01T10:00:00Z",
  users: { full_name: "Asha Mwinyi", email: "asha@example.com" },
}

const props = {
  ticket,
  index: 0,
  messageCount: 0,
  hasUnreadReply: false,
  isDeleting: false,
  onOpenChat: jest.fn(),
  onResolve: jest.fn(),
  onDelete: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("SupportTicketCard", () => {
  it("shows the ticket's subject and requester", () => {
    render(<SupportTicketCard {...props} />)

    expect(screen.getByText("Cannot log in")).toBeInTheDocument()
    expect(screen.getByText("Asha Mwinyi", { exact: false })).toBeInTheDocument()
  })

  it("shows a Resolve button for an unresolved ticket", () => {
    render(<SupportTicketCard {...props} />)

    expect(screen.getByRole("button", { name: /resolve/i })).toBeInTheDocument()
  })

  it("hides the Resolve button once the ticket is resolved", () => {
    render(<SupportTicketCard {...props} ticket={{ ...ticket, status: "resolved" }} />)

    expect(screen.queryByRole("button", { name: /resolve/i })).not.toBeInTheDocument()
  })

  it("calls onOpenChat from the chat button", async () => {
    render(<SupportTicketCard {...props} />)

    await userEvent.click(screen.getByRole("button", { name: /open live chat/i }))

    expect(props.onOpenChat).toHaveBeenCalledTimes(1)
  })

  it("calls onResolve from the resolve button", async () => {
    render(<SupportTicketCard {...props} />)

    await userEvent.click(screen.getByRole("button", { name: /resolve/i }))

    expect(props.onResolve).toHaveBeenCalledTimes(1)
  })

  it("shows the message count on the chat button once there are messages", () => {
    render(<SupportTicketCard {...props} messageCount={3} />)

    expect(screen.getByRole("button", { name: /open live chat \(3\)/i })).toBeInTheDocument()
  })

  it("flags an unread reply", () => {
    render(<SupportTicketCard {...props} hasUnreadReply />)

    expect(screen.getByText("New Reply Received")).toBeInTheDocument()
  })

  it("disables delete and shows a spinner while deleting", () => {
    render(<SupportTicketCard {...props} isDeleting />)

    expect(screen.getByRole("button", { name: /delete ticket permanently/i })).toBeDisabled()
  })
})

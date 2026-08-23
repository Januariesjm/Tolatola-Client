import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SupportChatHeader } from "@/components/support/support-chat-header"
import type { SupportTicket } from "@/lib/support/chat-message"

/**
 * Tests for components/support/support-chat-header.tsx.
 *
 * Covers the always-present agent identity and controls, plus the live-support
 * banner, which only renders when both `liveConversationId` and `activeTicket`
 * are present -- either alone should keep it hidden.
 */

function ticket(overrides: Partial<SupportTicket> = {}): SupportTicket {
  return {
    id: "ticket-12345678-abcd",
    ...overrides,
  }
}

describe("SupportChatHeader identity", () => {
  it("greets with the agent's display name", () => {
    render(<SupportChatHeader onClose={jest.fn()} liveConversationId={null} activeTicket={null} />)

    expect(screen.getByText("Hello, I'm Moureen Tyler")).toBeInTheDocument()
  })

  it("shows the agent's role subtitle", () => {
    render(<SupportChatHeader onClose={jest.fn()} liveConversationId={null} activeTicket={null} />)

    expect(screen.getByText("TOLA Digital Agent")).toBeInTheDocument()
  })

  it("renders the agent avatar", () => {
    render(<SupportChatHeader onClose={jest.fn()} liveConversationId={null} activeTicket={null} />)

    expect(screen.getByAltText("Moureen Tyler Avatar")).toBeInTheDocument()
  })
})

describe("SupportChatHeader controls", () => {
  it("calls onClose when Minimize is clicked", async () => {
    const onClose = jest.fn()
    render(<SupportChatHeader onClose={onClose} liveConversationId={null} activeTicket={null} />)

    await userEvent.click(screen.getByRole("button", { name: /minimize chat window/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it("calls onClose when the close control is clicked", async () => {
    const onClose = jest.fn()
    render(<SupportChatHeader onClose={onClose} liveConversationId={null} activeTicket={null} />)

    await userEvent.click(screen.getByRole("button", { name: /close support chat pane/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})

describe("SupportChatHeader live support banner", () => {
  it("hides the banner when there is no live conversation and no active ticket", () => {
    render(<SupportChatHeader onClose={jest.fn()} liveConversationId={null} activeTicket={null} />)

    expect(screen.queryByText("Connected to Live Support")).not.toBeInTheDocument()
  })

  it("hides the banner when there is a live conversation id but no active ticket", () => {
    render(<SupportChatHeader onClose={jest.fn()} liveConversationId="conv-1" activeTicket={null} />)

    expect(screen.queryByText("Connected to Live Support")).not.toBeInTheDocument()
  })

  it("hides the banner when there is an active ticket but no live conversation id", () => {
    render(<SupportChatHeader onClose={jest.fn()} liveConversationId={null} activeTicket={ticket()} />)

    expect(screen.queryByText("Connected to Live Support")).not.toBeInTheDocument()
  })

  it("shows the banner once both a live conversation id and an active ticket are present", () => {
    render(<SupportChatHeader onClose={jest.fn()} liveConversationId="conv-1" activeTicket={ticket()} />)

    expect(screen.getByText("Connected to Live Support")).toBeInTheDocument()
  })

  it("shows the ticket id truncated to its first 8 characters", () => {
    render(<SupportChatHeader onClose={jest.fn()} liveConversationId="conv-1" activeTicket={ticket({ id: "abcdefgh-1234-5678" })} />)

    expect(screen.getByText("Ticket #abcdefgh · Messages sync in real-time")).toBeInTheDocument()
  })
})

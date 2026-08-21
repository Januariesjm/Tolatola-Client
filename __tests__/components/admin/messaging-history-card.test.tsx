/**
 * Tests for MessagingHistoryCard (components/admin/messaging-history-card.tsx).
 *
 * Presentational: the logs are already filtered by the caller. What matters
 * here is the loading/empty states, that a channel badge shows only for the
 * channel that was actually used, and the search and refresh callbacks.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MessagingHistoryCard } from "@/components/admin/messaging-history-card"
import type { ActivityLog } from "@/lib/admin/messaging"

const activityLog = (over: Partial<ActivityLog["details"]> = {}): ActivityLog =>
  ({
    id: "l-1",
    admin_id: "a-1",
    action: "send_message",
    resource: "user",
    details: {
      recipient_user_id: "u-1",
      recipient_email: "asha@example.com",
      recipient_name: "Asha Mwinyi",
      subject: "Welcome",
      channels: { sendEmail: true, sendInApp: false },
      ...over,
    },
    created_at: "2026-02-01T10:00:00Z",
    admin: { full_name: "Admin One", email: "admin@example.com" },
  }) as ActivityLog

const props = {
  logs: [] as ActivityLog[],
  loading: false,
  searchQuery: "",
  onSearchQueryChange: jest.fn(),
  onRefresh: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("MessagingHistoryCard", () => {
  it("shows a loading state", () => {
    render(<MessagingHistoryCard {...props} loading />)

    expect(screen.getByText("Loading delivery history...")).toBeInTheDocument()
  })

  it("shows an empty state with no logs", () => {
    render(<MessagingHistoryCard {...props} />)

    expect(screen.getByText("No messaging activity logs found.")).toBeInTheDocument()
  })

  it("lists a log entry with its recipient and subject", () => {
    render(<MessagingHistoryCard {...props} logs={[activityLog()]} />)

    expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument()
    expect(screen.getByText("Subject: Welcome")).toBeInTheDocument()
  })

  it("shows a badge only for the channel actually used", () => {
    render(<MessagingHistoryCard {...props} logs={[activityLog({ channels: { sendEmail: true, sendInApp: false } })]} />)

    expect(screen.getByText("Email")).toBeInTheDocument()
    expect(screen.queryByText("In-App")).not.toBeInTheDocument()
  })

  it("shows both badges when both channels were used", () => {
    render(<MessagingHistoryCard {...props} logs={[activityLog({ channels: { sendEmail: true, sendInApp: true } })]} />)

    expect(screen.getByText("Email")).toBeInTheDocument()
    expect(screen.getByText("In-App")).toBeInTheDocument()
  })

  it("reports a search keystroke", async () => {
    render(<MessagingHistoryCard {...props} />)

    await userEvent.type(screen.getByPlaceholderText("Search history logs..."), "w")

    expect(props.onSearchQueryChange).toHaveBeenCalledWith("w")
  })

  it("calls onRefresh from the refresh button", async () => {
    render(<MessagingHistoryCard {...props} />)

    await userEvent.click(screen.getByRole("button"))

    expect(props.onRefresh).toHaveBeenCalledTimes(1)
  })
})

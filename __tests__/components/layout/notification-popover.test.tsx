import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { NotificationPopover } from "@/components/layout/notification-popover"

/**
 * Tests for components/layout/notification-popover.tsx.
 *
 * This is the bell in the header, so the unread count is the part users act on.
 * It is the sum of two independent sources -- global notifications and per
 * conversation unread counts -- and each of the three fetches behind it is
 * individually caught, so one failing service must not blank the whole tray.
 *
 * The signed-out case matters too: with no session it must fetch nothing and
 * show nothing rather than rendering a stale count.
 */

const fetchNotifications = jest.fn()
const fetchUnreadCount = jest.fn()
const markNotificationRead = jest.fn()
const markAllNotificationsRead = jest.fn()
const getUserConversations = jest.fn()
const getSession = jest.fn()
const removeChannel = jest.fn()

jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}))
jest.mock("@/lib/services/notifications.service", () => ({
  fetchNotifications: (...a: unknown[]) => fetchNotifications(...a),
  fetchUnreadCount: (...a: unknown[]) => fetchUnreadCount(...a),
  markNotificationRead: (...a: unknown[]) => markNotificationRead(...a),
  markAllNotificationsRead: (...a: unknown[]) => markAllNotificationsRead(...a),
}))
jest.mock("@/app/actions/messaging", () => ({ getUserConversations: (...a: unknown[]) => getUserConversations(...a) }))
/**
 * One client instance for every call, matching production.
 *
 * `createClientComponentClient` is a singleton by default, and this component
 * depends on that: it calls createClient() in its render body and passes the
 * result to a useCallback dependency array. A mock handing back a fresh object
 * per call makes that callback unstable, so the subscribe-and-fetch effect
 * re-runs on every render and immediately overwrites local state -- which looked
 * exactly like a "Mark all as read does not stick" bug until the mock was
 * corrected.
 */
jest.mock("@/lib/supabase/client", () => {
  // Built on first use, not in the factory body: jest hoists this above the
  // `const` declarations above, so referencing them eagerly would throw.
  let client: Record<string, unknown> | undefined
  return {
    createClient: () => {
      client ??= {
        auth: {
          getSession: () => getSession(),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: jest.fn() } } }),
        },
        channel: () => {
          const channel: Record<string, unknown> = {}
          channel.on = () => channel
          channel.subscribe = () => channel
          return channel
        },
        removeChannel,
      }
      return client
    },
  }
})

function notification(overrides: Record<string, unknown> = {}) {
  return {
    id: "n-1",
    title: "Order shipped",
    message: "Your parcel is on the way",
    type: "order_status_update",
    is_read: false,
    created_at: "2026-02-01T10:00:00.000Z",
    ...overrides,
  }
}

function conversation(overrides: Record<string, unknown> = {}) {
  return {
    id: "c-1",
    unread_count: 0,
    last_message: "Hello there",
    updated_at: "2026-02-01T10:00:00.000Z",
    other_participant: { full_name: "Tola Shop" },
    ...overrides,
  }
}

const SIGNED_IN = { data: { session: { user: { id: "u1" }, access_token: "t" } } }
const SIGNED_OUT = { data: { session: null } }

/**
 * The bell itself, addressed by its Radix slot rather than by role: once the tray
 * is open there are several buttons on screen.
 */
const bell = () => document.querySelector('[data-slot="popover-trigger"]') as HTMLElement

/**
 * Opens the tray by hovering, which is how it opens on desktop.
 *
 * Clicking does not work here: the trigger carries its own onClick *and* Radix's
 * composed one, so a click that follows the synthetic pointer-over (which has
 * already opened it via onMouseEnter) toggles it straight back shut.
 */
const openTray = () => userEvent.hover(bell())

beforeEach(() => {
  jest.clearAllMocks()
  getSession.mockResolvedValue(SIGNED_IN)
  fetchNotifications.mockResolvedValue([])
  fetchUnreadCount.mockResolvedValue(0)
  getUserConversations.mockResolvedValue({ conversations: [] })
})

describe("NotificationPopover signed out", () => {
  beforeEach(() => {
    getSession.mockResolvedValue(SIGNED_OUT)
  })

  it("fetches nothing without a session", async () => {
    render(<NotificationPopover />)

    await waitFor(() => expect(getSession).toHaveBeenCalled())
    expect(fetchNotifications).not.toHaveBeenCalled()
    expect(getUserConversations).not.toHaveBeenCalled()
  })

  it("shows no unread badge", async () => {
    render(<NotificationPopover />)

    await waitFor(() => expect(getSession).toHaveBeenCalled())
    expect(bell().textContent).toBe("")
  })
})

describe("NotificationPopover unread count", () => {
  it("shows no badge when there is nothing unread", async () => {
    render(<NotificationPopover />)

    await waitFor(() => expect(fetchUnreadCount).toHaveBeenCalled())
    expect(bell().textContent).toBe("")
  })

  it("shows the global notification count", async () => {
    fetchUnreadCount.mockResolvedValue(3)
    render(<NotificationPopover />)

    await waitFor(() => expect(bell()).toHaveTextContent("3"))
  })

  it("adds unread conversation messages to the count", async () => {
    fetchUnreadCount.mockResolvedValue(2)
    getUserConversations.mockResolvedValue({
      conversations: [conversation({ unread_count: 3 }), conversation({ id: "c-2", unread_count: 1 })],
    })
    render(<NotificationPopover />)

    await waitFor(() => expect(bell()).toHaveTextContent("6"))
  })

  it("counts conversations alone when there are no notifications", async () => {
    getUserConversations.mockResolvedValue({ conversations: [conversation({ unread_count: 4 })] })
    render(<NotificationPopover />)

    await waitFor(() => expect(bell()).toHaveTextContent("4"))
  })

  it("treats a conversation with no unread_count as zero", async () => {
    fetchUnreadCount.mockResolvedValue(1)
    getUserConversations.mockResolvedValue({ conversations: [conversation({ unread_count: undefined })] })
    render(<NotificationPopover />)

    await waitFor(() => expect(bell()).toHaveTextContent("1"))
  })

  it("caps the badge at 9+", async () => {
    fetchUnreadCount.mockResolvedValue(42)
    render(<NotificationPopover />)

    await waitFor(() => expect(bell()).toHaveTextContent("9+"))
  })

  it("shows an exact count at the cap boundary", async () => {
    fetchUnreadCount.mockResolvedValue(9)
    render(<NotificationPopover />)

    await waitFor(() => expect(bell()).toHaveTextContent("9"))
  })
})

describe("NotificationPopover resilience", () => {
  it("still shows conversations when the notifications service fails", async () => {
    fetchNotifications.mockRejectedValue(new Error("service down"))
    getUserConversations.mockResolvedValue({ conversations: [conversation({ unread_count: 2 })] })
    render(<NotificationPopover />)

    await waitFor(() => expect(bell()).toHaveTextContent("2"))
  })

  it("still shows notifications when the conversations action fails", async () => {
    getUserConversations.mockRejectedValue(new Error("service down"))
    fetchUnreadCount.mockResolvedValue(5)
    render(<NotificationPopover />)

    await waitFor(() => expect(bell()).toHaveTextContent("5"))
  })

  it("renders without a badge when the unread count fails", async () => {
    fetchUnreadCount.mockRejectedValue(new Error("service down"))
    render(<NotificationPopover />)

    await waitFor(() => expect(fetchUnreadCount).toHaveBeenCalled())
    expect(bell().textContent).toBe("")
  })

  it("does not crash when every source fails", async () => {
    fetchNotifications.mockRejectedValue(new Error("down"))
    fetchUnreadCount.mockRejectedValue(new Error("down"))
    getUserConversations.mockRejectedValue(new Error("down"))

    expect(() => render(<NotificationPopover />)).not.toThrow()
    await waitFor(() => expect(getSession).toHaveBeenCalled())
  })
})

describe("NotificationPopover tray", () => {
  it("shows an empty state when there is no activity", async () => {
    render(<NotificationPopover />)
    await waitFor(() => expect(fetchNotifications).toHaveBeenCalled())
    await openTray()

    expect(await screen.findByText("No activity yet")).toBeInTheDocument()
  })

  it("lists the notifications", async () => {
    fetchNotifications.mockResolvedValue([notification({ title: "Payment confirmed" })])
    render(<NotificationPopover />)
    await waitFor(() => expect(fetchNotifications).toHaveBeenCalled())
    await openTray()

    expect(await screen.findByText("Payment confirmed")).toBeInTheDocument()
  })

  it("offers Mark all as read only when something is unread", async () => {
    fetchUnreadCount.mockResolvedValue(2)
    fetchNotifications.mockResolvedValue([notification()])
    render(<NotificationPopover />)
    await waitFor(() => expect(bell()).toHaveTextContent("2"))
    await openTray()

    expect(await screen.findByRole("button", { name: /Mark all as read/i })).toBeInTheDocument()
  })

  it("hides Mark all as read when nothing is unread", async () => {
    fetchNotifications.mockResolvedValue([notification({ is_read: true })])
    render(<NotificationPopover />)
    await waitFor(() => expect(fetchNotifications).toHaveBeenCalled())
    await openTray()

    await waitFor(() => expect(screen.getByText("Notifications")).toBeInTheDocument())
    expect(screen.queryByRole("button", { name: /Mark all as read/i })).not.toBeInTheDocument()
  })

  it("marks everything read and clears the notification part of the count", async () => {
    fetchUnreadCount.mockResolvedValue(3)
    fetchNotifications.mockResolvedValue([notification()])
    getUserConversations.mockResolvedValue({ conversations: [conversation({ unread_count: 1 })] })
    render(<NotificationPopover />)
    await waitFor(() => expect(bell()).toHaveTextContent("4"))
    await openTray()
    await userEvent.click(await screen.findByRole("button", { name: /Mark all as read/i }))

    await waitFor(() => expect(markAllNotificationsRead).toHaveBeenCalled())
    // The unread conversation still counts; only the notifications cleared.
    await waitFor(() => expect(bell()).toHaveTextContent("1"))
  })

  it("keeps the count when marking all read fails", async () => {
    markAllNotificationsRead.mockRejectedValue(new Error("service down"))
    fetchUnreadCount.mockResolvedValue(3)
    fetchNotifications.mockResolvedValue([notification()])
    render(<NotificationPopover />)
    await waitFor(() => expect(bell()).toHaveTextContent("3"))
    await openTray()
    await userEvent.click(await screen.findByRole("button", { name: /Mark all as read/i }))

    await waitFor(() => expect(markAllNotificationsRead).toHaveBeenCalled())
    expect(bell()).toHaveTextContent("3")
  })

  it("offers the three filter tabs", async () => {
    fetchNotifications.mockResolvedValue([notification()])
    render(<NotificationPopover />)
    await waitFor(() => expect(fetchNotifications).toHaveBeenCalled())
    await openTray()

    for (const tab of ["all", "notifications", "messages"]) {
      expect(await screen.findByRole("button", { name: tab })).toBeInTheDocument()
    }
  })

  it("hides notifications when the messages tab is selected", async () => {
    fetchNotifications.mockResolvedValue([notification({ title: "Payment confirmed" })])
    render(<NotificationPopover />)
    await waitFor(() => expect(fetchNotifications).toHaveBeenCalled())
    await openTray()
    await userEvent.click(await screen.findByRole("button", { name: "messages" }))

    expect(screen.queryByText("Payment confirmed")).not.toBeInTheDocument()
  })

  it("shows notifications again on the notifications tab", async () => {
    fetchNotifications.mockResolvedValue([notification({ title: "Payment confirmed" })])
    render(<NotificationPopover />)
    await waitFor(() => expect(fetchNotifications).toHaveBeenCalled())
    await openTray()
    await userEvent.click(await screen.findByRole("button", { name: "messages" }))
    await userEvent.click(screen.getByRole("button", { name: "notifications" }))

    expect(await screen.findByText("Payment confirmed")).toBeInTheDocument()
  })
})

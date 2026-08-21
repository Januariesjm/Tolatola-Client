/**
 * Tests for the notifications service (lib/services/notifications.service.ts).
 *
 * Every function here tolerates more than one response shape, because the
 * backend returns a bare array from some deployments and a `{ data }` envelope
 * from others. That tolerance is the whole point of the module, so it is what
 * these tests pin.
 */

const mockGet = jest.fn()
const mockPost = jest.fn()

jest.mock("@/lib/api-client", () => ({
  clientApiGet: (...args: unknown[]) => mockGet(...args),
  clientApiPost: (...args: unknown[]) => mockPost(...args),
}))

import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
} from "@/lib/services/notifications.service"

const notification = (over: Partial<AppNotification> = {}): AppNotification => ({
  id: "n-1",
  user_id: "u-1",
  type: "order_placed",
  title: "Order placed",
  message: "Your order is in.",
  is_read: false,
  created_at: "2026-02-01T10:00:00Z",
  ...over,
})

beforeEach(() => {
  jest.clearAllMocks()
  mockPost.mockResolvedValue({})
})

describe("fetchNotifications", () => {
  it("requests the bare path with no options", async () => {
    mockGet.mockResolvedValue([])

    await fetchNotifications()

    expect(mockGet).toHaveBeenCalledWith("notifications")
  })

  it("adds unread_only when asked", async () => {
    mockGet.mockResolvedValue([])

    await fetchNotifications({ unreadOnly: true })

    expect(mockGet).toHaveBeenCalledWith("notifications?unread_only=true")
  })

  it("adds a limit", async () => {
    mockGet.mockResolvedValue([])

    await fetchNotifications({ limit: 5 })

    expect(mockGet).toHaveBeenCalledWith("notifications?limit=5")
  })

  it("combines both options", async () => {
    mockGet.mockResolvedValue([])

    await fetchNotifications({ unreadOnly: true, limit: 10 })

    expect(mockGet).toHaveBeenCalledWith("notifications?unread_only=true&limit=10")
  })

  it("omits unreadOnly when false rather than sending unread_only=false", async () => {
    mockGet.mockResolvedValue([])

    await fetchNotifications({ unreadOnly: false })

    expect(mockGet).toHaveBeenCalledWith("notifications")
  })

  it("omits a zero limit, which would mean 'no results'", async () => {
    mockGet.mockResolvedValue([])

    await fetchNotifications({ limit: 0 })

    expect(mockGet).toHaveBeenCalledWith("notifications")
  })

  it("unwraps a { data } envelope", async () => {
    mockGet.mockResolvedValue({ data: [notification()] })

    await expect(fetchNotifications()).resolves.toHaveLength(1)
  })

  it("accepts a bare array", async () => {
    mockGet.mockResolvedValue([notification(), notification({ id: "n-2" })])

    await expect(fetchNotifications()).resolves.toHaveLength(2)
  })

  it.each([[null], [undefined], [{}]])("returns an empty array for the payload %p", async (payload) => {
    mockGet.mockResolvedValue(payload)

    await expect(fetchNotifications()).resolves.toEqual([])
  })

  it("prefers the envelope when both a data key and array-likeness exist", async () => {
    mockGet.mockResolvedValue({ data: [notification({ id: "from-envelope" })] })

    const result = await fetchNotifications()

    expect(result[0].id).toBe("from-envelope")
  })
})

describe("fetchUnreadCount", () => {
  it("requests the unread-count endpoint", async () => {
    mockGet.mockResolvedValue({ unread_count: 3 })

    await fetchUnreadCount()

    expect(mockGet).toHaveBeenCalledWith("notifications/unread-count")
  })

  it("reads a top-level count", async () => {
    mockGet.mockResolvedValue({ unread_count: 7 })

    await expect(fetchUnreadCount()).resolves.toBe(7)
  })

  it("reads a nested count", async () => {
    mockGet.mockResolvedValue({ data: { unread_count: 4 } })

    await expect(fetchUnreadCount()).resolves.toBe(4)
  })

  it("returns a real zero rather than falling through", async () => {
    mockGet.mockResolvedValue({ unread_count: 0 })

    await expect(fetchUnreadCount()).resolves.toBe(0)
  })

  it.each([
    ["an unrecognised shape", { count: 9 }],
    ["a non-numeric count", { unread_count: "9" }],
    ["an empty object", {}],
  ])("falls back to 0 for %s", async (_label, payload) => {
    mockGet.mockResolvedValue(payload)

    await expect(fetchUnreadCount()).resolves.toBe(0)
  })
})

describe("marking as read", () => {
  it("posts to the per-notification read endpoint", async () => {
    await markNotificationRead("n-42")

    expect(mockPost).toHaveBeenCalledWith("notifications/n-42/read", {})
  })

  it("posts to the read-all endpoint", async () => {
    await markAllNotificationsRead()

    expect(mockPost).toHaveBeenCalledWith("notifications/read-all", {})
  })

  it("propagates a failure so the caller can surface it", async () => {
    mockPost.mockRejectedValue(new Error("503"))

    await expect(markNotificationRead("n-1")).rejects.toThrow("503")
  })
})

/**
 * Tests for createNotification (lib/notifications.ts).
 *
 * Notifications are best-effort: a failure must never propagate to the caller
 * (which is usually mid-way through an order or payout flow), so the contract
 * is "returns true on success, false on any failure, never throws".
 */

const mockInsert = jest.fn()
const mockFrom = jest.fn(() => ({ insert: mockInsert }))
const mockCreateClient = jest.fn()

jest.mock("@/lib/supabase/server", () => ({
  createClient: () => mockCreateClient(),
}))

import { createNotification } from "@/lib/notifications"

const params = {
  userId: "user-1",
  type: "order_placed" as const,
  title: "Order placed",
  message: "Your order is in.",
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  mockInsert.mockResolvedValue({ error: null })
  mockCreateClient.mockResolvedValue({ from: mockFrom })
})

afterEach(() => jest.restoreAllMocks())

describe("createNotification", () => {
  it("inserts into the notifications table and returns true", async () => {
    await expect(createNotification(params)).resolves.toBe(true)

    expect(mockFrom).toHaveBeenCalledWith("notifications")
  })

  it("writes the row unread with an empty data object by default", async () => {
    await createNotification(params)

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: "user-1",
      type: "order_placed",
      title: "Order placed",
      message: "Your order is in.",
      data: {},
      is_read: false,
    })
  })

  it("passes through a provided data payload", async () => {
    await createNotification({ ...params, data: { orderId: "o-1", amount: 5000 } })

    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ data: { orderId: "o-1", amount: 5000 } }))
  })

  it("returns false when the insert reports an error", async () => {
    mockInsert.mockResolvedValue({ error: { message: "table missing" } })

    await expect(createNotification(params)).resolves.toBe(false)
  })

  it("returns false rather than throwing when the insert rejects", async () => {
    mockInsert.mockRejectedValue(new Error("connection reset"))

    await expect(createNotification(params)).resolves.toBe(false)
  })

  it("returns false rather than throwing when the client cannot be created", async () => {
    mockCreateClient.mockRejectedValue(new Error("no cookies in this context"))

    await expect(createNotification(params)).resolves.toBe(false)
  })

  it.each([["order_placed"], ["order_assigned"], ["order_status_update"], ["stock_low"]])(
    "accepts the %s notification type",
    async (type) => {
      await expect(createNotification({ ...params, type: type as typeof params.type })).resolves.toBe(true)

      expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ type }))
    },
  )
})

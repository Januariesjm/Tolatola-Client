/**
 * Tests for useVendorOrders (hooks/use-vendor-orders.ts).
 *
 * Extracted from vendor-orders-tab.tsx. Covers the initial load, the realtime
 * subscriptions and their cleanup, the 15s polling fallback, the
 * new-orders-arrived toast (which must not fire on first load), deep-link
 * expansion, and the load-failure path.
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import { setErrorReporter, type LogRecord } from "@/lib/logger"

const mockToast = jest.fn()
jest.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mockToast }) }))

const mockClientApiGet = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiGet: (...args: unknown[]) => mockClientApiGet(...args),
}))

type RealtimeCallback = () => void
let realtimeCallbacks: RealtimeCallback[]
const removeChannel = jest.fn()

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: () => {
      const channel: Record<string, unknown> = {}
      channel.on = (_event: string, _filter: unknown, cb: RealtimeCallback) => {
        realtimeCallbacks.push(cb)
        return channel
      }
      channel.subscribe = () => channel
      return channel
    },
    removeChannel,
  }),
}))

import { STATUS_TO_TAB, useVendorOrders } from "@/hooks/use-vendor-orders"

let reported: LogRecord[]

beforeEach(() => {
  jest.clearAllMocks()
  realtimeCallbacks = []
  reported = []
  setErrorReporter((r) => reported.push(r))
  jest.spyOn(console, "error").mockImplementation(() => {})
  jest.spyOn(console, "log").mockImplementation(() => {})
  mockClientApiGet.mockResolvedValue({ orders: [] })
})

afterEach(() => {
  setErrorReporter(null)
  jest.restoreAllMocks()
})

describe("useVendorOrders", () => {
  it("loads the shop's orders on mount", async () => {
    mockClientApiGet.mockResolvedValue({ orders: [{ id: "o-1", status: "pending" }] })

    const { result } = renderHook(() => useVendorOrders("shop-1"))

    await waitFor(() => expect(result.current.orders).toHaveLength(1))
    expect(mockClientApiGet).toHaveBeenCalledWith("shops/shop-1/orders")
    expect(result.current.isLoading).toBe(false)
  })

  it("defaults to an empty list when the response has no orders key", async () => {
    mockClientApiGet.mockResolvedValue({})

    const { result } = renderHook(() => useVendorOrders("shop-1"))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.orders).toEqual([])
  })

  it("logs a load failure and stops loading rather than hanging", async () => {
    mockClientApiGet.mockRejectedValue(new Error("500"))

    const { result } = renderHook(() => useVendorOrders("shop-1"))

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(reported).toHaveLength(1)
    expect(reported[0]).toMatchObject({
      scope: "vendor.orders",
      message: "failed to load orders",
      context: { shopId: "shop-1" },
    })
  })

  it("subscribes to both realtime channels and removes them on unmount", async () => {
    const { unmount } = renderHook(() => useVendorOrders("shop-1"))

    await waitFor(() => expect(realtimeCallbacks).toHaveLength(2))

    unmount()
    expect(removeChannel).toHaveBeenCalledTimes(2)
  })

  it("refetches when a realtime event fires", async () => {
    const { result } = renderHook(() => useVendorOrders("shop-1"))
    await waitFor(() => expect(result.current.isLoading).toBe(false))

    const callsBefore = mockClientApiGet.mock.calls.length
    await act(async () => {
      realtimeCallbacks[0]()
    })

    expect(mockClientApiGet.mock.calls.length).toBeGreaterThan(callsBefore)
  })

  it("does not toast on the first load, only when new orders arrive later", async () => {
    mockClientApiGet.mockResolvedValue({ orders: [{ id: "o-1", status: "pending" }] })
    const { result } = renderHook(() => useVendorOrders("shop-1"))
    await waitFor(() => expect(result.current.orders).toHaveLength(1))

    // First load must be silent even though the count went 0 -> 1.
    expect(mockToast).not.toHaveBeenCalled()

    mockClientApiGet.mockResolvedValue({
      orders: [
        { id: "o-1", status: "pending" },
        { id: "o-2", status: "pending" },
        { id: "o-3", status: "pending" },
      ],
    })
    await act(async () => {
      realtimeCallbacks[0]()
    })

    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: expect.stringContaining("2 New Orders") })))
  })

  it("does not toast when a silent refresh returns no new orders", async () => {
    mockClientApiGet.mockResolvedValue({ orders: [{ id: "o-1", status: "pending" }] })
    const { result } = renderHook(() => useVendorOrders("shop-1"))
    await waitFor(() => expect(result.current.orders).toHaveLength(1))

    await act(async () => {
      realtimeCallbacks[0]()
    })

    expect(mockToast).not.toHaveBeenCalled()
  })

  it("polls on an interval as a fallback and stops on unmount", async () => {
    jest.useFakeTimers()
    try {
      const { unmount } = renderHook(() => useVendorOrders("shop-1"))
      await act(async () => {
        await Promise.resolve()
      })

      const before = mockClientApiGet.mock.calls.length
      await act(async () => {
        jest.advanceTimersByTime(15000)
      })
      expect(mockClientApiGet.mock.calls.length).toBe(before + 1)

      unmount()
      await act(async () => {
        jest.advanceTimersByTime(45000)
      })
      expect(mockClientApiGet.mock.calls.length).toBe(before + 1)
    } finally {
      jest.useRealTimers()
    }
  })

  describe("toggleOrderDetails", () => {
    it("expands then collapses an order", async () => {
      const { result } = renderHook(() => useVendorOrders("shop-1"))
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      act(() => result.current.toggleOrderDetails("o-1"))
      expect(result.current.expandedOrders.has("o-1")).toBe(true)

      act(() => result.current.toggleOrderDetails("o-1"))
      expect(result.current.expandedOrders.has("o-1")).toBe(false)
    })

    it("can hold several orders open at once", async () => {
      const { result } = renderHook(() => useVendorOrders("shop-1"))
      await waitFor(() => expect(result.current.isLoading).toBe(false))

      act(() => result.current.toggleOrderDetails("o-1"))
      act(() => result.current.toggleOrderDetails("o-2"))

      expect(result.current.expandedOrders.size).toBe(2)
    })
  })

  describe("deep linking", () => {
    it("expands the linked order and switches to its tab", async () => {
      mockClientApiGet.mockResolvedValue({ orders: [{ id: "o-7", status: "ready_for_pickup" }] })

      const { result } = renderHook(() => useVendorOrders("shop-1", "o-7"))

      await waitFor(() => expect(result.current.expandedOrders.has("o-7")).toBe(true))
      expect(result.current.activeTab).toBe(STATUS_TO_TAB.ready_for_pickup)
    })

    it("ignores an order id that is not in the list", async () => {
      mockClientApiGet.mockResolvedValue({ orders: [{ id: "o-1", status: "pending" }] })

      const { result } = renderHook(() => useVendorOrders("shop-1", "missing"))

      await waitFor(() => expect(result.current.isLoading).toBe(false))
      expect(result.current.expandedOrders.size).toBe(0)
    })
  })
})

describe("STATUS_TO_TAB", () => {
  it.each([
    ["processing", "preparing"],
    ["ready_for_pickup", "ready"],
    ["shipped", "completed"],
    ["delivered", "completed"],
    ["confirmed", "new"],
  ])("maps %s to the %s tab", (status, tab) => {
    expect(STATUS_TO_TAB[status]).toBe(tab)
  })

  it("has no entry for an unknown status", () => {
    expect(STATUS_TO_TAB.cancelled).toBeUndefined()
  })
})

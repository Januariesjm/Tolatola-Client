/**
 * Tests for useTicketMessageCounts (hooks/use-ticket-message-counts.ts).
 *
 * Extracted from support-tickets-tab.tsx. Covers the message tally, the
 * "waiting on us" unread rule, markRead, the realtime INSERT handler and
 * subscription cleanup.
 */

import { act, renderHook, waitFor } from "@testing-library/react"

type RealtimeHandler = (payload: {
  new?: { conversation_id?: string; sender_type?: string }
}) => void

let capturedHandler: RealtimeHandler | undefined
let selectedIds: string[] | undefined
let rows: Array<{ conversation_id: string; sender_type?: string }>
const removeChannel = jest.fn()
const subscribe = jest.fn()

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        in: (_column: string, ids: string[]) => {
          selectedIds = ids
          return Promise.resolve({ data: rows, error: null })
        },
      }),
    }),
    channel: () => {
      const channel: Record<string, unknown> = {}
      channel.on = (_event: string, _filter: unknown, handler: RealtimeHandler) => {
        capturedHandler = handler
        return channel
      }
      channel.subscribe = () => {
        subscribe()
        return channel
      }
      return channel
    },
    removeChannel,
  }),
}))

import { useTicketMessageCounts } from "@/hooks/use-ticket-message-counts"

beforeEach(() => {
  jest.clearAllMocks()
  capturedHandler = undefined
  selectedIds = undefined
  rows = []
  jest.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => jest.restoreAllMocks())

describe("useTicketMessageCounts", () => {
  it("tallies messages per conversation", async () => {
    rows = [
      { conversation_id: "c1", sender_type: "admin" },
      { conversation_id: "c1", sender_type: "admin" },
      { conversation_id: "c2", sender_type: "admin" },
    ]

    const { result } = renderHook(() =>
      useTicketMessageCounts([{ conversation_id: "c1" }, { conversation_id: "c2" }]),
    )

    await waitFor(() => expect(result.current.counts).toEqual({ c1: 2, c2: 1 }))
  })

  it.each([["user"], ["guest"]])("marks a conversation unread for a %s message", async (sender) => {
    rows = [{ conversation_id: "c1", sender_type: sender }]

    const { result } = renderHook(() => useTicketMessageCounts([{ conversation_id: "c1" }]))

    await waitFor(() => expect(result.current.unread).toEqual({ c1: true }))
  })

  it("does not mark a conversation unread for admin-only messages", async () => {
    rows = [{ conversation_id: "c1", sender_type: "admin" }]

    const { result } = renderHook(() => useTicketMessageCounts([{ conversation_id: "c1" }]))

    await waitFor(() => expect(result.current.counts).toEqual({ c1: 1 }))
    expect(result.current.unread).toEqual({})
  })

  it("queries only tickets that have a conversation", async () => {
    rows = []

    renderHook(() =>
      useTicketMessageCounts([
        { conversation_id: "c1" },
        { conversation_id: null },
        {},
        { conversation_id: "c2" },
      ]),
    )

    await waitFor(() => expect(selectedIds).toEqual(["c1", "c2"]))
  })

  it("skips the query entirely when no ticket has a conversation", async () => {
    renderHook(() => useTicketMessageCounts([{ conversation_id: null }, {}]))

    await waitFor(() => expect(subscribe).toHaveBeenCalled())
    expect(selectedIds).toBeUndefined()
  })

  it("increments the count when a realtime message arrives", async () => {
    rows = [{ conversation_id: "c1", sender_type: "admin" }]

    const { result } = renderHook(() => useTicketMessageCounts([{ conversation_id: "c1" }]))
    await waitFor(() => expect(result.current.counts).toEqual({ c1: 1 }))

    act(() => {
      capturedHandler?.({ new: { conversation_id: "c1", sender_type: "admin" } })
    })

    expect(result.current.counts).toEqual({ c1: 2 })
  })

  it("flags unread when the realtime message is from a customer", async () => {
    rows = []

    const { result } = renderHook(() => useTicketMessageCounts([{ conversation_id: "c1" }]))
    await waitFor(() => expect(subscribe).toHaveBeenCalled())

    act(() => {
      capturedHandler?.({ new: { conversation_id: "c1", sender_type: "guest" } })
    })

    expect(result.current.unread).toEqual({ c1: true })
  })

  it("counts a realtime message for a conversation it had not seen before", async () => {
    rows = []

    const { result } = renderHook(() => useTicketMessageCounts([{ conversation_id: "c1" }]))
    await waitFor(() => expect(subscribe).toHaveBeenCalled())

    act(() => {
      capturedHandler?.({ new: { conversation_id: "c9", sender_type: "admin" } })
    })

    expect(result.current.counts).toEqual({ c9: 1 })
  })

  it("ignores a realtime payload with no conversation id", async () => {
    rows = []

    const { result } = renderHook(() => useTicketMessageCounts([{ conversation_id: "c1" }]))
    await waitFor(() => expect(subscribe).toHaveBeenCalled())

    act(() => {
      capturedHandler?.({ new: {} })
      capturedHandler?.({})
    })

    expect(result.current.counts).toEqual({})
  })

  it("clears the unread flag via markRead without touching the count", async () => {
    rows = [{ conversation_id: "c1", sender_type: "user" }]

    const { result } = renderHook(() => useTicketMessageCounts([{ conversation_id: "c1" }]))
    await waitFor(() => expect(result.current.unread).toEqual({ c1: true }))

    act(() => result.current.markRead("c1"))

    expect(result.current.unread).toEqual({ c1: false })
    expect(result.current.counts).toEqual({ c1: 1 })
  })

  it("removes the realtime channel on unmount", async () => {
    const { unmount } = renderHook(() => useTicketMessageCounts([{ conversation_id: "c1" }]))
    await waitFor(() => expect(subscribe).toHaveBeenCalled())

    unmount()

    expect(removeChannel).toHaveBeenCalledTimes(1)
  })

  it("does not re-subscribe when a new tickets array holds the same conversations", async () => {
    rows = []

    const { rerender } = renderHook(
      ({ tickets }) => useTicketMessageCounts(tickets),
      { initialProps: { tickets: [{ conversation_id: "c1" }] } },
    )
    await waitFor(() => expect(subscribe).toHaveBeenCalledTimes(1))

    // New array identity, identical conversation ids.
    rerender({ tickets: [{ conversation_id: "c1" }] })

    expect(subscribe).toHaveBeenCalledTimes(1)
  })
})

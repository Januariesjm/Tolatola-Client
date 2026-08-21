/**
 * Tests for useSupportChat (hooks/use-support-chat.ts).
 *
 * Extracted from floating-support-widget.tsx. Covers the realtime subscription
 * lifecycle, both event paths (postgres_changes and broadcast), the dedupe that
 * stops a message arriving over both from being shown twice, and broadcasting.
 */

import { act, renderHook, waitFor } from "@testing-library/react"
import type { ChatMessage } from "@/lib/support/chat-message"

type Handler = (payload: unknown) => void

const handlers: Record<string, Handler> = {}
const send = jest.fn()
const subscribe = jest.fn()
const removeChannel = jest.fn()
let channelName: string | undefined
let pgFilter: unknown

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    channel: (name: string) => {
      channelName = name
      const channel: Record<string, unknown> = {}
      channel.on = (event: string, arg2: unknown, arg3?: Handler) => {
        if (event === "postgres_changes") {
          pgFilter = arg2
          handlers.postgres = arg3 as Handler
        } else {
          handlers.broadcast = arg2 as unknown as Handler
          if (typeof arg3 === "function") handlers.broadcast = arg3
        }
        return channel
      }
      channel.subscribe = () => {
        subscribe()
        return channel
      }
      channel.send = send
      return channel
    },
    removeChannel,
  }),
}))

import { useSupportChat } from "@/hooks/use-support-chat"

const WELCOME: ChatMessage = { id: "welcome", sender: "bot", text: "Hi!", timestamp: "10:00:00" }

const agentRow = (over: Record<string, unknown> = {}) => ({
  id: 7,
  sender_type: "agent",
  message: "An agent here",
  created_at: "2026-02-01T10:30:15.000Z",
  ...over,
})

function setup(conversationId: string | null, onActivity?: () => void) {
  return renderHook(({ id }: { id: string | null }) => useSupportChat({ conversationId: id, initialMessages: [WELCOME], onActivity }), {
    initialProps: { id: conversationId },
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  for (const k of Object.keys(handlers)) delete handlers[k]
  channelName = undefined
  pgFilter = undefined
  jest.spyOn(console, "log").mockImplementation(() => {})
  jest.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => jest.restoreAllMocks())

describe("useSupportChat", () => {
  it("starts with the initial transcript", () => {
    const { result } = setup(null)

    expect(result.current.messages).toEqual([WELCOME])
  })

  it("does not subscribe without a conversation", () => {
    setup(null)

    expect(subscribe).not.toHaveBeenCalled()
  })

  it("subscribes to the conversation's channel and filters by it", async () => {
    setup("conv-1")

    await waitFor(() => expect(subscribe).toHaveBeenCalledTimes(1))
    expect(channelName).toBe("conversation:conv-1")
    expect(pgFilter).toMatchObject({ table: "messages", filter: "conversation_id=eq.conv-1" })
  })

  it("appends an agent message from postgres_changes", async () => {
    const { result } = setup("conv-1")
    await waitFor(() => expect(subscribe).toHaveBeenCalled())

    act(() => handlers.postgres({ new: agentRow() }))

    expect(result.current.messages.map((m) => m.id)).toEqual(["welcome", "live-7"])
  })

  it("appends an agent message from broadcast", async () => {
    const { result } = setup("conv-1")
    await waitFor(() => expect(subscribe).toHaveBeenCalled())

    act(() => handlers.broadcast({ payload: agentRow({ id: 8 }) }))

    expect(result.current.messages.map((m) => m.id)).toEqual(["welcome", "live-8"])
  })

  it("shows a message once even when it arrives over both channels", async () => {
    const { result } = setup("conv-1")
    await waitFor(() => expect(subscribe).toHaveBeenCalled())

    act(() => handlers.postgres({ new: agentRow() }))
    act(() => handlers.broadcast({ payload: agentRow() }))

    expect(result.current.messages.filter((m) => m.id === "live-7")).toHaveLength(1)
  })

  it("ignores the buyer's own messages echoed back", async () => {
    const { result } = setup("conv-1")
    await waitFor(() => expect(subscribe).toHaveBeenCalled())

    act(() => handlers.postgres({ new: agentRow({ sender_type: "user" }) }))

    expect(result.current.messages).toHaveLength(1)
  })

  it("reports activity when a message arrives, so the idle timer resets", async () => {
    const onActivity = jest.fn()
    setup("conv-1", onActivity)
    await waitFor(() => expect(subscribe).toHaveBeenCalled())

    act(() => handlers.postgres({ new: agentRow() }))

    expect(onActivity).toHaveBeenCalledTimes(1)
  })

  it("does not report activity for an ignored message", async () => {
    const onActivity = jest.fn()
    setup("conv-1", onActivity)
    await waitFor(() => expect(subscribe).toHaveBeenCalled())

    act(() => handlers.postgres({ new: agentRow({ sender_type: "user" }) }))

    expect(onActivity).not.toHaveBeenCalled()
  })

  it("removes the channel on unmount", async () => {
    const { unmount } = setup("conv-1")
    await waitFor(() => expect(subscribe).toHaveBeenCalled())

    unmount()

    expect(removeChannel).toHaveBeenCalledTimes(1)
  })

  it("re-subscribes when the conversation changes", async () => {
    const { rerender } = setup("conv-1")
    await waitFor(() => expect(subscribe).toHaveBeenCalledTimes(1))

    rerender({ id: "conv-2" })

    await waitFor(() => expect(subscribe).toHaveBeenCalledTimes(2))
    expect(removeChannel).toHaveBeenCalledTimes(1)
    expect(channelName).toBe("conversation:conv-2")
  })

  it("does not re-subscribe when only the onActivity identity changes", async () => {
    const { rerender } = renderHook(
      ({ cb }: { cb: () => void }) => useSupportChat({ conversationId: "conv-1", initialMessages: [WELCOME], onActivity: cb }),
      { initialProps: { cb: () => {} } },
    )
    await waitFor(() => expect(subscribe).toHaveBeenCalledTimes(1))

    // A new inline arrow every render must not tear down the subscription.
    rerender({ cb: () => {} })

    expect(subscribe).toHaveBeenCalledTimes(1)
  })

  describe("broadcastMessage", () => {
    it("sends over the channel and reports success", async () => {
      const { result } = setup("conv-1")
      await waitFor(() => expect(subscribe).toHaveBeenCalled())

      let sent: boolean | undefined
      act(() => {
        sent = result.current.broadcastMessage({ id: 9, message: "hello" })
      })

      expect(sent).toBe(true)
      expect(send).toHaveBeenCalledWith({
        type: "broadcast",
        event: "message",
        payload: { id: 9, message: "hello" },
      })
    })

    it("is a no-op with no live channel", () => {
      const { result } = setup(null)

      let sent: boolean | undefined
      act(() => {
        sent = result.current.broadcastMessage({ id: 9 })
      })

      expect(sent).toBe(false)
      expect(send).not.toHaveBeenCalled()
    })
  })

  it("lets the caller append its own messages", async () => {
    const { result } = setup("conv-1")

    act(() => {
      result.current.setMessages((prev) => [...prev, { id: "own", sender: "user", text: "hi", timestamp: "10:01:00" }])
    })

    expect(result.current.messages.map((m) => m.id)).toEqual(["welcome", "own"])
  })
})

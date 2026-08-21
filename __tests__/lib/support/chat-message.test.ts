/**
 * Tests for support chat message mapping (lib/support/chat-message.ts).
 *
 * The realtime subscription mapped incoming rows twice — identical code for the
 * `postgres_changes` and `broadcast` events — and deduped with two copies of the
 * same predicate. These are the single shared versions.
 */

import {
  appendUniqueMessage,
  chatTimestamp,
  createBotMessage,
  replaceMessage,
  toAiChatHistory,
  toIncomingChatMessage,
  type ChatMessage,
} from "@/lib/support/chat-message"

const row = (over: Record<string, unknown> = {}) => ({
  id: 42,
  sender_type: "agent",
  message: "How can I help?",
  created_at: "2026-02-01T10:30:15.000Z",
  ...over,
})

/** A minimal transcript entry, for the helpers that only care about ids/order. */
const msg = (id: string): ChatMessage => ({ id, sender: "agent", text: "hi", timestamp: "10:00:00" })

describe("toIncomingChatMessage", () => {
  it("maps an agent row", () => {
    const msg = toIncomingChatMessage(row())

    expect(msg).toMatchObject({ id: "live-42", sender: "agent", text: "How can I help?" })
  })

  it("maps a bot row to the bot sender", () => {
    expect(toIncomingChatMessage(row({ sender_type: "bot" }))?.sender).toBe("bot")
  })

  it.each([["user"], ["guest"], ["system"], [""], [undefined]])("ignores a row from sender_type %p", (sender_type) => {
    // The buyer's own messages are appended optimistically; echoing them back
    // would show them twice.
    expect(toIncomingChatMessage(row({ sender_type }))).toBeNull()
  })

  it.each([[null], [undefined]])("returns null for %p", (input) => {
    expect(toIncomingChatMessage(input)).toBeNull()
  })

  it("labels an attachment-only message", () => {
    const msg = toIncomingChatMessage(row({ message: null, attachment_url: "https://cdn/x.pdf" }))

    expect(msg?.text).toBe("[Attachment]")
    expect(msg?.attachmentUrl).toBe("https://cdn/x.pdf")
  })

  it("leaves the text empty when there is neither message nor attachment", () => {
    expect(toIncomingChatMessage(row({ message: null }))?.text).toBe("")
  })

  it("carries the attachment type through, as undefined when absent", () => {
    expect(toIncomingChatMessage(row({ attachment_type: "application/pdf" }))?.attachmentType).toBe("application/pdf")
    expect(toIncomingChatMessage(row())?.attachmentType).toBeUndefined()
  })

  it("formats a timestamp with seconds", () => {
    expect(toIncomingChatMessage(row())?.timestamp).toMatch(/\d{1,2}:\d{2}:\d{2}/)
  })

  it("falls back to now when created_at is missing", () => {
    expect(toIncomingChatMessage(row({ created_at: undefined }))?.timestamp).toMatch(/\d{1,2}:\d{2}:\d{2}/)
  })

  it("derives the same id for the same row, so dedupe can work", () => {
    expect(toIncomingChatMessage(row())?.id).toBe(toIncomingChatMessage(row())?.id)
  })
})

describe("appendUniqueMessage", () => {
  const msg = (id: string): ChatMessage => ({ id, sender: "agent", text: "hi", timestamp: "10:00:00" })

  it("appends a new message", () => {
    expect(appendUniqueMessage([msg("a")], msg("b")).map((m) => m.id)).toEqual(["a", "b"])
  })

  it("ignores a duplicate id", () => {
    // A single message can arrive over both postgres_changes and broadcast.
    const existing = [msg("a"), msg("live-42")]

    expect(appendUniqueMessage(existing, msg("live-42"))).toBe(existing)
  })

  it("appends to an empty transcript", () => {
    expect(appendUniqueMessage([], msg("a"))).toHaveLength(1)
  })

  it("does not mutate the input array", () => {
    const existing = [msg("a")]
    appendUniqueMessage(existing, msg("b"))

    expect(existing).toHaveLength(1)
  })
})

describe("chatTimestamp", () => {
  it("produces an hour:minute:second label", () => {
    // Locale-dependent separators and 12/24-hour form, so the shape is asserted
    // rather than an exact string.
    expect(chatTimestamp()).toMatch(/\d{1,2}[:.]\d{2}[:.]\d{2}/)
  })
})

describe("createBotMessage", () => {
  it("builds a stamped bot message with the given id", () => {
    const message = createBotMessage("welcome-1", "Hello")

    expect(message).toMatchObject({ id: "welcome-1", sender: "bot", text: "Hello" })
    expect(message.timestamp).toBeTruthy()
  })

  it("carries the escalation flag through", () => {
    expect(createBotMessage("m1", "Need a human?", { showEscalationOption: true }).showEscalationOption).toBe(true)
  })

  it("carries the inactivity flag through", () => {
    expect(createBotMessage("m1", "Still there?", { showInactivityPrompt: true }).showInactivityPrompt).toBe(true)
  })

  it("sets no flags by default", () => {
    const message = createBotMessage("m1", "Hi")

    expect(message.showEscalationOption).toBeUndefined()
    expect(message.showInactivityPrompt).toBeUndefined()
  })
})

describe("replaceMessage", () => {
  it("swaps the named message for the replacement", () => {
    const result = replaceMessage([msg("a"), msg("connecting"), msg("c")], "connecting", msg("connected"))

    expect(result.map((m) => m.id)).toEqual(["a", "c", "connected"])
  })

  it("appends the replacement at the end so later arrivals stay in order", () => {
    // A realtime message can land while escalation is in flight; it must not end
    // up below the reply.
    const result = replaceMessage([msg("connecting"), msg("live-1")], "connecting", msg("connected"))

    expect(result.map((m) => m.id)).toEqual(["live-1", "connected"])
  })

  it("still appends when the target is absent", () => {
    const result = replaceMessage([msg("a")], "missing", msg("b"))

    expect(result.map((m) => m.id)).toEqual(["a", "b"])
  })

  it("does not mutate the input", () => {
    const existing = [msg("connecting")]
    replaceMessage(existing, "connecting", msg("connected"))

    expect(existing.map((m) => m.id)).toEqual(["connecting"])
  })
})

describe("toAiChatHistory", () => {
  it("reduces each message to the fields the endpoint needs", () => {
    const history = toAiChatHistory([{ ...msg("a"), text: "Where is my order?", sender: "user" }])

    expect(history).toEqual([{ sender: "user", text: "Where is my order?", attachmentUrl: undefined, attachmentType: undefined }])
  })

  it("keeps attachment references", () => {
    const withAttachment: ChatMessage = { ...msg("a"), attachmentUrl: "https://cdn/x.pdf", attachmentType: "application/pdf" }

    expect(toAiChatHistory([withAttachment])[0]).toMatchObject({
      attachmentUrl: "https://cdn/x.pdf",
      attachmentType: "application/pdf",
    })
  })

  it("drops the UI-only flags", () => {
    const flagged: ChatMessage = { ...msg("a"), showEscalationOption: true, showInactivityPrompt: true }

    expect(Object.keys(toAiChatHistory([flagged])[0]).sort()).toEqual(["attachmentType", "attachmentUrl", "sender", "text"])
  })

  it("preserves order", () => {
    const history = toAiChatHistory([
      { ...msg("a"), text: "first" },
      { ...msg("b"), text: "second" },
    ])

    expect(history.map((h) => h.text)).toEqual(["first", "second"])
  })

  it("maps an empty transcript to an empty history", () => {
    expect(toAiChatHistory([])).toEqual([])
  })
})

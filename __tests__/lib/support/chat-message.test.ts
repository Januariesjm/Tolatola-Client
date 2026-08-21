/**
 * Tests for support chat message mapping (lib/support/chat-message.ts).
 *
 * The realtime subscription mapped incoming rows twice — identical code for the
 * `postgres_changes` and `broadcast` events — and deduped with two copies of the
 * same predicate. These are the single shared versions.
 */

import { appendUniqueMessage, toIncomingChatMessage, type ChatMessage } from "@/lib/support/chat-message"

const row = (over: Record<string, unknown> = {}) => ({
  id: 42,
  sender_type: "agent",
  message: "How can I help?",
  created_at: "2026-02-01T10:30:15.000Z",
  ...over,
})

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

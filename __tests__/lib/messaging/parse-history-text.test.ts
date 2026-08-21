/**
 * Tests for lib/messaging/parse-history-text.ts.
 *
 * Extracted from components/messaging/chat-dialog.tsx. This reverses the
 * flattening the support widget does when it escalates a bot conversation to a
 * human, so an agent reads a transcript rather than one wall of text. The
 * regex has several failure modes that are invisible from the rendered output:
 * a colon inside a message being read as a speaker tag, and a `/g` regex
 * carrying `lastIndex` between calls.
 */

import { parseHistoryText } from "@/lib/messaging/parse-history-text"

/** Fixed clock so the synthesised timestamps are assertable. */
const NOW = Date.parse("2026-02-01T12:00:00.000Z")

describe("parseHistoryText empty input", () => {
  it.each([undefined, "", "   ", "\n\n"])("returns nothing for %j", (input) => {
    expect(parseHistoryText(input, NOW)).toEqual([])
  })
})

describe("parseHistoryText untagged descriptions", () => {
  it("returns the text as a single customer message", () => {
    const result = parseHistoryText("My parcel never arrived", NOW)

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ message: "My parcel never arrived", sender_type: "user", sender: { full_name: "Customer User" } })
  })

  it("trims the description", () => {
    expect(parseHistoryText("  spaced out  ", NOW)[0].message).toBe("spaced out")
  })

  it("does not mistake a colon inside prose for a speaker tag", () => {
    // "Order status: pending" must stay one message, not become a tag split.
    const result = parseHistoryText("Order status: pending since Monday", NOW)

    expect(result).toHaveLength(1)
    expect(result[0].message).toBe("Order status: pending since Monday")
  })

  it("does not treat an unknown uppercase tag as a speaker", () => {
    const result = parseHistoryText("ADMIN: please review", NOW)

    expect(result).toHaveLength(1)
    expect(result[0].message).toBe("ADMIN: please review")
  })
})

describe("parseHistoryText tagged transcripts", () => {
  const TRANSCRIPT = "USER: where is my order\nBOT: let me check that for you\nUSER: thanks"

  it("splits each turn into its own message", () => {
    const result = parseHistoryText(TRANSCRIPT, NOW)

    expect(result.map((m) => m.message)).toEqual(["where is my order", "let me check that for you", "thanks"])
  })

  it("attributes each turn to the right speaker", () => {
    expect(parseHistoryText(TRANSCRIPT, NOW).map((m) => m.sender_type)).toEqual(["user", "bot", "user"])
  })

  it("names the bot as the AI agent", () => {
    const result = parseHistoryText("BOT: hello there", NOW)

    expect(result[0].sender).toEqual({ id: "", full_name: "Moureen Tyler (AI Agent)" })
  })

  it("names a human agent as support", () => {
    const result = parseHistoryText("AGENT: I can help with that", NOW)

    expect(result[0]).toMatchObject({ sender_type: "agent", sender: { id: "agent", full_name: "Support Agent" } })
  })

  it("treats a guest as a customer", () => {
    const result = parseHistoryText("GUEST: I do not have an account", NOW)

    expect(result[0]).toMatchObject({ sender_type: "user", sender: { full_name: "Customer User" } })
  })

  it("matches tags case-insensitively", () => {
    const result = parseHistoryText("user: lowercase\nbot: also lowercase", NOW)

    expect(result.map((m) => m.sender_type)).toEqual(["user", "bot"])
  })

  it("strips the escalation preamble the widget prepends", () => {
    const result = parseHistoryText("Escalated from Moureen Tyler AI Chat: USER: hello", NOW)

    expect(result).toHaveLength(1)
    expect(result[0].message).toBe("hello")
  })

  it("strips the preamble case-insensitively", () => {
    const result = parseHistoryText("escalated from moureen tyler ai chat: USER: hi", NOW)

    expect(result[0].message).toBe("hi")
  })

  it("keeps a multi-line message body intact", () => {
    const result = parseHistoryText("USER: line one\nline two\nBOT: reply", NOW)

    expect(result[0].message).toBe("line one\nline two")
    expect(result[1].message).toBe("reply")
  })

  it("keeps a colon inside a tagged message", () => {
    const result = parseHistoryText("USER: my order id is ORDER: 1234", NOW)

    expect(result[0].message).toContain("ORDER: 1234")
  })

  it("drops a trailing tag with no content rather than showing a blank bubble", () => {
    const result = parseHistoryText("USER: hello\nBOT:", NOW)

    expect(result).toHaveLength(1)
    expect(result[0].message).toBe("hello")
  })

  /**
   * Known limitation, carried over from the original implementation.
   *
   * The tag pattern requires a delimiter before a speaker tag, but `\s*` after
   * the colon consumes the following newline -- so a tag whose turn is empty
   * eats the delimiter the *next* tag needed, and that next turn is absorbed
   * into the empty one's body rather than being split off.
   *
   * The visible effect is one merged bubble attributed to the wrong speaker when
   * the bot returns an empty response. Pinned rather than fixed, because this
   * extraction is meant to preserve behaviour; see the accompanying summary.
   */
  it("absorbs the following turn when a turn is empty", () => {
    const result = parseHistoryText("USER: hello\nBOT:   \nUSER: still there?", NOW)

    expect(result.map((m) => m.message)).toEqual(["hello", "USER: still there?"])
    expect(result[1].sender_type).toBe("bot")
  })

  it("absorbs the following turn even with no spaces after the colon", () => {
    // `\s*` matches the newline as well, so the delimiter is consumed either way.
    const result = parseHistoryText("USER: hello\nBOT:\nUSER: still there?", NOW)

    expect(result.map((m) => m.message)).toEqual(["hello", "USER: still there?"])
  })

  it("absorbs the following turn regardless of how much whitespace separates them", () => {
    // `\s*` is greedy across newlines, so no amount of blank space leaves a
    // delimiter behind for the next tag.
    const result = parseHistoryText("USER: hello\nBOT:\n\n\nUSER: still there?", NOW)

    expect(result.map((m) => m.message)).toEqual(["hello", "USER: still there?"])
  })

  it("returns a single turn when the last tag is the only content of the first", () => {
    const result = parseHistoryText("USER:\nBOT:", NOW)

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ message: "BOT:", sender_type: "user" })
  })
})

describe("parseHistoryText ordering", () => {
  it("backdates each turn so the transcript sorts chronologically", () => {
    const result = parseHistoryText("USER: first\nBOT: second\nUSER: third", NOW)
    const times = result.map((m) => Date.parse(m.created_at))

    expect(times[0]).toBeLessThan(times[1])
    expect(times[1]).toBeLessThan(times[2])
  })

  it("spaces the turns a minute apart, ending at the given clock", () => {
    const result = parseHistoryText("USER: first\nBOT: second", NOW)

    expect(result[0].created_at).toBe(new Date(NOW - 120_000).toISOString())
    expect(result[1].created_at).toBe(new Date(NOW - 60_000).toISOString())
  })

  it("gives every message a distinct id", () => {
    const ids = parseHistoryText("USER: a\nBOT: b\nUSER: c", NOW).map((m) => m.id)

    expect(new Set(ids).size).toBe(3)
  })
})

describe("parseHistoryText repeated calls", () => {
  it("returns the same result when called twice", () => {
    // The speaker regex is /g; reusing one instance across calls would carry
    // lastIndex over and silently drop the leading turns on the second call.
    const transcript = "USER: where is my order\nBOT: checking"

    expect(parseHistoryText(transcript, NOW)).toEqual(parseHistoryText(transcript, NOW))
  })

  it("parses a second, different transcript correctly", () => {
    parseHistoryText("USER: first call\nBOT: reply", NOW)
    const second = parseHistoryText("AGENT: second call", NOW)

    expect(second).toHaveLength(1)
    expect(second[0].message).toBe("second call")
  })
})

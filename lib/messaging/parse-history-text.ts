/**
 * Parses an escalated AI chat transcript back into individual messages.
 *
 * When the support widget escalates to a human it flattens the whole bot
 * conversation into one string -- `"USER: where is my order\nBOT: let me
 * check"` -- and stores it as the ticket's description. The admin chat dialog
 * has to reverse that so an agent sees a readable transcript rather than one
 * wall of text.
 *
 * Extracted from components/messaging/chat-dialog.tsx, where it was a private
 * function in the largest untested component in the codebase. It is pure and
 * full of edge cases -- an unprefixed description, a prefix mid-line, a trailing
 * prefix with nothing after it -- so it is worth testing directly rather than
 * through a rendered dialog.
 */

/**
 * A parsed transcript entry.
 *
 * Structurally compatible with the dialog's own Message type -- the dialog
 * concatenates parsed history with live messages and renders both through one
 * code path, so the optional attachment and avatar fields are declared here even
 * though a flattened transcript never carries them.
 */
export interface ParsedHistoryMessage {
  id: string
  message: string
  created_at: string
  sender_id: string
  sender_type: "bot" | "agent" | "user"
  sender: { id: string; full_name: string; profile_image_url?: string }
  attachment_url?: string
  attachment_type?: string
}

/** Prefix the widget adds when it hands a conversation to a human. */
const ESCALATION_PREFIX = /^Escalated from Moureen Tyler AI Chat:\s*/i

/**
 * Speaker tags, matched at a line start or after whitespace so a colon inside a
 * message body ("Order status: pending") is not mistaken for one.
 */
const SPEAKER_PREFIX = /(?:^|\n|\s)(BOT|USER|GUEST|AGENT):\s*/gi

/** Display name per speaker. GUEST is shown as a customer, same as USER. */
const SPEAKER_NAMES = {
  bot: "Moureen Tyler (AI Agent)",
  agent: "Support Agent",
  user: "Customer User",
} as const

function speakerTypeFor(tag: string): ParsedHistoryMessage["sender_type"] {
  if (tag === "BOT") return "bot"
  if (tag === "AGENT") return "agent"
  return "user"
}

/**
 * Splits `text` into messages.
 *
 * Returns an empty array for empty input, and a single customer message when the
 * text carries no speaker tags at all -- that is a ticket raised through a form
 * rather than escalated from chat, and its description is still worth showing.
 *
 * @param now Injectable clock. Timestamps are synthesised because the original
 *   per-message times are lost in the flattening; each entry is backdated a
 *   minute from the last so the transcript sorts in order.
 */
export function parseHistoryText(text?: string, now: number = Date.now()): ParsedHistoryMessage[] {
  if (!text || !text.trim()) return []

  const cleanText = text.replace(ESCALATION_PREFIX, "").trim()

  const matches: Array<{ tag: string; index: number; contentStart: number }> = []
  // A fresh regex per call: /g regexes carry lastIndex between uses.
  const prefixRegex = new RegExp(SPEAKER_PREFIX.source, "gi")

  let match: RegExpExecArray | null
  while ((match = prefixRegex.exec(cleanText)) !== null) {
    matches.push({ tag: match[1].toUpperCase(), index: match.index, contentStart: match.index + match[0].length })
  }

  if (matches.length === 0) {
    return [
      {
        id: "hist-0",
        message: cleanText,
        created_at: new Date(now).toISOString(),
        sender_id: "",
        sender_type: "user",
        sender: { id: "", full_name: SPEAKER_NAMES.user },
      },
    ]
  }

  const result: ParsedHistoryMessage[] = []

  for (let i = 0; i < matches.length; i++) {
    const nextIndex = i < matches.length - 1 ? matches[i + 1].index : cleanText.length
    const content = cleanText.slice(matches[i].contentStart, nextIndex).trim()

    // A tag with nothing after it is dropped rather than rendered as a blank
    // bubble.
    if (!content) continue

    const senderType = speakerTypeFor(matches[i].tag)
    const senderId = senderType === "bot" ? "" : senderType

    result.push({
      id: `parsed-${i}-${now}`,
      message: content,
      created_at: new Date(now - (matches.length - i) * 60_000).toISOString(),
      sender_id: senderId,
      sender_type: senderType,
      sender: { id: senderId, full_name: SPEAKER_NAMES[senderType] },
    })
  }

  return result
}

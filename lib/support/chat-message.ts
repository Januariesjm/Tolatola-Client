/**
 * Chat message shapes and mapping for the support widget.
 *
 * The realtime subscription in floating-support-widget.tsx mapped an incoming
 * row to a ChatMessage twice — once for `postgres_changes` and again, verbatim,
 * for `broadcast` — and deduped it with a second copy of the same predicate.
 * Both live here once, as pure functions.
 */

/** A message rendered in the widget's transcript. */
export interface ChatMessage {
  id: string
  sender: "bot" | "user" | "agent"
  text: string
  timestamp: string
  showEscalationOption?: boolean
  showInactivityPrompt?: boolean
  attachmentUrl?: string
  attachmentType?: string
  attachmentName?: string
}

/** A file staged for upload, before it becomes a message. */
export interface SelectedAttachment {
  file: File
  previewUrl: string
  base64Data: string
  mimeType: string
  name: string
  size: number
  isPdf: boolean
}

/** The support ticket a live chat is attached to. */
export interface SupportTicket {
  id: string
  subject?: string | null
  status?: string | null
  conversation_id?: string | null
  created_at?: string | null
}

/**
 * A `messages` row as it arrives over realtime. Deliberately loose: it comes
 * off the wire, so every field is treated as possibly absent.
 */
export interface IncomingMessageRow {
  id?: string | number
  sender_type?: string
  message?: string | null
  attachment_url?: string | null
  attachment_type?: string | null
  created_at?: string
}

/** Senders whose messages the widget displays as incoming. */
const INCOMING_SENDERS = ["agent", "bot"]

function formatTimestamp(createdAt?: string): string {
  const date = createdAt ? new Date(createdAt) : new Date()
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
}

/**
 * Maps a realtime row to a ChatMessage, or null when it is not an incoming
 * message the widget should render (the buyer's own messages arrive optimistically
 * and would otherwise appear twice).
 */
export function toIncomingChatMessage(row?: IncomingMessageRow | null): ChatMessage | null {
  if (!row || !row.sender_type || !INCOMING_SENDERS.includes(row.sender_type)) {
    return null
  }

  return {
    id: `live-${row.id}`,
    sender: row.sender_type === "bot" ? "bot" : "agent",
    text: row.message || (row.attachment_url ? "[Attachment]" : ""),
    timestamp: formatTimestamp(row.created_at),
    attachmentUrl: row.attachment_url ?? undefined,
    attachmentType: row.attachment_type ?? undefined,
  }
}

/**
 * Appends a message unless one with the same id is already present.
 *
 * Needed because a single message can arrive over both `postgres_changes` and
 * `broadcast`; without this the transcript shows it twice.
 */
export function appendUniqueMessage(messages: ChatMessage[], message: ChatMessage): ChatMessage[] {
  if (messages.some((m) => m.id === message.id)) {
    return messages
  }
  return [...messages, message]
}

/** One prior turn, as the AI chat endpoint expects it. */
export interface AiChatHistoryEntry {
  sender: ChatMessage["sender"]
  text: string
  attachmentUrl?: string
  attachmentType?: string
}

/** Body sent to the support AI chat endpoint. */
export interface AiChatRequestBody {
  message: string
  history: AiChatHistoryEntry[]
  attachmentUrl?: string
  attachmentType?: string
  attachment?: {
    data: string
    mimeType: string
    filename: string
    url?: string
  }
}

/** Response from the support AI chat endpoint. */
export interface AiChatResponse {
  response?: string
  needs_human?: boolean
  ticket?: SupportTicket | null
  conversation?: { id?: string | null } | null
}

/**
 * Response from the escalate-to-human endpoint.
 *
 * The endpoint returns either a wrapped `{ ticket }` or the ticket's fields at
 * the top level depending on which of the fallback URLs answered, so this
 * carries the ticket fields as well as the wrapper.
 */
export interface EscalationResponse extends Partial<SupportTicket> {
  ticket?: SupportTicket | null
  conversation?: { id?: string | null } | null
}

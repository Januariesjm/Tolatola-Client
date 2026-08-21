"use client"

import { useEffect, useRef, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { logger } from "@/lib/logger"
import { appendUniqueMessage, toIncomingChatMessage, type ChatMessage, type IncomingMessageRow } from "@/lib/support/chat-message"

const log = logger.child("support.chat")

/** Minimal shape of the Supabase realtime channel the widget uses. */
interface BroadcastCapableChannel {
  send: (args: { type: "broadcast"; event: string; payload: unknown }) => unknown
}

interface UseSupportChatOptions {
  /** Conversation to subscribe to; null means no live chat yet. */
  conversationId: string | null
  /** Initial transcript, e.g. the bot's welcome message. */
  initialMessages: ChatMessage[]
  /** Called whenever an incoming message arrives, to reset the idle timer. */
  onActivity?: () => void
}

/**
 * Owns the support transcript and its realtime subscription.
 *
 * Extracted from floating-support-widget.tsx, where the subscription effect
 * mapped incoming rows to messages twice — identical code for the
 * `postgres_changes` and `broadcast` events — and deduped with two copies of
 * the same predicate. Both now come from lib/support/chat-message.
 *
 * A message can legitimately arrive over both channels, so dedupe by id is
 * load-bearing, not defensive.
 */
export function useSupportChat({ conversationId, initialMessages, onActivity }: UseSupportChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const channelRef = useRef<BroadcastCapableChannel | null>(null)

  // Keep the callback in a ref so a new function identity from the caller does
  // not tear down and re-establish the subscription on every render.
  const onActivityRef = useRef(onActivity)
  useEffect(() => {
    onActivityRef.current = onActivity
  }, [onActivity])

  useEffect(() => {
    if (!conversationId) return

    const receive = (row?: IncomingMessageRow | null) => {
      const message = toIncomingChatMessage(row)
      if (!message) return

      setMessages((prev) => appendUniqueMessage(prev, message))
      onActivityRef.current?.()
    }

    const supabase = createClient()
    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: { new?: IncomingMessageRow }) => receive(payload.new),
      )
      .on("broadcast", { event: "message" }, (payload: { payload?: IncomingMessageRow }) => {
        log.debug("broadcast message received", { conversationId })
        receive(payload.payload)
      })
      .subscribe()

    channelRef.current = channel as unknown as BroadcastCapableChannel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, [conversationId])

  /**
   * Broadcasts a just-sent message to the other participants. No-op when there
   * is no live channel, which is the case for the bot-only conversation.
   */
  const broadcastMessage = (payload: unknown) => {
    if (!channelRef.current) return false
    channelRef.current.send({ type: "broadcast", event: "message", payload })
    return true
  }

  return { messages, setMessages, broadcastMessage }
}

"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { logger } from "@/lib/logger"

const log = logger.child("hooks.ticket-message-counts")

interface TicketLike {
  conversation_id?: string | null
}

export interface TicketMessageCounts {
  /** Message count per conversation id. */
  counts: Record<string, number>
  /** Conversation ids with at least one message from a user or guest. */
  unread: Record<string, boolean>
  /** Clears the unread flag for one conversation, e.g. when its chat opens. */
  markRead: (conversationId: string) => void
}

/** A message row sender that means "waiting on us". */
function isFromCustomer(senderType: unknown): boolean {
  return senderType === "user" || senderType === "guest"
}

/**
 * Tracks message counts for the conversations linked to a set of support
 * tickets, and keeps them current via a realtime subscription on `messages`.
 *
 * Extracted from support-tickets-tab.tsx: it is self-contained, and the tab was
 * over the 500-line limit.
 */
export function useTicketMessageCounts(tickets: TicketLike[]): TicketMessageCounts {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [unread, setUnread] = useState<Record<string, boolean>>({})

  const supabase = useMemo(() => createClient(), [])

  const conversationIds = useMemo(
    () => tickets.map((t) => t.conversation_id).filter(Boolean) as string[],
    [tickets],
  )

  // Join on the ids themselves rather than the array identity, so a new
  // tickets array with the same conversations does not re-fetch.
  const conversationKey = conversationIds.join(",")

  const fetchMessageCounts = useCallback(async () => {
    try {
      const ids = conversationKey ? conversationKey.split(",") : []
      if (ids.length === 0) return

      const { data } = await supabase
        .from("messages")
        .select("conversation_id, sender_type")
        .in("conversation_id", ids)

      if (!data) return

      const nextCounts: Record<string, number> = {}
      const nextUnread: Record<string, boolean> = {}

      for (const message of data as Array<{ conversation_id: string; sender_type?: string }>) {
        nextCounts[message.conversation_id] = (nextCounts[message.conversation_id] || 0) + 1
        if (isFromCustomer(message.sender_type)) {
          nextUnread[message.conversation_id] = true
        }
      }

      setCounts(nextCounts)
      setUnread(nextUnread)
    } catch (error) {
      log.error("error fetching message counts", error)
    }
  }, [conversationKey, supabase])

  useEffect(() => {
    fetchMessageCounts()

    // Listen for realtime incoming messages across tickets.
    const channel = supabase
      .channel("support_tickets_messages_counter")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload: { new?: { conversation_id?: string; sender_type?: string } }) => {
          const newMessage = payload.new
          if (!newMessage?.conversation_id) return

          const conversationId = newMessage.conversation_id
          setCounts((prev) => ({ ...prev, [conversationId]: (prev[conversationId] || 0) + 1 }))
          if (isFromCustomer(newMessage.sender_type)) {
            setUnread((prev) => ({ ...prev, [conversationId]: true }))
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchMessageCounts, supabase])

  const markRead = useCallback((conversationId: string) => {
    setUnread((prev) => ({ ...prev, [conversationId]: false }))
  }, [])

  return { counts, unread, markRead }
}

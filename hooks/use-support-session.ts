"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { logger } from "@/lib/logger"
import type { SupportTicket } from "@/lib/support/chat-message"

const log = logger.child("support.session")

/** Ticket states that mean a conversation is still live. */
const OPEN_TICKET_STATUSES = ["open", "in_progress"]

/** Window event other components dispatch to pop the widget open. */
export const OPEN_SUPPORT_CHAT_EVENT = "open-support-chat"

/**
 * Auth state, the buyer's open support ticket, and whether the widget is open.
 *
 * Extracted from the init effect in
 * components/support/floating-support-widget.tsx. Two things about it are worth
 * keeping visible:
 *
 *   - Reconnecting to an existing ticket on mount is what makes the widget
 *     resume a conversation after a page reload rather than starting a new one.
 *     Only the most recent open ticket is used; older ones stay closed.
 *   - The ticket lookup was previously unguarded, so a Supabase error surfaced
 *     as an unhandled rejection. It is caught and logged now; a buyer who cannot
 *     be reconnected gets a fresh bot conversation instead of a broken widget.
 *
 * `currentUserId` was also tracked here and never read by anything, so it is
 * gone.
 */
export function useSupportSession() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userToken, setUserToken] = useState<string | null>(null)
  const [activeTicket, setActiveTicket] = useState<SupportTicket | null>(null)
  const [liveConversationId, setLiveConversationId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const init = async () => {
      try {
        const supabase = createClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (cancelled || !session?.user) return

        setIsAuthenticated(true)
        setUserToken(session.access_token)

        const { data: tickets, error } = await supabase
          .from("support_tickets")
          .select("*, conversations:conversation_id(*)")
          .eq("user_id", session.user.id)
          .in("status", OPEN_TICKET_STATUSES)
          .order("created_at", { ascending: false })
          .limit(1)

        if (error) throw error
        if (cancelled || !tickets?.length) return

        setActiveTicket(tickets[0])
        if (tickets[0].conversation_id) {
          setLiveConversationId(tickets[0].conversation_id)
        }
      } catch (err) {
        log.error("could not restore support session", err)
      }
    }

    init()

    const handleOpenSupport = () => setIsOpen(true)
    window.addEventListener(OPEN_SUPPORT_CHAT_EVENT, handleOpenSupport)

    return () => {
      cancelled = true
      window.removeEventListener(OPEN_SUPPORT_CHAT_EVENT, handleOpenSupport)
    }
  }, [])

  return {
    isOpen,
    setIsOpen,
    isAuthenticated,
    userToken,
    activeTicket,
    setActiveTicket,
    liveConversationId,
    setLiveConversationId,
  }
}

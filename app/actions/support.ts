"use server"

import { createClient } from "@/lib/supabase/server"
import { getOrCreateConversation, sendMessage } from "./messaging"
import { logger } from "@/lib/logger"
import { createSupportTicketSchema, formatSupportTicketIssues, type SupportTicketGuestInfo } from "@/lib/schemas/support-ticket"

const log = logger.child("app.actions.support")

export async function createSupportTicket(subject: string, message: string, priority: string = "low", guestInfo?: SupportTicketGuestInfo) {
  try {
    // A server action is a POST endpoint, so its arguments are as untrusted as a
    // request body. Previously they went straight into the insert: an empty
    // subject produced an unreadable row in the admin queue, and `priority` was
    // an unconstrained string written to a column the admin UI filters on.
    const parsed = createSupportTicketSchema.safeParse({ subject, message, priority, guestInfo })

    if (!parsed.success) {
      const issues = formatSupportTicketIssues(parsed.error)
      log.warn("rejected malformed support ticket", undefined, { issues })
      return { error: `Invalid support request: ${issues}` }
    }

    const validated = parsed.data

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user && !validated.guestInfo) {
      return { error: "Not authenticated and no guest info provided" }
    }

    // 1. Create Ticket
    const ticketData: Record<string, string> = {
      subject: validated.subject,
      description: validated.message,
      priority: validated.priority,
      status: "open",
    }

    // A signed-in user owns the ticket; otherwise it is attributed to the guest.
    if (user) {
      ticketData.user_id = user.id
    } else if (validated.guestInfo) {
      ticketData.guest_name = validated.guestInfo.name
      ticketData.guest_email = validated.guestInfo.email
    }

    const { data: ticket, error: ticketError } = await supabase.from("support_tickets").insert(ticketData).select().single()

    if (ticketError) {
      log.error("error creating ticket", ticketError)
      return { error: `Failed to create ticket: ${ticketError.message}` }
    }

    // 2. Create Support Conversation linked to this ticket
    const conversationResult = await getOrCreateConversation(
      undefined,
      undefined,
      undefined,
      undefined,
      ticket.id,
      validated.guestInfo?.guestId,
    )

    if (conversationResult.error) {
      log.error("error creating conversation for ticket", conversationResult.error)
      return { ticket, warning: "Ticket created but chat initialization failed." }
    }

    // 3. Post the initial message to the chat
    if (conversationResult.conversation) {
      await sendMessage(conversationResult.conversation.id, validated.message, undefined, undefined, validated.guestInfo ? "guest" : "user")
    }

    return { ticket, conversation: conversationResult.conversation }
  } catch (err: any) {
    log.error("panic createSupportTicket", err)
    return { error: err.message }
  }
}

export async function getSupportTicketDetails(ticketId: string) {
  const supabase = await createClient()

  // @ts-ignore
  const { data: ticket, error } = await (supabase as any)
    .from("support_tickets")
    .select(
      `
            *,
            users:user_id(full_name, email, profile_image_url)
        `,
    )
    .eq("id", ticketId)
    .single()

  if (error) {
    return { error: error.message }
  }

  return { ticket }
}

export async function deleteAllResolvedTickets() {
  try {
    const { createAdminClient } = await import("@/lib/supabase/server")
    const adminSupabase = await createAdminClient()

    // Fetch all resolved, completed, or closed support tickets
    const { data: resolvedTickets, error: fetchError } = await (adminSupabase as any)
      .from("support_tickets")
      .select("id, conversation_id")
      .in("status", ["resolved", "completed", "closed"])

    if (fetchError) {
      log.error("fetch error", fetchError)
      return { error: fetchError.message }
    }

    if (!resolvedTickets || resolvedTickets.length === 0) {
      return { success: true, count: 0, message: "No resolved or completed tickets to delete." }
    }

    const ticketIds = resolvedTickets.map((t: any) => t.id)
    const convIds = resolvedTickets.map((t: any) => t.conversation_id).filter(Boolean)

    // 1. Delete messages linked to these conversations
    if (convIds.length > 0) {
      await (adminSupabase as any).from("messages").delete().in("conversation_id", convIds)

      // 2. Delete conversations
      await (adminSupabase as any).from("conversations").delete().in("id", convIds)
    }

    // 3. Delete tickets
    const { error: deleteError } = await (adminSupabase as any).from("support_tickets").delete().in("id", ticketIds)

    if (deleteError) {
      log.error("delete error", deleteError)
      return { error: deleteError.message }
    }

    return { success: true, count: ticketIds.length }
  } catch (err: any) {
    log.error("exception", err)
    return { error: err.message }
  }
}

export async function deleteTicketPermanently(ticketId: string) {
  try {
    const { createAdminClient } = await import("@/lib/supabase/server")
    const adminSupabase = await createAdminClient()

    const { data: ticket } = await (adminSupabase as any).from("support_tickets").select("id, conversation_id").eq("id", ticketId).single()

    if (ticket?.conversation_id) {
      await (adminSupabase as any).from("messages").delete().eq("conversation_id", ticket.conversation_id)
      await (adminSupabase as any).from("conversations").delete().eq("id", ticket.conversation_id)
    }

    const { error } = await (adminSupabase as any).from("support_tickets").delete().eq("id", ticketId)
    if (error) return { error: error.message }
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

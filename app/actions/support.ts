"use server"

import { createClient } from "@/lib/supabase/server"
import { getOrCreateConversation, sendMessage } from "./messaging"

export async function createSupportTicket(subject: string, message: string, priority: string = "low") {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
            return { error: "Not authenticated" }
        }

        // 1. Create Ticket
        // @ts-ignore
        const { data: ticket, error: ticketError } = await (supabase as any)
            .from("support_tickets")
            .insert({
                user_id: user.id,
                subject,
                message, // Initial message is also the ticket description
                priority,
                status: "open",
            })
            .select()
            .single()

        if (ticketError) {
            console.error("Error creating ticket:", ticketError)
            return { error: `Failed to create ticket: ${ticketError.message}` }
        }

        // 2. Create Support Conversation linked to this ticket
        const conversationResult = await getOrCreateConversation(undefined, undefined, undefined, undefined, ticket.id)

        if (conversationResult.error) {
            console.error("Error creating conversation for ticket:", conversationResult.error)
            // We still return the ticket but warn about chat
            return { ticket, warning: "Ticket created but chat initialization failed." }
        }

        // 3. Post the initial message to the chat as well?
        // Usually the ticket 'message' is the first message.
        if (conversationResult.conversation) {
            await sendMessage(conversationResult.conversation.id, message)
        }

        return { ticket, conversation: conversationResult.conversation }
    } catch (err: any) {
        console.error("Panic createSupportTicket:", err)
        return { error: err.message }
    }
}

export async function getSupportTicketDetails(ticketId: string) {
    const supabase = await createClient()

    // @ts-ignore
    const { data: ticket, error } = await (supabase as any)
        .from("support_tickets")
        .select(`
            *,
            users:user_id(full_name, email, profile_image_url)
        `)
        .eq("id", ticketId)
        .single()

    if (error) {
        return { error: error.message }
    }

    return { ticket }
}

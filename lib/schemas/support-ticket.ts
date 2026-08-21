import { z } from "zod"

/**
 * Input validation for the support-ticket server action.
 *
 * There is no `app/api` route for support tickets -- the widget calls the
 * `createSupportTicket` server action in app/actions/support.ts, and the AI
 * escalation path posts to the external support service. A server action is
 * still a network boundary: Next.js exposes it as a POST endpoint and its
 * arguments arrive deserialised from the wire, so they are no more trustworthy
 * than a route body.
 *
 * The action previously took `subject`, `message`, `priority` and `guestInfo`
 * straight into a Supabase insert. An empty subject produced an unreadable row
 * in the admin queue, and `priority` was an unconstrained string, so a caller
 * could write any value into a column the admin UI filters and colour-codes on.
 */

/** Triage levels the admin support queue renders. */
export const supportTicketPrioritySchema = z.enum(["low", "medium", "high", "urgent"])

/**
 * Contact details for a ticket opened by someone who is not signed in.
 *
 * `guestId` ties the ticket to the browser's chat session so the conversation
 * can be reattached on the next visit.
 */
export const supportTicketGuestInfoSchema = z.object({
  name: z.string().min(1, "Guest name is required"),
  email: z.string().email("A valid guest email is required"),
  guestId: z.string().min(1, "guestId is required"),
})

/**
 * A new support ticket.
 *
 * The subject cap matches the column and the widget, which already truncates a
 * buyer's last message to 45 characters when deriving one.
 */
export const createSupportTicketSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required").max(200, "Subject must be 200 characters or fewer"),
  message: z.string().trim().min(1, "Message is required"),
  priority: supportTicketPrioritySchema.default("low"),
  guestInfo: supportTicketGuestInfoSchema.optional(),
})

export type SupportTicketPriority = z.infer<typeof supportTicketPrioritySchema>
export type SupportTicketGuestInfo = z.infer<typeof supportTicketGuestInfoSchema>
export type CreateSupportTicketInput = z.infer<typeof createSupportTicketSchema>

/**
 * Collapses Zod issues into one message for a server action's `{ error }`
 * result. Field paths only, never the rejected values -- a support message can
 * contain anything the buyer typed.
 */
export function formatSupportTicketIssues(error: z.ZodError): string {
  return error.issues.map((issue) => (issue.path.length > 0 ? `${issue.path.join(".")}: ${issue.message}` : issue.message)).join("; ")
}

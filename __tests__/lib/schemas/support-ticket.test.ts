/**
 * Tests for lib/schemas/support-ticket.ts.
 *
 * The support ticket boundary is a server action rather than an API route, but
 * its arguments still arrive over the wire. These cover both what must be
 * rejected and, importantly, what must keep working -- the widget derives a
 * subject by truncating a buyer's message, so the length rules have to
 * accommodate that.
 */

import {
  createSupportTicketSchema,
  formatSupportTicketIssues,
  supportTicketGuestInfoSchema,
  supportTicketPrioritySchema,
} from "@/lib/schemas/support-ticket"

const VALID = {
  subject: "Order never arrived",
  message: "My order from last week has not been delivered.",
  priority: "medium" as const,
}

describe("supportTicketPrioritySchema", () => {
  it.each(["low", "medium", "high", "urgent"])("accepts %s", (priority) => {
    expect(supportTicketPrioritySchema.safeParse(priority).success).toBe(true)
  })

  it("rejects an arbitrary priority the admin queue cannot render", () => {
    expect(supportTicketPrioritySchema.safeParse("SUPER-URGENT").success).toBe(false)
  })

  it("rejects a non-string priority", () => {
    expect(supportTicketPrioritySchema.safeParse(3).success).toBe(false)
  })
})

describe("createSupportTicketSchema", () => {
  it("accepts a well-formed ticket", () => {
    const parsed = createSupportTicketSchema.safeParse(VALID)

    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data.priority).toBe("medium")
  })

  it("defaults the priority to low", () => {
    const parsed = createSupportTicketSchema.safeParse({ subject: VALID.subject, message: VALID.message })

    expect(parsed.success && parsed.data.priority).toBe("low")
  })

  it("rejects an empty subject", () => {
    expect(createSupportTicketSchema.safeParse({ ...VALID, subject: "" }).success).toBe(false)
  })

  it("rejects a whitespace-only subject", () => {
    // Trimmed before the length check, so "   " is empty rather than length 3.
    expect(createSupportTicketSchema.safeParse({ ...VALID, subject: "   " }).success).toBe(false)
  })

  it("trims surrounding whitespace off the subject", () => {
    const parsed = createSupportTicketSchema.safeParse({ ...VALID, subject: "  Order never arrived  " })

    expect(parsed.success && parsed.data.subject).toBe("Order never arrived")
  })

  it("rejects an empty message", () => {
    expect(createSupportTicketSchema.safeParse({ ...VALID, message: "" }).success).toBe(false)
  })

  it("rejects a missing message", () => {
    expect(createSupportTicketSchema.safeParse({ subject: VALID.subject }).success).toBe(false)
  })

  it("accepts a subject at the 200-character cap", () => {
    expect(createSupportTicketSchema.safeParse({ ...VALID, subject: "a".repeat(200) }).success).toBe(true)
  })

  it("rejects a subject past the cap", () => {
    expect(createSupportTicketSchema.safeParse({ ...VALID, subject: "a".repeat(201) }).success).toBe(false)
  })

  it("accepts the 45-character subject the widget derives from a message", () => {
    // The widget slices a buyer's last message to 45 chars for the subject; that
    // must never be rejected.
    expect(createSupportTicketSchema.safeParse({ ...VALID, subject: "a".repeat(45) }).success).toBe(true)
  })

  it("accepts a long message body", () => {
    // Escalation sends the whole chat transcript as the message.
    expect(createSupportTicketSchema.safeParse({ ...VALID, message: "USER: hello\n".repeat(500) }).success).toBe(true)
  })

  it("rejects a non-object payload", () => {
    expect(createSupportTicketSchema.safeParse("help me").success).toBe(false)
  })

  it("strips unknown keys rather than writing them to the row", () => {
    const parsed = createSupportTicketSchema.safeParse({ ...VALID, status: "resolved", user_id: "someone-else" })

    expect(parsed.success).toBe(true)
    expect(parsed.success && parsed.data).not.toHaveProperty("status")
    expect(parsed.success && parsed.data).not.toHaveProperty("user_id")
  })
})

describe("createSupportTicketSchema guest info", () => {
  const guestInfo = { name: "Amina", email: "amina@example.com", guestId: "guest-123" }

  it("accepts a complete guest block", () => {
    expect(createSupportTicketSchema.safeParse({ ...VALID, guestInfo }).success).toBe(true)
  })

  it("treats guest info as optional for signed-in buyers", () => {
    expect(createSupportTicketSchema.safeParse(VALID).success).toBe(true)
  })

  it("rejects a malformed guest email", () => {
    expect(createSupportTicketSchema.safeParse({ ...VALID, guestInfo: { ...guestInfo, email: "not-an-email" } }).success).toBe(false)
  })

  it("rejects a guest with no name", () => {
    expect(supportTicketGuestInfoSchema.safeParse({ ...guestInfo, name: "" }).success).toBe(false)
  })

  it("rejects a guest with no guestId, which is what reattaches the conversation", () => {
    expect(supportTicketGuestInfoSchema.safeParse({ ...guestInfo, guestId: "" }).success).toBe(false)
  })
})

describe("formatSupportTicketIssues", () => {
  it("names the failing field", () => {
    const parsed = createSupportTicketSchema.safeParse({ ...VALID, subject: "" })

    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(formatSupportTicketIssues(parsed.error)).toContain("subject")
    }
  })

  it("joins multiple issues", () => {
    const parsed = createSupportTicketSchema.safeParse({ subject: "", message: "" })

    if (!parsed.success) {
      const formatted = formatSupportTicketIssues(parsed.error)
      expect(formatted).toContain("subject")
      expect(formatted).toContain("message")
      expect(formatted).toContain(";")
    }
  })

  it("does not echo the rejected value back", () => {
    // A support message can contain anything the buyer typed, including data
    // that should not end up in a log line or an error string.
    const secret = "my-card-is-4111111111111111"
    const parsed = createSupportTicketSchema.safeParse({ subject: "a".repeat(300), message: secret })

    if (!parsed.success) {
      expect(formatSupportTicketIssues(parsed.error)).not.toContain(secret)
    }
  })
})

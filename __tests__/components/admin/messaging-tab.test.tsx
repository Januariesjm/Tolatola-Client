/**
 * Tests for MessagingTab (components/admin/messaging-tab.tsx).
 *
 * The recipient search/filter and log search/filter logic itself lives in
 * lib/admin/messaging.ts (already covered) -- these tests use the real
 * exported functions and focus on the tab's own wiring: fetching the right
 * recipient list per role, the recipient search/select/clear flow, the send
 * validations and payload, and the activity-log history feed (via Supabase).
 */

import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MessagingTab } from "@/components/admin/messaging-tab"

// jsdom has no pointer capture support; Radix's Select uses it to manage the
// listbox's pointer interactions. Without this polyfill, opening the role
// dropdown throws before it can render its options.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {}
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {}
}

const mockGet = jest.fn()
const mockPost = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiGet: (...args: unknown[]) => mockGet(...args),
  clientApiPost: (...args: unknown[]) => mockPost(...args),
}))

const mockToast = jest.fn()
jest.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mockToast }) }))

const mockLimit = jest.fn()
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          order: () => ({
            limit: (...args: unknown[]) => mockLimit(...args),
          }),
        }),
      }),
    }),
  }),
}))

function customerRow(over: Record<string, unknown> = {}) {
  return { id: "c-1", full_name: "Asha Mwinyi", email: "asha@example.com", phone: "255700000001", ...over }
}

function vendorRow(over: Record<string, unknown> = {}) {
  return {
    id: "v-1",
    user_id: "u-v1",
    business_name: "Dodoma Crafts",
    phone: "255700000002",
    users: { full_name: "Baraka John", email: "baraka@example.com", phone: "255700000002" },
    ...over,
  }
}

function activityLog(over: Record<string, unknown> = {}) {
  return {
    id: "l-1",
    admin_id: "a-1",
    action: "send_message",
    resource: "user",
    details: {
      recipient_user_id: "u-1",
      recipient_email: "asha@example.com",
      recipient_name: "Asha Mwinyi",
      subject: "Welcome",
      channels: { sendEmail: true, sendInApp: false },
    },
    created_at: "2026-02-01T10:00:00Z",
    admin: { full_name: "Admin One", email: "admin@example.com" },
    ...over,
  }
}

beforeEach(() => {
  // mockReset (not clearAllMocks) so a `mockResolvedValueOnce` left unconsumed
  // by one test -- e.g. an interaction that never reached the fetch it was
  // queued for -- can't leak into the next test's first call.
  mockGet.mockReset()
  mockPost.mockReset()
  mockToast.mockReset()
  mockLimit.mockReset()
  mockGet.mockResolvedValue({ data: [] })
  mockLimit.mockResolvedValue({ data: [], error: null })
})

/** Renders and waits for both the initial customer fetch and the log fetch to settle. */
async function renderReady() {
  const view = render(<MessagingTab />)
  await waitFor(() => expect(mockGet).toHaveBeenCalledWith("admin/customers"))
  // The search input is disabled while `loadingUsers` is true. Waiting on the
  // fetch call alone only proves the request started -- it resolves as soon
  // as clientApiGet is invoked, before the promise settles and the resulting
  // setState flushes, which is what the recipient dropdown tests need.
  await waitFor(() => expect(screen.getByPlaceholderText(/type name, email, or phone of/i)).not.toBeDisabled())
  await waitFor(() => expect(screen.queryByText("Loading delivery history...")).not.toBeInTheDocument())
  return view
}

describe("MessagingTab", () => {
  it("renders the composer heading", async () => {
    await renderReady()

    expect(screen.getByText("Direct Messaging & Email Service")).toBeInTheDocument()
  })

  it("fetches customers for the default role on mount", async () => {
    await renderReady()

    expect(mockGet).toHaveBeenCalledWith("admin/customers")
  })

  it("shows a loading state for the history feed", async () => {
    mockLimit.mockReturnValue(new Promise(() => {}))
    render(<MessagingTab />)

    expect(screen.getByText("Loading delivery history...")).toBeInTheDocument()

    // Let the (unrelated) customer fetch settle before the test exits, so its
    // setState doesn't land in the next test un-acted.
    await waitFor(() => expect(screen.getByPlaceholderText(/type name, email, or phone of/i)).not.toBeDisabled())
  })

  it("shows an empty state when there is no send history", async () => {
    await renderReady()

    expect(screen.getByText("No messaging activity logs found.")).toBeInTheDocument()
  })

  it("lists a fetched activity log", async () => {
    mockLimit.mockResolvedValue({ data: [activityLog()], error: null })
    await renderReady()

    expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument()
    expect(screen.getByText("Subject: Welcome")).toBeInTheDocument()
  })

  it("narrows the history list to a search match", async () => {
    mockLimit.mockResolvedValue({
      data: [
        activityLog(),
        activityLog({ id: "l-2", details: { ...activityLog().details, recipient_name: "Baraka John", subject: "Payout notice" } }),
      ],
      error: null,
    })
    await renderReady()

    await userEvent.type(screen.getByPlaceholderText("Search history logs..."), "payout")

    expect(screen.queryByText("Asha Mwinyi")).not.toBeInTheDocument()
    expect(screen.getByText("Baraka John")).toBeInTheDocument()
  })

  describe("recipient search", () => {
    it("shows a matching customer in the dropdown", async () => {
      mockGet.mockResolvedValueOnce({ data: [customerRow()] })
      await renderReady()

      await userEvent.type(screen.getByPlaceholderText(/type name, email, or phone of customer/i), "asha")

      expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument()
      expect(screen.getByText("asha@example.com")).toBeInTheDocument()
    })

    it("shows a no-match message", async () => {
      mockGet.mockResolvedValueOnce({ data: [customerRow()] })
      await renderReady()

      await userEvent.type(screen.getByPlaceholderText(/type name, email, or phone of customer/i), "zzz")

      expect(screen.getByText("No matching customers found.")).toBeInTheDocument()
    })

    it("selects a recipient and clears the search", async () => {
      mockGet.mockResolvedValueOnce({ data: [customerRow()] })
      await renderReady()

      await userEvent.type(screen.getByPlaceholderText(/type name, email, or phone of customer/i), "asha")
      await userEvent.click(screen.getByText("Asha Mwinyi"))

      expect(screen.queryByPlaceholderText(/type name, email, or phone of customer/i)).not.toBeInTheDocument()
      expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument()
      expect(screen.getByText("asha@example.com")).toBeInTheDocument()
    })

    it("clears the selected recipient from the remove button", async () => {
      mockGet.mockResolvedValueOnce({ data: [customerRow()] })
      await renderReady()

      await userEvent.type(screen.getByPlaceholderText(/type name, email, or phone of customer/i), "asha")
      await userEvent.click(screen.getByText("Asha Mwinyi"))
      const recipientCard = screen.getByText("Asha Mwinyi").closest("div.flex.items-center.justify-between") as HTMLElement
      await userEvent.click(within(recipientCard).getByRole("button"))

      expect(screen.getByPlaceholderText(/type name, email, or phone of customer/i)).toBeInTheDocument()
    })

    it("fetches the vendor list when the role changes", async () => {
      mockGet.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [vendorRow()] })
      await renderReady()

      await userEvent.click(screen.getByRole("combobox"))
      await userEvent.click(await screen.findByText("Vendors"))

      await waitFor(() => expect(mockGet).toHaveBeenCalledWith("admin/vendors"))
    })

    it("searches the vendor list using the joined user's recipient id", async () => {
      mockGet.mockResolvedValueOnce({ data: [] }).mockResolvedValueOnce({ data: [vendorRow()] })
      await renderReady()

      await userEvent.click(screen.getByRole("combobox"))
      await userEvent.click(await screen.findByText("Vendors"))
      await waitFor(() => expect(mockGet).toHaveBeenCalledWith("admin/vendors"))

      await userEvent.type(screen.getByPlaceholderText(/type name, email, or phone of vendor/i), "dodoma")

      expect(screen.getByText("Dodoma Crafts")).toBeInTheDocument()
    })
  })

  describe("validation", () => {
    it("requires a recipient before sending", async () => {
      await renderReady()

      await userEvent.type(screen.getByLabelText(/subject/i), "Hi")
      await userEvent.type(screen.getByLabelText(/message content/i), "Body")
      await userEvent.click(screen.getByRole("button", { name: /send message/i }))

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Validation Error", description: "Please select a message recipient." }),
      )
      expect(mockPost).not.toHaveBeenCalled()
    })

    async function selectCustomer() {
      mockGet.mockResolvedValueOnce({ data: [customerRow()] })
      await renderReady()
      await userEvent.type(screen.getByPlaceholderText(/type name, email, or phone of customer/i), "asha")
      await userEvent.click(screen.getByText("Asha Mwinyi"))
    }

    it("requires a subject", async () => {
      await selectCustomer()

      await userEvent.type(screen.getByLabelText(/message content/i), "Body")
      await userEvent.click(screen.getByRole("button", { name: /send message/i }))

      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Validation Error", description: "Please enter a subject." }))
      expect(mockPost).not.toHaveBeenCalled()
    })

    it("requires a message", async () => {
      await selectCustomer()

      await userEvent.type(screen.getByLabelText(/subject/i), "Hi")
      await userEvent.click(screen.getByRole("button", { name: /send message/i }))

      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Validation Error", description: "Please enter a message." }))
      expect(mockPost).not.toHaveBeenCalled()
    })

    it("requires at least one channel", async () => {
      await selectCustomer()

      await userEvent.type(screen.getByLabelText(/subject/i), "Hi")
      await userEvent.type(screen.getByLabelText(/message content/i), "Body")
      await userEvent.click(screen.getByRole("checkbox", { name: /send email/i }))
      await userEvent.click(screen.getByRole("checkbox", { name: /in-app notification/i }))
      await userEvent.click(screen.getByRole("button", { name: /send message/i }))

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Validation Error", description: "Please select at least one channel (Email or In-App)." }),
      )
      expect(mockPost).not.toHaveBeenCalled()
    })
  })

  describe("sending", () => {
    beforeEach(() => {
      mockPost.mockResolvedValue({ message: "Direct message sent successfully." })
    })

    it("posts the composed payload for the selected recipient", async () => {
      mockGet.mockResolvedValueOnce({ data: [customerRow()] })
      await renderReady()
      await userEvent.type(screen.getByPlaceholderText(/type name, email, or phone of customer/i), "asha")
      await userEvent.click(screen.getByText("Asha Mwinyi"))

      await userEvent.type(screen.getByLabelText(/subject/i), "Welcome")
      await userEvent.type(screen.getByLabelText(/message content/i), "Glad to have you.")
      await userEvent.click(screen.getByRole("button", { name: /send message/i }))

      await waitFor(() =>
        expect(mockPost).toHaveBeenCalledWith("/admin/send-message", {
          userId: "c-1",
          subject: "Welcome",
          message: "Glad to have you.",
          sendEmail: true,
          sendInApp: true,
        }),
      )
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Success" }))
    })

    it("resets the composer and re-fetches history after a successful send", async () => {
      mockGet.mockResolvedValueOnce({ data: [customerRow()] })
      await renderReady()
      await userEvent.type(screen.getByPlaceholderText(/type name, email, or phone of customer/i), "asha")
      await userEvent.click(screen.getByText("Asha Mwinyi"))
      await userEvent.type(screen.getByLabelText(/subject/i), "Welcome")
      await userEvent.type(screen.getByLabelText(/message content/i), "Glad to have you.")

      const limitCallsBeforeSend = mockLimit.mock.calls.length
      await userEvent.click(screen.getByRole("button", { name: /send message/i }))

      await waitFor(() => expect(mockLimit.mock.calls.length).toBeGreaterThan(limitCallsBeforeSend))
      expect(screen.getByLabelText(/subject/i)).toHaveValue("")
      expect(screen.getByPlaceholderText(/type name, email, or phone of customer/i)).toBeInTheDocument()
    })

    it("shows an error and preserves the composer when the send fails", async () => {
      mockPost.mockRejectedValue(new Error("network unreachable"))
      mockGet.mockResolvedValueOnce({ data: [customerRow()] })
      await renderReady()
      await userEvent.type(screen.getByPlaceholderText(/type name, email, or phone of customer/i), "asha")
      await userEvent.click(screen.getByText("Asha Mwinyi"))
      await userEvent.type(screen.getByLabelText(/subject/i), "Welcome")
      await userEvent.type(screen.getByLabelText(/message content/i), "Glad to have you.")

      await userEvent.click(screen.getByRole("button", { name: /send message/i }))

      await waitFor(() =>
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({ title: "Error sending message", description: "network unreachable" }),
        ),
      )
      expect(screen.getByLabelText(/subject/i)).toHaveValue("Welcome")
    })
  })
})

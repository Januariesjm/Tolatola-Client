/**
 * Tests for AdminMessageDialog (components/admin/message-dialog.tsx).
 *
 * A self-contained composer: its own subject/message/channel state, its own
 * validation, and a direct call to clientApiPost. What matters is that each
 * validation rule blocks the send with the right message, a successful send
 * posts the right payload and resets/closes, and a failed send surfaces the
 * error without closing the dialog.
 */

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AdminMessageDialog } from "@/components/admin/message-dialog"

const mockPost = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiPost: (...args: unknown[]) => mockPost(...args),
}))

const mockToast = jest.fn()
jest.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mockToast }) }))

const props = {
  isOpen: true,
  onClose: jest.fn(),
  recipientId: "u-1",
  recipientName: "Asha Mwinyi",
}

beforeEach(() => {
  jest.clearAllMocks()
  mockPost.mockResolvedValue({ message: "Message sent successfully." })
})

describe("AdminMessageDialog", () => {
  it("renders nothing when closed", () => {
    render(<AdminMessageDialog {...props} isOpen={false} />)

    expect(screen.queryByText("Send Message")).not.toBeInTheDocument()
  })

  it("shows the recipient's name", () => {
    render(<AdminMessageDialog {...props} />)

    expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument()
  })

  it("defaults both channels to checked", () => {
    render(<AdminMessageDialog {...props} />)

    expect(screen.getByRole("checkbox", { name: /send email/i })).toBeChecked()
    expect(screen.getByRole("checkbox", { name: /in-app notification/i })).toBeChecked()
  })

  it("blocks sending with no subject", async () => {
    render(<AdminMessageDialog {...props} />)

    await userEvent.type(screen.getByLabelText(/message content/i), "hello there")
    await userEvent.click(screen.getByRole("button", { name: /send message/i }))

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Validation Error", description: "Please enter a subject." }))
    expect(mockPost).not.toHaveBeenCalled()
  })

  it("blocks sending with no message", async () => {
    render(<AdminMessageDialog {...props} />)

    await userEvent.type(screen.getByLabelText(/subject/i), "Hello")
    await userEvent.click(screen.getByRole("button", { name: /send message/i }))

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Validation Error", description: "Please enter a message." }))
    expect(mockPost).not.toHaveBeenCalled()
  })

  it("blocks sending with no channel selected", async () => {
    render(<AdminMessageDialog {...props} />)

    await userEvent.type(screen.getByLabelText(/subject/i), "Hello")
    await userEvent.type(screen.getByLabelText(/message content/i), "hello there")
    await userEvent.click(screen.getByRole("checkbox", { name: /send email/i }))
    await userEvent.click(screen.getByRole("checkbox", { name: /in-app notification/i }))
    await userEvent.click(screen.getByRole("button", { name: /send message/i }))

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Validation Error",
        description: "Please select at least one message channel (Email or In-App).",
      }),
    )
    expect(mockPost).not.toHaveBeenCalled()
  })

  it("sends the message with the composed payload", async () => {
    render(<AdminMessageDialog {...props} />)

    await userEvent.type(screen.getByLabelText(/subject/i), "Welcome")
    await userEvent.type(screen.getByLabelText(/message content/i), "Glad to have you.")
    await userEvent.click(screen.getByRole("button", { name: /send message/i }))

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("/admin/send-message", {
        userId: "u-1",
        subject: "Welcome",
        message: "Glad to have you.",
        sendEmail: true,
        sendInApp: true,
      }),
    )
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Success" }))
    expect(props.onClose).toHaveBeenCalledTimes(1)
  })

  it("respects an unchecked channel in the payload", async () => {
    render(<AdminMessageDialog {...props} />)

    await userEvent.type(screen.getByLabelText(/subject/i), "Welcome")
    await userEvent.type(screen.getByLabelText(/message content/i), "Glad to have you.")
    await userEvent.click(screen.getByRole("checkbox", { name: /in-app notification/i }))
    await userEvent.click(screen.getByRole("button", { name: /send message/i }))

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("/admin/send-message", expect.objectContaining({ sendEmail: true, sendInApp: false })),
    )
  })

  it("shows an error and keeps the dialog open when the send fails", async () => {
    mockPost.mockRejectedValue(new Error("network unreachable"))
    render(<AdminMessageDialog {...props} />)

    await userEvent.type(screen.getByLabelText(/subject/i), "Welcome")
    await userEvent.type(screen.getByLabelText(/message content/i), "Glad to have you.")
    await userEvent.click(screen.getByRole("button", { name: /send message/i }))

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Error sending message", description: "network unreachable" }),
      ),
    )
    expect(props.onClose).not.toHaveBeenCalled()
    // Fields survive the failure -- the user shouldn't have to retype.
    expect(screen.getByLabelText(/subject/i)).toHaveValue("Welcome")
  })

  it("shows a sending state while the request is in flight", async () => {
    let resolve!: (v: { message: string }) => void
    mockPost.mockReturnValue(new Promise((r) => (resolve = r)))
    render(<AdminMessageDialog {...props} />)

    await userEvent.type(screen.getByLabelText(/subject/i), "Welcome")
    await userEvent.type(screen.getByLabelText(/message content/i), "Glad to have you.")
    await userEvent.click(screen.getByRole("button", { name: /send message/i }))

    expect(screen.getByRole("button", { name: /sending/i })).toBeDisabled()
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled()

    resolve({ message: "ok" })
    await waitFor(() => expect(props.onClose).toHaveBeenCalled())
  })

  it("calls onClose from the Cancel button", async () => {
    render(<AdminMessageDialog {...props} />)

    await userEvent.click(screen.getByRole("button", { name: /cancel/i }))

    expect(props.onClose).toHaveBeenCalledTimes(1)
  })
})

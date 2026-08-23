import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SupportMessageBubble } from "@/components/support/support-message-bubble"
import type { ChatMessage } from "@/lib/support/chat-message"

/**
 * Tests for components/support/support-message-bubble.tsx.
 *
 * The bubble is purely presentational but branches heavily on `message.sender`
 * (bot vs. agent vs. user) for avatar visibility, the "Support Agent" label, and
 * bubble/timestamp styling. It also renders an attachment (image vs. PDF row)
 * and two independent inline action blocks gated by props separate from the
 * message itself (escalation button, inactivity countdown).
 */

function message(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: "m-1",
    sender: "bot",
    text: "Hello, how can I help?",
    timestamp: "10:00:00 AM",
    ...overrides,
  }
}

function baseProps(overrides: Partial<React.ComponentProps<typeof SupportMessageBubble>> = {}) {
  return {
    message: message(),
    isLiveConversation: false,
    isEscalating: false,
    onEscalate: jest.fn(),
    inactivityPromptActive: false,
    secondsRemaining: 0,
    onContinueSession: jest.fn(),
    onEndSession: jest.fn(),
    ...overrides,
  }
}

describe("SupportMessageBubble content", () => {
  it("renders the message text", () => {
    render(<SupportMessageBubble {...baseProps({ message: message({ text: "Your order has shipped" }) })} />)

    expect(screen.getByText("Your order has shipped")).toBeInTheDocument()
  })

  it("renders the timestamp", () => {
    render(<SupportMessageBubble {...baseProps({ message: message({ timestamp: "11:45:30 AM" }) })} />)

    expect(screen.getByText("11:45:30 AM")).toBeInTheDocument()
  })

  it("preserves newlines in the message text", () => {
    render(<SupportMessageBubble {...baseProps({ message: message({ text: "Line one\nLine two" }) })} />)

    const text = screen.getByText((_, element) => element?.textContent === "Line one\nLine two")
    expect(text).toHaveClass("whitespace-pre-wrap")
  })
})

describe("SupportMessageBubble sender-dependent rendering", () => {
  it("shows the agent avatar and label for a live agent message", () => {
    render(<SupportMessageBubble {...baseProps({ message: message({ sender: "agent" }) })} />)

    expect(screen.getByText("Support Agent")).toBeInTheDocument()
    expect(screen.getByAltText("Support Agent")).toBeInTheDocument()
  })

  it("shows the bot avatar under the bot's display name, without the agent label", () => {
    render(<SupportMessageBubble {...baseProps({ message: message({ sender: "bot" }) })} />)

    expect(screen.queryByText("Support Agent")).not.toBeInTheDocument()
    expect(screen.getByAltText("Moureen Tyler")).toBeInTheDocument()
  })

  it("renders no avatar for the user's own messages", () => {
    render(<SupportMessageBubble {...baseProps({ message: message({ sender: "user" }) })} />)

    expect(screen.queryByAltText("Support Agent")).not.toBeInTheDocument()
    expect(screen.queryByAltText("Moureen Tyler")).not.toBeInTheDocument()
  })

  it("aligns the user's bubble to the end of the row", () => {
    const { container } = render(<SupportMessageBubble {...baseProps({ message: message({ sender: "user" }) })} />)

    expect(container.firstChild).toHaveClass("ml-auto", "flex-row-reverse")
  })

  it("aligns an incoming bubble to the start of the row", () => {
    const { container } = render(<SupportMessageBubble {...baseProps({ message: message({ sender: "bot" }) })} />)

    expect(container.firstChild).toHaveClass("mr-auto")
    expect(container.firstChild).not.toHaveClass("ml-auto")
  })

  it("gives the user's bubble the blue sender styling", () => {
    render(<SupportMessageBubble {...baseProps({ message: message({ sender: "user", text: "user bubble" }) })} />)

    const bubble = screen.getByText("user bubble").parentElement
    expect(bubble).toHaveClass("bg-blue-600", "text-white")
  })

  it("gives an agent's bubble emerald styling distinct from the bot", () => {
    render(<SupportMessageBubble {...baseProps({ message: message({ sender: "agent", text: "agent bubble" }) })} />)

    const bubble = screen.getByText("agent bubble").parentElement
    expect(bubble).toHaveClass("bg-emerald-50", "border-emerald-200")
  })

  it("gives the bot's bubble the default white styling", () => {
    render(<SupportMessageBubble {...baseProps({ message: message({ sender: "bot", text: "bot bubble" }) })} />)

    const bubble = screen.getByText("bot bubble").parentElement
    expect(bubble).toHaveClass("bg-white", "text-slate-900")
  })

  it("right-aligns the timestamp only for the user's own messages", () => {
    render(<SupportMessageBubble {...baseProps({ message: message({ sender: "user", timestamp: "1:00:00 PM" }) })} />)

    expect(screen.getByText("1:00:00 PM")).toHaveClass("text-right")
  })
})

describe("SupportMessageBubble attachments", () => {
  it("renders nothing extra when there is no attachment", () => {
    render(<SupportMessageBubble {...baseProps()} />)

    expect(screen.queryByAltText("User Attachment")).not.toBeInTheDocument()
    expect(screen.queryByText(/PDF Document/)).not.toBeInTheDocument()
  })

  it("renders an image attachment inline when attachmentType is an image", () => {
    render(
      <SupportMessageBubble
        {...baseProps({
          message: message({ attachmentUrl: "https://cdn.example.com/photo.jpg", attachmentType: "image/jpeg" }),
        })}
      />,
    )

    const img = screen.getByAltText("User Attachment") as HTMLImageElement
    expect(img.src).toBe("https://cdn.example.com/photo.jpg")
  })

  it("treats a data: image URL as an image even without attachmentType", () => {
    render(
      <SupportMessageBubble
        {...baseProps({
          message: message({ attachmentUrl: "data:image/png;base64,abc123" }),
        })}
      />,
    )

    expect(screen.getByAltText("User Attachment")).toBeInTheDocument()
  })

  it("renders a PDF as a download row with its filename", () => {
    render(
      <SupportMessageBubble
        {...baseProps({
          message: message({
            attachmentUrl: "https://cdn.example.com/invoice.pdf",
            attachmentType: "application/pdf",
            attachmentName: "invoice.pdf",
          }),
        })}
      />,
    )

    const link = screen.getByRole("link", { name: /invoice\.pdf/ })
    expect(link).toHaveAttribute("href", "https://cdn.example.com/invoice.pdf")
    expect(link).toHaveAttribute("target", "_blank")
  })

  it("falls back to a generic label for a PDF with no name", () => {
    render(
      <SupportMessageBubble
        {...baseProps({
          message: message({ attachmentUrl: "https://cdn.example.com/file.pdf", attachmentType: "application/pdf" }),
        })}
      />,
    )

    expect(screen.getByText("PDF Document")).toBeInTheDocument()
  })
})

describe("SupportMessageBubble escalation action", () => {
  it("shows the escalation button when the message opts in and no human is live", () => {
    render(
      <SupportMessageBubble
        {...baseProps({ message: message({ showEscalationOption: true }), isLiveConversation: false })}
      />,
    )

    expect(screen.getByRole("button", { name: /connect to human support/i })).toBeInTheDocument()
  })

  it("hides the escalation button once a human is already on the conversation", () => {
    render(
      <SupportMessageBubble
        {...baseProps({ message: message({ showEscalationOption: true }), isLiveConversation: true })}
      />,
    )

    expect(screen.queryByRole("button", { name: /connect to human support/i })).not.toBeInTheDocument()
  })

  it("omits the escalation button when the message does not request it", () => {
    render(<SupportMessageBubble {...baseProps({ message: message({ showEscalationOption: false }) })} />)

    expect(screen.queryByRole("button", { name: /connect to human support/i })).not.toBeInTheDocument()
  })

  it("calls onEscalate when clicked", async () => {
    const onEscalate = jest.fn()
    render(
      <SupportMessageBubble
        {...baseProps({ message: message({ showEscalationOption: true }), onEscalate })}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: /connect to human support/i }))

    expect(onEscalate).toHaveBeenCalledTimes(1)
  })

  it("shows a connecting label and disables the button while escalating", () => {
    render(
      <SupportMessageBubble
        {...baseProps({ message: message({ showEscalationOption: true }), isEscalating: true })}
      />,
    )

    const button = screen.getByRole("button", { name: /connecting to support/i })
    expect(button).toBeDisabled()
  })
})

describe("SupportMessageBubble inactivity prompt", () => {
  it("shows the countdown when the message requests it and the prompt is active", () => {
    render(
      <SupportMessageBubble
        {...baseProps({
          message: message({ showInactivityPrompt: true }),
          inactivityPromptActive: true,
          secondsRemaining: 125,
        })}
      />,
    )

    expect(screen.getByText("Ending automatically in 2m 5s...")).toBeInTheDocument()
  })

  it("hides the countdown when the prompt is not active", () => {
    render(
      <SupportMessageBubble
        {...baseProps({ message: message({ showInactivityPrompt: true }), inactivityPromptActive: false })}
      />,
    )

    expect(screen.queryByText(/Ending automatically/)).not.toBeInTheDocument()
  })

  it("hides the countdown when the message does not carry the flag", () => {
    render(
      <SupportMessageBubble
        {...baseProps({ message: message({ showInactivityPrompt: false }), inactivityPromptActive: true })}
      />,
    )

    expect(screen.queryByText(/Ending automatically/)).not.toBeInTheDocument()
  })

  it("calls onContinueSession from the Continue button", async () => {
    const onContinueSession = jest.fn()
    render(
      <SupportMessageBubble
        {...baseProps({
          message: message({ showInactivityPrompt: true }),
          inactivityPromptActive: true,
          onContinueSession,
        })}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: /continue/i }))

    expect(onContinueSession).toHaveBeenCalledTimes(1)
  })

  it("calls onEndSession from the End Chat button", async () => {
    const onEndSession = jest.fn()
    render(
      <SupportMessageBubble
        {...baseProps({
          message: message({ showInactivityPrompt: true }),
          inactivityPromptActive: true,
          onEndSession,
        })}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: /end chat/i }))

    expect(onEndSession).toHaveBeenCalledTimes(1)
  })
})

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ChatDialog } from "@/components/messaging/chat-dialog"

/**
 * Tests for components/messaging/chat-dialog.tsx.
 *
 * The behaviour worth pinning is how the escalated AI transcript is merged with
 * live messages. A ticket's description holds the flattened bot conversation, and
 * the same turns often also exist as real message rows -- so the dialog shows
 * only the history entries that are *not* already present. Getting that wrong
 * shows an agent every turn twice.
 *
 * Loading is also gated on the dialog being open: a closed dialog must not
 * subscribe or fetch, or every ticket row in the admin list would open a
 * realtime channel.
 */

const getConversationMessages = jest.fn()
const markMessagesAsRead = jest.fn()
const sendMessage = jest.fn()
const uploadChatFile = jest.fn()
const toast = jest.fn()
const removeChannel = jest.fn()
const channelSend = jest.fn()

jest.mock("@/hooks/use-toast", () => ({ toast: (...args: unknown[]) => toast(...args) }))
jest.mock("@/app/actions/messaging", () => ({
  getConversationMessages: (...args: unknown[]) => getConversationMessages(...args),
  markMessagesAsRead: (...args: unknown[]) => markMessagesAsRead(...args),
  sendMessage: (...args: unknown[]) => sendMessage(...args),
  uploadChatFile: (...args: unknown[]) => uploadChatFile(...args),
}))
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: "agent-1" } } }) },
    channel: () => {
      const channel: Record<string, unknown> = {}
      channel.on = () => channel
      channel.subscribe = () => channel
      channel.send = channelSend
      return channel
    },
    removeChannel,
  }),
}))

function message(overrides: Record<string, unknown> = {}) {
  return {
    id: "m-1",
    message: "Hello, how can I help?",
    created_at: "2026-02-01T10:00:00.000Z",
    sender_id: "agent-1",
    sender_type: "agent",
    sender: { id: "agent-1", full_name: "Support Agent" },
    ...overrides,
  }
}

const BASE = {
  open: true,
  onOpenChange: jest.fn(),
  conversationId: "conv-1",
  shopName: "Tola Support",
}

beforeEach(() => {
  jest.clearAllMocks()
  getConversationMessages.mockResolvedValue({ messages: [] })
  sendMessage.mockResolvedValue({ message: message({ id: "m-new", message: "Sent reply" }) })
  uploadChatFile.mockResolvedValue({ url: "https://cdn/file.pdf", type: "application/pdf" })
})

describe("ChatDialog logging", () => {
  it("traces through the structured logger, not a raw console.log", async () => {
    const consoleLog = jest.spyOn(console, "log").mockImplementation(() => {})

    render(<ChatDialog {...BASE} />)
    await waitFor(() => expect(getConversationMessages).toHaveBeenCalled())

    const rawTrace = consoleLog.mock.calls.some(([arg]) => typeof arg === "string" && arg.includes("[ChatDialog]"))
    expect(rawTrace).toBe(false)
    expect(consoleLog).toHaveBeenCalledWith(expect.stringContaining("[debug] messaging.chat-dialog:"))

    consoleLog.mockRestore()
  })
})

describe("ChatDialog open and closed", () => {
  it("renders nothing when closed", () => {
    render(<ChatDialog {...BASE} open={false} />)

    expect(screen.queryByText("Tola Support")).not.toBeInTheDocument()
  })

  it("does not load messages while closed", async () => {
    render(<ChatDialog {...BASE} open={false} />)

    await waitFor(() => expect(screen.queryByText("Tola Support")).not.toBeInTheDocument())
    expect(getConversationMessages).not.toHaveBeenCalled()
  })

  it("loads the conversation when opened", async () => {
    render(<ChatDialog {...BASE} />)

    await waitFor(() => expect(getConversationMessages).toHaveBeenCalledWith("conv-1"))
  })

  it("marks the conversation read when opened", async () => {
    render(<ChatDialog {...BASE} />)

    await waitFor(() => expect(markMessagesAsRead).toHaveBeenCalledWith("conv-1"))
  })

  it("tears down the realtime channel on close", async () => {
    const { unmount } = render(<ChatDialog {...BASE} />)
    await waitFor(() => expect(getConversationMessages).toHaveBeenCalled())

    unmount()

    expect(removeChannel).toHaveBeenCalled()
  })
})

describe("ChatDialog header", () => {
  it("names the counterparty", async () => {
    render(<ChatDialog {...BASE} />)

    expect(await screen.findByText("Tola Support")).toBeInTheDocument()
  })

  it("shows the product when the chat is about one", async () => {
    render(<ChatDialog {...BASE} productName="Kanga Fabric" />)

    expect(await screen.findByText("Kanga Fabric")).toBeInTheDocument()
  })

  it("falls back to a generic subtitle without a product", async () => {
    render(<ChatDialog {...BASE} />)

    expect(await screen.findByText(/Customer Support Live Chat/i)).toBeInTheDocument()
  })

  it("counts the messages on show", async () => {
    getConversationMessages.mockResolvedValue({ messages: [message(), message({ id: "m-2" })] })
    render(<ChatDialog {...BASE} />)

    expect(await screen.findByText("2 msgs")).toBeInTheDocument()
  })

  it("uses the singular for a single message", async () => {
    getConversationMessages.mockResolvedValue({ messages: [message()] })
    render(<ChatDialog {...BASE} />)

    expect(await screen.findByText("1 msg")).toBeInTheDocument()
  })
})

describe("ChatDialog transcript", () => {
  it("shows an empty state when there is nothing to show", async () => {
    render(<ChatDialog {...BASE} />)

    expect(await screen.findByText("No messages yet")).toBeInTheDocument()
  })

  it("renders the loaded messages", async () => {
    getConversationMessages.mockResolvedValue({ messages: [message({ message: "Your parcel is on its way" })] })
    render(<ChatDialog {...BASE} />)

    expect(await screen.findByText("Your parcel is on its way")).toBeInTheDocument()
  })

  it("renders the escalated transcript when there are no message rows", async () => {
    render(<ChatDialog {...BASE} ticketDescription={"USER: where is my order\nBOT: let me check"} />)

    // The parsed history renders into the dialog's portal, which mounts a tick
    // after the initial render, so this settles rather than asserting eagerly.
    await waitFor(() => expect(screen.getByText("where is my order")).toBeInTheDocument())
    expect(screen.getByText("let me check")).toBeInTheDocument()
  })

  it("attributes a parsed bot turn to the AI agent", async () => {
    render(<ChatDialog {...BASE} ticketDescription="BOT: I can help with that" />)

    await waitFor(() => expect(screen.getByText(/Moureen Tyler \(AI Agent\)/)).toBeInTheDocument())
  })

  it("does not repeat a history turn that already exists as a message row", async () => {
    getConversationMessages.mockResolvedValue({ messages: [message({ message: "where is my order" })] })
    render(<ChatDialog {...BASE} ticketDescription={"USER: where is my order\nBOT: let me check"} />)

    await waitFor(() => expect(screen.getAllByText("where is my order")).toHaveLength(1))
    expect(screen.getByText("let me check")).toBeInTheDocument()
  })

  it("ignores whitespace differences when de-duplicating history", async () => {
    getConversationMessages.mockResolvedValue({ messages: [message({ message: "  where is my order  " })] })
    render(<ChatDialog {...BASE} ticketDescription="USER: where is my order" />)

    await waitFor(() => expect(getConversationMessages).toHaveBeenCalled())
    expect(screen.getAllByText(/where is my order/)).toHaveLength(1)
  })

  it("shows the messages when there is no escalated history", async () => {
    getConversationMessages.mockResolvedValue({ messages: [message({ message: "Just a normal ticket" })] })
    render(<ChatDialog {...BASE} ticketDescription="" />)

    expect(await screen.findByText("Just a normal ticket")).toBeInTheDocument()
  })

  it("survives a failed load without crashing", async () => {
    getConversationMessages.mockResolvedValue({ error: "permission denied" })
    render(<ChatDialog {...BASE} />)

    expect(await screen.findByText("No messages yet")).toBeInTheDocument()
  })
})

describe("ChatDialog sending", () => {
  const composer = () => screen.getByPlaceholderText(/Type your message/i)

  it("sends the typed reply as an agent", async () => {
    render(<ChatDialog {...BASE} />)
    await userEvent.type(composer(), "On its way")
    await userEvent.click(screen.getByRole("button", { name: /send message/i }))

    await waitFor(() => expect(sendMessage).toHaveBeenCalledWith("conv-1", "On its way", undefined, undefined, "agent"))
  })

  it("clears the composer after sending", async () => {
    render(<ChatDialog {...BASE} />)
    await userEvent.type(composer(), "On its way")
    await userEvent.click(screen.getByRole("button", { name: /send message/i }))

    await waitFor(() => expect(composer()).toHaveValue(""))
  })

  it("shows the sent message immediately", async () => {
    render(<ChatDialog {...BASE} />)
    await userEvent.type(composer(), "On its way")
    await userEvent.click(screen.getByRole("button", { name: /send message/i }))

    expect(await screen.findByText("Sent reply")).toBeInTheDocument()
  })

  it("relays the sent message to the other participant", async () => {
    render(<ChatDialog {...BASE} />)
    await userEvent.type(composer(), "On its way")
    await userEvent.click(screen.getByRole("button", { name: /send message/i }))

    await waitFor(() => expect(channelSend).toHaveBeenCalledWith(expect.objectContaining({ type: "broadcast", event: "message" })))
  })

  it("disables send for an empty composer", async () => {
    render(<ChatDialog {...BASE} />)

    expect(await screen.findByRole("button", { name: /send message/i })).toBeDisabled()
  })

  it("disables send for whitespace only", async () => {
    render(<ChatDialog {...BASE} />)
    await userEvent.type(composer(), "   ")

    expect(screen.getByRole("button", { name: /send message/i })).toBeDisabled()
  })

  it("sends nothing when Enter is pressed on an empty composer", async () => {
    render(<ChatDialog {...BASE} />)
    await userEvent.type(composer(), "{Enter}")

    expect(sendMessage).not.toHaveBeenCalled()
  })

  it("trims the message before sending", async () => {
    render(<ChatDialog {...BASE} />)
    await userEvent.type(composer(), "  padded  ")
    await userEvent.click(screen.getByRole("button", { name: /send message/i }))

    await waitFor(() => expect(sendMessage).toHaveBeenCalledWith("conv-1", "padded", undefined, undefined, "agent"))
  })

  it("surfaces a send failure and keeps the text", async () => {
    sendMessage.mockResolvedValue({ error: "conversation closed" })
    render(<ChatDialog {...BASE} />)
    await userEvent.type(composer(), "On its way")
    await userEvent.click(screen.getByRole("button", { name: /send message/i }))

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Error", description: "conversation closed", variant: "destructive" }),
      ),
    )
    expect(composer()).toHaveValue("On its way")
  })
})

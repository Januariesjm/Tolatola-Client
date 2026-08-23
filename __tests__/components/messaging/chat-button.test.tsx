import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ChatButton } from "@/components/messaging/chat-button"

/**
 * Tests for components/messaging/chat-button.tsx.
 *
 * The button's whole job is to turn a click into a conversation id and hand
 * it to ChatDialog -- or to fail loudly (via toast) without ever opening the
 * dialog. ChatDialog itself is mocked out here (it has its own suite) so
 * these tests can pin the three outcomes of handleOpenChat: success, a
 * `{ error }` result, and a thrown exception -- plus the odd-but-real branch
 * where the server action returns neither.
 */

const getOrCreateConversation = jest.fn()
const toast = jest.fn()

jest.mock("@/hooks/use-toast", () => ({ toast: (...args: unknown[]) => toast(...args) }))
jest.mock("@/app/actions/messaging", () => ({
  getOrCreateConversation: (...args: unknown[]) => getOrCreateConversation(...args),
}))
jest.mock("@/components/messaging/chat-dialog", () => ({
  ChatDialog: (props: any) => (
    <div data-testid="chat-dialog">
      <span data-testid="chat-dialog-open">{String(props.open)}</span>
      <span data-testid="chat-dialog-conversation">{props.conversationId}</span>
      <span data-testid="chat-dialog-shop">{props.shopName}</span>
      <span data-testid="chat-dialog-product">{props.productName ?? ""}</span>
    </div>
  ),
}))

beforeEach(() => {
  jest.clearAllMocks()
})

describe("ChatButton label and default state", () => {
  it("shows the default label", () => {
    render(<ChatButton />)

    expect(screen.getByRole("button", { name: "Chat with Seller" })).toBeInTheDocument()
  })

  it("shows a custom label when provided", () => {
    render(<ChatButton label="Ask a question" />)

    expect(screen.getByRole("button", { name: "Ask a question" })).toBeInTheDocument()
  })

  it("does not render the dialog before a conversation exists", () => {
    render(<ChatButton />)

    expect(screen.queryByTestId("chat-dialog")).not.toBeInTheDocument()
  })
})

describe("ChatButton success path", () => {
  it("requests a conversation with the given ids on click", async () => {
    getOrCreateConversation.mockResolvedValue({ conversation: { id: "conv-1" } })
    render(<ChatButton shopId="shop-1" productId="prod-1" receiverId="user-2" orderId="order-9" />)

    await userEvent.click(screen.getByRole("button"))

    await waitFor(() => expect(getOrCreateConversation).toHaveBeenCalledWith("shop-1", "prod-1", "user-2", "order-9"))
  })

  it("opens the dialog with the returned conversation id", async () => {
    getOrCreateConversation.mockResolvedValue({ conversation: { id: "conv-42" } })
    render(<ChatButton />)

    await userEvent.click(screen.getByRole("button"))

    expect(await screen.findByTestId("chat-dialog-conversation")).toHaveTextContent("conv-42")
    expect(screen.getByTestId("chat-dialog-open")).toHaveTextContent("true")
  })

  it("passes the shop name through to the dialog", async () => {
    getOrCreateConversation.mockResolvedValue({ conversation: { id: "conv-1" } })
    render(<ChatButton shopName="Kanga Emporium" />)

    await userEvent.click(screen.getByRole("button"))

    expect(await screen.findByTestId("chat-dialog-shop")).toHaveTextContent("Kanga Emporium")
  })

  it("falls back to 'Seller' when no shop name is given", async () => {
    getOrCreateConversation.mockResolvedValue({ conversation: { id: "conv-1" } })
    render(<ChatButton />)

    await userEvent.click(screen.getByRole("button"))

    expect(await screen.findByTestId("chat-dialog-shop")).toHaveTextContent("Seller")
  })

  it("passes the product name through when given", async () => {
    getOrCreateConversation.mockResolvedValue({ conversation: { id: "conv-1" } })
    render(<ChatButton productName="Kanga Fabric" />)

    await userEvent.click(screen.getByRole("button"))

    expect(await screen.findByTestId("chat-dialog-product")).toHaveTextContent("Kanga Fabric")
  })

  it("shows a loading label while the request is in flight", async () => {
    let resolve!: (value: unknown) => void
    getOrCreateConversation.mockReturnValue(new Promise((r) => (resolve = r)))
    render(<ChatButton />)

    await userEvent.click(screen.getByRole("button"))

    expect(screen.getByRole("button", { name: "Loading..." })).toBeDisabled()

    resolve({ conversation: { id: "conv-1" } })
    await waitFor(() => expect(screen.getByRole("button")).not.toBeDisabled())
  })
})

describe("ChatButton error result", () => {
  it("toasts the server-reported error", async () => {
    getOrCreateConversation.mockResolvedValue({ error: "Shop not found" })
    render(<ChatButton />)

    await userEvent.click(screen.getByRole("button"))

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Error", description: "Shop not found", variant: "destructive" }),
      ),
    )
  })

  it("does not open the dialog when the action errors", async () => {
    getOrCreateConversation.mockResolvedValue({ error: "Shop not found" })
    render(<ChatButton />)

    await userEvent.click(screen.getByRole("button"))

    await waitFor(() => expect(toast).toHaveBeenCalled())
    expect(screen.queryByTestId("chat-dialog")).not.toBeInTheDocument()
  })
})

describe("ChatButton neither error nor conversation", () => {
  it("does not open a dialog or toast when the action returns nothing usable", async () => {
    getOrCreateConversation.mockResolvedValue({})
    render(<ChatButton />)

    await userEvent.click(screen.getByRole("button"))

    await waitFor(() => expect(getOrCreateConversation).toHaveBeenCalled())
    expect(screen.queryByTestId("chat-dialog")).not.toBeInTheDocument()
    expect(toast).not.toHaveBeenCalled()
  })
})

describe("ChatButton thrown errors", () => {
  it("toasts the thrown error's message", async () => {
    getOrCreateConversation.mockRejectedValue(new Error("network down"))
    render(<ChatButton />)

    await userEvent.click(screen.getByRole("button"))

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Unexpected Error", description: "network down", variant: "destructive" }),
      ),
    )
  })

  it("falls back to a generic message when the thrown error has none", async () => {
    getOrCreateConversation.mockRejectedValue({})
    render(<ChatButton />)

    await userEvent.click(screen.getByRole("button"))

    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(expect.objectContaining({ title: "Unexpected Error", description: "Failed to open chat" })),
    )
  })

  it("re-enables the button after a thrown error", async () => {
    getOrCreateConversation.mockRejectedValue(new Error("boom"))
    render(<ChatButton />)

    await userEvent.click(screen.getByRole("button"))

    await waitFor(() => expect(screen.getByRole("button")).not.toBeDisabled())
  })
})

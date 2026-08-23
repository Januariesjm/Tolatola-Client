import React from "react"
import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MessagesContent } from "@/components/messaging/messages-content"

/**
 * Tests for components/messaging/messages-content.tsx.
 *
 * This is the conversation inbox: a loading state, an empty state, and a list
 * whose rows have to figure out -- from raw conversation rows plus whichever
 * side the current user is on -- which counterpart's name/avatar to show, and
 * fall back sensibly when shop/user data is thin. It also deep-links: a
 * `?id=` in the URL should auto-open that conversation once the list loads,
 * and the realtime subscription should refresh the list and clean up on
 * unmount.
 */

const getUserConversations = jest.fn()

let mockSearchParams = new URLSearchParams()

jest.mock("next/navigation", () => ({
  useSearchParams: () => mockSearchParams,
}))

jest.mock("@/app/actions/messaging", () => ({
  getUserConversations: (...args: unknown[]) => getUserConversations(...args),
}))

jest.mock("@/components/messaging/chat-dialog", () => ({
  ChatDialog: (props: any) => (
    <div data-testid="chat-dialog">
      <span data-testid="chat-dialog-open">{String(props.open)}</span>
      <span data-testid="chat-dialog-conversation">{props.conversationId}</span>
      <span data-testid="chat-dialog-shop">{props.shopName}</span>
      <button data-testid="chat-dialog-close" onClick={() => props.onOpenChange(false)}>
        close
      </button>
    </div>
  ),
}))

const removeChannel = jest.fn()
const channelCallbacks: Array<() => void> = []
let mockAuthUser: { id: string } | null = { id: "user-1" }

jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: { getUser: async () => ({ data: { user: mockAuthUser } }) },
    channel: () => {
      const channel: Record<string, unknown> = {}
      channel.on = (_event: string, _filter: unknown, callback: () => void) => {
        channelCallbacks.push(callback)
        return channel
      }
      channel.subscribe = () => channel
      return channel
    },
    removeChannel: (...args: unknown[]) => removeChannel(...args),
  }),
}))

function conversation(overrides: Record<string, unknown> = {}) {
  return {
    id: "conv-1",
    last_message: "See you soon",
    last_message_at: "2026-02-01T10:00:00.000Z",
    customer: { id: "user-1", full_name: "Cassy Customer" },
    vendor: { id: "vendor-1", full_name: "Vera Vendor" },
    shop: { id: "shop-1", name: "Kanga Emporium" },
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  channelCallbacks.length = 0
  mockSearchParams = new URLSearchParams()
  mockAuthUser = { id: "user-1" }
  getUserConversations.mockResolvedValue({ conversations: [] })
})

describe("MessagesContent loading", () => {
  it("shows a loading message before conversations resolve", async () => {
    let resolve!: (value: unknown) => void
    getUserConversations.mockReturnValue(new Promise((r) => (resolve = r)))
    render(<MessagesContent />)

    expect(screen.getByText("Loading conversations...")).toBeInTheDocument()

    resolve({ conversations: [] })
    await waitFor(() => expect(screen.queryByText("Loading conversations...")).not.toBeInTheDocument())
  })
})

describe("MessagesContent empty state", () => {
  it("shows the empty state when there are no conversations", async () => {
    render(<MessagesContent />)

    expect(await screen.findByText("No conversations yet")).toBeInTheDocument()
    expect(screen.getByText("Start chatting with sellers from product pages")).toBeInTheDocument()
  })
})

describe("MessagesContent list rendering", () => {
  it("shows the shop name when the conversation has a shop", async () => {
    getUserConversations.mockResolvedValue({ conversations: [conversation()] })
    render(<MessagesContent />)

    expect(await screen.findByText("Kanga Emporium")).toBeInTheDocument()
  })

  it("falls back to the counterpart's name when there is no shop", async () => {
    getUserConversations.mockResolvedValue({
      conversations: [conversation({ shop: null })],
    })
    render(<MessagesContent />)

    // current user (user-1) is the customer, so the other party is the vendor
    expect(await screen.findByText("Vera Vendor")).toBeInTheDocument()
  })

  it("shows the last message preview", async () => {
    getUserConversations.mockResolvedValue({ conversations: [conversation({ last_message: "Is this still available?" })] })
    render(<MessagesContent />)

    expect(await screen.findByText("Is this still available?")).toBeInTheDocument()
  })

  it("shows a placeholder when there is no last message", async () => {
    getUserConversations.mockResolvedValue({ conversations: [conversation({ last_message: null })] })
    render(<MessagesContent />)

    expect(await screen.findByText("Start a conversation")).toBeInTheDocument()
  })

  it("shows a formatted date when last_message_at is present", async () => {
    getUserConversations.mockResolvedValue({ conversations: [conversation({ last_message_at: "2026-02-01T10:00:00.000Z" })] })
    render(<MessagesContent />)

    expect(await screen.findByText(new Date("2026-02-01T10:00:00.000Z").toLocaleDateString())).toBeInTheDocument()
  })

  it("omits the date when last_message_at is absent", async () => {
    getUserConversations.mockResolvedValue({ conversations: [conversation({ last_message_at: null, last_message: "hey" })] })
    render(<MessagesContent />)

    await screen.findByText("hey")
    expect(screen.queryByText(/\d{1,2}\/\d{1,2}\/\d{4}/)).not.toBeInTheDocument()
  })

  it("skips a falsy conversation entry without crashing", async () => {
    getUserConversations.mockResolvedValue({ conversations: [null, conversation({ id: "conv-real" })] })
    render(<MessagesContent />)

    expect(await screen.findByText("Kanga Emporium")).toBeInTheDocument()
  })

  it("renders multiple conversations", async () => {
    getUserConversations.mockResolvedValue({
      conversations: [
        conversation({ id: "conv-1", shop: { id: "s1", name: "Shop One" } }),
        conversation({ id: "conv-2", shop: { id: "s2", name: "Shop Two" } }),
      ],
    })
    render(<MessagesContent />)

    expect(await screen.findByText("Shop One")).toBeInTheDocument()
    expect(screen.getByText("Shop Two")).toBeInTheDocument()
  })

  it("falls back to the avatar initial from the shop name", async () => {
    getUserConversations.mockResolvedValue({ conversations: [conversation({ shop: { name: "Kanga Emporium" } })] })
    render(<MessagesContent />)

    await screen.findByText("Kanga Emporium")
    expect(screen.getByText("K")).toBeInTheDocument()
  })

  it("falls back to the counterpart's initial when there is no shop name", async () => {
    getUserConversations.mockResolvedValue({ conversations: [conversation({ shop: null })] })
    render(<MessagesContent />)

    await screen.findByText("Vera Vendor")
    expect(screen.getByText("V")).toBeInTheDocument()
  })

  it("falls back to 'S' when neither shop nor counterpart has a name", async () => {
    getUserConversations.mockResolvedValue({
      conversations: [conversation({ shop: null, vendor: { id: "vendor-1", full_name: "" } })],
    })
    render(<MessagesContent />)

    await waitFor(() => expect(getUserConversations).toHaveBeenCalled())
    expect(screen.getByText("S")).toBeInTheDocument()
  })

  it("shows the customer's name as the counterpart when the current user is the vendor", async () => {
    getUserConversations.mockResolvedValue({
      conversations: [
        conversation({
          shop: null,
          customer: { id: "some-other-customer", full_name: "Cassy Customer" },
          vendor: { id: "user-1", full_name: "Vera Vendor" },
        }),
      ],
    })
    render(<MessagesContent />)

    // currentUserId resolves to "user-1" from the mocked auth client, and that
    // matches the vendor here, so isCustomer is false and the counterpart
    // shown is the customer, not the vendor.
    expect(await screen.findByText("Cassy Customer")).toBeInTheDocument()
    expect(screen.queryByText("Vera Vendor")).not.toBeInTheDocument()
  })
})

describe("MessagesContent current user resolution", () => {
  it("does not crash when auth.getUser resolves with no user", async () => {
    mockAuthUser = null
    getUserConversations.mockResolvedValue({ conversations: [conversation({ shop: { name: "No Auth User Shop" } })] })
    render(<MessagesContent />)

    expect(await screen.findByText("No Auth User Shop")).toBeInTheDocument()
  })

  it("treats every conversation as the vendor's view when currentUserId never resolves", async () => {
    mockAuthUser = null
    getUserConversations.mockResolvedValue({
      conversations: [
        conversation({
          shop: null,
          customer: { id: "cust-1", full_name: "Cassy Customer" },
          vendor: { id: "vend-1", full_name: "Vera Vendor" },
        }),
      ],
    })
    render(<MessagesContent />)

    // With no currentUserId, customer.id === null is false, so isCustomer is
    // false and the counterpart shown is the customer.
    expect(await screen.findByText("Cassy Customer")).toBeInTheDocument()
  })
})

describe("MessagesContent opening a conversation", () => {
  it("opens the dialog when a conversation row is clicked", async () => {
    getUserConversations.mockResolvedValue({ conversations: [conversation()] })
    render(<MessagesContent />)

    const row = await screen.findByText("Kanga Emporium")
    await userEvent.click(row)

    expect(await screen.findByTestId("chat-dialog-conversation")).toHaveTextContent("conv-1")
    expect(screen.getByTestId("chat-dialog-shop")).toHaveTextContent("Kanga Emporium")
  })

  it("uses the vendor name as the dialog title when there is no shop", async () => {
    getUserConversations.mockResolvedValue({ conversations: [conversation({ shop: null })] })
    render(<MessagesContent />)

    const row = await screen.findByText("Vera Vendor")
    await userEvent.click(row)

    expect(await screen.findByTestId("chat-dialog-shop")).toHaveTextContent("Vera Vendor")
  })

  it("falls back to the customer's name for the dialog title when shop and vendor names are blank", async () => {
    // The row heading falls back to "Chat" too (it only ever looks at
    // shop/otherUser), but handleOpenChat's shopName calculation checks
    // vendor *and then* customer regardless of which side is "otherUser",
    // so the opened dialog gets the customer's name here.
    getUserConversations.mockResolvedValue({
      conversations: [
        conversation({
          shop: null,
          vendor: { id: "vendor-1", full_name: "" },
          customer: { id: "user-1", full_name: "Cassy Customer" },
        }),
      ],
    })
    render(<MessagesContent />)

    const row = await screen.findByText("Chat")
    await userEvent.click(row)

    expect(await screen.findByTestId("chat-dialog-shop")).toHaveTextContent("Cassy Customer")
  })

  it("falls back to 'Chat' for the dialog title when shop, vendor, and customer names are all blank", async () => {
    getUserConversations.mockResolvedValue({
      conversations: [
        conversation({
          shop: null,
          vendor: { id: "vendor-1", full_name: "" },
          customer: { id: "user-1", full_name: "" },
        }),
      ],
    })
    render(<MessagesContent />)

    const row = await screen.findByText("Chat")
    await userEvent.click(row)

    expect(await screen.findByTestId("chat-dialog-shop")).toHaveTextContent("Chat")
  })

  it("closes the dialog when the dialog reports closed", async () => {
    getUserConversations.mockResolvedValue({ conversations: [conversation()] })
    render(<MessagesContent />)

    const row = await screen.findByText("Kanga Emporium")
    await userEvent.click(row)
    await screen.findByTestId("chat-dialog")

    await userEvent.click(screen.getByTestId("chat-dialog-close"))

    await waitFor(() => expect(screen.queryByTestId("chat-dialog")).not.toBeInTheDocument())
  })
})

describe("MessagesContent deep linking", () => {
  it("auto-opens the conversation matching the id in the URL", async () => {
    mockSearchParams = new URLSearchParams({ id: "conv-2" })
    getUserConversations.mockResolvedValue({
      conversations: [conversation({ id: "conv-1" }), conversation({ id: "conv-2", shop: { name: "Deep Linked Shop" } })],
    })
    render(<MessagesContent />)

    expect(await screen.findByTestId("chat-dialog-conversation")).toHaveTextContent("conv-2")
    expect(screen.getByTestId("chat-dialog-shop")).toHaveTextContent("Deep Linked Shop")
  })

  it("does nothing when the URL id does not match any conversation", async () => {
    mockSearchParams = new URLSearchParams({ id: "does-not-exist" })
    getUserConversations.mockResolvedValue({ conversations: [conversation()] })
    render(<MessagesContent />)

    await waitFor(() => expect(getUserConversations).toHaveBeenCalled())
    expect(screen.queryByTestId("chat-dialog")).not.toBeInTheDocument()
  })
})

describe("MessagesContent realtime updates", () => {
  it("subscribes to conversation changes and reloads the list on an event", async () => {
    render(<MessagesContent />)
    await waitFor(() => expect(getUserConversations).toHaveBeenCalledTimes(1))
    expect(channelCallbacks.length).toBeGreaterThan(0)

    getUserConversations.mockResolvedValue({ conversations: [conversation({ shop: { name: "Freshly Loaded" } })] })
    await act(async () => {
      channelCallbacks[0]()
    })

    expect(await screen.findByText("Freshly Loaded")).toBeInTheDocument()
    expect(getUserConversations).toHaveBeenCalledTimes(2)
  })

  it("removes the realtime channel on unmount", async () => {
    const { unmount } = render(<MessagesContent />)
    await waitFor(() => expect(getUserConversations).toHaveBeenCalled())

    unmount()

    expect(removeChannel).toHaveBeenCalled()
  })
})

describe("MessagesContent failed load", () => {
  it("shows the empty state when the action returns no conversations field", async () => {
    getUserConversations.mockResolvedValue({ error: "boom" })
    render(<MessagesContent />)

    expect(await screen.findByText("No conversations yet")).toBeInTheDocument()
  })
})

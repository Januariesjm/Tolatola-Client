import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"

/**
 * Tests for components/layout/mobile-bottom-nav.tsx.
 *
 * Four tabs (Home, Categories, Messages, Cart) that highlight based on the
 * current pathname, plus two independent badge counts: a cart badge read
 * (and kept in sync) from localStorage, and a messages badge that is the sum
 * of a global unread-notifications count and each conversation's own
 * unread_count -- fetched only when a Supabase session exists. The
 * Categories tab opens a Radix Sheet listing categories fetched from the
 * API, sorted with "services" last and translated via getCategoryTranslation.
 *
 * jsdom has no Pointer Capture API, which Radix's Sheet (built on
 * @radix-ui/react-dialog) touches when its trigger is clicked, so it's
 * polyfilled below -- same fix used in language-switcher.test.tsx for
 * Radix's DropdownMenu.
 */

if (typeof Element !== "undefined") {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {}
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {}
  }
}

// Use the real English strings so selectors match the copy users actually see.
jest.mock("@/lib/i18n/language-context", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { translations } = require("@/lib/i18n/translations")
  return {
    useLanguage: () => ({
      t: (key: string) => translations.en[key] ?? key,
      language: "en",
      setLanguage: jest.fn(),
    }),
  }
})

let mockPathname = "/"
jest.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
}))

const clientApiGet = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiGet: (...a: unknown[]) => clientApiGet(...a),
}))

const fetchUnreadCount = jest.fn()
jest.mock("@/lib/services/notifications.service", () => ({
  fetchUnreadCount: (...a: unknown[]) => fetchUnreadCount(...a),
}))

const getUserConversations = jest.fn()
jest.mock("@/app/actions/messaging", () => ({
  getUserConversations: (...a: unknown[]) => getUserConversations(...a),
}))

const getSession = jest.fn()
const removeChannel = jest.fn()
/**
 * One client instance for every call, matching production (see
 * cart-popover/notification-popover suites for the same fixture): the
 * component calls createClient() directly in render and in effects, so a
 * fresh object per call would make dependency arrays unstable.
 */
jest.mock("@/lib/supabase/client", () => {
  let client: Record<string, unknown> | undefined
  return {
    createClient: () => {
      client ??= {
        auth: {
          getSession: () => getSession(),
          onAuthStateChange: () => ({ data: { subscription: { unsubscribe: jest.fn() } } }),
        },
        channel: () => {
          const channel: Record<string, unknown> = {}
          channel.on = () => channel
          channel.subscribe = () => channel
          return channel
        },
        removeChannel,
      }
      return client
    },
  }
})

const SIGNED_IN = { data: { session: { user: { id: "u1" }, access_token: "t" } } }
const SIGNED_OUT = { data: { session: null } }

function apiCategory(overrides: Record<string, unknown> = {}) {
  return {
    id: "1",
    name: "Agriculture",
    slug: "agriculture",
    parent_id: null,
    ...overrides,
  }
}

/** The trigger for the Categories Sheet -- a plain button, addressed by its label. */
const categoriesTrigger = () => screen.getByRole("button", { name: /categories/i })

beforeEach(() => {
  jest.clearAllMocks()
  mockPathname = "/"
  clientApiGet.mockResolvedValue({ data: [] })
  fetchUnreadCount.mockResolvedValue(0)
  getUserConversations.mockResolvedValue({ conversations: [] })
  getSession.mockResolvedValue(SIGNED_OUT)
  localStorage.clear()
})

describe("MobileBottomNav tabs", () => {
  it("renders the four tabs with their labels", () => {
    render(<MobileBottomNav />)

    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute("href", "/")
    expect(categoriesTrigger()).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /messages/i })).toHaveAttribute("href", "/messages")
    expect(screen.getByRole("link", { name: /cart/i })).toHaveAttribute("href", "/cart")
  })

  it("highlights Home when the pathname is the homepage", () => {
    mockPathname = "/"
    render(<MobileBottomNav />)

    expect(screen.getByRole("link", { name: /home/i })).toHaveClass("text-[#1D61E7]")
    expect(screen.getByRole("link", { name: /messages/i })).not.toHaveClass("text-[#1D61E7]")
    expect(screen.getByRole("link", { name: /cart/i })).not.toHaveClass("text-[#1D61E7]")
  })

  it("highlights Messages when the pathname is /messages", () => {
    mockPathname = "/messages"
    render(<MobileBottomNav />)

    expect(screen.getByRole("link", { name: /messages/i })).toHaveClass("text-[#1D61E7]")
    expect(screen.getByRole("link", { name: /home/i })).not.toHaveClass("text-[#1D61E7]")
  })

  it("highlights Cart when the pathname is /cart", () => {
    mockPathname = "/cart"
    render(<MobileBottomNav />)

    expect(screen.getByRole("link", { name: /cart/i })).toHaveClass("text-[#1D61E7]")
    expect(screen.getByRole("link", { name: /home/i })).not.toHaveClass("text-[#1D61E7]")
  })

  it("highlights nothing on an unrelated route", () => {
    mockPathname = "/shop"
    render(<MobileBottomNav />)

    expect(screen.getByRole("link", { name: /home/i })).not.toHaveClass("text-[#1D61E7]")
    expect(screen.getByRole("link", { name: /messages/i })).not.toHaveClass("text-[#1D61E7]")
    expect(screen.getByRole("link", { name: /cart/i })).not.toHaveClass("text-[#1D61E7]")
  })
})

describe("MobileBottomNav cart badge", () => {
  function seedCart(items: unknown[]) {
    localStorage.setItem("cart", JSON.stringify(items))
  }

  it("shows no badge for an empty cart", () => {
    render(<MobileBottomNav />)

    expect(screen.getByRole("link", { name: /cart/i })).toHaveTextContent("Cart")
    expect(screen.getByRole("link", { name: /cart/i }).textContent).toBe("Cart")
  })

  it("counts units rather than rows", () => {
    seedCart([{ quantity: 3 }, { quantity: 2 }])
    render(<MobileBottomNav />)

    expect(screen.getByRole("link", { name: /cart/i })).toHaveTextContent("5")
  })

  it("caps the badge at 99+", () => {
    seedCart([{ quantity: 150 }])
    render(<MobileBottomNav />)

    expect(screen.getByRole("link", { name: /cart/i })).toHaveTextContent("99+")
  })

  it("follows a cartUpdated event dispatched by another surface", async () => {
    seedCart([{ quantity: 1 }])
    render(<MobileBottomNav />)

    seedCart([{ quantity: 4 }])
    window.dispatchEvent(new Event("cartUpdated"))

    await waitFor(() => expect(screen.getByRole("link", { name: /cart/i })).toHaveTextContent("4"))
  })

  it("follows a storage event from another tab", async () => {
    seedCart([{ quantity: 1 }])
    render(<MobileBottomNav />)

    seedCart([{ quantity: 1 }, { quantity: 1 }])
    window.dispatchEvent(new Event("storage"))

    await waitFor(() => expect(screen.getByRole("link", { name: /cart/i })).toHaveTextContent("2"))
  })
})

describe("MobileBottomNav messages badge", () => {
  it("fetches nothing and shows no badge when signed out", async () => {
    render(<MobileBottomNav />)

    await waitFor(() => expect(getSession).toHaveBeenCalled())
    expect(fetchUnreadCount).not.toHaveBeenCalled()
    expect(screen.getByRole("link", { name: /messages/i }).textContent).toBe("Messages")
  })

  it("shows the global unread count when signed in", async () => {
    getSession.mockResolvedValue(SIGNED_IN)
    fetchUnreadCount.mockResolvedValue(3)
    render(<MobileBottomNav />)

    await waitFor(() => expect(screen.getByRole("link", { name: /messages/i })).toHaveTextContent("3"))
  })

  it("adds unread conversation counts to the global count", async () => {
    getSession.mockResolvedValue(SIGNED_IN)
    fetchUnreadCount.mockResolvedValue(2)
    getUserConversations.mockResolvedValue({
      conversations: [{ unread_count: 3 }, { unread_count: 1 }],
    })
    render(<MobileBottomNav />)

    await waitFor(() => expect(screen.getByRole("link", { name: /messages/i })).toHaveTextContent("6"))
  })

  it("treats a conversation with no unread_count as zero", async () => {
    getSession.mockResolvedValue(SIGNED_IN)
    fetchUnreadCount.mockResolvedValue(1)
    getUserConversations.mockResolvedValue({ conversations: [{ unread_count: undefined }] })
    render(<MobileBottomNav />)

    await waitFor(() => expect(screen.getByRole("link", { name: /messages/i })).toHaveTextContent("1"))
  })

  it("caps the badge at 9+", async () => {
    getSession.mockResolvedValue(SIGNED_IN)
    fetchUnreadCount.mockResolvedValue(42)
    render(<MobileBottomNav />)

    await waitFor(() => expect(screen.getByRole("link", { name: /messages/i })).toHaveTextContent("9+"))
  })

  it("does not crash when the unread sources fail", async () => {
    getSession.mockResolvedValue(SIGNED_IN)
    fetchUnreadCount.mockRejectedValue(new Error("down"))
    getUserConversations.mockRejectedValue(new Error("down"))

    expect(() => render(<MobileBottomNav />)).not.toThrow()
    await waitFor(() => expect(getSession).toHaveBeenCalled())
  })
})

describe("MobileBottomNav categories sheet", () => {
  it("always offers an All Categories tile once opened", async () => {
    const user = userEvent.setup()
    render(<MobileBottomNav />)

    await user.click(categoriesTrigger())

    expect(await screen.findByRole("link", { name: /all/i })).toHaveAttribute("href", "/shop")
  })

  it("lists fetched categories with their translated names", async () => {
    clientApiGet.mockResolvedValue({
      data: [apiCategory({ id: "1", name: "Raw DB Name", slug: "agriculture" })],
    })
    const user = userEvent.setup()
    render(<MobileBottomNav />)

    await user.click(categoriesTrigger())

    // category.agriculture -> "Agriculture" in the real English translations.
    expect(await screen.findByText("Agriculture")).toBeInTheDocument()
    expect(screen.queryByText("Raw DB Name")).not.toBeInTheDocument()
  })

  it("links each category tile to the shop filtered by its slug", async () => {
    clientApiGet.mockResolvedValue({
      data: [apiCategory({ id: "1", name: "Handicrafts", slug: "handicrafts" })],
    })
    const user = userEvent.setup()
    render(<MobileBottomNav />)

    await user.click(categoriesTrigger())

    expect(await screen.findByRole("link", { name: /handicrafts/i })).toHaveAttribute("href", "/shop?category=handicrafts")
  })

  it("excludes subcategories (rows with a parent_id) from the tile list", async () => {
    clientApiGet.mockResolvedValue({
      data: [
        apiCategory({ id: "1", name: "Agriculture", slug: "agriculture" }),
        apiCategory({ id: "2", name: "Crops", slug: "crops", parent_id: "1" }),
      ],
    })
    const user = userEvent.setup()
    render(<MobileBottomNav />)

    await user.click(categoriesTrigger())

    await screen.findByText("Agriculture")
    expect(screen.queryByText("Crops")).not.toBeInTheDocument()
  })

  it("always sorts the services category to the end", async () => {
    clientApiGet.mockResolvedValue({
      data: [
        apiCategory({ id: "1", name: "Services", slug: "services" }),
        apiCategory({ id: "2", name: "Agriculture", slug: "agriculture" }),
      ],
    })
    const user = userEvent.setup()
    render(<MobileBottomNav />)

    await user.click(categoriesTrigger())
    await screen.findByText("Agriculture")

    const links = screen.getAllByRole("link")
    expect(links[links.length - 1]).toHaveAttribute("href", "/shop?category=services")
  })

  it("closes the sheet when a category tile is clicked", async () => {
    clientApiGet.mockResolvedValue({
      data: [apiCategory({ id: "1", name: "Agriculture", slug: "agriculture" })],
    })
    const user = userEvent.setup()
    render(<MobileBottomNav />)

    await user.click(categoriesTrigger())
    const agricultureLink = await screen.findByRole("link", { name: /agriculture/i })
    await user.click(agricultureLink)

    await waitFor(() => expect(screen.queryByText("Agriculture")).not.toBeInTheDocument())
  })

  it("does not crash and leaves the list empty when the category fetch fails", async () => {
    clientApiGet.mockRejectedValue(new Error("network down"))
    const user = userEvent.setup()

    expect(() => render(<MobileBottomNav />)).not.toThrow()
    await waitFor(() => expect(clientApiGet).toHaveBeenCalledWith("categories"))

    await user.click(categoriesTrigger())
    expect(await screen.findByRole("link", { name: /all/i })).toBeInTheDocument()
  })
})

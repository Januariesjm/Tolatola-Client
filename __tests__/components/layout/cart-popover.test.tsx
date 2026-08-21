import React from "react"
import { render, screen, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CartPopover } from "@/components/layout/cart-popover"

/**
 * Tests for components/layout/cart-popover.tsx.
 *
 * The cart lives in localStorage and every surface that mutates it dispatches a
 * `cartUpdated` event, so this component's correctness is about staying in sync
 * with that: it must reflect changes made elsewhere in the app, and its own
 * edits must write through and re-broadcast so the badge on other surfaces
 * follows.
 *
 * Item identity is the other load-bearing detail. The same product in two
 * variants is two rows, so changing the quantity of one must not touch the
 * other.
 */

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }))
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}))

function cartItem(overrides: Record<string, unknown> = {}) {
  return {
    product_id: "p1",
    quantity: 1,
    product: { id: "p1", name: "Kanga Fabric", price: 12000, images: ["https://cdn/kanga.jpg"] },
    ...overrides,
  }
}

/** Seeds localStorage the way the rest of the app writes the cart. */
function seedCart(items: unknown[]) {
  localStorage.setItem("cart", JSON.stringify(items))
}

function readCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]")
}

/** Opens the popover; on desktop it opens on hover. */
async function openCart() {
  await userEvent.click(screen.getByRole("button"))
}

beforeEach(() => {
  localStorage.clear()
  // Desktop by default: the mobile branch swaps hover for tap.
  window.innerWidth = 1280
})

describe("CartPopover badge", () => {
  it("shows no badge for an empty cart", () => {
    seedCart([])
    render(<CartPopover />)

    expect(screen.getByRole("button").textContent).toBe("")
  })

  it("counts units rather than rows", () => {
    seedCart([cartItem({ quantity: 3 }), cartItem({ product_id: "p2", quantity: 2 })])
    render(<CartPopover />)

    expect(screen.getByRole("button")).toHaveTextContent("5")
  })

  it("caps the badge at 99+", () => {
    seedCart([cartItem({ quantity: 150 })])
    render(<CartPopover />)

    expect(screen.getByRole("button")).toHaveTextContent("99+")
  })

  it("shows an exact count at the cap boundary", () => {
    seedCart([cartItem({ quantity: 99 })])
    render(<CartPopover />)

    expect(screen.getByRole("button")).toHaveTextContent("99")
  })
})

describe("CartPopover syncing with the rest of the app", () => {
  it("picks up a cart written before it mounted", () => {
    seedCart([cartItem({ quantity: 2 })])
    render(<CartPopover />)

    expect(screen.getByRole("button")).toHaveTextContent("2")
  })

  it("follows a cartUpdated event from another surface", async () => {
    seedCart([cartItem()])
    render(<CartPopover />)

    seedCart([cartItem({ quantity: 4 })])
    act(() => {
      window.dispatchEvent(new Event("cartUpdated"))
    })

    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("4"))
  })

  it("follows a storage event from another tab", async () => {
    seedCart([cartItem()])
    render(<CartPopover />)

    seedCart([cartItem(), cartItem({ product_id: "p2" })])
    act(() => {
      window.dispatchEvent(new Event("storage"))
    })

    await waitFor(() => expect(screen.getByRole("button")).toHaveTextContent("2"))
  })

  it("treats a missing cart key as empty rather than crashing", () => {
    localStorage.removeItem("cart")

    expect(() => render(<CartPopover />)).not.toThrow()
  })
})

describe("CartPopover contents", () => {
  it("shows an empty state with a route back to the shop", async () => {
    seedCart([])
    render(<CartPopover />)
    await openCart()

    expect(await screen.findByText("Your cart is empty")).toBeInTheDocument()
    expect(screen.getByRole("link")).toHaveAttribute("href", "/shop")
  })

  it("lists the cart lines", async () => {
    seedCart([cartItem(), cartItem({ product_id: "p2", product: { id: "p2", name: "Batik Wrap", price: 8000 } })])
    render(<CartPopover />)
    await openCart()

    expect(await screen.findByText("Kanga Fabric")).toBeInTheDocument()
    expect(screen.getByText("Batik Wrap")).toBeInTheDocument()
  })

  it("labels a single item in the singular", async () => {
    seedCart([cartItem()])
    render(<CartPopover />)
    await openCart()

    expect(await screen.findByText("1 item")).toBeInTheDocument()
  })

  it("labels several items in the plural", async () => {
    seedCart([cartItem({ quantity: 2 })])
    render(<CartPopover />)
    await openCart()

    expect(await screen.findByText("2 items")).toBeInTheDocument()
  })

  it("totals the line prices", async () => {
    seedCart([cartItem({ quantity: 2 }), cartItem({ product_id: "p2", product: { id: "p2", name: "Batik", price: 8000 } })])
    render(<CartPopover />)
    await openCart()

    expect(await screen.findByText(/TZS 32,000/)).toBeInTheDocument()
  })

  it("shows the variant badges", async () => {
    seedCart([cartItem({ selected_color: { name: "Red" }, selected_size: "XL" })])
    render(<CartPopover />)
    await openCart()

    expect(await screen.findByText("Red")).toBeInTheDocument()
    expect(screen.getByText("XL")).toBeInTheDocument()
  })

  it("offers routes to the cart page and to checkout", async () => {
    seedCart([cartItem()])
    render(<CartPopover />)
    await openCart()

    await waitFor(() => {
      const hrefs = screen.getAllByRole("link").map((l) => l.getAttribute("href"))
      expect(hrefs).toContain("/cart")
      expect(hrefs).toContain("/checkout")
    })
  })
})

describe("CartPopover editing", () => {
  /** The +/- controls carry only icons, so they are addressed positionally. */
  async function quantityControls() {
    const buttons = await screen.findAllByRole("button")
    return buttons
  }

  it("writes an increased quantity through to storage", async () => {
    seedCart([cartItem({ quantity: 1 })])
    render(<CartPopover />)
    await openCart()

    const buttons = await quantityControls()
    // trigger, decrease, increase, remove
    await userEvent.click(buttons[2])

    await waitFor(() => expect(readCart()[0].quantity).toBe(2))
  })

  it("writes a decreased quantity through to storage", async () => {
    seedCart([cartItem({ quantity: 3 })])
    render(<CartPopover />)
    await openCart()

    const buttons = await quantityControls()
    await userEvent.click(buttons[1])

    await waitFor(() => expect(readCart()[0].quantity).toBe(2))
  })

  it("never lets a quantity fall below one", async () => {
    // Removing is a separate control; decrementing to zero would leave a line
    // in the cart contributing nothing.
    seedCart([cartItem({ quantity: 1 })])
    render(<CartPopover />)
    await openCart()

    const buttons = await quantityControls()
    await userEvent.click(buttons[1])

    await waitFor(() => expect(readCart()[0].quantity).toBe(1))
  })

  it("removes a line from storage", async () => {
    seedCart([cartItem()])
    render(<CartPopover />)
    await openCart()

    const buttons = await quantityControls()
    await userEvent.click(buttons[3])

    await waitFor(() => expect(readCart()).toHaveLength(0))
  })

  it("edits only the variant that was changed", async () => {
    // Both rows are the same product_id; identity includes colour and size.
    seedCart([
      cartItem({ quantity: 1, selected_color: { name: "Red" }, selected_size: "S" }),
      cartItem({ quantity: 1, selected_color: { name: "Blue" }, selected_size: "M" }),
    ])
    render(<CartPopover />)
    await openCart()

    const buttons = await quantityControls()
    await userEvent.click(buttons[2])

    await waitFor(() => {
      const cart = readCart()
      expect(cart[0].quantity).toBe(2)
      expect(cart[1].quantity).toBe(1)
    })
  })

  it("removes only the variant that was removed", async () => {
    seedCart([
      cartItem({ selected_color: { name: "Red" }, selected_size: "S" }),
      cartItem({ selected_color: { name: "Blue" }, selected_size: "M" }),
    ])
    render(<CartPopover />)
    await openCart()

    const buttons = await quantityControls()
    await userEvent.click(buttons[3])

    await waitFor(() => {
      const cart = readCart()
      expect(cart).toHaveLength(1)
      expect(cart[0].selected_color.name).toBe("Blue")
    })
  })

  it("re-broadcasts cartUpdated so other surfaces follow", async () => {
    const listener = jest.fn()
    window.addEventListener("cartUpdated", listener)
    seedCart([cartItem()])
    render(<CartPopover />)
    await openCart()

    const buttons = await quantityControls()
    await userEvent.click(buttons[2])

    await waitFor(() => expect(listener).toHaveBeenCalled())
    window.removeEventListener("cartUpdated", listener)
  })
})

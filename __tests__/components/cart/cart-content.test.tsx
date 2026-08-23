import React from "react"
import { render, screen, within, waitFor, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CartContent } from "@/components/cart/cart-content"

/**
 * Tests for components/cart/cart-content.tsx.
 *
 * This is the full cart page (as opposed to the header popover): it reads the
 * cart straight out of localStorage, lets a buyer adjust quantity or remove a
 * line, and totals subtotal + a flat delivery fee into what checkout will
 * charge. It also gates the checkout button behind an async Supabase auth
 * check, so the button starts disabled and only becomes clickable once that
 * check resolves.
 *
 * `t()` is mocked to return its key verbatim so assertions can target stable
 * strings instead of real copy.
 */

const mockPush = jest.fn()
const mockGetUser = jest.fn()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), refresh: jest.fn(), back: jest.fn(), forward: jest.fn(), prefetch: jest.fn() }),
}))

jest.mock("@/lib/i18n/language-context", () => ({
  useLanguage: () => ({ t: (key: string) => key, language: "en" }),
}))

// The component's own auth check, mocked directly (rather than relying on the
// jest.setup.ts default) so the "still checking" test below can hold it
// pending indefinitely instead of racing a real resolution.
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { getUser: mockGetUser } }),
}))

/** Renders and lets the async auth-check effect settle before returning. */
async function renderCart() {
  const result = render(<CartContent />)
  await act(async () => {})
  return result
}

function cartItem(overrides: Record<string, unknown> = {}) {
  return {
    product_id: "p1",
    quantity: 1,
    product: { id: "p1", name: "Kanga Fabric", price: 12000, stock_quantity: 10, images: ["https://cdn/kanga.jpg"] },
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

/** Scopes to a single cart-line Card, identified by its remove button. */
function cardFor(productName: string) {
  const heading = screen.getByText(productName)
  const card = heading.closest('[data-slot="card"]') as HTMLElement
  return within(card)
}

beforeEach(() => {
  localStorage.clear()
  mockPush.mockClear()
  mockGetUser.mockReset().mockResolvedValue({ data: { user: null } })
})

describe("CartContent empty state", () => {
  it("shows the empty message and a route back to the shop", async () => {
    seedCart([])
    await renderCart()

    expect(screen.getByText("cart.empty")).toBeInTheDocument()
    const link = screen.getByRole("link", { name: "cart.continue_shopping" })
    expect(link).toHaveAttribute("href", "/shop")
  })

  it("treats a missing cart key as empty rather than crashing", async () => {
    localStorage.removeItem("cart")

    await renderCart()

    expect(screen.getByText("cart.empty")).toBeInTheDocument()
  })

  it("shows zero items in the header count", async () => {
    seedCart([])
    await renderCart()

    expect(screen.getByText("0 cart.items_in_cart")).toBeInTheDocument()
  })
})

describe("CartContent line items", () => {
  it("renders each line's product name and quantity", async () => {
    seedCart([cartItem({ quantity: 2 }), cartItem({ product_id: "p2", product: { id: "p2", name: "Batik Wrap", price: 8000, stock_quantity: 5 } })])
    await renderCart()

    expect(screen.getByText("Kanga Fabric")).toBeInTheDocument()
    expect(screen.getByText("Batik Wrap")).toBeInTheDocument()
    expect(cardFor("Kanga Fabric").getByText("2")).toBeInTheDocument()
  })

  it("counts distinct lines rather than total units in the header count", async () => {
    // Two lines, six total units -- the header shows the line count (2), not 6.
    seedCart([cartItem({ quantity: 3 }), cartItem({ product_id: "p2", quantity: 3, product: { id: "p2", name: "Batik Wrap", price: 8000 } })])
    await renderCart()

    expect(screen.getByText("2 cart.items_in_cart")).toBeInTheDocument()
  })

  it("shows the line total as price times quantity", async () => {
    seedCart([cartItem({ quantity: 3 })])
    await renderCart()

    expect(cardFor("Kanga Fabric").getByText("TZS 36,000")).toBeInTheDocument()
  })

  it("shows the colour and size badges when the line has variants", async () => {
    seedCart([cartItem({ selected_color: { name: "Red" }, selected_size: "XL" })])
    await renderCart()

    expect(screen.getByText(/Red/)).toBeInTheDocument()
    expect(screen.getByText(/XL/)).toBeInTheDocument()
  })

  it("renders the same product twice when it is in two variants", async () => {
    seedCart([
      cartItem({ selected_color: { name: "Red" }, selected_size: "S" }),
      cartItem({ selected_color: { name: "Blue" }, selected_size: "M" }),
    ])
    await renderCart()

    expect(screen.getAllByText("Kanga Fabric")).toHaveLength(2)
  })

  it("prefers the variant image over the product's own image", async () => {
    seedCart([
      cartItem({
        selected_color: { name: "Red", image: "https://cdn/red.jpg" },
        product: { id: "p1", name: "Kanga Fabric", price: 12000, images: ["https://cdn/default.jpg"] },
      }),
    ])
    await renderCart()

    expect(screen.getByRole("img", { name: "Kanga Fabric" })).toHaveAttribute("src", "https://cdn/red.jpg")
  })

  it("falls back to a generated placeholder when the product has no images", async () => {
    seedCart([cartItem({ product: { id: "p1", name: "Kanga Fabric", price: 12000, stock_quantity: 10 } })])
    await renderCart()

    const img = screen.getByRole("img", { name: "Kanga Fabric" })
    expect(img.getAttribute("src")).toContain("/placeholder.svg")
    expect(img.getAttribute("src")).toContain(encodeURIComponent("Kanga Fabric"))
  })
})

describe("CartContent totals", () => {
  it("sums line totals into a subtotal and adds the flat delivery fee", async () => {
    seedCart([cartItem({ quantity: 2 }), cartItem({ product_id: "p2", product: { id: "p2", name: "Batik Wrap", price: 8000 } })])
    await renderCart()

    // subtotal: 2*12000 + 1*8000 = 32000; delivery: 5000; total: 37000
    expect(screen.getByText("TZS 32,000")).toBeInTheDocument()
    expect(screen.getByText("TZS 5,000")).toBeInTheDocument()
    expect(screen.getByText("TZS 37,000")).toBeInTheDocument()
  })
})

describe("CartContent quantity controls", () => {
  function quantityButtons(productName: string) {
    const scope = cardFor(productName)
    const buttons = scope.getAllByRole("button")
    // JSX order within a card: remove (has a title), then minus, then plus.
    const [, minus, plus] = buttons
    return { minus, plus }
  }

  it("increments the quantity and writes it through to storage", async () => {
    seedCart([cartItem({ quantity: 1 })])
    await renderCart()

    const { plus } = quantityButtons("Kanga Fabric")
    await userEvent.click(plus)

    await waitFor(() => expect(readCart()[0].quantity).toBe(2))
    expect(cardFor("Kanga Fabric").getByText("2")).toBeInTheDocument()
  })

  it("decrements the quantity and writes it through to storage", async () => {
    seedCart([cartItem({ quantity: 3 })])
    await renderCart()

    const { minus } = quantityButtons("Kanga Fabric")
    await userEvent.click(minus)

    await waitFor(() => expect(readCart()[0].quantity).toBe(2))
  })

  it("disables the decrement button at a quantity of one", async () => {
    seedCart([cartItem({ quantity: 1 })])
    await renderCart()

    const { minus } = quantityButtons("Kanga Fabric")
    expect(minus).toBeDisabled()
  })

  it("disables the increment button once quantity reaches available stock", async () => {
    seedCart([cartItem({ quantity: 5, product: { id: "p1", name: "Kanga Fabric", price: 12000, stock_quantity: 5 } })])
    await renderCart()

    const { plus } = quantityButtons("Kanga Fabric")
    expect(plus).toBeDisabled()
  })

  it("re-broadcasts cartUpdated so other surfaces (e.g. the header badge) follow", async () => {
    const listener = jest.fn()
    window.addEventListener("cartUpdated", listener)
    seedCart([cartItem({ quantity: 1 })])
    await renderCart()

    const { plus } = quantityButtons("Kanga Fabric")
    await userEvent.click(plus)

    await waitFor(() => expect(listener).toHaveBeenCalled())
    window.removeEventListener("cartUpdated", listener)
  })

  it("edits only the variant line that was changed", async () => {
    seedCart([
      cartItem({ quantity: 1, selected_color: { name: "Red" }, selected_size: "S" }),
      cartItem({ quantity: 1, selected_color: { name: "Blue" }, selected_size: "M" }),
    ])
    await renderCart()

    const cards = screen.getAllByText("Kanga Fabric").map((h) => within(h.closest('[data-slot="card"]') as HTMLElement))
    const [, , plusOnFirst] = cards[0].getAllByRole("button")
    await userEvent.click(plusOnFirst)

    await waitFor(() => {
      const cart = readCart()
      expect(cart[0].quantity).toBe(2)
      expect(cart[1].quantity).toBe(1)
    })
  })
})

describe("CartContent remove", () => {
  it("removes the line from the page and from storage", async () => {
    seedCart([cartItem(), cartItem({ product_id: "p2", product: { id: "p2", name: "Batik Wrap", price: 8000 } })])
    await renderCart()

    await userEvent.click(cardFor("Kanga Fabric").getByTitle("Remove item"))

    await waitFor(() => expect(readCart()).toHaveLength(1))
    expect(screen.queryByText("Kanga Fabric")).not.toBeInTheDocument()
    expect(screen.getByText("Batik Wrap")).toBeInTheDocument()
  })

  it("shows the empty state once the last line is removed", async () => {
    seedCart([cartItem()])
    await renderCart()

    await userEvent.click(screen.getByTitle("Remove item"))

    expect(await screen.findByText("cart.empty")).toBeInTheDocument()
  })
})

describe("CartContent checkout CTA", () => {
  it("disables the checkout button and shows a loading label while the auth check is pending", async () => {
    // Held pending on purpose: this test asserts the state that exists only
    // before the auth check resolves.
    mockGetUser.mockReturnValue(new Promise(() => {}))
    seedCart([cartItem()])
    await renderCart()

    expect(screen.getByRole("button", { name: "common.loading" })).toBeDisabled()
  })

  it("enables the checkout button once the auth check resolves", async () => {
    seedCart([cartItem()])
    await renderCart()

    await waitFor(() => expect(screen.getByRole("button", { name: "cart.proceed" })).toBeEnabled())
  })

  it("navigates to /checkout when the checkout button is clicked", async () => {
    seedCart([cartItem()])
    await renderCart()

    const button = await screen.findByRole("button", { name: "cart.proceed" })
    await userEvent.click(button)

    expect(mockPush).toHaveBeenCalledWith("/checkout")
  })

  it("offers a continue-shopping route back to /shop alongside a non-empty cart", async () => {
    seedCart([cartItem()])
    await renderCart()

    const link = await screen.findByRole("link", { name: "cart.continue_shopping" })
    expect(link).toHaveAttribute("href", "/shop")
  })
})

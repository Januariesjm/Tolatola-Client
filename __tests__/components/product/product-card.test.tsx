/**
 * Tests for ProductCard (components/product/product-card.tsx).
 *
 * This is a purely presentational grid tile shared across shop, home, and
 * favorites-style listing pages: it does not read any hook for cart/favorite
 * state itself (that's owned by whoever renders it -- see shop-content.tsx),
 * it just renders the given `product` and reports clicks back through
 * `onAddToCart` / `onToggleLike` / `onCopyLink` / `onSocialShare`, taking
 * `isLiked` / `isInCart` as plain props. The only internal state is the
 * share dialog (open/closed, "copied" flash).
 *
 * Coverage focus:
 * - name / price / image rendering, including the no-image placeholder
 * - discount badge + crossed-out original price when compare_at_price > price
 * - out-of-stock state: "Sold Out" overlay + badge, disabled cart button
 * - the heart button calling onToggleLike with the product id, and its
 *   filled/liked visual state
 * - the cart button calling onAddToCart (and not when out of stock), and the
 *   "In Cart" state when isInCart is true
 * - the image and title links pointing at /product/:id
 * - the share dialog: opening it, copy-link (falls back to clipboard when no
 *   onCopyLink is given), and delegating to onSocialShare when provided
 */

import React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ProductCard } from "@/components/product/product-card"

const mockToast = jest.fn()
jest.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mockToast }),
}))

function product(overrides: Record<string, unknown> = {}) {
  return {
    id: "p-1",
    name: "Sisal Basket",
    price: 25000,
    images: ["/basket.jpg"],
    stock_quantity: 10,
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("ProductCard rendering", () => {
  it("renders the product name, price, and image", () => {
    render(<ProductCard product={product()} />)

    expect(screen.getByText("Sisal Basket")).toBeInTheDocument()
    expect(screen.getByText(/25,000/)).toBeInTheDocument()
    expect(screen.getByText("TZS")).toBeInTheDocument()

    const image = screen.getByAltText("Sisal Basket") as HTMLImageElement
    expect(image).toBeInTheDocument()
    expect(image.src).toContain("/basket.jpg")
  })

  it("shows a placeholder icon when the product has no image", () => {
    render(<ProductCard product={product({ images: undefined })} />)

    expect(screen.queryByAltText("Sisal Basket")).not.toBeInTheDocument()
  })

  it("shows the weight unit next to the price when present", () => {
    render(<ProductCard product={product({ weight_unit: "kg" })} />)

    expect(screen.getByText(/\/ kg/)).toBeInTheDocument()
  })

  it("links the product image and title to the product detail page", () => {
    render(<ProductCard product={product({ id: "p-42" })} />)

    const links = screen.getAllByRole("link")
    expect(links.length).toBeGreaterThanOrEqual(2)
    links.forEach((link) => expect(link).toHaveAttribute("href", "/product/p-42"))
  })

  it("renders a supplied badge with its text", () => {
    render(<ProductCard product={product()} badge={{ text: "New Arrival", variant: "new" }} />)

    expect(screen.getByText("New Arrival")).toBeInTheDocument()
  })
})

describe("ProductCard discount pricing", () => {
  it("shows a discount badge and the crossed-out original price when compare_at_price is higher", () => {
    render(<ProductCard product={product({ price: 30000, compare_at_price: 40000 })} />)

    expect(screen.getByText("25% OFF")).toBeInTheDocument()
    expect(screen.getByText(/40,000/)).toBeInTheDocument()
  })

  it("does not show a discount badge when compare_at_price is not higher than price", () => {
    render(<ProductCard product={product({ price: 30000, compare_at_price: 30000 })} />)

    expect(screen.queryByText(/% OFF/)).not.toBeInTheDocument()
  })

  it("does not show a discount badge when there is no compare_at_price", () => {
    render(<ProductCard product={product()} />)

    expect(screen.queryByText(/% OFF/)).not.toBeInTheDocument()
  })
})

describe("ProductCard out-of-stock state", () => {
  it("shows a Sold Out overlay and disables the cart button", () => {
    render(<ProductCard product={product({ stock_quantity: 0 })} />)

    expect(screen.getAllByText("Sold Out").length).toBeGreaterThan(0)
    const cartButton = screen.getByRole("button", { name: /sold out/i })
    expect(cartButton).toBeDisabled()
  })

  it("does not call onAddToCart when the sold-out button is clicked", async () => {
    const onAddToCart = jest.fn()
    render(<ProductCard product={product({ stock_quantity: 0 })} onAddToCart={onAddToCart} />)

    const cartButton = screen.getByRole("button", { name: /sold out/i })
    await userEvent.click(cartButton)

    expect(onAddToCart).not.toHaveBeenCalled()
  })

  it("shows an enabled Cart button when in stock", () => {
    render(<ProductCard product={product({ stock_quantity: 5 })} />)

    const cartButton = screen.getByRole("button", { name: /^cart$/i })
    expect(cartButton).not.toBeDisabled()
  })
})

describe("ProductCard add to cart", () => {
  it("calls onAddToCart with the product when clicked while in stock", async () => {
    const onAddToCart = jest.fn()
    const p = product()
    render(<ProductCard product={p} onAddToCart={onAddToCart} />)

    await userEvent.click(screen.getByRole("button", { name: /^cart$/i }))

    expect(onAddToCart).toHaveBeenCalledWith(p)
  })

  it("shows an 'In Cart' label instead of Cart when isInCart is true", () => {
    render(<ProductCard product={product()} isInCart />)

    expect(screen.getByRole("button", { name: /in cart/i })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /^cart$/i })).not.toBeInTheDocument()
  })
})

describe("ProductCard favorite toggle", () => {
  it("calls onToggleLike with the product id when the heart button is clicked", async () => {
    const onToggleLike = jest.fn()
    render(<ProductCard product={product({ id: "p-7" })} onToggleLike={onToggleLike} />)

    const heartButton = screen.getAllByRole("button").find((b) => b.querySelector("svg.lucide-heart"))
    expect(heartButton).toBeTruthy()
    await userEvent.click(heartButton as HTMLElement)

    expect(onToggleLike).toHaveBeenCalledWith("p-7")
  })

  it("renders the heart as filled when isLiked is true", () => {
    render(<ProductCard product={product()} isLiked />)

    const heartButton = screen.getAllByRole("button").find((b) => b.querySelector("svg.lucide-heart"))
    const heartIcon = heartButton?.querySelector("svg.lucide-heart")
    expect(heartIcon).toHaveClass("fill-current")
  })

  it("does not render the heart as filled when isLiked is false", () => {
    render(<ProductCard product={product()} isLiked={false} />)

    const heartButton = screen.getAllByRole("button").find((b) => b.querySelector("svg.lucide-heart"))
    const heartIcon = heartButton?.querySelector("svg.lucide-heart")
    expect(heartIcon).not.toHaveClass("fill-current")
  })
})

describe("ProductCard share dialog", () => {
  it("opens the share dialog when the share button is clicked", async () => {
    render(<ProductCard product={product()} />)

    const shareButton = screen.getAllByRole("button").find((b) => b.querySelector("svg.lucide-share-2"))
    expect(shareButton).toBeTruthy()
    await userEvent.click(shareButton as HTMLElement)

    expect(screen.getByText("Share Product")).toBeInTheDocument()
    expect(screen.getByText(/Share Sisal Basket with your friends and family/)).toBeInTheDocument()
  })

  it("copies the product link to the clipboard and confirms with a toast when no onCopyLink is given", async () => {
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    render(<ProductCard product={product({ id: "p-9" })} />)
    const shareButton = screen.getAllByRole("button").find((b) => b.querySelector("svg.lucide-share-2"))
    await userEvent.click(shareButton as HTMLElement)
    await userEvent.click(screen.getByText("Copy Link"))

    expect(writeText).toHaveBeenCalledWith(`${window.location.origin}/product/p-9`)
    expect(await screen.findByText("Link Copied!")).toBeInTheDocument()
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Link copied!" }))
  })

  it("delegates copy-link to onCopyLink when provided instead of using the clipboard", async () => {
    const onCopyLink = jest.fn()
    const writeText = jest.fn()
    Object.assign(navigator, { clipboard: { writeText } })
    const p = product({ id: "p-9" })

    render(<ProductCard product={p} onCopyLink={onCopyLink} />)
    const shareButton = screen.getAllByRole("button").find((b) => b.querySelector("svg.lucide-share-2"))
    await userEvent.click(shareButton as HTMLElement)
    await userEvent.click(screen.getByText("Copy Link"))

    expect(onCopyLink).toHaveBeenCalledWith(p)
    expect(writeText).not.toHaveBeenCalled()
  })

  it("delegates social share to onSocialShare with the chosen platform when provided", async () => {
    const onSocialShare = jest.fn()
    const p = product()

    render(<ProductCard product={p} onSocialShare={onSocialShare} />)
    const shareButton = screen.getAllByRole("button").find((b) => b.querySelector("svg.lucide-share-2"))
    await userEvent.click(shareButton as HTMLElement)
    await userEvent.click(screen.getByText("WhatsApp"))

    expect(onSocialShare).toHaveBeenCalledWith(p, "whatsapp")
  })

  it("opens a share window for the chosen platform when no onSocialShare is given", async () => {
    const windowOpen = jest.spyOn(window, "open").mockImplementation(() => null)

    render(<ProductCard product={product({ id: "p-9" })} />)
    const shareButton = screen.getAllByRole("button").find((b) => b.querySelector("svg.lucide-share-2"))
    await userEvent.click(shareButton as HTMLElement)
    await userEvent.click(screen.getByText("Facebook"))

    expect(windowOpen).toHaveBeenCalledWith(
      expect.stringContaining("https://www.facebook.com/sharer/sharer.php?u="),
      "_blank",
      "width=600,height=400",
    )
    windowOpen.mockRestore()
  })

  it.each([
    ["Twitter (X)", "https://twitter.com/intent/tweet?url="],
    ["LinkedIn", "https://www.linkedin.com/sharing/share-offsite/?url="],
    ["Telegram", "https://t.me/share/url?url="],
  ])("opens a share window for %s", async (label, urlPrefix) => {
    const windowOpen = jest.spyOn(window, "open").mockImplementation(() => null)

    render(<ProductCard product={product({ id: "p-9" })} />)
    const shareButton = screen.getAllByRole("button").find((b) => b.querySelector("svg.lucide-share-2"))
    await userEvent.click(shareButton as HTMLElement)
    await userEvent.click(screen.getByText(label))

    expect(windowOpen).toHaveBeenCalledWith(expect.stringContaining(urlPrefix), "_blank", "width=600,height=400")
    windowOpen.mockRestore()
  })

  it("reports a toast error when copying the link to the clipboard fails", async () => {
    const writeText = jest.fn().mockRejectedValue(new Error("denied"))
    Object.assign(navigator, { clipboard: { writeText } })

    render(<ProductCard product={product({ id: "p-9" })} />)
    const shareButton = screen.getAllByRole("button").find((b) => b.querySelector("svg.lucide-share-2"))
    await userEvent.click(shareButton as HTMLElement)
    await userEvent.click(screen.getByText("Copy Link"))

    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Error", variant: "destructive" }))
  })
})

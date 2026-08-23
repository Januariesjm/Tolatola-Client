/**
 * Tests for OrdersListContent (components/orders/orders-list-content.tsx).
 *
 * Covers the empty-state fallback, the per-order summary (status badge colour,
 * formatted date/total, item count pluralisation), the product-image URL
 * fallback chain (images[0] -> primary_image_url -> placeholder), and the
 * broken-image onError handler that swaps in a placehold.co avatar.
 */

import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { OrdersListContent } from "@/components/orders/orders-list-content"

function makeOrder(overrides: Partial<Record<string, any>> = {}) {
  return {
    id: "ord-1",
    order_number: "TOLA-00042",
    status: "shipped",
    created_at: "2026-02-01T10:00:00Z",
    total_amount: 125000,
    order_items: [
      {
        id: "item-1",
        products: { name: "Sisal Basket", images: ["/a.jpg"] },
      },
    ],
    ...overrides,
  }
}

describe("OrdersListContent", () => {
  describe("empty state", () => {
    it("shows the no-orders message and a link back to the shop", () => {
      render(<OrdersListContent orders={[]} />)

      expect(screen.getByText("No orders yet")).toBeInTheDocument()
      const link = screen.getByRole("link", { name: /start shopping/i })
      expect(link).toHaveAttribute("href", "/shop")
      expect(screen.queryByText(/Order #/)).not.toBeInTheDocument()
    })
  })

  describe("order list rendering", () => {
    it("shows the order number, status, formatted date and total", () => {
      render(<OrdersListContent orders={[makeOrder()]} />)

      expect(screen.getByText("Order #TOLA-00042")).toBeInTheDocument()
      expect(screen.getByText("shipped")).toBeInTheDocument()
      expect(screen.getByText("February 1, 2026")).toBeInTheDocument()
      expect(screen.getAllByText(/TZS 125,000/).length).toBeGreaterThan(0)
    })

    it("links to the order detail page", () => {
      render(<OrdersListContent orders={[makeOrder({ id: "ord-77" })]} />)

      const link = screen.getByRole("link", { name: /view details/i })
      expect(link).toHaveAttribute("href", "/orders/ord-77")
    })

    it("renders one card per order", () => {
      render(<OrdersListContent orders={[makeOrder({ id: "ord-1" }), makeOrder({ id: "ord-2", order_number: "TOLA-00043" })]} />)

      expect(screen.getByText("Order #TOLA-00042")).toBeInTheDocument()
      expect(screen.getByText("Order #TOLA-00043")).toBeInTheDocument()
    })

    describe("item count pluralisation", () => {
      it("shows singular 'Item' for a single line item", () => {
        render(<OrdersListContent orders={[makeOrder()]} />)
        expect(screen.getByText("1 Item")).toBeInTheDocument()
      })

      it("shows plural 'Items' for multiple line items", () => {
        const order = makeOrder({
          order_items: [
            { id: "item-1", products: { name: "Sisal Basket", images: ["/a.jpg"] } },
            { id: "item-2", products: { name: "Kikoy", images: ["/b.jpg"] } },
          ],
        })
        render(<OrdersListContent orders={[order]} />)
        expect(screen.getByText("2 Items")).toBeInTheDocument()
      })
    })

    describe("status badge colour", () => {
      it.each([
        ["pending", "bg-yellow-500/15"],
        ["confirmed", "bg-blue-500/15"],
        ["processing", "bg-purple-500/15"],
        ["shipped", "bg-indigo-500/15"],
        ["delivered", "bg-green-500/15"],
        ["cancelled", "bg-red-500/15"],
        ["refunded", "bg-gray-500/15"],
      ])("applies the %s colour class for status '%s'", (status, expectedClass) => {
        render(<OrdersListContent orders={[makeOrder({ status })]} />)
        expect(screen.getByText(status)).toHaveClass(expectedClass)
      })

      it("is case-insensitive when matching status", () => {
        render(<OrdersListContent orders={[makeOrder({ status: "DELIVERED" })]} />)
        expect(screen.getByText("DELIVERED")).toHaveClass("bg-green-500/15")
      })

      it("falls back to the default grey class for an unknown status", () => {
        render(<OrdersListContent orders={[makeOrder({ status: "weird-status" })]} />)
        expect(screen.getByText("weird-status")).toHaveClass("bg-gray-100")
      })
    })

    describe("product image fallback chain", () => {
      it("uses images[0] when present", () => {
        render(<OrdersListContent orders={[makeOrder()]} />)
        expect(screen.getByAltText("Sisal Basket")).toHaveAttribute("src", "/a.jpg")
      })

      it("falls back to primary_image_url when images is absent", () => {
        const order = makeOrder({
          order_items: [{ id: "item-1", products: { name: "Kikoy", primary_image_url: "/primary.jpg" } }],
        })
        render(<OrdersListContent orders={[order]} />)
        expect(screen.getByAltText("Kikoy")).toHaveAttribute("src", "/primary.jpg")
      })

      it("falls back to the placeholder image when neither is present", () => {
        const order = makeOrder({
          order_items: [{ id: "item-1", products: { name: "Mystery Item" } }],
        })
        render(<OrdersListContent orders={[order]} />)
        expect(screen.getByAltText("Mystery Item")).toHaveAttribute("src", "/placeholder-product.png")
      })

      it("falls back to a generic alt text when the product has no name", () => {
        const order = makeOrder({
          order_items: [{ id: "item-1", products: { images: ["/a.jpg"] } }],
        })
        render(<OrdersListContent orders={[order]} />)
        expect(screen.getByAltText("Product")).toBeInTheDocument()
      })
    })

    describe("broken image handling", () => {
      it("swaps in a placehold.co avatar built from the product's initials on error", () => {
        render(<OrdersListContent orders={[makeOrder()]} />)

        const img = screen.getByAltText("Sisal Basket")
        fireEvent.error(img)

        expect(img).toHaveAttribute("src", "https://placehold.co/100x100?text=Si")
      })

      it("uses the 'PR' fallback initials when the product has no name", () => {
        const order = makeOrder({
          order_items: [{ id: "item-1", products: { images: ["/broken.jpg"] } }],
        })
        render(<OrdersListContent orders={[order]} />)

        const img = screen.getByAltText("Product")
        fireEvent.error(img)

        expect(img).toHaveAttribute("src", "https://placehold.co/100x100?text=PR")
      })
    })

    it("renders an order with multiple items without crashing", () => {
      const order = makeOrder({
        order_items: [
          { id: "item-1", products: { name: "Sisal Basket", images: ["/a.jpg"] } },
          { id: "item-2", products: { name: "Kikoy", images: ["/b.jpg"] } },
          { id: "item-3", products: { name: "Maasai Beads", images: ["/c.jpg"] } },
        ],
      })
      render(<OrdersListContent orders={[order]} />)

      expect(screen.getByText("Sisal Basket")).toBeInTheDocument()
      expect(screen.getByText("Kikoy")).toBeInTheDocument()
      expect(screen.getByText("Maasai Beads")).toBeInTheDocument()
    })
  })
})

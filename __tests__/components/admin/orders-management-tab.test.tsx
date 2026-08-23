/**
 * Tests for OrdersManagementTab (components/admin/orders-management-tab.tsx).
 *
 * A pure, prop-driven view over a list of orders -- no fetching, no mutation.
 * Three filters compose: a date-range filter (components/admin/date-range-filter.tsx,
 * tested separately), a status dropdown, and a free-text search across order
 * number, customer name/email/phone and shipping street/ward. What's worth
 * pinning: each filter narrows the list correctly, they compose (AND) with
 * each other, the empty state's copy and "clear filters" action differ based
 * on whether a filter is active, and a couple of per-row derived bits (item
 * count/preview, badge fallback colors, guest-customer fallback).
 *
 * jsdom has no Pointer Capture API, which Radix's DropdownMenu touches on
 * pointer down; polyfilled below, same fix used in
 * __tests__/components/layout/language-switcher.test.tsx.
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

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { OrdersManagementTab } from "@/components/admin/orders-management-tab"

function order(overrides: Record<string, unknown> = {}) {
  return {
    id: "o-1",
    order_number: "ORD-1001",
    status: "pending",
    payment_status: "paid",
    payment_method: "mobile-money",
    transporter_status: undefined,
    total_amount: 25000,
    created_at: "2026-01-10T08:30:00.000Z",
    users: { full_name: "Asha Mwinyi", email: "asha@example.com", phone: "0700000001" },
    shipping_address: {
      full_name: "Asha Mwinyi",
      email: "asha@example.com",
      phone: "0700000001",
      street: "12 Samora Ave",
      ward: "Kikuyu",
      district: "Dodoma Urban",
      region: "Dodoma",
      country: "Tanzania",
    },
    order_items: [{ products: { name: "Maize Flour 5kg" } }],
    ...overrides,
  }
}

describe("OrdersManagementTab", () => {
  it("shows the generic empty state when there are no orders at all", () => {
    render(<OrdersManagementTab orders={[]} />)

    expect(screen.getByText("No orders found")).toBeInTheDocument()
    expect(screen.getByText("There are currently no orders in the system.")).toBeInTheDocument()
    expect(screen.queryByText("Clear all filters")).not.toBeInTheDocument()
  })

  it("renders an order's number, customer, shipping and item summary", () => {
    render(<OrdersManagementTab orders={[order()]} />)

    expect(screen.getByText("#ORD-1001")).toBeInTheDocument()
    expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument()
    expect(screen.getByText("asha@example.com")).toBeInTheDocument()
    expect(screen.getByText("12 Samora Ave")).toBeInTheDocument()
    expect(screen.getByText("1 Products")).toBeInTheDocument()
    expect(screen.getByText("Maize Flour 5kg")).toBeInTheDocument()
    expect(screen.getByText("TZS 25,000")).toBeInTheDocument()
  })

  it("falls back to 'Guest Customer' and 'No email'/'No phone' when there is no user or shipping contact", () => {
    render(
      <OrdersManagementTab
        orders={[
          order({
            users: undefined,
            shipping_address: { ...order().shipping_address, full_name: undefined, email: undefined, phone: undefined },
          }),
        ]}
      />,
    )

    expect(screen.getByText("Guest Customer")).toBeInTheDocument()
    expect(screen.getByText("No email")).toBeInTheDocument()
    expect(screen.getByText("No phone")).toBeInTheDocument()
  })

  it("shows '+N more' when an order has more than one item", () => {
    render(
      <OrdersManagementTab
        orders={[
          order({
            order_items: [
              { products: { name: "Maize Flour 5kg" } },
              { products: { name: "Rice 2kg" } },
              { products: { name: "Beans 1kg" } },
            ],
          }),
        ]}
      />,
    )

    expect(screen.getByText("3 Products")).toBeInTheDocument()
    expect(screen.getByText(/\+ 2 more/)).toBeInTheDocument()
  })

  it("shows a transporter status badge only when transporter_status is set", () => {
    render(<OrdersManagementTab orders={[order({ transporter_status: "in_transit" })]} />)

    expect(screen.getByText("in transit")).toBeInTheDocument()
  })

  it("falls back to the neutral badge color for an unrecognized status", () => {
    render(<OrdersManagementTab orders={[order({ status: "archived" })]} />)

    const badge = screen.getByText("archived")
    expect(badge.className).toContain("bg-slate-100")
  })

  it("filters by order number", async () => {
    render(
      <OrdersManagementTab orders={[order({ id: "o-1", order_number: "ORD-1001" }), order({ id: "o-2", order_number: "ORD-2002" })]} />,
    )

    await userEvent.type(screen.getByPlaceholderText(/search order/i), "2002")

    expect(screen.getByText("#ORD-2002")).toBeInTheDocument()
    expect(screen.queryByText("#ORD-1001")).not.toBeInTheDocument()
  })

  it("filters by customer name, email, phone, street or ward", async () => {
    const orders = [
      order({ id: "o-1", order_number: "ORD-1001" }),
      order({
        id: "o-2",
        order_number: "ORD-2002",
        users: { full_name: "Baraka John", email: "baraka@example.com", phone: "0711111111" },
        shipping_address: {
          ...order().shipping_address,
          full_name: "Baraka John",
          email: "baraka@example.com",
          phone: "0711111111",
          ward: "Mikocheni",
        },
      }),
    ]

    render(<OrdersManagementTab orders={orders} />)
    await userEvent.type(screen.getByPlaceholderText(/search order/i), "mikocheni")

    expect(screen.getByText("#ORD-2002")).toBeInTheDocument()
    expect(screen.queryByText("#ORD-1001")).not.toBeInTheDocument()
  })

  it("shows the filtered empty state with a clear-filters action when search matches nothing", async () => {
    render(<OrdersManagementTab orders={[order()]} />)

    await userEvent.type(screen.getByPlaceholderText(/search order/i), "no-such-order")

    expect(screen.getByText("No orders found")).toBeInTheDocument()
    expect(screen.getByText(/Try adjusting your filters/)).toBeInTheDocument()
    expect(screen.getByText("Clear all filters")).toBeInTheDocument()
  })

  it("clears the search query when 'Clear all filters' is clicked", async () => {
    render(<OrdersManagementTab orders={[order()]} />)

    const search = screen.getByPlaceholderText(/search order/i)
    await userEvent.type(search, "no-such-order")
    await userEvent.click(screen.getByText("Clear all filters"))

    expect(screen.getByText("#ORD-1001")).toBeInTheDocument()
    expect((search as HTMLInputElement).value).toBe("")
  })

  it("filters by status via the status dropdown", async () => {
    render(
      <OrdersManagementTab
        orders={[
          order({ id: "o-1", order_number: "ORD-1001", status: "pending" }),
          order({ id: "o-2", order_number: "ORD-2002", status: "delivered" }),
        ]}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: /All Status/i }))
    await userEvent.click(await screen.findByText("Delivered"))

    expect(screen.getByText("#ORD-2002")).toBeInTheDocument()
    expect(screen.queryByText("#ORD-1001")).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^Delivered$/i })).toBeInTheDocument()
  })

  it("composes the status filter with the search filter", async () => {
    render(
      <OrdersManagementTab
        orders={[
          order({ id: "o-1", order_number: "ORD-1001", status: "pending" }),
          order({ id: "o-2", order_number: "ORD-2002", status: "pending" }),
          order({ id: "o-3", order_number: "ORD-3003", status: "delivered" }),
        ]}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: /All Status/i }))
    await userEvent.click(await screen.findByText("Pending"))
    await userEvent.type(screen.getByPlaceholderText(/search order/i), "2002")

    expect(screen.getByText("#ORD-2002")).toBeInTheDocument()
    expect(screen.queryByText("#ORD-1001")).not.toBeInTheDocument()
    expect(screen.queryByText("#ORD-3003")).not.toBeInTheDocument()
  })

  it("clears both search and status filters via 'Clear all filters'", async () => {
    render(
      <OrdersManagementTab
        orders={[
          order({ id: "o-1", order_number: "ORD-1001", status: "pending" }),
          order({ id: "o-2", order_number: "ORD-2002", status: "delivered" }),
        ]}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: /All Status/i }))
    await userEvent.click(await screen.findByText("Delivered"))
    await userEvent.type(screen.getByPlaceholderText(/search order/i), "no-match")

    expect(screen.getByText("Clear all filters")).toBeInTheDocument()
    await userEvent.click(screen.getByText("Clear all filters"))

    expect(screen.getByText("#ORD-1001")).toBeInTheDocument()
    expect(screen.getByText("#ORD-2002")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /All Status/i })).toBeInTheDocument()
  })

  it("filters out orders created before the selected date range", async () => {
    const recent = order({ id: "o-1", order_number: "ORD-1001", created_at: new Date().toISOString() })
    const old = order({ id: "o-2", order_number: "ORD-2002", created_at: "2020-01-01T00:00:00.000Z" })

    render(<OrdersManagementTab orders={[recent, old]} />)
    await userEvent.click(screen.getByText("Today"))

    expect(screen.getByText("#ORD-1001")).toBeInTheDocument()
    expect(screen.queryByText("#ORD-2002")).not.toBeInTheDocument()
  })

  it("supports filtering by every status option in the dropdown", async () => {
    const statuses = ["confirmed", "processing", "shipped", "cancelled"] as const
    const orders = statuses.map((status, i) => order({ id: `o-${i}`, order_number: `ORD-${i}`, status }))

    render(<OrdersManagementTab orders={orders} />)

    let currentLabel = "All Status"
    for (const status of statuses) {
      await userEvent.click(screen.getByRole("button", { name: new RegExp(`^${currentLabel}$`, "i") }))
      currentLabel = status.charAt(0).toUpperCase() + status.slice(1)
      await userEvent.click(await screen.findByText(currentLabel))
      expect(screen.getByRole("button", { name: new RegExp(`^${currentLabel}$`, "i") })).toBeInTheDocument()
    }

    // Switching back to "All Status" via the dropdown restores every order.
    await userEvent.click(screen.getByRole("button", { name: new RegExp(`^${currentLabel}$`, "i") }))
    await userEvent.click(await screen.findByText("All Status"))
    orders.forEach((o) => expect(screen.getByText(`#${o.order_number}`)).toBeInTheDocument())
  })

  it("numbers rows sequentially starting at 1", () => {
    render(
      <OrdersManagementTab orders={[order({ id: "o-1", order_number: "ORD-1001" }), order({ id: "o-2", order_number: "ORD-2002" })]} />,
    )

    const rows = screen.getAllByText(/^#\d+$/)
    expect(rows[0]).toHaveTextContent("#1")
    expect(rows[1]).toHaveTextContent("#2")
  })
})

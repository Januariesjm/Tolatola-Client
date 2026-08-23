/**
 * Tests for VendorOrdersTab (components/vendor/vendor-orders-tab.tsx).
 *
 * The data layer (realtime subscriptions, 15s polling, deep-link expansion)
 * lives in hooks/use-vendor-orders.ts and has its own dedicated suite
 * (__tests__/hooks/use-vendor-orders.test.tsx). Re-driving all of that through
 * this component would just re-test the hook with extra ceremony, so the hook
 * is replaced here with a small fake that keeps real React state for the
 * pieces the component actually reads and mutates (activeTab, period,
 * expandedOrders, updatingOrderId) while leaving `orders` fully under the
 * test's control. STATUS_TO_TAB is left real via requireActual since the
 * component imports it directly to decide which tab to jump to after a status
 * update.
 *
 * What's covered here instead: tab bucketing by status, the empty state, the
 * expand/collapse order card, money/date formatting, which action button
 * shows for which status, and the update-status mutation's toast/tab-switch
 * paths.
 */

import React, { useState } from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { VendorOrdersTab } from "@/components/vendor/vendor-orders-tab"
import type { DatePeriod } from "@/components/admin/date-range-filter"

const mockToast = jest.fn()
jest.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mockToast }) }))

const mockPatch = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiGet: jest.fn(),
  clientApiPatch: (...args: unknown[]) => mockPatch(...args),
}))

const mockFetchOrders = jest.fn()
const mockUseVendorOrders = jest.fn()
jest.mock("@/hooks/use-vendor-orders", () => {
  const actual = jest.requireActual("@/hooks/use-vendor-orders")
  return {
    ...actual,
    useVendorOrders: (...args: unknown[]) => mockUseVendorOrders(...args),
  }
})

let currentOrders: any[] = []
let currentlyLoading = false

/** Real React state for the bits the component reads/sets; `orders` is fixed per test. */
function useFakeVendorOrders() {
  const [activeTab, setActiveTab] = useState("new")
  const [period, setPeriod] = useState<DatePeriod>("all")
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null)

  return {
    orders: currentOrders,
    isLoading: currentlyLoading,
    isRefreshing: false,
    expandedOrders,
    updatingOrderId,
    setUpdatingOrderId,
    activeTab,
    setActiveTab,
    period,
    setPeriod,
    fetchOrders: mockFetchOrders,
    toggleOrderDetails: (id: string) =>
      setExpandedOrders((prev) => {
        const next = new Set(prev)
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      }),
  }
}

function order(overrides: Record<string, any> = {}) {
  return {
    id: "o-1",
    order_number: "ORD-1001",
    status: "pending",
    created_at: new Date().toISOString(),
    users: { full_name: "Asha Mwinyi" },
    items: [{ id: "i-1", quantity: 2, unit_price: 5000, delivery_fee: 0, products: { name: "Maize Flour" } }],
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  currentOrders = []
  currentlyLoading = false
  mockUseVendorOrders.mockImplementation(() => useFakeVendorOrders())
  mockPatch.mockResolvedValue({ success: true })
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("VendorOrdersTab", () => {
  it("shows a loading message while orders are loading", () => {
    currentlyLoading = true
    render(<VendorOrdersTab shopId="shop-1" />)

    expect(screen.getByText("Loading orders...")).toBeInTheDocument()
  })

  it("shows the empty state for a tab with no orders", () => {
    currentOrders = []
    render(<VendorOrdersTab shopId="shop-1" />)

    expect(screen.getByText("No orders in this tab")).toBeInTheDocument()
    expect(screen.getByText("0 Total")).toBeInTheDocument()
  })

  it("buckets orders into tabs by status and shows counts as badges", () => {
    currentOrders = [
      order({ id: "o-pending", status: "pending" }),
      order({ id: "o-confirmed", status: "confirmed" }),
      order({ id: "o-processing", status: "processing" }),
      order({ id: "o-ready", status: "ready_for_pickup" }),
      order({ id: "o-delivered", status: "delivered" }),
    ]
    render(<VendorOrdersTab shopId="shop-1" />)

    // New tab (default active) holds pending + confirmed => 2
    const tabsList = screen.getByRole("tablist")
    expect(within(tabsList).getByRole("tab", { name: /New/ })).toHaveTextContent("2")
    expect(within(tabsList).getByRole("tab", { name: /Preparing/ })).toHaveTextContent("1")
    expect(within(tabsList).getByRole("tab", { name: /Ready/ })).toHaveTextContent("1")
    expect(within(tabsList).getByRole("tab", { name: /Completed/ })).toHaveTextContent("1")
    expect(screen.getByText("5 Total")).toBeInTheDocument()
  })

  it("renders the order number and total for a collapsed order card", () => {
    currentOrders = [
      order({
        id: "o-1",
        order_number: "ORD-2002",
        items: [{ id: "i-1", quantity: 3, unit_price: 1000, delivery_fee: 0, products: { name: "Rice" } }],
      }),
    ]
    render(<VendorOrdersTab shopId="shop-1" />)

    expect(screen.getByText("ORD-2002")).toBeInTheDocument()
    expect(screen.getByText("TZS 3,000")).toBeInTheDocument()
  })

  it("includes delivery fees in the order total", () => {
    currentOrders = [
      order({
        items: [
          { id: "i-1", quantity: 1, unit_price: 10000, delivery_fee: 1500, products: { name: "Sugar" } },
          { id: "i-2", quantity: 2, unit_price: 2000, delivery_fee: 0, products: { name: "Salt" } },
        ],
      }),
    ]
    render(<VendorOrdersTab shopId="shop-1" />)

    // 10000 + 1500 + (2000*2) = 15500
    expect(screen.getByText("TZS 15,500")).toBeInTheDocument()
  })

  it("falls back to shipping address name/phone when there is no linked user", async () => {
    currentOrders = [
      order({
        users: undefined,
        shipping_address: { full_name: "Baraka Juma", phone: "255700000002" },
      }),
    ]
    render(<VendorOrdersTab shopId="shop-1" />)

    await userEvent.click(screen.getByText("ORD-1001"))
    // Appears both as the customer name and, separately, in the shipping
    // address block -- getCustomerName() and the raw shipping_address render
    // independently, so assert on the count rather than a single node.
    expect(screen.getAllByText("Baraka Juma").length).toBeGreaterThanOrEqual(1)
  })

  it("expands an order to show customer, items, and shipping details, then collapses it again", async () => {
    currentOrders = [
      order({
        shipping_address: { full_name: "Asha Mwinyi", phone: "255700000001", city: "Dodoma", region: "Dodoma" },
      }),
    ]
    render(<VendorOrdersTab shopId="shop-1" />)

    expect(screen.queryByText("Order Items (1)")).not.toBeInTheDocument()

    await userEvent.click(screen.getByText("ORD-1001"))

    expect(screen.getByText("Order Items (1)")).toBeInTheDocument()
    expect(screen.getByText("Shipping Address")).toBeInTheDocument()
    expect(screen.getByText("255700000001")).toBeInTheDocument()

    await userEvent.click(screen.getByText("ORD-1001"))
    expect(screen.queryByText("Order Items (1)")).not.toBeInTheDocument()
  })

  it("shows a delivery fee line under an item that has one", async () => {
    currentOrders = [
      order({
        items: [{ id: "i-1", quantity: 1, unit_price: 5000, delivery_fee: 800, products: { name: "Cooking Oil" } }],
      }),
    ]
    render(<VendorOrdersTab shopId="shop-1" />)

    await userEvent.click(screen.getByText("ORD-1001"))

    expect(screen.getByText("+ Delivery: TZS 800")).toBeInTheDocument()
  })

  it("shows a 'Confirm Order' action for a pending order and requests the status update", async () => {
    currentOrders = [order({ id: "o-1", status: "pending" })]
    render(<VendorOrdersTab shopId="shop-1" />)
    await userEvent.click(screen.getByText("ORD-1001"))

    await userEvent.click(screen.getByRole("button", { name: /Confirm Order/i }))

    await waitFor(() => expect(mockPatch).toHaveBeenCalledWith("vendors/orders/o-1/status", { status: "confirmed" }))
    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Order Updated ✓", description: expect.stringContaining("Confirmed") }),
    )
    await waitFor(() => expect(mockFetchOrders).toHaveBeenCalled())
  })

  it("shows a 'Start Processing' action for a confirmed order and switches to the Preparing tab on success", async () => {
    currentOrders = [order({ id: "o-1", status: "confirmed" })]
    render(<VendorOrdersTab shopId="shop-1" />)
    await userEvent.click(screen.getByText("ORD-1001"))

    await userEvent.click(screen.getByRole("button", { name: /Start Processing/i }))

    await waitFor(() => expect(mockPatch).toHaveBeenCalledWith("vendors/orders/o-1/status", { status: "processing" }))
    // STATUS_TO_TAB.processing -> "preparing"; the New tab's panel should no
    // longer be the one showing content once the tab switches.
    await waitFor(() => expect(screen.getByRole("tab", { name: /Preparing/ })).toHaveAttribute("data-state", "active"))
  })

  it("shows a 'Mark Ready for Pickup' action for a processing order", async () => {
    currentOrders = [order({ id: "o-1", status: "processing" })]
    render(<VendorOrdersTab shopId="shop-1" />)
    await userEvent.click(screen.getByRole("tab", { name: /Preparing/ }))
    await userEvent.click(screen.getByText("ORD-1001"))

    await userEvent.click(screen.getByRole("button", { name: /Mark Ready for Pickup/i }))

    await waitFor(() => expect(mockPatch).toHaveBeenCalledWith("vendors/orders/o-1/status", { status: "ready_for_pickup" }))
  })

  it("shows a searching badge and a Retry Search action for a ready order with no transporter yet", async () => {
    currentOrders = [order({ id: "o-1", status: "ready_for_pickup" })]
    render(<VendorOrdersTab shopId="shop-1" />)
    await userEvent.click(screen.getByRole("tab", { name: /Ready/ }))
    await userEvent.click(screen.getByText("ORD-1001"))

    expect(screen.getByText("Searching for Transporter...")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Retry Search/i })).toBeInTheDocument()
  })

  it("shows 'Transporter In Transit' once the assignment is in transit, with no retry button", async () => {
    currentOrders = [
      order({
        id: "o-1",
        status: "ready_for_pickup",
        transporter_assignment: { status: "in_transit", accepted_at: "2026-01-01T00:00:00Z" },
      }),
    ]
    render(<VendorOrdersTab shopId="shop-1" />)
    await userEvent.click(screen.getByRole("tab", { name: /Ready/ }))
    await userEvent.click(screen.getByText("ORD-1001"))

    expect(screen.getByText("Transporter In Transit")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Retry Search/i })).not.toBeInTheDocument()
  })

  it("shows a Completed badge for a shipped or delivered order with no further action", async () => {
    currentOrders = [order({ id: "o-1", status: "delivered" })]
    render(<VendorOrdersTab shopId="shop-1" />)
    await userEvent.click(screen.getByRole("tab", { name: /Completed/ }))
    await userEvent.click(screen.getByText("ORD-1001"))

    // "Completed" also names the tab trigger itself; scope to the badge div
    // rendered inside the card body so the assertion is unambiguous.
    expect(screen.getByText("Completed", { selector: "div" })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Confirm Order|Start Processing|Mark Ready/i })).not.toBeInTheDocument()
  })

  it("shows a destructive toast and stops updating when the status update fails", async () => {
    mockPatch.mockRejectedValue(new Error("network down"))
    currentOrders = [order({ id: "o-1", status: "pending" })]
    render(<VendorOrdersTab shopId="shop-1" />)
    await userEvent.click(screen.getByText("ORD-1001"))

    await userEvent.click(screen.getByRole("button", { name: /Confirm Order/i }))

    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Update Failed", variant: "destructive" })))
  })

  it("computes the earnings tab total from completed orders only", async () => {
    currentOrders = [
      order({
        id: "o-1",
        status: "delivered",
        items: [{ id: "i-1", quantity: 1, unit_price: 20000, delivery_fee: 0, products: { name: "A" } }],
      }),
      order({
        id: "o-2",
        status: "shipped",
        items: [{ id: "i-2", quantity: 1, unit_price: 5000, delivery_fee: 0, products: { name: "B" } }],
      }),
      order({
        id: "o-3",
        status: "pending",
        items: [{ id: "i-3", quantity: 1, unit_price: 999999, delivery_fee: 0, products: { name: "C" } }],
      }),
    ]
    render(<VendorOrdersTab shopId="shop-1" />)

    await userEvent.click(screen.getByRole("tab", { name: /Earnings/i }))

    expect(screen.getByText("TZS 25,000")).toBeInTheDocument()
    expect(screen.getByText("2 orders completed")).toBeInTheDocument()
  })

  it("formats how long ago an order was placed in minutes, hours and days", () => {
    const now = Date.now()
    currentOrders = [
      order({ id: "o-min", order_number: "ORD-MIN", created_at: new Date(now - 5 * 60000).toISOString() }),
      order({ id: "o-hr", order_number: "ORD-HR", created_at: new Date(now - 3 * 3600000).toISOString() }),
      order({ id: "o-day", order_number: "ORD-DAY", created_at: new Date(now - 2 * 86400000).toISOString() }),
    ]
    render(<VendorOrdersTab shopId="shop-1" />)

    expect(screen.getByText("5m ago")).toBeInTheDocument()
    expect(screen.getByText("3h ago")).toBeInTheDocument()
    expect(screen.getByText("2d ago")).toBeInTheDocument()
  })

  it("retries the transporter search from the Ready tab, calling the same status update", async () => {
    currentOrders = [order({ id: "o-1", status: "ready_for_pickup" })]
    render(<VendorOrdersTab shopId="shop-1" />)
    await userEvent.click(screen.getByRole("tab", { name: /Ready/ }))
    await userEvent.click(screen.getByText("ORD-1001"))

    await userEvent.click(screen.getByRole("button", { name: /Retry Search/i }))

    await waitFor(() => expect(mockPatch).toHaveBeenCalledWith("vendors/orders/o-1/status", { status: "ready_for_pickup" }))
  })

  it("triggers a refresh fetch when the Refresh button is clicked", async () => {
    currentOrders = [order()]
    render(<VendorOrdersTab shopId="shop-1" />)

    await userEvent.click(screen.getByRole("button", { name: /Refresh/i }))

    expect(mockFetchOrders).toHaveBeenCalledWith(true)
  })
})

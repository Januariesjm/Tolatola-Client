/**
 * Tests for OrderDetailContent (components/orders/order-detail-content.tsx).
 *
 * Focus is handleConfirmDelivery, which finalises payments and closes escrow --
 * the most consequential action on the page. It previously refreshed only on
 * `response.ok` and ignored every other outcome, so a rejected confirmation was
 * indistinguishable from a successful one.
 */

import React from "react"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { OrderDetailContent } from "@/components/orders/order-detail-content"
import { setErrorReporter, type LogRecord } from "@/lib/logger"
import type { Order } from "@/lib/schemas/order"

const mockRefresh = jest.fn()
jest.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mockRefresh, push: jest.fn(), replace: jest.fn() }),
  usePathname: () => "/orders/ord-1",
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: "ord-1" }),
}))

jest.mock("@/components/messaging/chat-button", () => ({
  ChatButton: () => <div data-testid="chat-button" />,
}))
jest.mock("@/components/orders/order-tracking-map", () => ({
  OrderTrackingMap: () => <div data-testid="tracking-map" />,
}))

const baseOrder: Order = {
  id: "ord-1",
  order_number: "TOLA-00042",
  status: "shipped",
  payment_status: "paid",
  payment_method: "mpesa",
  total_amount: 125000,
  subtotal: 120000,
  delivery_fee: 5000,
  created_at: "2026-02-01T10:00:00Z",
  delivery_confirmation_requested: true,
  delivery_pin: "4821",
  shipping_address: {
    full_name: "Asha Mwinyi",
    phone: "255700000001",
    address: "12 Samora Ave",
    city: "Dodoma",
    region: "Dodoma",
  },
  order_items: [
    {
      id: "item-1",
      product_id: "prod-1",
      quantity: 2,
      total_price: 60000,
      products: {
        name: "Sisal Basket",
        price: 30000,
        images: ["/a.jpg"],
        shops: { id: "shop-1", name: "Dodoma Crafts", vendors: { business_name: "Dodoma Crafts Ltd" } },
      },
    },
  ],
  transport_methods: { name: "Boda", provider_type: "individual" },
  transporter_assignments: null,
}

let reported: LogRecord[]

function mockFetch(result: { ok?: boolean; status?: number } | "reject") {
  const fetchMock = jest.fn(async () => {
    if (result === "reject") throw new Error("network down")
    return { ok: result.ok ?? true, status: result.status ?? 200, json: async () => ({}) } as Response
  })
  global.fetch = fetchMock as unknown as typeof fetch
  return fetchMock
}

beforeEach(() => {
  jest.clearAllMocks()
  reported = []
  setErrorReporter((r) => reported.push(r))
  jest.spyOn(console, "error").mockImplementation(() => {})
  jest.spyOn(console, "log").mockImplementation(() => {})
  mockFetch({ ok: true })
})

afterEach(() => {
  setErrorReporter(null)
  jest.restoreAllMocks()
})

const clickConfirm = async () => userEvent.click(screen.getAllByRole("button", { name: /confirm delivery/i })[0])

describe("OrderDetailContent", () => {
  describe("rendering", () => {
    it("shows the order number and total", () => {
      render(<OrderDetailContent order={baseOrder} />)

      expect(screen.getByText(/TOLA-00042/)).toBeInTheDocument()
      expect(screen.getAllByText(/125,000/).length).toBeGreaterThan(0)
    })

    it("renders line items", () => {
      render(<OrderDetailContent order={baseOrder} />)

      expect(screen.getByText("Sisal Basket")).toBeInTheDocument()
    })

    it("renders an order with no items without crashing", () => {
      render(<OrderDetailContent order={{ ...baseOrder, order_items: null }} />)

      expect(screen.getByText(/TOLA-00042/)).toBeInTheDocument()
    })

    it("renders an order with a null status without crashing", () => {
      // getStatusColor used to call .toLowerCase() on this directly.
      render(<OrderDetailContent order={{ ...baseOrder, status: null, payment_status: null }} />)

      expect(screen.getByText(/TOLA-00042/)).toBeInTheDocument()
    })

    it("shows the delivery PIN while the order is in transit", () => {
      render(<OrderDetailContent order={baseOrder} />)

      expect(screen.getByText("4821")).toBeInTheDocument()
    })

    it("hides the confirm banner when confirmation was not requested", () => {
      render(<OrderDetailContent order={{ ...baseOrder, delivery_confirmation_requested: false }} />)

      expect(screen.queryByRole("button", { name: /confirm delivery/i })).not.toBeInTheDocument()
    })
  })

  describe("handleConfirmDelivery", () => {
    it("posts the order id to the confirm endpoint", async () => {
      const fetchMock = mockFetch({ ok: true })
      render(<OrderDetailContent order={baseOrder} />)

      await clickConfirm()

      await waitFor(() =>
        expect(fetchMock).toHaveBeenCalledWith(
          "/api/orders/confirm-delivery",
          expect.objectContaining({
            method: "POST",
            body: JSON.stringify({ orderId: "ord-1" }),
          }),
        ),
      )
    })

    it("refreshes the page on success", async () => {
      mockFetch({ ok: true })
      render(<OrderDetailContent order={baseOrder} />)

      await clickConfirm()

      await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1))
      expect(screen.queryByRole("alert")).not.toBeInTheDocument()
      expect(reported).toHaveLength(0)
    })

    it("surfaces an error and does NOT refresh when the request is rejected", async () => {
      // The regression this pins: a non-OK response used to do nothing at all.
      mockFetch({ ok: false, status: 409 })
      render(<OrderDetailContent order={baseOrder} />)

      await clickConfirm()

      expect(await screen.findByRole("alert")).toHaveTextContent(/couldn't confirm delivery/i)
      expect(mockRefresh).not.toHaveBeenCalled()
      expect(reported).toHaveLength(1)
      expect(reported[0]).toMatchObject({
        scope: "orders.detail",
        message: "failed to confirm delivery",
        context: { orderId: "ord-1" },
      })
      expect(reported[0].error?.message).toContain("409")
    })

    it("surfaces an error when the network fails", async () => {
      mockFetch("reject")
      render(<OrderDetailContent order={baseOrder} />)

      await clickConfirm()

      expect(await screen.findByRole("alert")).toBeInTheDocument()
      expect(mockRefresh).not.toHaveBeenCalled()
      expect(reported[0].error?.message).toBe("network down")
    })

    it("re-enables the button after a failure so the buyer can retry", async () => {
      mockFetch({ ok: false, status: 500 })
      render(<OrderDetailContent order={baseOrder} />)

      await clickConfirm()
      await screen.findByRole("alert")

      const button = screen.getAllByRole("button", { name: /confirm delivery/i })[0]
      await waitFor(() => expect(button).not.toBeDisabled())
    })

    it("clears a previous error once a retry succeeds", async () => {
      mockFetch({ ok: false, status: 500 })
      render(<OrderDetailContent order={baseOrder} />)
      await clickConfirm()
      await screen.findByRole("alert")

      mockFetch({ ok: true })
      await clickConfirm()

      await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument())
      expect(mockRefresh).toHaveBeenCalledTimes(1)
    })
  })
})

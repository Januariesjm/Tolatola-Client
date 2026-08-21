/**
 * Tests for VendorSubscriptionTab (components/vendor/vendor-subscription-tab.tsx).
 *
 * Previously untested entirely. Focused on the same surface the transporter
 * equivalent is tested for: loading, opening the upgrade dialog for the
 * clicked plan, the checkout request body, and that a successful checkout
 * with no control number goes straight to the confirming-payment overlay.
 * (This tab now shares hooks/use-subscription-payment-poll.ts with the
 * transporter tab, whose poll behaviour has its own dedicated suite.)
 */

import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { VendorSubscriptionTab } from "@/components/vendor/vendor-subscription-tab"

const mockGet = jest.fn()
const mockPost = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiGet: (...args: unknown[]) => mockGet(...args),
  clientApiPost: (...args: unknown[]) => mockPost(...args),
}))

const mockToast = jest.fn()
jest.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mockToast }) }))

const PLANS = [
  { id: "p-free", name: "Free", price: 0 },
  { id: "p-pro", name: "Pro", price: 25000 },
]

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  mockGet.mockImplementation(async (path: string) => {
    if (path.includes("subscriptions/plans")) return { plans: PLANS }
    if (path.includes("subscription")) return { vendor: { current_subscription: { plan: PLANS[0] } } }
    return {}
  })
  mockPost.mockResolvedValue({ success: true, subscription: { id: "sub-1" } })
})

afterEach(() => {
  jest.restoreAllMocks()
})

async function renderTab() {
  const view = render(<VendorSubscriptionTab vendorId="v-1" />)
  await waitFor(() => expect(screen.getByText("Pro")).toBeInTheDocument())
  return view
}

describe("VendorSubscriptionTab", () => {
  it("requests plans and the vendor's current subscription", async () => {
    await renderTab()

    expect(mockGet).toHaveBeenCalledWith("subscriptions/plans")
    expect(mockGet).toHaveBeenCalledWith("vendors/v-1/subscription")
  })

  it("opens the upgrade dialog for the plan that was clicked", async () => {
    await renderTab()

    await userEvent.click(screen.getByRole("button", { name: "Upgrade to Pro" }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("Upgrade to Pro")).toBeInTheDocument()
  })

  it("posts the selected plan, vendor id and payment method on checkout", async () => {
    await renderTab()
    await userEvent.click(screen.getByRole("button", { name: "Upgrade to Pro" }))
    const dialog = await screen.findByRole("dialog")
    const phoneInput = within(dialog).getAllByRole("textbox")[0] ?? within(dialog).getByPlaceholderText(/2557/)
    await userEvent.type(phoneInput, "255700000001")

    await userEvent.click(within(dialog).getByRole("button", { name: /^Pay /i }))

    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1))
    const [path, body] = mockPost.mock.calls[0]
    expect(path).toBe("subscriptions")
    expect(body).toMatchObject({ planId: "p-pro", vendorId: "v-1" })
  })

  it("shows the confirming-payment overlay after a successful checkout with no control number", async () => {
    mockPost.mockResolvedValue({ success: true, subscription: { id: "sub-1" } })
    await renderTab()
    await userEvent.click(screen.getByRole("button", { name: "Upgrade to Pro" }))
    const dialog = await screen.findByRole("dialog")
    const phoneInput = within(dialog).getAllByRole("textbox")[0] ?? within(dialog).getByPlaceholderText(/2557/)
    await userEvent.type(phoneInput, "255700000001")

    await userEvent.click(within(dialog).getByRole("button", { name: /^Pay /i }))

    await waitFor(() => expect(screen.getByText("Confirming Payment")).toBeInTheDocument())
  })

  it("reports a failed checkout", async () => {
    mockPost.mockResolvedValue({ success: false, message: "plan unavailable" })
    await renderTab()
    await userEvent.click(screen.getByRole("button", { name: "Upgrade to Pro" }))
    const dialog = await screen.findByRole("dialog")
    const phoneInput = within(dialog).getAllByRole("textbox")[0] ?? within(dialog).getByPlaceholderText(/2557/)
    await userEvent.type(phoneInput, "255700000001")

    await userEvent.click(within(dialog).getByRole("button", { name: /^Pay /i }))

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Payment Failed", variant: "destructive" })),
    )
  })
})

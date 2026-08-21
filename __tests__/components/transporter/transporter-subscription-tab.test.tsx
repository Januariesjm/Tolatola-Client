/**
 * Tests for TransporterSubscriptionTab
 * (components/transporter/transporter-subscription-tab.tsx).
 *
 * Previously untested entirely. Covers the plan/subscription load, opening the
 * upgrade dialog for the clicked plan, the checkout request body, and the two
 * outcomes a checkout can report (a mobile-money push with no control number,
 * versus a bank transfer that returns one and shows the payment overlay).
 */

import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TransporterSubscriptionTab } from "@/components/transporter/transporter-subscription-tab"

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
  { id: "p-basic", name: "Basic", price: 15000 },
]

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  mockGet.mockImplementation(async (path: string) => {
    if (path.includes("subscriptions/plans")) return { plans: PLANS }
    if (path.includes("transporters/me")) return { transporter: { current_subscription: { plan: PLANS[0] } } }
    return {}
  })
  mockPost.mockResolvedValue({ success: true, subscription: { id: "sub-1" } })
})

afterEach(() => {
  jest.restoreAllMocks()
})

async function renderTab() {
  const view = render(<TransporterSubscriptionTab transporterId="t-1" />)
  await waitFor(() => expect(screen.getByText("Basic")).toBeInTheDocument())
  return view
}

describe("TransporterSubscriptionTab", () => {
  it("requests plans scoped to transporters", async () => {
    await renderTab()

    expect(mockGet).toHaveBeenCalledWith("subscriptions/plans?type=transporter")
  })

  it("shows the current plan as active", async () => {
    await renderTab()

    expect(screen.getByText("Active Plan: Free")).toBeInTheDocument()
  })

  it("marks the current plan's card, not the other one, as current", async () => {
    await renderTab()

    const freeCard = screen.getByText("Free", { selector: ".text-xl" }).closest("div.relative")
    expect(freeCard).not.toBeNull()
    expect(within(freeCard as HTMLElement).getByText("Current")).toBeInTheDocument()
  })

  it("does not offer an upgrade button on the free plan", async () => {
    await renderTab()

    expect(screen.queryByRole("button", { name: "Upgrade to Free" })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Upgrade to Basic" })).toBeInTheDocument()
  })

  it("opens the upgrade dialog for the plan that was clicked", async () => {
    await renderTab()

    await userEvent.click(screen.getByRole("button", { name: "Upgrade to Basic" }))

    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByText("Basic Member")).toBeInTheDocument()
  })

  it("posts the selected plan and payment method on checkout", async () => {
    await renderTab()
    await userEvent.click(screen.getByRole("button", { name: "Upgrade to Basic" }))
    const dialog = await screen.findByRole("dialog")
    await userEvent.type(within(dialog).getByPlaceholderText("e.g. 2557..."), "255700000001")

    await userEvent.click(within(dialog).getByRole("button", { name: /^Pay /i }))

    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1))
    const [path, body] = mockPost.mock.calls[0]
    expect(path).toBe("subscriptions/transporters")
    expect(body).toMatchObject({
      planId: "p-basic",
      transporterId: "t-1",
      paymentMethod: "airtel-money",
      paymentDetails: { phoneNumber: "255700000001" },
    })
  })

  it("shows the payment overlay and does not surface a control number for a mobile-money push", async () => {
    mockPost.mockResolvedValue({ success: true, subscription: { id: "sub-1" } })
    await renderTab()
    await userEvent.click(screen.getByRole("button", { name: "Upgrade to Basic" }))
    const dialog = await screen.findByRole("dialog")
    await userEvent.type(within(dialog).getByPlaceholderText("e.g. 2557..."), "255700000001")

    await userEvent.click(within(dialog).getByRole("button", { name: /^Pay /i }))

    await waitFor(() => expect(screen.getByText("Confirming Payment")).toBeInTheDocument())
    expect(screen.queryByText("Control Number")).not.toBeInTheDocument()
  })

  it("shows the bank control number when the checkout returns one", async () => {
    mockPost.mockResolvedValue({ success: true, subscription: { id: "sub-1" }, controlNumber: "987654321" })
    await renderTab()
    await userEvent.click(screen.getByRole("button", { name: "Upgrade to Basic" }))
    const dialog = await screen.findByRole("dialog")
    await userEvent.click(within(dialog).getByText("Bank Transfer"))
    await userEvent.click(within(dialog).getByText("crdb wakala"))

    await userEvent.click(within(dialog).getByRole("button", { name: /^Pay /i }))

    await waitFor(() => expect(screen.getByText("987654321")).toBeInTheDocument())
    expect(screen.getByText("Bank Settlement")).toBeInTheDocument()
  })

  it("reports a failed checkout without showing the payment overlay", async () => {
    mockPost.mockResolvedValue({ success: false, message: "plan unavailable" })
    await renderTab()
    await userEvent.click(screen.getByRole("button", { name: "Upgrade to Basic" }))
    const dialog = await screen.findByRole("dialog")
    await userEvent.type(within(dialog).getByPlaceholderText("e.g. 2557..."), "255700000001")

    await userEvent.click(within(dialog).getByRole("button", { name: /^Pay /i }))

    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Payment Failed", variant: "destructive" })),
    )
    expect(screen.queryByText("Confirming Payment")).not.toBeInTheDocument()
  })
})

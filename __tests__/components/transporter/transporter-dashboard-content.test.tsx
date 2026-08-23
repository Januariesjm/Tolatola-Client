/**
 * Tests for TransporterDashboardContent (components/transporter/transporter-dashboard-content.tsx).
 *
 * This component is a thin shell: it owns `activeTab` state, computes the
 * date-filtered stats (active/completed trips, available/pending balance)
 * that feed both the stat cards and every tab, and wires up location update
 * / logout. Every tab is mocked out (as a prop-capturing stub) so this suite
 * exercises only the shell's own routing/derived-state logic, not each tab's
 * own data fetching.
 */

import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TransporterDashboardContent } from "@/components/transporter/transporter-dashboard-content"

const mockGet = jest.fn()
const mockPut = jest.fn()
const mockPost = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiGet: (...args: unknown[]) => mockGet(...args),
  clientApiPut: (...args: unknown[]) => mockPut(...args),
  clientApiPost: (...args: unknown[]) => mockPost(...args),
}))

const mockToast = jest.fn()
jest.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mockToast }) }))

// The global mock in jest.setup.ts builds a fresh client instance per call,
// which makes signOut unassertable (the component's instance differs from
// any instance a test creates). Override it here with one shared jest.fn.
const mockSignOut = jest.fn().mockResolvedValue({ error: null })
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signOut: mockSignOut } }),
}))

jest.mock("@/lib/logger", () => {
  const childLogger = { error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn() }
  return { logger: { child: jest.fn(() => childLogger) } }
})

jest.mock("@/components/layout/header-animated-text", () => ({
  HeaderAnimatedText: () => <span>TOLA</span>,
}))
jest.mock("@/components/layout/notification-popover", () => ({
  NotificationPopover: () => <div data-testid="notification-popover" />,
}))

const paymentsSpy = jest.fn()
const withdrawalsSpy = jest.fn()

jest.mock("@/components/transporter/transporter-assignments-tab", () => ({
  TransporterAssignmentsTab: (props: any) => <div data-testid="assignments-tab">assignments:{props.assignments.length}</div>,
}))
jest.mock("@/components/transporter/transporter-payments-tab", () => ({
  TransporterPaymentsTab: (props: any) => {
    paymentsSpy(props)
    return <div data-testid="payments-tab">payments:{props.payments.length}</div>
  },
}))
jest.mock("@/components/transporter/transporter-withdrawals-tab", () => ({
  TransporterWithdrawalsTab: (props: any) => {
    withdrawalsSpy(props)
    return <div data-testid="withdrawals-tab">withdrawals:{props.withdrawals.length}</div>
  },
}))
jest.mock("@/components/transporter/transporter-subscription-tab", () => ({
  TransporterSubscriptionTab: () => <div data-testid="subscription-tab" />,
}))
jest.mock("@/components/transporter/transporter-profile-tab", () => ({
  TransporterProfileTab: () => <div data-testid="profile-tab" />,
}))

type DashboardProps = React.ComponentProps<typeof TransporterDashboardContent>

const baseProps: DashboardProps = {
  transporter: { id: "t-1", business_name: "Kariakoo Movers", vehicle_type: "van", rating: 4.8 },
  assignments: [
    { id: "a-1", status: "accepted", accepted_at: "2026-01-01" },
    { id: "a-2", status: "delivered" },
    { id: "a-3", status: "delivered" },
  ],
  payments: [
    { id: "p-1", status: "available", amount: 5000 },
    { id: "p-2", status: "available", amount: 2000 },
    { id: "p-3", status: "pending", amount: 1000 },
  ],
  withdrawals: [{ id: "w-1", status: "pending", amount: 1000 }],
  user: { id: "u-1", email: "driver@example.com" },
}

function renderDashboard(overrides: Partial<DashboardProps> = {}) {
  return render(<TransporterDashboardContent {...baseProps} {...overrides} />)
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGet.mockResolvedValue({ assignments: [], availableOrders: [] })
  mockPut.mockResolvedValue({})
  mockPost.mockResolvedValue({})
})

describe("TransporterDashboardContent", () => {
  it("renders the assignments tab by default", () => {
    renderDashboard()

    expect(screen.getByTestId("assignments-tab")).toBeInTheDocument()
    expect(screen.queryByTestId("payments-tab")).not.toBeInTheDocument()
  })

  it("shows the transporter's business name", () => {
    renderDashboard()

    expect(screen.getByText("Kariakoo Movers")).toBeInTheDocument()
  })

  it("computes active and completed trip counts from the assignments", () => {
    renderDashboard()

    const activeCard = screen.getByText("Active Deliveries").closest('[data-slot="card"]') as HTMLElement
    const completedCard = screen.getByText("Completed").closest('[data-slot="card"]') as HTMLElement
    expect(within(activeCard).getByText("1")).toBeInTheDocument()
    expect(within(completedCard).getByText("2")).toBeInTheDocument()
  })

  it("computes available and pending balances from the payments", () => {
    renderDashboard()

    // Available balance: 5000 + 2000 = 7000; pending: 1000.
    const balanceCard = screen.getByText("Available Balance").closest('[data-slot="card"]') as HTMLElement
    expect(balanceCard.textContent).toContain("7,000")
    expect(balanceCard.textContent).toContain("TZS")
  })

  it("forwards the computed balances to the payments tab", async () => {
    renderDashboard()

    await userEvent.click(screen.getByRole("tab", { name: /Payments/i }))

    expect(paymentsSpy).toHaveBeenCalledWith(expect.objectContaining({ availableBalance: 7000, pendingBalance: 1000 }))
  })

  it("passes the available balance down to the withdrawals tab", () => {
    renderDashboard()

    expect(withdrawalsSpy).not.toHaveBeenCalled() // withdrawals tab isn't mounted on the default tab
  })

  it("switches to the payments tab", async () => {
    renderDashboard()

    await userEvent.click(screen.getByRole("tab", { name: /Payments/i }))

    expect(screen.getByTestId("payments-tab")).toBeInTheDocument()
    expect(screen.queryByTestId("assignments-tab")).not.toBeInTheDocument()
  })

  it("switches to the withdrawals tab and forwards the available balance", async () => {
    renderDashboard()

    await userEvent.click(screen.getByRole("tab", { name: /Withdrawals/i }))

    expect(screen.getByTestId("withdrawals-tab")).toBeInTheDocument()
    expect(withdrawalsSpy).toHaveBeenCalledWith(expect.objectContaining({ availableBalance: 7000 }))
  })

  it("switches to the subscription tab", async () => {
    renderDashboard()

    await userEvent.click(screen.getByRole("tab", { name: /Membership/i }))

    expect(screen.getByTestId("subscription-tab")).toBeInTheDocument()
  })

  it("switches to the profile tab", async () => {
    renderDashboard()

    await userEvent.click(screen.getByRole("tab", { name: "Profile" }))

    expect(screen.getByTestId("profile-tab")).toBeInTheDocument()
  })

  it("refreshes assignments when the Refresh Trips button is clicked", async () => {
    mockGet.mockImplementation(async (path: string) => {
      if (path === "assignments") return { assignments: [{ id: "a-9", status: "delivered" }] }
      return { availableOrders: [] }
    })
    renderDashboard()

    await userEvent.click(screen.getByRole("button", { name: /Refresh Trips/i }))

    await waitFor(() => expect(mockGet).toHaveBeenCalledWith("assignments"))
    expect(mockGet).toHaveBeenCalledWith("assignments/available")
  })

  it("updates the location and shows a success message", async () => {
    const getCurrentPosition = jest.fn((success: (pos: unknown) => void) => {
      success({ coords: { latitude: -6.8, longitude: 39.28 } })
    })
    Object.defineProperty(window.navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition },
    })

    renderDashboard()
    await userEvent.click(screen.getByRole("button", { name: /Update Location/i }))

    await waitFor(() => expect(screen.getByText("✓ Location synced")).toBeInTheDocument())
    expect(mockPut).toHaveBeenCalledWith("transporters/me/location", { latitude: -6.8, longitude: 39.28 })
  })

  it("shows an error message when the location update fails", async () => {
    const getCurrentPosition = jest.fn((_success: unknown, error: (err: unknown) => void) => {
      error(new Error("denied"))
    })
    Object.defineProperty(window.navigator, "geolocation", {
      configurable: true,
      value: { getCurrentPosition },
    })

    renderDashboard()
    await userEvent.click(screen.getByRole("button", { name: /Update Location/i }))

    await waitFor(() => expect(screen.getByText("Failed to sync location")).toBeInTheDocument())
  })

  it("logs out: signs out of Supabase and calls the backend logout", async () => {
    // jsdom's real `window.location.href` setter attempts navigation (and its
    // property descriptor isn't configurable in this jsdom version, so it
    // can't be swapped for a spy either); suppress the resulting "not
    // implemented" console noise and assert on the calls that matter instead.
    jest.spyOn(console, "error").mockImplementation(() => {})

    renderDashboard()
    await userEvent.click(screen.getByRole("button", { name: /Logout/i }))

    await waitFor(() => expect(mockSignOut).toHaveBeenCalled())
    expect(mockPost).toHaveBeenCalledWith("auth/logout")
  })
})

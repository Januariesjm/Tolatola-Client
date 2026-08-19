import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { AdminDashboardContent } from "@/components/admin/admin-dashboard-content"

// Mock notification popover to prevent deep component dependency chain in unit test
jest.mock("@/components/layout/notification-popover", () => ({
  NotificationPopover: () => <div data-testid="notification-popover">Notifications</div>,
}))

// Mock sub-tab components so we can test AdminDashboardContent navigation in isolation
jest.mock("@/components/admin/analytics-tab", () => ({
  AnalyticsTab: () => <div data-testid="analytics-tab">Analytics Content</div>,
}))
jest.mock("@/components/admin/support-tickets-tab", () => ({
  SupportTicketsTab: () => <div data-testid="support-tab">Support Tickets Content</div>,
}))
jest.mock("@/components/admin/orders-management-tab", () => ({
  OrdersManagementTab: () => <div data-testid="orders-tab">Orders Content</div>,
}))

describe("AdminDashboardContent component", () => {
  const defaultProps = {
    adminRole: {
      id: "role-1",
      email: "admin@tolatola.co",
      role: { id: "r1", role_name: "Super Admin", access_level: 10, permissions: ["view_analytics", "manage_support"] },
      permissions: ["view_analytics", "manage_support", "manage_orders"],
    },
    pendingVendors: [],
    pendingTransporters: [],
    pendingCustomerKyc: [],
    pendingProducts: [],
    allProducts: [],
    orders: [],
    transactions: [],
    tickets: [],
    payouts: [],
    stats: { totalUsers: 100, totalOrders: 50 },
    promotions: [],
    subscriptions: [],
  }

  it("renders the sidebar and default analytics tab for superadmin", () => {
    render(<AdminDashboardContent {...defaultProps} />)

    expect(screen.getByTestId("analytics-tab")).toBeInTheDocument()
    expect(screen.getByText("Super Admin")).toBeInTheDocument()
  })

  it("renders permission-gated sidebar buttons", () => {
    render(<AdminDashboardContent {...defaultProps} />)

    expect(screen.getByRole("button", { name: /analytics/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /orders/i })).toBeInTheDocument()
  })

  it("switches tabs when a sidebar button is clicked", () => {
    render(<AdminDashboardContent {...defaultProps} />)

    const ordersBtn = screen.getByRole("button", { name: /orders/i })
    fireEvent.click(ordersBtn)

    expect(screen.getByTestId("orders-tab")).toBeInTheDocument()
  })

  it("handles empty adminRole gracefully without crashing", () => {
    const propsNoRole = {
      ...defaultProps,
      adminRole: null,
    }

    render(<AdminDashboardContent {...propsNoRole} />)
    expect(screen.getByTestId("analytics-tab")).toBeInTheDocument()
  })
})

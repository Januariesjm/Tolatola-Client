import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import { useRouter } from "next/navigation"
import ProfileContent from "@/components/profile/profile-content"
import { clientApiPost } from "@/lib/api-client"

// Mock sub-tab components so ProfileContent's own tab-switching logic can be
// tested in isolation, without pulling in each tab's own dependency chain.
jest.mock("@/components/profile/personal-info-tab", () => ({
  __esModule: true,
  default: () => <div data-testid="personal-tab">Personal Info Content</div>,
}))
jest.mock("@/components/profile/kyc-verification-tab", () => ({
  __esModule: true,
  default: () => <div data-testid="kyc-tab">KYC Verification Content</div>,
}))
jest.mock("@/components/profile/order-history-tab", () => ({
  __esModule: true,
  default: () => <div data-testid="orders-tab">Order History Content</div>,
}))
jest.mock("@/components/profile/transaction-history-tab", () => ({
  __esModule: true,
  default: () => <div data-testid="transactions-tab">Transaction History Content</div>,
}))
jest.mock("@/components/profile/account-settings-tab", () => ({
  __esModule: true,
  default: () => <div data-testid="settings-tab">Account Settings Content</div>,
}))
jest.mock("@/components/profile/support-tab", () => ({
  __esModule: true,
  default: () => <div data-testid="support-tab">Support Tickets Content</div>,
}))

jest.mock("@/lib/api-client", () => ({
  clientApiPost: jest.fn(),
}))

describe("ProfileContent component", () => {
  const defaultProps = {
    user: { id: "user-1", email: "jane@example.com", created_at: "2023-05-10T00:00:00.000Z" },
    profile: { full_name: "Jane Doe" },
    kyc: { kyc_status: "approved" },
    vendor: undefined,
    transporter: undefined,
    orders: [],
    transactions: [],
    tickets: [],
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(clientApiPost as jest.Mock).mockResolvedValue({})
  })

  it("renders the default (personal) tab on mount", () => {
    render(<ProfileContent {...defaultProps} />)

    expect(screen.getByTestId("personal-tab")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Personal Info" })).toBeInTheDocument()
  })

  it("renders the profile header with name, email, and avatar initial", () => {
    render(<ProfileContent {...defaultProps} />)

    expect(screen.getByText("Jane Doe")).toBeInTheDocument()
    expect(screen.getByText("jane@example.com")).toBeInTheDocument()
    // Avatar initial derived from full_name
    expect(screen.getByText("J")).toBeInTheDocument()
  })

  it("falls back to 'User' and email initial when profile has no name", () => {
    render(<ProfileContent {...defaultProps} profile={null} />)

    expect(screen.getByText("User")).toBeInTheDocument()
    // Avatar initial falls back to the first letter of the email
    expect(screen.getByText("j")).toBeInTheDocument()
  })

  it("shows the KYC verified badge when kyc_status is approved", () => {
    render(<ProfileContent {...defaultProps} />)
    expect(screen.getByText("Verified")).toBeInTheDocument()
  })

  it("shows a 'Not Verified' badge when kyc is missing", () => {
    render(<ProfileContent {...defaultProps} kyc={null} />)
    expect(screen.getByText("Not Verified")).toBeInTheDocument()
  })

  it("switches to the KYC tab when its nav item is clicked", () => {
    render(<ProfileContent {...defaultProps} />)

    fireEvent.click(screen.getByRole("button", { name: /kyc verification/i }))

    expect(screen.getByTestId("kyc-tab")).toBeInTheDocument()
    expect(screen.queryByTestId("personal-tab")).not.toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "KYC Verification" })).toBeInTheDocument()
  })

  it("switches to the Order History tab when its nav item is clicked", () => {
    render(<ProfileContent {...defaultProps} />)

    fireEvent.click(screen.getByRole("button", { name: /order history/i }))

    expect(screen.getByTestId("orders-tab")).toBeInTheDocument()
  })

  it("switches to the Transactions tab when its nav item is clicked", () => {
    render(<ProfileContent {...defaultProps} />)

    fireEvent.click(screen.getByRole("button", { name: /transactions/i }))

    expect(screen.getByTestId("transactions-tab")).toBeInTheDocument()
  })

  it("switches to the Support Tickets tab when its nav item is clicked", () => {
    render(<ProfileContent {...defaultProps} />)

    fireEvent.click(screen.getByRole("button", { name: /support tickets/i }))

    expect(screen.getByTestId("support-tab")).toBeInTheDocument()
  })

  it("switches to the Settings tab when its nav item is clicked", () => {
    render(<ProfileContent {...defaultProps} />)

    fireEvent.click(screen.getByRole("button", { name: /^settings$/i }))

    expect(screen.getByTestId("settings-tab")).toBeInTheDocument()
  })

  it("navigates back to the personal tab after switching away and back", () => {
    render(<ProfileContent {...defaultProps} />)

    fireEvent.click(screen.getByRole("button", { name: /order history/i }))
    expect(screen.getByTestId("orders-tab")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /personal info/i }))
    expect(screen.getByTestId("personal-tab")).toBeInTheDocument()
  })

  it("shows the default 'Become a Seller' CTA when the user has no vendor record", () => {
    render(<ProfileContent {...defaultProps} />)
    expect(screen.getByRole("button", { name: /become a seller/i })).toBeInTheDocument()
  })

  it("shows 'Under Review' for a pending vendor application and disables the button", () => {
    render(<ProfileContent {...defaultProps} vendor={{ kyc_status: "pending" }} />)

    const btn = screen.getByRole("button", { name: /under review/i })
    expect(btn).toBeInTheDocument()
    expect(btn).toBeDisabled()
  })

  it("shows the rejection reason and a Reapply CTA for a rejected vendor application", () => {
    render(<ProfileContent {...defaultProps} vendor={{ kyc_status: "rejected", kyc_notes: "Missing documents" }} />)

    expect(screen.getByText("Missing documents")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /reapply/i })).toBeInTheDocument()
  })

  it("switches an approved vendor to the vendor dashboard via the API", async () => {
    // jest.setup.ts mocks next/navigation's useRouter to return a shared
    // module-level mockRouter object (with jest.fn() methods), rather than
    // making useRouter itself a jest.fn() -- so we read the router instance
    // to assert on its push() calls instead of re-mocking useRouter.
    const router = useRouter()
    ;(clientApiPost as jest.Mock).mockResolvedValue({})

    render(<ProfileContent {...defaultProps} vendor={{ kyc_status: "approved" }} />)

    fireEvent.click(screen.getByRole("button", { name: /switch to seller dashboard/i }))

    expect(clientApiPost).toHaveBeenCalledWith("profile/switch-role", { role: "vendor" })
    await screen.findByRole("button", { name: /switch to seller dashboard/i })
    expect(router.push).toHaveBeenCalledWith("/vendor/dashboard")
  })

  it("shows the default 'Become a Transporter' CTA when the user has no transporter record", () => {
    render(<ProfileContent {...defaultProps} />)
    expect(screen.getByRole("button", { name: /become a transporter/i })).toBeInTheDocument()
  })

  it("renders the member-since year derived from the user's created_at date", () => {
    render(<ProfileContent {...defaultProps} />)
    expect(screen.getByText(/member since 2023/i)).toBeInTheDocument()
  })
})

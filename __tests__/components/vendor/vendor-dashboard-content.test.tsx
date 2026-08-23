/**
 * Tests for VendorDashboardContent (components/vendor/vendor-dashboard-content.tsx).
 *
 * Unlike the agent dashboard shell, this component renders real Radix
 * `Tabs`/`TabsTrigger`/`TabsContent` (no switch-statement routing) so tab
 * switching is exercised by clicking the actual tab triggers. Every heavy
 * child (order/wallet/subscription tabs, the add/edit/profile dialogs, the
 * notification popover) is mocked out as a simple stub so this suite only
 * covers the shell's own logic:
 *  - which tab is active on mount, including from the `tab`/`orderId` query params
 *  - the "no shop yet" vs "has shop" branches
 *  - the shop-location-missing banner and the location-required warning dialog
 *    gating "Add Product"
 *  - rendering product cards (including the out-of-stock badge and status
 *    colors) and wiring their edit/toggle-stock/delete actions
 *  - the Shop Settings and Profile panels rendered inline (not mocked)
 *  - the logout handler
 */

import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { VendorDashboardContent } from "@/components/vendor/vendor-dashboard-content"

const mockPush = jest.fn()
const mockRefresh = jest.fn()
let mockSearchParams = new URLSearchParams()

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
  useSearchParams: () => mockSearchParams,
}))

const mockApiPost = jest.fn()
const mockApiGet = jest.fn()
const mockApiDelete = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiPost: (...args: unknown[]) => mockApiPost(...args),
  clientApiGet: (...args: unknown[]) => mockApiGet(...args),
  clientApiDelete: (...args: unknown[]) => mockApiDelete(...args),
}))

// Overrides the global jest.setup.ts supabase mock so an individual test can
// make auth.signOut() reject (to exercise handleLogout's outer catch branch).
const mockSignOut = jest.fn().mockResolvedValue({ error: null })
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({ auth: { signOut: (...args: unknown[]) => mockSignOut(...args) } }),
}))

jest.mock("@/components/layout/notification-popover", () => ({
  NotificationPopover: ({ userType }: { userType?: string }) => <div data-testid="notification-popover">popover:{userType}</div>,
}))

jest.mock("@/components/vendor/add-product-dialog", () => ({
  AddProductDialog: ({ open, shopId, onSuccess }: { open: boolean; shopId?: string; onSuccess: () => void }) =>
    open ? (
      <div data-testid="add-product-dialog">
        add-product:{shopId}
        <button onClick={onSuccess}>add-product-succeeded</button>
      </div>
    ) : null,
}))

jest.mock("@/components/vendor/edit-product-dialog", () => ({
  EditProductDialog: ({ open, product, onSuccess }: { open: boolean; product?: { name?: string }; onSuccess: () => void }) =>
    open ? (
      <div data-testid="edit-product-dialog">
        edit-product:{product?.name}
        <button onClick={onSuccess}>edit-product-succeeded</button>
      </div>
    ) : null,
}))

jest.mock("@/components/vendor/edit-vendor-profile-dialog", () => ({
  EditVendorProfileDialog: ({ open, vendor, onSuccess }: { open: boolean; vendor?: { business_name?: string }; onSuccess: () => void }) =>
    open ? (
      <div data-testid="edit-vendor-profile-dialog">
        edit-profile:{vendor?.business_name}
        <button onClick={onSuccess}>edit-profile-succeeded</button>
      </div>
    ) : null,
}))

jest.mock("@/components/vendor/vendor-orders-tab", () => ({
  VendorOrdersTab: ({ shopId, initialOrderId }: { shopId: string; initialOrderId?: string }) => (
    <div data-testid="orders-tab">
      orders-tab:{shopId}:{initialOrderId ?? "none"}
    </div>
  ),
}))

jest.mock("@/components/vendor/vendor-wallet-tab", () => ({
  VendorWalletTab: ({ vendorId }: { vendorId: string }) => <div data-testid="wallet-tab">wallet-tab:{vendorId}</div>,
}))

jest.mock("@/components/vendor/vendor-subscription-tab", () => ({
  VendorSubscriptionTab: ({ vendorId }: { vendorId: string }) => <div data-testid="subscription-tab">subscription-tab:{vendorId}</div>,
}))

const baseVendor = {
  id: "vendor-1",
  business_name: "Kilimanjaro Traders",
  phone: "0712345678",
  description: "We sell fresh produce",
}

const baseShop = {
  id: "shop-1",
  name: "Kilimanjaro Shop",
  description: "A great shop",
  region: "Kilimanjaro",
  district: "Moshi",
  ward: "Kaloleni",
  address: "Market Street",
}

const baseProducts = [
  { id: "p-1", name: "Bananas", description: "Fresh bananas", price: 5000, stock_quantity: 10, status: "approved", images: [] },
  { id: "p-2", name: "Mangoes", description: "Sweet mangoes", price: 3000, stock_quantity: 0, status: "pending", images: ["/mango.png"] },
]

type DashboardProps = React.ComponentProps<typeof VendorDashboardContent>

function renderContent(overrides: Partial<DashboardProps> = {}) {
  const props: DashboardProps = {
    vendor: baseVendor,
    shop: baseShop,
    products: baseProducts,
    ...overrides,
  }
  return render(<VendorDashboardContent {...props} />)
}

beforeEach(() => {
  jest.clearAllMocks()
  mockSearchParams = new URLSearchParams()
  jest.spyOn(console, "error").mockImplementation(() => {})
  mockApiPost.mockResolvedValue({ success: true })
  mockApiDelete.mockResolvedValue({ success: true })
  mockSignOut.mockResolvedValue({ error: null })
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("VendorDashboardContent", () => {
  it("renders the products tab by default with the vendor's welcome header", () => {
    renderContent()

    expect(screen.getByText("Welcome, Kilimanjaro Traders")).toBeInTheDocument()
    expect(screen.getByText("Your Products")).toBeInTheDocument()
    expect(screen.getByTestId("notification-popover")).toHaveTextContent("popover:vendor")
  })

  it("reads the initial tab and orderId from the search params", () => {
    mockSearchParams = new URLSearchParams("tab=orders&orderId=order-99")
    renderContent()

    expect(screen.getByTestId("orders-tab")).toHaveTextContent("orders-tab:shop-1:order-99")
  })

  it("defaults the orders tab's initialOrderId to none when absent from search params", () => {
    mockSearchParams = new URLSearchParams("tab=orders")
    renderContent()

    expect(screen.getByTestId("orders-tab")).toHaveTextContent("orders-tab:shop-1:none")
  })

  it("switches to the wallet tab and passes the vendor id", async () => {
    renderContent()

    await userEvent.click(screen.getByRole("tab", { name: "Wallet" }))

    expect(screen.getByTestId("wallet-tab")).toHaveTextContent("wallet-tab:vendor-1")
    expect(screen.queryByText("Your Products")).not.toBeInTheDocument()
  })

  it("switches to the subscription tab and passes the vendor id", async () => {
    renderContent()

    await userEvent.click(screen.getByRole("tab", { name: "Subscription" }))

    expect(screen.getByTestId("subscription-tab")).toHaveTextContent("subscription-tab:vendor-1")
  })

  it("switches to the shop settings tab and renders shop + vendor contact details inline", async () => {
    renderContent()

    await userEvent.click(screen.getByRole("tab", { name: "Shop Settings" }))

    expect(screen.getByText("Kilimanjaro Shop")).toBeInTheDocument()
    expect(screen.getByText("A great shop")).toBeInTheDocument()
    expect(screen.getByText("0712345678")).toBeInTheDocument()
    expect(screen.getByText("Market Street")).toBeInTheDocument()
    expect(screen.getByText("Kilimanjaro")).toBeInTheDocument()
    expect(screen.getByText("Kaloleni")).toBeInTheDocument()
  })

  it("shows fallback copy for missing shop description, phone and business description", async () => {
    renderContent({
      vendor: { ...baseVendor, phone: null, description: null },
      shop: { ...baseShop, description: null },
    })

    await userEvent.click(screen.getByRole("tab", { name: "Shop Settings" }))

    expect(screen.getAllByText("No description").length).toBeGreaterThan(0)
    expect(screen.getByText("No phone added")).toBeInTheDocument()
    expect(screen.getByText("No description added")).toBeInTheDocument()
  })

  it("shows an amber location warning inside shop settings when the shop has no address", async () => {
    renderContent({ shop: { ...baseShop, address: null } })

    await userEvent.click(screen.getByRole("tab", { name: "Shop Settings" }))

    expect(screen.getByText("Please add your shop location for accurate delivery fees")).toBeInTheDocument()
  })

  it("opens the edit-vendor-profile dialog from Shop Settings", async () => {
    renderContent()

    await userEvent.click(screen.getByRole("tab", { name: "Shop Settings" }))
    await userEvent.click(screen.getByRole("button", { name: /^edit profile$/i }))

    expect(screen.getByTestId("edit-vendor-profile-dialog")).toHaveTextContent("edit-profile:Kilimanjaro Traders")
  })

  it("navigates to the shop edit page from the 'Edit Shop' button in Shop Settings", async () => {
    renderContent()

    await userEvent.click(screen.getByRole("tab", { name: "Shop Settings" }))
    await userEvent.click(screen.getByRole("button", { name: /^edit shop$/i }))

    expect(mockPush).toHaveBeenCalledWith("/vendor/shop/edit")
  })

  it("switches to the profile tab", async () => {
    renderContent()

    await userEvent.click(screen.getByRole("tab", { name: "Profile" }))

    expect(screen.getByText("Profile Settings")).toBeInTheDocument()
  })

  it("navigates to /profile when Edit Profile is clicked on the profile tab", async () => {
    renderContent()

    await userEvent.click(screen.getByRole("tab", { name: "Profile" }))
    await userEvent.click(screen.getByRole("button", { name: /edit profile/i }))

    expect(mockPush).toHaveBeenCalledWith("/profile")
  })

  it("renders a 'Create Your Shop' card and navigates on click when there is no shop", async () => {
    renderContent({ shop: null })

    expect(screen.getByText("Create Your Shop")).toBeInTheDocument()
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: /create shop/i }))

    expect(mockPush).toHaveBeenCalledWith("/vendor/shop/create")
  })

  it("shows the shop-location-required banner when the shop has no region/district", () => {
    renderContent({ shop: { ...baseShop, region: null, district: null } })

    expect(screen.getByText("Shop Location Required")).toBeInTheDocument()
  })

  it("navigates to the shop edit page when 'Add Location' is clicked on the banner", async () => {
    renderContent({ shop: { ...baseShop, region: null, district: null } })

    await userEvent.click(screen.getByRole("button", { name: /add location/i }))

    expect(mockPush).toHaveBeenCalledWith("/vendor/shop/edit")
  })

  it("does not show the location banner once the shop has a region and district", () => {
    renderContent()

    expect(screen.queryByText("Shop Location Required")).not.toBeInTheDocument()
  })

  it("opens the add-product dialog directly when the shop already has a location", async () => {
    renderContent()

    await userEvent.click(screen.getByRole("button", { name: /^add product$/i }))

    expect(screen.getByTestId("add-product-dialog")).toHaveTextContent("add-product:shop-1")
  })

  it("shows a location-required warning dialog instead of opening add-product when location is missing", async () => {
    renderContent({ shop: { ...baseShop, region: null, district: null } })

    await userEvent.click(screen.getByRole("button", { name: /^add product$/i }))

    expect(screen.queryByTestId("add-product-dialog")).not.toBeInTheDocument()
    expect(
      screen.getByText(
        "You need to add your shop location before you can add products. The location is required to calculate accurate delivery fees for your customers.",
      ),
    ).toBeInTheDocument()
  })

  it("navigates to the shop edit page and dismisses the dialog from the location warning dialog", async () => {
    renderContent({ shop: { ...baseShop, region: null, district: null } })

    await userEvent.click(screen.getByRole("button", { name: /^add product$/i }))
    await userEvent.click(screen.getByRole("button", { name: /add shop location/i }))

    expect(mockPush).toHaveBeenCalledWith("/vendor/shop/edit")
    await waitFor(() =>
      expect(screen.queryByText(/You need to add your shop location before you can add products/i)).not.toBeInTheDocument(),
    )
  })

  it("renders an empty-products state and gates 'Add Your First Product' the same way", async () => {
    renderContent({ products: [] })

    expect(screen.getByText("No products yet")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: /add your first product/i }))

    expect(screen.getByTestId("add-product-dialog")).toBeInTheDocument()
  })

  it("renders product cards with price, stock, status and an out-of-stock badge", () => {
    renderContent()

    const bananas = screen.getByText("Bananas").closest("div.overflow-hidden") as HTMLElement
    expect(within(bananas).getByText("TZS 5,000")).toBeInTheDocument()
    expect(within(bananas).getByText("10")).toBeInTheDocument()
    expect(within(bananas).getByText("approved")).toBeInTheDocument()

    const mangoes = screen.getByText("Mangoes").closest("div.overflow-hidden") as HTMLElement
    expect(within(mangoes).getByText("Out of Stock")).toBeInTheDocument()
    expect(within(mangoes).getByText("pending")).toBeInTheDocument()
  })

  it("shows the rejected status color and a 'No description' fallback for a product with no description", () => {
    renderContent({
      products: [{ id: "p-3", name: "Avocados", description: null, price: 1000, stock_quantity: 4, status: "rejected", images: [] }],
    })

    const avocados = screen.getByText("Avocados").closest("div.overflow-hidden") as HTMLElement
    expect(within(avocados).getByText("rejected")).toBeInTheDocument()
    expect(within(avocados).getByText("No description")).toBeInTheDocument()
  })

  it("opens the edit-product dialog for the clicked product", async () => {
    renderContent()

    const bananas = screen.getByText("Bananas").closest("div.overflow-hidden") as HTMLElement
    await userEvent.click(within(bananas).getByRole("button", { name: /^edit$/i }))

    expect(screen.getByTestId("edit-product-dialog")).toHaveTextContent("edit-product:Bananas")
  })

  it("toggles stock via the API and refreshes when a product is marked out of stock", async () => {
    renderContent()

    const bananas = screen.getByText("Bananas").closest("div.overflow-hidden") as HTMLElement
    await userEvent.click(within(bananas).getByRole("button", { name: /out of stock/i }))

    await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith("products/update-stock", { productId: "p-1", quantity: 0 }))
    expect(mockRefresh).toHaveBeenCalled()
  })

  it("toggles stock back to in-stock for an out-of-stock product", async () => {
    renderContent()

    const mangoes = screen.getByText("Mangoes").closest("div.overflow-hidden") as HTMLElement
    await userEvent.click(within(mangoes).getByRole("button", { name: /in stock/i }))

    await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith("products/update-stock", { productId: "p-2", quantity: 1 }))
  })

  it("deletes a product after confirming in the alert dialog", async () => {
    renderContent()

    const bananas = screen.getByText("Bananas").closest("div.overflow-hidden") as HTMLElement
    const deleteButton = within(bananas)
      .getAllByRole("button")
      .find((button) => button.querySelector("svg.lucide-trash-2"))
    await userEvent.click(deleteButton as HTMLElement)

    expect(screen.getByText("Delete Product")).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to delete "Bananas"/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: /^delete$/i }))

    await waitFor(() => expect(mockApiDelete).toHaveBeenCalledWith("products/p-1"))
    expect(mockRefresh).toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByText("Delete Product")).not.toBeInTheDocument())
  })

  it("cancels product deletion without calling the API", async () => {
    renderContent()

    const bananas = screen.getByText("Bananas").closest("div.overflow-hidden") as HTMLElement
    const deleteButton = within(bananas)
      .getAllByRole("button")
      .find((button) => button.querySelector("svg.lucide-trash-2"))
    await userEvent.click(deleteButton as HTMLElement)

    await userEvent.click(screen.getByRole("button", { name: /cancel/i }))

    expect(mockApiDelete).not.toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByText("Delete Product")).not.toBeInTheDocument())
  })

  it("logs the user out: signs out of supabase, calls the backend logout endpoint, and redirects home", async () => {
    renderContent()

    await userEvent.click(screen.getByRole("button", { name: /logout/i }))

    // jsdom resolves the handler's `window.location.href = "/"` against the
    // current origin (it can't be swapped for a plain stub here), so assert
    // against the resolved root URL rather than the literal "/" the handler wrote.
    await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith("auth/logout"))
    await waitFor(() => expect(window.location.href).toBe(`${window.location.origin}/`))
  })

  it("still redirects home when the backend logout call fails", async () => {
    mockApiPost.mockRejectedValueOnce(new Error("backend down"))
    renderContent()

    await userEvent.click(screen.getByRole("button", { name: /logout/i }))

    await waitFor(() => expect(window.location.href).toBe(`${window.location.origin}/`))
  })

  it("refreshes the page after a successful add, edit, or profile-edit dialog", async () => {
    renderContent()

    await userEvent.click(screen.getByRole("button", { name: /^add product$/i }))
    await userEvent.click(screen.getByRole("button", { name: /add-product-succeeded/i }))
    expect(mockRefresh).toHaveBeenCalledTimes(1)

    const bananas = screen.getByText("Bananas").closest("div.overflow-hidden") as HTMLElement
    await userEvent.click(within(bananas).getByRole("button", { name: /^edit$/i }))
    await userEvent.click(screen.getByRole("button", { name: /edit-product-succeeded/i }))
    expect(mockRefresh).toHaveBeenCalledTimes(2)

    await userEvent.click(screen.getByRole("tab", { name: "Shop Settings" }))
    await userEvent.click(screen.getByRole("button", { name: /^edit profile$/i }))
    await userEvent.click(screen.getByRole("button", { name: /edit-profile-succeeded/i }))
    expect(mockRefresh).toHaveBeenCalledTimes(3)
  })

  it("still redirects home, without calling the backend logout, when supabase signOut itself fails", async () => {
    mockSignOut.mockRejectedValueOnce(new Error("signout failed"))
    renderContent()

    await userEvent.click(screen.getByRole("button", { name: /logout/i }))

    await waitFor(() => expect(window.location.href).toBe(`${window.location.origin}/`))
    expect(mockApiPost).not.toHaveBeenCalledWith("auth/logout")
  })

  it("does not refresh the product list when the delete API call fails", async () => {
    mockApiDelete.mockRejectedValueOnce(new Error("delete failed"))
    renderContent()

    const bananas = screen.getByText("Bananas").closest("div.overflow-hidden") as HTMLElement
    const deleteButton = within(bananas)
      .getAllByRole("button")
      .find((button) => button.querySelector("svg.lucide-trash-2"))
    await userEvent.click(deleteButton as HTMLElement)
    await userEvent.click(screen.getByRole("button", { name: /^delete$/i }))

    // Radix's AlertDialogAction dismisses the dialog on click regardless of
    // what the onClick handler does, so the observable effect of the failure
    // is that router.refresh() (the success-only side effect) never fires.
    await waitFor(() => expect(mockApiDelete).toHaveBeenCalledWith("products/p-1"))
    expect(mockRefresh).not.toHaveBeenCalled()
  })

  it("logs and swallows an error when the stock-toggle API call fails", async () => {
    mockApiPost.mockRejectedValueOnce(new Error("stock update failed"))
    renderContent()

    const bananas = screen.getByText("Bananas").closest("div.overflow-hidden") as HTMLElement
    await userEvent.click(within(bananas).getByRole("button", { name: /out of stock/i }))

    await waitFor(() => expect(mockApiPost).toHaveBeenCalledWith("products/update-stock", { productId: "p-1", quantity: 0 }))
    expect(mockRefresh).not.toHaveBeenCalled()
  })
})

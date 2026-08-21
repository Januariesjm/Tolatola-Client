/**
 * Tests for VendorManagementTab and the hook behind it
 * (components/admin/vendor-management-tab.tsx, hooks/use-admin-vendors.ts).
 *
 * The list is an admin surface with two destructive actions on it —
 * deactivating a vendor and permanently deleting one — so the behaviour worth
 * protecting is that each acts on the vendor that was clicked, that a failure
 * leaves the list alone, and that the details dialog stays in step with the row
 * it was opened from.
 */

import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { VendorManagementTab } from "@/components/admin/vendor-management-tab"
import { setErrorReporter, type LogRecord } from "@/lib/logger"

const mockGet = jest.fn()
const mockPost = jest.fn()
const mockDelete = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiGet: (...args: unknown[]) => mockGet(...args),
  clientApiPost: (...args: unknown[]) => mockPost(...args),
  clientApiDelete: (...args: unknown[]) => mockDelete(...args),
}))

const mockToast = jest.fn()
jest.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: mockToast }) }))
jest.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast: mockToast }) }))
jest.mock("@/components/admin/message-dialog", () => ({
  AdminMessageDialog: ({ recipientName }: { recipientName: string }) => <div data-testid="msg-dialog">{recipientName}</div>,
}))

const ACTIVE = {
  id: "v-1",
  user_id: "u-1",
  business_name: "Dodoma Crafts",
  tin_number: "TIN-111",
  nida_number: "NIDA-111",
  address: "12 Samora Ave",
  district: "Dodoma Urban",
  region: "Dodoma",
  ward: "Kikuyu",
  kyc_status: "approved",
  is_active: true,
  business_license_url: "/license.png",
  created_at: "2026-01-05T10:00:00Z",
  updated_at: "2026-01-06T10:00:00Z",
  users: { email: "asha@example.com", full_name: "Asha Mwinyi", phone: "255700000001", vendor_type: "producer" },
}

const INACTIVE = {
  id: "v-2",
  business_name: "Mbeya Grains",
  tin_number: "TIN-222",
  nida_number: "NIDA-222",
  address: "9 Uhuru Rd",
  district: "Mbeya City",
  region: "Mbeya",
  ward: "Sisimba",
  kyc_status: "pending",
  is_active: false,
  created_at: "2026-01-07T10:00:00Z",
  updated_at: "2026-01-08T10:00:00Z",
  users: { email: "baraka@example.com", full_name: "Baraka Juma" },
  phone: "255700000002",
}

let reported: LogRecord[]

beforeEach(() => {
  jest.clearAllMocks()
  reported = []
  setErrorReporter((record) => reported.push(record))
  jest.spyOn(console, "error").mockImplementation(() => {})
  jest.spyOn(console, "log").mockImplementation(() => {})
  // Deleting asks for a native confirm; jsdom's default is false, which would
  // make every delete test silently no-op.
  jest.spyOn(window, "confirm").mockReturnValue(true)
  mockGet.mockResolvedValue({ data: [ACTIVE, INACTIVE] })
  mockPost.mockResolvedValue({})
  mockDelete.mockResolvedValue({})
})

afterEach(() => {
  setErrorReporter(null)
  jest.restoreAllMocks()
})

/** Renders and waits for the list to arrive. */
async function renderTab() {
  const view = render(<VendorManagementTab />)
  await waitFor(() => expect(screen.getByText("Dodoma Crafts")).toBeInTheDocument())
  return view
}

/**
 * The list card for one vendor.
 *
 * Scoped to the first match on purpose: once the details dialog is open the
 * vendor's name appears there too, and a bare getByText would be ambiguous.
 */
const cardFor = (name: string) => {
  const heading = screen.getAllByText(name)[0]
  return (heading.closest("div.relative") ?? heading.parentElement!) as HTMLElement
}

/** Opens the details dialog from a vendor's card and returns the dialog. */
async function openDetails(name: string) {
  await userEvent.click(within(cardFor(name)).getByRole("button", { name: /view details/i }))
  return screen.findByRole("dialog")
}

describe("VendorManagementTab", () => {
  describe("loading", () => {
    it("requests the admin vendor list", async () => {
      await renderTab()

      expect(mockGet).toHaveBeenCalledWith("admin/vendors")
    })

    it("shows the total count", async () => {
      await renderTab()

      expect(screen.getByText("2 Total Vendors")).toBeInTheDocument()
    })

    it("reports a failed load and does not leave a spinner up forever", async () => {
      mockGet.mockRejectedValue(new Error("500 from admin/vendors"))

      render(<VendorManagementTab />)

      await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ variant: "destructive" })))
      expect(reported.map((r) => r.message)).toContain("error fetching vendors")
      expect(screen.getByText("0 Total Vendors")).toBeInTheDocument()
    })

    it("tolerates a response with no data array", async () => {
      mockGet.mockResolvedValue({})

      render(<VendorManagementTab />)

      await waitFor(() => expect(screen.getByText("0 Total Vendors")).toBeInTheDocument())
    })
  })

  describe("search", () => {
    it("narrows the list to matching vendors", async () => {
      await renderTab()

      await userEvent.type(screen.getByPlaceholderText(/search/i), "mbeya")

      await waitFor(() => expect(screen.queryByText("Dodoma Crafts")).not.toBeInTheDocument())
      expect(screen.getByText("Mbeya Grains")).toBeInTheDocument()
    })

    it("finds a vendor by TIN, which is how support requests arrive", async () => {
      await renderTab()

      await userEvent.type(screen.getByPlaceholderText(/search/i), "TIN-222")

      await waitFor(() => expect(screen.queryByText("Dodoma Crafts")).not.toBeInTheDocument())
    })

    it("keeps the total count showing every vendor, not just the matches", async () => {
      await renderTab()

      await userEvent.type(screen.getByPlaceholderText(/search/i), "mbeya")

      await waitFor(() => expect(screen.getByText("2 Total Vendors")).toBeInTheDocument())
    })

    it("restores the full list when the query is cleared", async () => {
      await renderTab()
      const input = screen.getByPlaceholderText(/search/i)

      await userEvent.type(input, "mbeya")
      await waitFor(() => expect(screen.queryByText("Dodoma Crafts")).not.toBeInTheDocument())
      await userEvent.clear(input)

      await waitFor(() => expect(screen.getByText("Dodoma Crafts")).toBeInTheDocument())
    })
  })

  describe("activating and deactivating", () => {
    it("deactivates an active vendor", async () => {
      await renderTab()

      await userEvent.click(within(cardFor("Dodoma Crafts")).getByRole("button", { name: /deactivate/i }))

      await waitFor(() => expect(mockPost).toHaveBeenCalledWith("admin/vendors/v-1/deactivate"))
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Vendor Deactivated" }))
    })

    it("activates an inactive vendor", async () => {
      await renderTab()

      await userEvent.click(within(cardFor("Mbeya Grains")).getByRole("button", { name: /activate/i }))

      await waitFor(() => expect(mockPost).toHaveBeenCalledWith("admin/vendors/v-2/activate"))
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({ title: "Vendor Activated" }))
    })

    it("flips the row's own control without refetching the list", async () => {
      await renderTab()

      await userEvent.click(within(cardFor("Dodoma Crafts")).getByRole("button", { name: /deactivate/i }))

      await waitFor(() => expect(within(cardFor("Dodoma Crafts")).getByRole("button", { name: /activate/i })).toBeInTheDocument())
      expect(mockGet).toHaveBeenCalledTimes(1)
    })

    it("leaves the row alone when the request fails", async () => {
      mockPost.mockRejectedValue(new Error("409"))
      await renderTab()

      await userEvent.click(within(cardFor("Dodoma Crafts")).getByRole("button", { name: /deactivate/i }))

      await waitFor(() => expect(reported.map((r) => r.message)).toContain("error toggling vendor status"))
      // Still showing "Deactivate": the optimistic flip must not survive a failure.
      expect(within(cardFor("Dodoma Crafts")).getByRole("button", { name: /deactivate/i })).toBeInTheDocument()
    })
  })

  describe("the details dialog", () => {
    it("opens for the vendor whose card was clicked", async () => {
      await renderTab()

      const dialog = await openDetails("Mbeya Grains")

      expect(within(dialog).getByText("Complete information for Mbeya Grains")).toBeInTheDocument()
    })

    it("shows the raw vendor type when it has no label yet", async () => {
      mockGet.mockResolvedValue({ data: [{ ...ACTIVE, users: { ...ACTIVE.users, vendor_type: "cooperative" } }] })
      await renderTab()

      await userEvent.click(screen.getByRole("button", { name: /view details/i }))

      const dialog = await screen.findByRole("dialog")
      expect(within(dialog).getByText("cooperative")).toBeInTheDocument()
    })

    it("toggling from inside the dialog closes it and updates the row underneath", async () => {
      await renderTab()
      const dialog = await openDetails("Dodoma Crafts")

      await userEvent.click(within(dialog).getByRole("button", { name: /deactivate account/i }))

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
      await waitFor(() => expect(within(cardFor("Dodoma Crafts")).getByRole("button", { name: /activate/i })).toBeInTheDocument())
    })

    it("reopening after a toggle shows the vendor's new state", async () => {
      await renderTab()
      const first = await openDetails("Dodoma Crafts")
      await userEvent.click(within(first).getByRole("button", { name: /deactivate account/i }))
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())

      const reopened = await openDetails("Dodoma Crafts")

      expect(within(reopened).getByRole("button", { name: /activate account/i })).toBeInTheDocument()
    })

    it("deletes the vendor, removes the row and closes", async () => {
      await renderTab()
      const dialog = await openDetails("Mbeya Grains")

      await userEvent.click(within(dialog).getByRole("button", { name: /delete/i }))

      await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("admin/vendors/v-2"))
      await waitFor(() => expect(screen.queryByText("Mbeya Grains")).not.toBeInTheDocument())
      expect(screen.getAllByText("Dodoma Crafts").length).toBeGreaterThan(0)
    })

    it("keeps the dialog open and the row present when the delete fails", async () => {
      mockDelete.mockRejectedValue(new Error("foreign key violation"))
      await renderTab()
      const dialog = await openDetails("Mbeya Grains")

      await userEvent.click(within(dialog).getByRole("button", { name: /delete/i }))

      await waitFor(() => expect(reported.map((r) => r.message)).toContain("error deleting vendor"))
      expect(screen.getAllByText("Mbeya Grains").length).toBeGreaterThan(0)
      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })
  })
})

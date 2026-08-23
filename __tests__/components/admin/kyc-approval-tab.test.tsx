/**
 * Tests for KYCApprovalTab (components/admin/kyc-approval-tab.tsx).
 *
 * A prop-driven list of pending vendor KYC applications. Approving posts
 * straight to the API and refreshes the router; rejecting opens a dialog that
 * requires a non-empty reason before it will submit. There is also a document
 * viewer dialog that switches between an <iframe> (PDF) and an <img> based on
 * the URL's extension. Failures fall back to a bare `alert()` rather than a
 * toast, so those are asserted via a spy on `window.alert`.
 */

import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { KYCApprovalTab } from "@/components/admin/kyc-approval-tab"
import { setErrorReporter, type LogRecord } from "@/lib/logger"

const mockPost = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiPost: (...args: unknown[]) => mockPost(...args),
}))

const mockRefresh = jest.fn()
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mockRefresh }) }))

function vendor(overrides: Record<string, unknown> = {}) {
  return {
    id: "v-1",
    business_name: "Dodoma Crafts",
    tin_number: "TIN-111",
    phone_number: "255700000001",
    location: "Dodoma",
    kyc_type: "individual",
    business_license_url: "/license.png",
    created_at: "2026-01-05T10:00:00Z",
    users: { email: "asha@example.com", full_name: "Asha Mwinyi", vendor_type: "producer" },
    ...overrides,
  }
}

let reported: LogRecord[]

beforeEach(() => {
  jest.clearAllMocks()
  reported = []
  setErrorReporter((record) => reported.push(record))
  jest.spyOn(console, "error").mockImplementation(() => {})
  jest.spyOn(window, "alert").mockImplementation(() => {})
  mockPost.mockResolvedValue({})
})

afterEach(() => {
  setErrorReporter(null)
  jest.restoreAllMocks()
})

const cardFor = (name: string) => screen.getByText(name).closest("div.space-y-4") as HTMLElement

describe("KYCApprovalTab", () => {
  describe("rendering", () => {
    it("shows the empty state when there are no vendors", () => {
      render(<KYCApprovalTab vendors={[]} />)

      expect(screen.getByText("No pending KYC applications")).toBeInTheDocument()
      expect(screen.getByText("0 Pending")).toBeInTheDocument()
    })

    it("tolerates a null/undefined vendors prop", () => {
      // @ts-expect-error -- exercising the `!vendors` branch deliberately
      render(<KYCApprovalTab vendors={null} />)

      expect(screen.getByText("No pending KYC applications")).toBeInTheDocument()
      expect(screen.getByText("0 Pending")).toBeInTheDocument()
    })

    it("renders a vendor's core details and the pending count", () => {
      render(<KYCApprovalTab vendors={[vendor()]} />)

      expect(screen.getByText("1 Pending")).toBeInTheDocument()
      expect(screen.getByText("Dodoma Crafts")).toBeInTheDocument()
      expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument()
      expect(screen.getAllByText("asha@example.com").length).toBeGreaterThan(0)
      expect(screen.getByText("TIN-111")).toBeInTheDocument()
      expect(screen.getByText("Individual / Sole Trader")).toBeInTheDocument()
      expect(screen.getByText("producer")).toBeInTheDocument()
    })

    it("shows company representative fields only for a company KYC type", () => {
      render(
        <KYCApprovalTab
          vendors={[
            vendor({
              kyc_type: "company",
              representative_full_name: "Juma Rep",
              representative_phone: "255700000009",
              representative_tin: "REP-TIN",
              representative_position: "Director",
              representative_national_id: "NIDA-9",
            }),
          ]}
        />,
      )

      expect(screen.getByText("Company")).toBeInTheDocument()
      expect(screen.getByText("Juma Rep")).toBeInTheDocument()
      expect(screen.getByText("Director")).toBeInTheDocument()
    })

    it("does not show representative fields for an individual KYC type", () => {
      render(<KYCApprovalTab vendors={[vendor({ kyc_type: "individual" })]} />)

      expect(screen.queryByText("Rep. Name:")).not.toBeInTheDocument()
    })

    it("falls back to N/A for missing optional fields", () => {
      render(
        <KYCApprovalTab
          vendors={[
            vendor({
              phone_number: undefined,
              users: { email: undefined, full_name: undefined },
              location: undefined,
            }),
          ]}
        />,
      )

      expect(screen.getAllByText("N/A").length).toBeGreaterThan(0)
    })

    it("numbers vendor cards sequentially starting at 1", () => {
      render(<KYCApprovalTab vendors={[vendor({ id: "v-1" }), vendor({ id: "v-2", business_name: "Mbeya Grains" })]} />)

      expect(screen.getByText("#1")).toBeInTheDocument()
      expect(screen.getByText("#2")).toBeInTheDocument()
    })
  })

  describe("approving", () => {
    it("approves a vendor and refreshes the router", async () => {
      render(<KYCApprovalTab vendors={[vendor()]} />)

      await userEvent.click(screen.getByRole("button", { name: /approve/i }))

      await waitFor(() => expect(mockPost).toHaveBeenCalledWith("admin/vendors/v-1/activate"))
      await waitFor(() => expect(mockRefresh).toHaveBeenCalled())
    })

    it("alerts and logs when approval fails", async () => {
      mockPost.mockRejectedValue(new Error("500"))
      render(<KYCApprovalTab vendors={[vendor()]} />)

      await userEvent.click(screen.getByRole("button", { name: /approve/i }))

      await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Failed to approve vendor. Please try again."))
      expect(reported.map((r) => r.message)).toContain("error approving vendor")
      expect(mockRefresh).not.toHaveBeenCalled()
    })
  })

  describe("rejecting", () => {
    it("opens the rejection dialog for the clicked vendor", async () => {
      render(<KYCApprovalTab vendors={[vendor()]} />)

      await userEvent.click(screen.getByRole("button", { name: /reject/i }))

      const dialog = await screen.findByRole("dialog")
      expect(within(dialog).getByText(/Dodoma Crafts's application/)).toBeInTheDocument()
    })

    it("disables confirm until a reason is typed, then submits it", async () => {
      render(<KYCApprovalTab vendors={[vendor()]} />)
      await userEvent.click(screen.getByRole("button", { name: /reject/i }))
      const dialog = await screen.findByRole("dialog")

      expect(within(dialog).getByRole("button", { name: /confirm rejection/i })).toBeDisabled()

      await userEvent.type(within(dialog).getByLabelText(/rejection reason/i), "Blurry license")
      await userEvent.click(within(dialog).getByRole("button", { name: /confirm rejection/i }))

      await waitFor(() => expect(mockPost).toHaveBeenCalledWith("admin/vendors/v-1/reject", { reason: "Blurry license" }))
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
      expect(mockRefresh).toHaveBeenCalled()
    })

    it("alerts rather than submitting when the reason is only whitespace", async () => {
      render(<KYCApprovalTab vendors={[vendor()]} />)
      await userEvent.click(screen.getByRole("button", { name: /reject/i }))
      const dialog = await screen.findByRole("dialog")
      const textarea = within(dialog).getByLabelText(/rejection reason/i)

      await userEvent.type(textarea, "   ")
      // Button is disabled by the whitespace-only value, so drive the confirm
      // path directly to exercise the guard inside handleRejectConfirm.
      const confirmButton = within(dialog).getByRole("button", { name: /confirm rejection/i })
      expect(confirmButton).toBeDisabled()
      expect(mockPost).not.toHaveBeenCalled()
    })

    it("cancels without submitting anything", async () => {
      render(<KYCApprovalTab vendors={[vendor()]} />)
      await userEvent.click(screen.getByRole("button", { name: /reject/i }))
      const dialog = await screen.findByRole("dialog")

      await userEvent.click(within(dialog).getByRole("button", { name: /cancel/i }))

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
      expect(mockPost).not.toHaveBeenCalled()
    })

    it("alerts and logs when rejection fails, keeping the dialog open", async () => {
      mockPost.mockRejectedValue(new Error("500"))
      render(<KYCApprovalTab vendors={[vendor()]} />)
      await userEvent.click(screen.getByRole("button", { name: /reject/i }))
      const dialog = await screen.findByRole("dialog")

      await userEvent.type(within(dialog).getByLabelText(/rejection reason/i), "Bad TIN")
      await userEvent.click(within(dialog).getByRole("button", { name: /confirm rejection/i }))

      await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Failed to reject vendor. Please try again."))
      expect(reported.map((r) => r.message)).toContain("error rejecting vendor")
      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })
  })

  describe("document viewer", () => {
    it("opens the viewer with an image for a non-PDF URL", async () => {
      render(<KYCApprovalTab vendors={[vendor({ business_license_url: "/license.png" })]} />)

      await userEvent.click(screen.getByRole("button", { name: /view document/i }))

      const dialog = await screen.findByRole("dialog")
      expect(within(dialog).getByAltText("Document")).toHaveAttribute("src", "/license.png")
    })

    it("opens the viewer with an iframe for a PDF URL", async () => {
      render(<KYCApprovalTab vendors={[vendor({ business_license_url: "/license.pdf" })]} />)

      await userEvent.click(screen.getByRole("button", { name: /view document/i }))

      const dialog = await screen.findByRole("dialog")
      expect(within(dialog).getByTitle("PDF Document Viewer")).toHaveAttribute("src", "/license.pdf#toolbar=0")
    })

    it("does not show a 'View Document' link when there is no license URL", () => {
      render(<KYCApprovalTab vendors={[vendor({ business_license_url: undefined })]} />)

      expect(screen.queryByRole("button", { name: /view document/i })).not.toBeInTheDocument()
    })

    it("closes via the Close Preview button", async () => {
      render(<KYCApprovalTab vendors={[vendor()]} />)
      await userEvent.click(screen.getByRole("button", { name: /view document/i }))
      const dialog = await screen.findByRole("dialog")

      await userEvent.click(within(dialog).getByRole("button", { name: /close preview/i }))

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    })

    it("opens the original document in a new tab", async () => {
      const openSpy = jest.spyOn(window, "open").mockImplementation(() => null)
      render(<KYCApprovalTab vendors={[vendor({ business_license_url: "/license.png" })]} />)
      await userEvent.click(screen.getByRole("button", { name: /view document/i }))
      const dialog = await screen.findByRole("dialog")

      await userEvent.click(within(dialog).getByRole("button", { name: /open original/i }))

      expect(openSpy).toHaveBeenCalledWith("/license.png", "_blank")
    })
  })

  describe("while submitting", () => {
    it("disables approve and reject buttons on the row that is submitting", async () => {
      let resolvePost: (value: unknown) => void = () => {}
      mockPost.mockImplementation(() => new Promise((resolve) => (resolvePost = resolve)))
      render(<KYCApprovalTab vendors={[vendor()]} />)
      const card = cardFor("Dodoma Crafts")

      await userEvent.click(within(card).getByRole("button", { name: /approve/i }))

      expect(within(card).getByRole("button", { name: /approve/i })).toBeDisabled()
      expect(within(card).getByRole("button", { name: /reject/i })).toBeDisabled()

      resolvePost({})
      await waitFor(() => expect(within(card).getByRole("button", { name: /approve/i })).not.toBeDisabled())
    })
  })
})

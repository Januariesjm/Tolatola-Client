/**
 * Tests for TransporterKYCApprovalTab (components/admin/transporter-kyc-approval-tab.tsx).
 *
 * Same shape as KYCApprovalTab (vendor) and CustomerKYCApprovalTab: a
 * prop-driven list, approve posts and refreshes the router, reject requires a
 * non-empty reason via a dialog, and a document viewer dialog switches
 * between an <iframe> (PDF) and an <img>. This component is unique in having
 * three separate document links (driver's license, ID, insurance) that each
 * carry their own dialog title, and a vehicle-type badge whose color falls
 * back to gray for an unrecognized type. Failures use `alert()`, not toast.
 */

import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { TransporterKYCApprovalTab } from "@/components/admin/transporter-kyc-approval-tab"
import { setErrorReporter, type LogRecord } from "@/lib/logger"

const mockPost = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiPost: (...args: unknown[]) => mockPost(...args),
}))

const mockRefresh = jest.fn()
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mockRefresh }) }))

function transporter(overrides: Record<string, unknown> = {}) {
  return {
    id: "t-1",
    phone: "255700000001",
    business_name: "Asha Logistics",
    region: "Dodoma",
    district: "Dodoma Urban",
    vehicle_type: "canter",
    vehicle_registration: "T123ABC",
    license_number: "LIC-111",
    driver_license_url: "/license.png",
    id_document_url: "/id.png",
    insurance_document_url: "/insurance.png",
    created_at: "2026-01-05T10:00:00Z",
    users: { email: "asha@example.com", full_name: "Asha Mwinyi" },
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

describe("TransporterKYCApprovalTab", () => {
  describe("rendering", () => {
    it("shows the empty state when there are no pending applications", () => {
      render(<TransporterKYCApprovalTab transporters={[]} />)

      expect(screen.getByText("No pending transporter KYC applications")).toBeInTheDocument()
      expect(screen.getByText("0 Pending")).toBeInTheDocument()
    })

    it("renders a transporter's core details and the pending count", () => {
      render(<TransporterKYCApprovalTab transporters={[transporter()]} />)

      expect(screen.getByText("1 Pending")).toBeInTheDocument()
      expect(screen.getAllByText("Asha Mwinyi").length).toBeGreaterThan(0)
      expect(screen.getAllByText("asha@example.com").length).toBeGreaterThan(0)
      expect(screen.getByText("Asha Logistics")).toBeInTheDocument()
      expect(screen.getByText("Dodoma, Dodoma Urban")).toBeInTheDocument()
      expect(screen.getByText("T123ABC")).toBeInTheDocument()
      expect(screen.getByText("LIC-111")).toBeInTheDocument()
      expect(screen.getByText("CANTER")).toBeInTheDocument()
    })

    it("falls back to 'Unnamed' when there is no linked user name", () => {
      render(<TransporterKYCApprovalTab transporters={[transporter({ users: { email: "x@example.com" } })]} />)

      expect(screen.getByText("Unnamed")).toBeInTheDocument()
    })

    it("does not render a business name row when none is set", () => {
      render(<TransporterKYCApprovalTab transporters={[transporter({ business_name: undefined })]} />)

      expect(screen.queryByText("Business:")).not.toBeInTheDocument()
    })

    it("falls back to N/A for location when neither region nor district is set", () => {
      render(<TransporterKYCApprovalTab transporters={[transporter({ region: undefined, district: undefined })]} />)

      expect(screen.getByText("Location:").nextSibling).toHaveTextContent("N/A")
    })

    it("falls back to the gray badge for an unrecognized vehicle type", () => {
      render(<TransporterKYCApprovalTab transporters={[transporter({ vehicle_type: "spaceship" })]} />)

      const badge = screen.getByText("SPACESHIP")
      expect(badge.className).toContain("bg-gray-500")
    })

    it("numbers transporter cards sequentially starting at 1", () => {
      render(
        <TransporterKYCApprovalTab
          transporters={[transporter({ id: "t-1" }), transporter({ id: "t-2", business_name: "Baraka Movers" })]}
        />,
      )

      expect(screen.getByText("#1")).toBeInTheDocument()
      expect(screen.getByText("#2")).toBeInTheDocument()
    })
  })

  describe("approving", () => {
    it("approves the transporter and refreshes the router", async () => {
      render(<TransporterKYCApprovalTab transporters={[transporter()]} />)

      await userEvent.click(screen.getByRole("button", { name: /approve/i }))

      await waitFor(() => expect(mockPost).toHaveBeenCalledWith("admin/transporters/t-1/approve"))
      await waitFor(() => expect(mockRefresh).toHaveBeenCalled())
    })

    it("alerts and logs when approval fails", async () => {
      mockPost.mockRejectedValue(new Error("500"))
      render(<TransporterKYCApprovalTab transporters={[transporter()]} />)

      await userEvent.click(screen.getByRole("button", { name: /approve/i }))

      await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Failed to approve transporter. Please try again."))
      expect(reported.map((r) => r.message)).toContain("error approving transporter")
      expect(mockRefresh).not.toHaveBeenCalled()
    })
  })

  describe("rejecting", () => {
    it("opens the rejection dialog naming the transporter", async () => {
      render(<TransporterKYCApprovalTab transporters={[transporter()]} />)

      await userEvent.click(screen.getByRole("button", { name: /reject/i }))

      const dialog = await screen.findByRole("dialog")
      expect(within(dialog).getByText(/Asha Mwinyi's application/)).toBeInTheDocument()
    })

    it("disables confirm until a reason is typed, then submits it", async () => {
      render(<TransporterKYCApprovalTab transporters={[transporter()]} />)
      await userEvent.click(screen.getByRole("button", { name: /reject/i }))
      const dialog = await screen.findByRole("dialog")

      expect(within(dialog).getByRole("button", { name: /confirm rejection/i })).toBeDisabled()

      await userEvent.type(within(dialog).getByLabelText(/rejection reason/i), "Expired license")
      await userEvent.click(within(dialog).getByRole("button", { name: /confirm rejection/i }))

      await waitFor(() => expect(mockPost).toHaveBeenCalledWith("admin/transporters/t-1/reject", { reason: "Expired license" }))
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
      expect(mockRefresh).toHaveBeenCalled()
    })

    it("leaves confirm disabled for a whitespace-only reason", async () => {
      render(<TransporterKYCApprovalTab transporters={[transporter()]} />)
      await userEvent.click(screen.getByRole("button", { name: /reject/i }))
      const dialog = await screen.findByRole("dialog")

      await userEvent.type(within(dialog).getByLabelText(/rejection reason/i), "   ")

      expect(within(dialog).getByRole("button", { name: /confirm rejection/i })).toBeDisabled()
      expect(mockPost).not.toHaveBeenCalled()
    })

    it("cancels without submitting anything", async () => {
      render(<TransporterKYCApprovalTab transporters={[transporter()]} />)
      await userEvent.click(screen.getByRole("button", { name: /reject/i }))
      const dialog = await screen.findByRole("dialog")

      await userEvent.click(within(dialog).getByRole("button", { name: /cancel/i }))

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
      expect(mockPost).not.toHaveBeenCalled()
    })

    it("alerts and logs when rejection fails, keeping the dialog open", async () => {
      mockPost.mockRejectedValue(new Error("500"))
      render(<TransporterKYCApprovalTab transporters={[transporter()]} />)
      await userEvent.click(screen.getByRole("button", { name: /reject/i }))
      const dialog = await screen.findByRole("dialog")

      await userEvent.type(within(dialog).getByLabelText(/rejection reason/i), "Vehicle reg expired")
      await userEvent.click(within(dialog).getByRole("button", { name: /confirm rejection/i }))

      await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Failed to reject transporter. Please try again."))
      expect(reported.map((r) => r.message)).toContain("error rejecting transporter")
      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })
  })

  describe("document viewer", () => {
    it("opens the driver's license document with its own dialog title", async () => {
      render(<TransporterKYCApprovalTab transporters={[transporter()]} />)
      const viewButtons = screen.getAllByRole("button", { name: /^view$/i })

      await userEvent.click(viewButtons[0])

      const dialog = await screen.findByRole("dialog")
      expect(within(dialog).getByText("Driver's License")).toBeInTheDocument()
      expect(within(dialog).getByAltText("Document")).toHaveAttribute("src", "/license.png")
    })

    it("opens the ID document with its own dialog title", async () => {
      render(<TransporterKYCApprovalTab transporters={[transporter()]} />)
      const viewButtons = screen.getAllByRole("button", { name: /^view$/i })

      // Order in the DOM: Driver's License, ID Document, Insurance.
      await userEvent.click(viewButtons[1])

      const dialog = await screen.findByRole("dialog")
      expect(within(dialog).getByText("Identification Document")).toBeInTheDocument()
      expect(within(dialog).getByAltText("Document")).toHaveAttribute("src", "/id.png")
    })

    it("opens the insurance document with its own dialog title", async () => {
      render(<TransporterKYCApprovalTab transporters={[transporter()]} />)
      const viewButtons = screen.getAllByRole("button", { name: /^view$/i })

      await userEvent.click(viewButtons[2])

      const dialog = await screen.findByRole("dialog")
      expect(within(dialog).getByText("Insurance Document")).toBeInTheDocument()
      expect(within(dialog).getByAltText("Document")).toHaveAttribute("src", "/insurance.png")
    })

    it("falls back to the alternate ID document field when the primary is absent", async () => {
      render(
        <TransporterKYCApprovalTab
          transporters={[transporter({ id_document_url: undefined, vehicle_registration_document_url: "/alt-id.png" })]}
        />,
      )
      const viewButtons = screen.getAllByRole("button", { name: /^view$/i })

      await userEvent.click(viewButtons[1])

      const dialog = await screen.findByRole("dialog")
      expect(within(dialog).getByAltText("Document")).toHaveAttribute("src", "/alt-id.png")
    })

    it("does not show a document link when none of its URLs are present", () => {
      render(
        <TransporterKYCApprovalTab
          transporters={[
            transporter({
              driver_license_url: undefined,
              license_document_url: undefined,
              id_document_url: undefined,
              vehicle_registration_document_url: undefined,
              insurance_document_url: undefined,
            }),
          ]}
        />,
      )

      expect(screen.queryByRole("button", { name: /^view$/i })).not.toBeInTheDocument()
    })

    it("renders an iframe for a PDF document", async () => {
      render(<TransporterKYCApprovalTab transporters={[transporter({ driver_license_url: "/license.pdf" })]} />)
      const viewButtons = screen.getAllByRole("button", { name: /^view$/i })

      await userEvent.click(viewButtons[0])

      const dialog = await screen.findByRole("dialog")
      expect(within(dialog).getByTitle("PDF Document Viewer")).toHaveAttribute("src", "/license.pdf#toolbar=0")
    })

    it("closes via the Close Preview button", async () => {
      render(<TransporterKYCApprovalTab transporters={[transporter()]} />)
      const viewButtons = screen.getAllByRole("button", { name: /^view$/i })
      await userEvent.click(viewButtons[0])
      const dialog = await screen.findByRole("dialog")

      await userEvent.click(within(dialog).getByRole("button", { name: /close preview/i }))

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    })

    it("opens the original document in a new tab", async () => {
      const openSpy = jest.spyOn(window, "open").mockImplementation(() => null)
      render(<TransporterKYCApprovalTab transporters={[transporter()]} />)
      const viewButtons = screen.getAllByRole("button", { name: /^view$/i })
      await userEvent.click(viewButtons[0])
      const dialog = await screen.findByRole("dialog")

      await userEvent.click(within(dialog).getByRole("button", { name: /open original/i }))

      expect(openSpy).toHaveBeenCalledWith("/license.png", "_blank")
    })
  })
})

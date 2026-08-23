/**
 * Tests for CustomerKYCApprovalTab (components/admin/customer-kyc-approval-tab.tsx).
 *
 * A prop-driven list of pending customer identity-verification submissions.
 * Structurally close to KYCApprovalTab (vendor KYC) and TransporterKYCApprovalTab:
 * approve posts and refreshes, reject requires a non-empty reason via a
 * dialog, and there is a document viewer that renders an <iframe> for PDFs and
 * an <img> otherwise. This component additionally renders up to three document
 * thumbnails (ID front/back, selfie) and has an explicit "no documents
 * uploaded" message when none are present. Failures use `alert()`, not toast.
 */

import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CustomerKYCApprovalTab } from "@/components/admin/customer-kyc-approval-tab"
import { setErrorReporter, type LogRecord } from "@/lib/logger"

const mockPost = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiPost: (...args: unknown[]) => mockPost(...args),
}))

const mockRefresh = jest.fn()
jest.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mockRefresh }) }))

function kyc(overrides: Record<string, unknown> = {}) {
  return {
    id: "k-1",
    full_name: "Asha Mwinyi",
    phone_number: "255700000001",
    date_of_birth: "1990-05-01T00:00:00Z",
    address: "12 Samora Ave",
    city: "Dodoma",
    region: "Dodoma",
    id_type: "national_id",
    id_number: "NIDA-111",
    id_document_front_url: "/id-front.png",
    id_document_back_url: "/id-back.png",
    selfie_url: "/selfie.png",
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

describe("CustomerKYCApprovalTab", () => {
  describe("rendering", () => {
    it("shows the empty state when there are no pending applications", () => {
      render(<CustomerKYCApprovalTab customers={[]} />)

      expect(screen.getByText("No pending customer KYC applications")).toBeInTheDocument()
      expect(screen.getByText("0 Pending")).toBeInTheDocument()
    })

    it("renders a customer's core identity details and the pending count", () => {
      render(<CustomerKYCApprovalTab customers={[kyc()]} />)

      expect(screen.getByText("1 Pending")).toBeInTheDocument()
      expect(screen.getAllByText("Asha Mwinyi").length).toBeGreaterThan(0)
      expect(screen.getAllByText("asha@example.com").length).toBeGreaterThan(0)
      expect(screen.getByText("NIDA-111")).toBeInTheDocument()
      expect(screen.getByText("Dodoma, Dodoma")).toBeInTheDocument()
      expect(screen.getByText("5/1/1990")).toBeInTheDocument()
    })

    it("falls back to 'Unnamed User' when there is no linked user name", () => {
      render(<CustomerKYCApprovalTab customers={[kyc({ users: { email: "x@example.com" } })]} />)

      expect(screen.getByText("Unnamed User")).toBeInTheDocument()
    })

    it("falls back to N/A for missing optional fields", () => {
      render(
        <CustomerKYCApprovalTab
          customers={[
            kyc({
              full_name: undefined,
              phone_number: undefined,
              date_of_birth: undefined,
              address: undefined,
              city: undefined,
              region: undefined,
              id_type: undefined,
              id_number: undefined,
            }),
          ]}
        />,
      )

      expect(screen.getAllByText("N/A").length).toBeGreaterThan(0)
    })

    it("shows document thumbnails for each uploaded document", () => {
      render(<CustomerKYCApprovalTab customers={[kyc()]} />)

      expect(screen.getByAltText("ID Front")).toBeInTheDocument()
      expect(screen.getByAltText("ID Back")).toBeInTheDocument()
      expect(screen.getByAltText("Selfie with ID")).toBeInTheDocument()
    })

    it("shows 'No documents uploaded' when none of the three URLs are present", () => {
      render(
        <CustomerKYCApprovalTab
          customers={[kyc({ id_document_front_url: undefined, id_document_back_url: undefined, selfie_url: undefined })]}
        />,
      )

      expect(screen.getByText("No documents uploaded")).toBeInTheDocument()
    })

    it("numbers customer cards sequentially starting at 1", () => {
      render(<CustomerKYCApprovalTab customers={[kyc({ id: "k-1" }), kyc({ id: "k-2", full_name: "Baraka John" })]} />)

      expect(screen.getByText("#1")).toBeInTheDocument()
      expect(screen.getByText("#2")).toBeInTheDocument()
    })
  })

  describe("approving", () => {
    it("approves the customer KYC and refreshes the router", async () => {
      render(<CustomerKYCApprovalTab customers={[kyc()]} />)

      await userEvent.click(screen.getByRole("button", { name: /approve/i }))

      await waitFor(() => expect(mockPost).toHaveBeenCalledWith("admin/customers-kyc/k-1/approve"))
      await waitFor(() => expect(mockRefresh).toHaveBeenCalled())
    })

    it("alerts and logs when approval fails", async () => {
      mockPost.mockRejectedValue(new Error("500"))
      render(<CustomerKYCApprovalTab customers={[kyc()]} />)

      await userEvent.click(screen.getByRole("button", { name: /approve/i }))

      await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Failed to approve KYC. Please try again."))
      expect(reported.map((r) => r.message)).toContain("error approving customer KYC")
      expect(mockRefresh).not.toHaveBeenCalled()
    })
  })

  describe("rejecting", () => {
    it("opens the rejection dialog naming the customer", async () => {
      render(<CustomerKYCApprovalTab customers={[kyc()]} />)

      await userEvent.click(screen.getByRole("button", { name: /reject/i }))

      const dialog = await screen.findByRole("dialog")
      expect(within(dialog).getByText(/Asha Mwinyi's KYC application/)).toBeInTheDocument()
    })

    it("disables confirm until a reason is typed, then submits it", async () => {
      render(<CustomerKYCApprovalTab customers={[kyc()]} />)
      await userEvent.click(screen.getByRole("button", { name: /reject/i }))
      const dialog = await screen.findByRole("dialog")

      expect(within(dialog).getByRole("button", { name: /confirm rejection/i })).toBeDisabled()

      await userEvent.type(within(dialog).getByLabelText(/rejection reason/i), "Blurry ID photo")
      await userEvent.click(within(dialog).getByRole("button", { name: /confirm rejection/i }))

      await waitFor(() => expect(mockPost).toHaveBeenCalledWith("admin/customers-kyc/k-1/reject", { reason: "Blurry ID photo" }))
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
      expect(mockRefresh).toHaveBeenCalled()
    })

    it("leaves confirm disabled for a whitespace-only reason", async () => {
      render(<CustomerKYCApprovalTab customers={[kyc()]} />)
      await userEvent.click(screen.getByRole("button", { name: /reject/i }))
      const dialog = await screen.findByRole("dialog")

      await userEvent.type(within(dialog).getByLabelText(/rejection reason/i), "   ")

      expect(within(dialog).getByRole("button", { name: /confirm rejection/i })).toBeDisabled()
      expect(mockPost).not.toHaveBeenCalled()
    })

    it("cancels without submitting anything", async () => {
      render(<CustomerKYCApprovalTab customers={[kyc()]} />)
      await userEvent.click(screen.getByRole("button", { name: /reject/i }))
      const dialog = await screen.findByRole("dialog")

      await userEvent.click(within(dialog).getByRole("button", { name: /cancel/i }))

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
      expect(mockPost).not.toHaveBeenCalled()
    })

    it("alerts and logs when rejection fails, keeping the dialog open", async () => {
      mockPost.mockRejectedValue(new Error("500"))
      render(<CustomerKYCApprovalTab customers={[kyc()]} />)
      await userEvent.click(screen.getByRole("button", { name: /reject/i }))
      const dialog = await screen.findByRole("dialog")

      await userEvent.type(within(dialog).getByLabelText(/rejection reason/i), "ID mismatch")
      await userEvent.click(within(dialog).getByRole("button", { name: /confirm rejection/i }))

      await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Failed to reject KYC. Please try again."))
      expect(reported.map((r) => r.message)).toContain("error rejecting customer KYC")
      expect(screen.getByRole("dialog")).toBeInTheDocument()
    })
  })

  describe("document viewer", () => {
    it("opens the viewer with an image when a thumbnail is clicked", async () => {
      render(<CustomerKYCApprovalTab customers={[kyc()]} />)

      await userEvent.click(screen.getByAltText("ID Front"))

      const dialog = await screen.findByRole("dialog")
      expect(within(dialog).getByAltText("Document")).toHaveAttribute("src", "/id-front.png")
    })

    it("renders an iframe for a PDF document", async () => {
      render(<CustomerKYCApprovalTab customers={[kyc({ id_document_front_url: "/id-front.pdf" })]} />)

      await userEvent.click(screen.getByAltText("ID Front"))

      const dialog = await screen.findByRole("dialog")
      expect(within(dialog).getByTitle("PDF Document Viewer")).toHaveAttribute("src", "/id-front.pdf#toolbar=0")
    })

    it("closes via the Close Preview button", async () => {
      render(<CustomerKYCApprovalTab customers={[kyc()]} />)
      await userEvent.click(screen.getByAltText("ID Front"))
      const dialog = await screen.findByRole("dialog")

      await userEvent.click(within(dialog).getByRole("button", { name: /close preview/i }))

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    })

    it("opens the original document in a new tab", async () => {
      const openSpy = jest.spyOn(window, "open").mockImplementation(() => null)
      render(<CustomerKYCApprovalTab customers={[kyc()]} />)
      await userEvent.click(screen.getByAltText("Selfie with ID"))
      const dialog = await screen.findByRole("dialog")

      await userEvent.click(within(dialog).getByRole("button", { name: /open original/i }))

      expect(openSpy).toHaveBeenCalledWith("/selfie.png", "_blank")
    })
  })
})

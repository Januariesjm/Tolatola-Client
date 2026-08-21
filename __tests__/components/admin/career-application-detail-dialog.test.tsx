/**
 * Tests for CareerApplicationDetailDialog
 * (components/admin/career-application-detail-dialog.tsx).
 *
 * Presentational: every value and handler comes from props. What matters is
 * that the right document links render only when their URL is present, that
 * the "current" status button is disabled so it can't be re-selected, and
 * that delete asks for the application actually shown.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { CareerApplicationDetailDialog } from "@/components/admin/career-application-detail-dialog"
import type { CareerApplication } from "@/lib/admin/career-applications"

const application: CareerApplication = {
  id: "a-1",
  full_name: "Asha Mwinyi",
  email: "asha@example.com",
  phone: "255700000001",
  position: "Backend Engineer",
  cover_letter: "I would love to join.",
  cv_url: "/cv.pdf",
  status: "pending",
  created_at: "2026-02-01T00:00:00Z",
  updated_at: "2026-02-01T00:00:00Z",
}

const props = {
  open: true,
  onOpenChange: jest.fn(),
  application,
  loadingId: null as string | null,
  onStatusChange: jest.fn(),
  onDelete: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("CareerApplicationDetailDialog", () => {
  it("renders nothing when there is no selected application", () => {
    render(<CareerApplicationDetailDialog {...props} application={null} />)

    expect(screen.queryByText("Uploaded Documents")).not.toBeInTheDocument()
  })

  it("shows the applicant's name and email", () => {
    render(<CareerApplicationDetailDialog {...props} />)

    expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument()
    expect(screen.getByText("asha@example.com")).toBeInTheDocument()
  })

  it("always links the CV, using a fallback label when no filename is on record", () => {
    render(<CareerApplicationDetailDialog {...props} />)

    expect(screen.getByRole("link", { name: /CV \/ Resume/ })).toHaveAttribute("href", "/cv.pdf")
  })

  it("does not link certificates or an application letter when their URLs are absent", () => {
    render(<CareerApplicationDetailDialog {...props} />)

    expect(screen.queryByText("Academic Certificates & IDs")).not.toBeInTheDocument()
    expect(screen.queryByText("Letter of Application")).not.toBeInTheDocument()
  })

  it("links certificates when the URL is present", () => {
    render(<CareerApplicationDetailDialog {...props} application={{ ...application, certificates_url: "/cert.pdf" }} />)

    expect(screen.getByRole("link", { name: /Academic Certificates/ })).toHaveAttribute("href", "/cert.pdf")
  })

  it("disables the button for the application's current status", () => {
    render(<CareerApplicationDetailDialog {...props} />)

    expect(screen.getByRole("button", { name: /Pending/ })).toBeDisabled()
    expect(screen.getByRole("button", { name: /Reviewed/ })).toBeEnabled()
  })

  it("requests a status change with the application's id", async () => {
    render(<CareerApplicationDetailDialog {...props} />)

    await userEvent.click(screen.getByRole("button", { name: /Shortlisted/ }))

    expect(props.onStatusChange).toHaveBeenCalledWith("a-1", "shortlisted")
  })

  it("disables every status button while a request for this application is loading", () => {
    render(<CareerApplicationDetailDialog {...props} loadingId="a-1" />)

    expect(screen.getByRole("button", { name: /Reviewed/ })).toBeDisabled()
  })

  it("closes via the Close button", async () => {
    render(<CareerApplicationDetailDialog {...props} />)

    // Radix's own dialog-close X button also has the accessible name "Close";
    // the one this test cares about is the explicit footer button.
    await userEvent.click(screen.getAllByRole("button", { name: "Close" })[0])

    expect(props.onOpenChange).toHaveBeenCalledWith(false)
  })

  it("requests deletion of the application shown, not some other id", async () => {
    render(<CareerApplicationDetailDialog {...props} />)

    await userEvent.click(screen.getByRole("button", { name: /Delete/ }))

    expect(props.onDelete).toHaveBeenCalledWith("a-1")
  })
})

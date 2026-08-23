/**
 * Tests for HRApplicationsSubtab (components/admin/hr-applications-subtab.tsx).
 *
 * A prop-driven list of career applications with client-side search/status/
 * position filtering (via lib/admin/career-applications, exercised here
 * through the real implementation rather than mocked), per-status stat cards
 * that double as filter toggles, status-transition buttons that call the API
 * and patch local state, and a delete action gated behind window.confirm.
 * What's worth pinning: the filter composition, that each status shows the
 * right transition buttons, that a failed status change or delete leaves the
 * row untouched, and that the detail dialog reflects and can drive the same
 * actions as the table row.
 */

// jsdom has no Pointer Capture API, which Radix's Select touches on pointer
// down; polyfilled the same way as __tests__/components/admin/orders-management-tab.test.tsx.
if (typeof Element !== "undefined") {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = () => false
  }
  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = () => {}
  }
  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = () => {}
  }
}

import React from "react"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HRApplicationsSubtab } from "@/components/admin/hr-applications-subtab"
import type { CareerApplication } from "@/lib/admin/career-applications"

const mockPost = jest.fn()
const mockDelete = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiPost: (...args: unknown[]) => mockPost(...args),
  clientApiDelete: (...args: unknown[]) => mockDelete(...args),
  clientApiGet: jest.fn(),
}))

function application(overrides: Partial<CareerApplication> = {}): CareerApplication {
  return {
    id: "app-1",
    full_name: "Asha Mwinyi",
    email: "asha@example.com",
    phone: "0700000001",
    position: "Field Officer",
    cv_url: "https://example.test/cv.pdf",
    status: "pending",
    created_at: "2026-01-10T08:30:00.000Z",
    updated_at: "2026-01-10T08:30:00.000Z",
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  jest.spyOn(window, "confirm").mockReturnValue(true)
  jest.spyOn(window, "open").mockImplementation(() => null)
  mockPost.mockResolvedValue({ data: {} })
  mockDelete.mockResolvedValue({})
})

afterEach(() => {
  jest.restoreAllMocks()
})

/** The table row for an applicant, located by their name. */
const rowFor = (name: string) => screen.getByText(name).closest("tr") as HTMLElement

describe("HRApplicationsSubtab", () => {
  it("shows the empty state when there are no applications", () => {
    render(<HRApplicationsSubtab applications={[]} />)

    expect(screen.getByText("No applications found")).toBeInTheDocument()
    expect(screen.getByText("Applications will appear here when candidates apply.")).toBeInTheDocument()
  })

  it("shows the total and per-status counts", () => {
    const { container } = render(
      <HRApplicationsSubtab
        applications={[
          application({ id: "a-1", status: "pending" }),
          application({ id: "a-2", status: "reviewed" }),
          application({ id: "a-3", status: "shortlisted" }),
          application({ id: "a-4", status: "rejected" }),
        ]}
      />,
    )

    // The five stat cards (Total, Pending, Reviewed, Shortlisted, Rejected)
    // each show a count in this class; total is 4, every status is 1.
    const counts = Array.from(container.querySelectorAll(".text-2xl.font-black")).map((el) => el.textContent)
    expect(counts).toEqual(["4", "1", "1", "1", "1"])
  })

  it("filters by search across name, email and position", async () => {
    render(
      <HRApplicationsSubtab
        applications={[
          application({ id: "a-1", full_name: "Asha Mwinyi" }),
          application({ id: "a-2", full_name: "Baraka John", email: "baraka@example.com", position: "Driver" }),
        ]}
      />,
    )

    await userEvent.type(screen.getByPlaceholderText(/search by name/i), "driver")

    expect(screen.getByText("Baraka John")).toBeInTheDocument()
    expect(screen.queryByText("Asha Mwinyi")).not.toBeInTheDocument()
  })

  it("filters by status when a stat card is clicked", async () => {
    render(
      <HRApplicationsSubtab
        applications={[
          application({ id: "a-1", full_name: "Asha Mwinyi", status: "pending" }),
          application({ id: "a-2", full_name: "Baraka John", status: "shortlisted" }),
        ]}
      />,
    )

    // "Shortlisted" also appears on Baraka's own status badge; the stat card
    // label renders first in the DOM.
    await userEvent.click(screen.getAllByText("Shortlisted")[0])

    expect(screen.getByText("Baraka John")).toBeInTheDocument()
    expect(screen.queryByText("Asha Mwinyi")).not.toBeInTheDocument()
  })

  it("filters by position via the position dropdown", async () => {
    render(
      <HRApplicationsSubtab
        applications={[
          application({ id: "a-1", full_name: "Asha Mwinyi", position: "Field Officer" }),
          application({ id: "a-2", full_name: "Baraka John", position: "Driver" }),
        ]}
      />,
    )

    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(await screen.findByRole("option", { name: "Driver" }))

    expect(screen.getByText("Baraka John")).toBeInTheDocument()
    expect(screen.queryByText("Asha Mwinyi")).not.toBeInTheDocument()
  })

  it("shows Review and Shortlist actions for a pending application", () => {
    render(<HRApplicationsSubtab applications={[application({ status: "pending" })]} />)

    const row = rowFor("Asha Mwinyi")
    expect(within(row).getByRole("button", { name: /Review/ })).toBeInTheDocument()
    expect(within(row).getByRole("button", { name: /Shortlist/ })).toBeInTheDocument()
  })

  it("shows Shortlist and Reject actions for a reviewed application", () => {
    render(<HRApplicationsSubtab applications={[application({ status: "reviewed" })]} />)

    const row = rowFor("Asha Mwinyi")
    expect(within(row).getByRole("button", { name: /Shortlist/ })).toBeInTheDocument()
    expect(within(row).getByRole("button", { name: /Reject/ })).toBeInTheDocument()
  })

  it("shows only Reject for a shortlisted application", () => {
    render(<HRApplicationsSubtab applications={[application({ status: "shortlisted" })]} />)

    const row = rowFor("Asha Mwinyi")
    expect(within(row).getByRole("button", { name: /Reject/ })).toBeInTheDocument()
    expect(within(row).queryByRole("button", { name: /Shortlist/ })).not.toBeInTheDocument()
  })

  it("shows Reopen for a rejected application", () => {
    render(<HRApplicationsSubtab applications={[application({ status: "rejected" })]} />)

    expect(within(rowFor("Asha Mwinyi")).getByRole("button", { name: /Reopen/ })).toBeInTheDocument()
  })

  it("moves an application to reviewed and calls the API with the right path", async () => {
    render(<HRApplicationsSubtab applications={[application({ id: "app-7", status: "pending" })]} />)

    await userEvent.click(within(rowFor("Asha Mwinyi")).getByRole("button", { name: /Review/ }))

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("admin/career-applications/app-7/status", { status: "reviewed", admin_notes: undefined }),
    )
    expect(await within(rowFor("Asha Mwinyi")).findByText("Reviewed")).toBeInTheDocument()
  })

  it("leaves the status unchanged when the status-change request fails", async () => {
    mockPost.mockRejectedValue(new Error("network error"))
    render(<HRApplicationsSubtab applications={[application({ status: "pending" })]} />)

    await userEvent.click(within(rowFor("Asha Mwinyi")).getByRole("button", { name: /Review/ }))

    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1))
    expect(within(rowFor("Asha Mwinyi")).getByText("Pending")).toBeInTheDocument()
    // Loading resets so the action buttons are usable again.
    expect(within(rowFor("Asha Mwinyi")).getByRole("button", { name: /Review/ })).not.toBeDisabled()
  })

  it("deletes an application when the confirmation is accepted", async () => {
    render(<HRApplicationsSubtab applications={[application()]} />)

    // The delete button is the last icon-only button in the row's actions cell.
    const deleteButtons = within(rowFor("Asha Mwinyi")).getAllByRole("button")
    await userEvent.click(deleteButtons[deleteButtons.length - 1])

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("admin/career-applications/app-1"))
    await waitFor(() => expect(screen.queryByText("Asha Mwinyi")).not.toBeInTheDocument())
  })

  it("does not delete when the confirmation is declined", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(false)
    render(<HRApplicationsSubtab applications={[application()]} />)

    const deleteButtons = within(rowFor("Asha Mwinyi")).getAllByRole("button")
    await userEvent.click(deleteButtons[deleteButtons.length - 1])

    expect(mockDelete).not.toHaveBeenCalled()
    expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument()
  })

  it("opens the detail dialog when a row is clicked and shows the applicant's documents", async () => {
    render(
      <HRApplicationsSubtab
        applications={[application({ cv_filename: "asha-cv.pdf", certificates_url: "https://example.test/certs.pdf" })]}
      />,
    )

    await userEvent.click(screen.getByText("Asha Mwinyi"))

    expect(await screen.findByText("asha-cv.pdf")).toBeInTheDocument()
    expect(screen.getByText("Academic Certificates & IDs")).toBeInTheDocument()
  })

  it("filters by every stat card, including toggling back to all", async () => {
    render(
      <HRApplicationsSubtab
        applications={[
          application({ id: "a-1", full_name: "Asha Mwinyi", status: "pending" }),
          application({ id: "a-2", full_name: "Baraka John", status: "reviewed" }),
          application({ id: "a-3", full_name: "Chiku Ali", status: "rejected" }),
        ]}
      />,
    )

    await userEvent.click(screen.getAllByText("Pending")[0])
    expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument()
    expect(screen.queryByText("Baraka John")).not.toBeInTheDocument()

    await userEvent.click(screen.getAllByText("Reviewed")[0])
    expect(screen.getByText("Baraka John")).toBeInTheDocument()
    expect(screen.queryByText("Asha Mwinyi")).not.toBeInTheDocument()

    await userEvent.click(screen.getAllByText("Rejected")[0])
    expect(screen.getByText("Chiku Ali")).toBeInTheDocument()

    await userEvent.click(screen.getByText("Total"))
    expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument()
    expect(screen.getByText("Baraka John")).toBeInTheDocument()
    expect(screen.getByText("Chiku Ali")).toBeInTheDocument()
  })

  it("opens each document type in a new tab from the row's document buttons", async () => {
    render(
      <HRApplicationsSubtab
        applications={[
          application({
            certificates_url: "https://example.test/certs.pdf",
            application_letter_url: "https://example.test/letter.pdf",
          }),
        ]}
      />,
    )

    const row = rowFor("Asha Mwinyi")
    await userEvent.click(within(row).getByTitle("CV"))
    expect(window.open).toHaveBeenCalledWith("https://example.test/cv.pdf", "_blank")

    await userEvent.click(within(row).getByTitle("Certificates"))
    expect(window.open).toHaveBeenCalledWith("https://example.test/certs.pdf", "_blank")

    await userEvent.click(within(row).getByTitle("Application Letter"))
    expect(window.open).toHaveBeenCalledWith("https://example.test/letter.pdf", "_blank")
  })

  it("rejects a shortlisted application and reopens a rejected one", async () => {
    render(<HRApplicationsSubtab applications={[application({ id: "app-5", status: "shortlisted" })]} />)

    await userEvent.click(within(rowFor("Asha Mwinyi")).getByRole("button", { name: /Reject/ }))

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("admin/career-applications/app-5/status", { status: "rejected", admin_notes: undefined }),
    )
    await within(rowFor("Asha Mwinyi")).findByText("Rejected")

    await userEvent.click(within(rowFor("Asha Mwinyi")).getByRole("button", { name: /Reopen/ }))

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("admin/career-applications/app-5/status", { status: "pending", admin_notes: undefined }),
    )
    await within(rowFor("Asha Mwinyi")).findByText("Pending")
  })

  it("rejects a reviewed application", async () => {
    render(<HRApplicationsSubtab applications={[application({ id: "app-6", status: "reviewed" })]} />)

    await userEvent.click(within(rowFor("Asha Mwinyi")).getByRole("button", { name: /Reject/ }))

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("admin/career-applications/app-6/status", { status: "rejected", admin_notes: undefined }),
    )
  })

  it("drives a status change and delete from within the detail dialog", async () => {
    render(<HRApplicationsSubtab applications={[application({ id: "app-9", status: "pending" })]} />)

    await userEvent.click(screen.getByText("Asha Mwinyi"))
    const dialog = await screen.findByRole("dialog")
    await userEvent.click(within(dialog).getByRole("button", { name: /Shortlisted/ }))

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith("admin/career-applications/app-9/status", { status: "shortlisted", admin_notes: undefined }),
    )

    await userEvent.click(within(dialog).getByRole("button", { name: /Delete/ }))

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("admin/career-applications/app-9"))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
  })
})

/**
 * Tests for HRInterviewsSubtab (components/admin/hr-interviews-subtab.tsx).
 *
 * A prop-driven interview schedule filtered by candidate name or position.
 * Adding an interview posts the form and prepends the response; the status
 * select on each row posts an update inline; delete is gated behind
 * window.confirm. What's worth pinning: the search filter, each status
 * badge, that changing the row's status select calls the API with {id,
 * status} and swaps in the server's response, and the add/delete flows.
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
import { HRInterviewsSubtab } from "@/components/admin/hr-interviews-subtab"

const mockPost = jest.fn()
const mockDelete = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiPost: (...args: unknown[]) => mockPost(...args),
  clientApiDelete: (...args: unknown[]) => mockDelete(...args),
}))

function interview(overrides: Record<string, unknown> = {}) {
  return {
    id: "int-1",
    candidate_name: "Asha Mwinyi",
    position: "Field Officer",
    interview_date: "2026-03-01",
    interview_time: "10:00",
    interviewer: "Baraka John",
    status: "scheduled",
    notes: "",
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  jest.spyOn(window, "confirm").mockReturnValue(true)
  mockPost.mockResolvedValue({ data: interview({ id: "new-int" }) })
  mockDelete.mockResolvedValue({})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("HRInterviewsSubtab", () => {
  it("shows the empty state when there are no interviews", () => {
    render(<HRInterviewsSubtab interviews={[]} />)

    expect(screen.getByText("No interviews scheduled.")).toBeInTheDocument()
  })

  it("renders an interview's candidate, position, date/time and interviewer", () => {
    render(<HRInterviewsSubtab interviews={[interview()]} />)

    expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument()
    expect(screen.getByText("Field Officer")).toBeInTheDocument()
    expect(screen.getByText("10:00")).toBeInTheDocument()
    expect(screen.getByText("Baraka John")).toBeInTheDocument()
  })

  it("shows 'TBA' when there is no interviewer assigned", () => {
    render(<HRInterviewsSubtab interviews={[interview({ interviewer: "" })]} />)

    expect(screen.getByText("TBA")).toBeInTheDocument()
  })

  it("filters by candidate name or position", async () => {
    render(<HRInterviewsSubtab interviews={[interview(), interview({ id: "int-2", candidate_name: "Chiku Ali", position: "Driver" })]} />)

    await userEvent.type(screen.getByPlaceholderText(/search candidate or position/i), "driver")

    expect(screen.getByText("Chiku Ali")).toBeInTheDocument()
    expect(screen.queryByText("Asha Mwinyi")).not.toBeInTheDocument()
  })

  it.each([
    ["scheduled", "Scheduled"],
    ["completed", "Completed"],
    ["cancelled", "Cancelled"],
    ["hired", "Hired"],
    ["rejected", "Rejected"],
  ])("shows the %s status as '%s' in the select trigger", (status, label) => {
    render(<HRInterviewsSubtab interviews={[interview({ status })]} />)

    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it("deletes an interview when the confirmation is accepted", async () => {
    render(<HRInterviewsSubtab interviews={[interview()]} />)

    await userEvent.click(screen.getAllByRole("button", { name: "" })[0])

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("admin/hr/interviews/int-1"))
    await waitFor(() => expect(screen.queryByText("Asha Mwinyi")).not.toBeInTheDocument())
  })

  it("does not delete when the confirmation is declined", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(false)
    render(<HRInterviewsSubtab interviews={[interview()]} />)

    await userEvent.click(screen.getAllByRole("button", { name: "" })[0])

    expect(mockDelete).not.toHaveBeenCalled()
  })

  it("changes status via the row's select and applies the server's response", async () => {
    mockPost.mockResolvedValue({ data: interview({ status: "completed" }) })
    render(<HRInterviewsSubtab interviews={[interview({ status: "scheduled" })]} />)

    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(await screen.findByRole("option", { name: "Completed" }))

    await waitFor(() => expect(mockPost).toHaveBeenCalledWith("admin/hr/interviews", { id: "int-1", status: "completed" }))
    expect(await screen.findByText("Completed")).toBeInTheDocument()
  })

  it("leaves the row unchanged when the status update request fails", async () => {
    mockPost.mockRejectedValue(new Error("network error"))
    render(<HRInterviewsSubtab interviews={[interview({ status: "scheduled" })]} />)

    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(await screen.findByRole("option", { name: "Completed" }))

    await waitFor(() => expect(mockPost).toHaveBeenCalledTimes(1))
    expect(screen.getByText("Scheduled")).toBeInTheDocument()
  })

  it("submits a new interview and prepends it to the list", async () => {
    mockPost.mockResolvedValue({ data: interview({ id: "new-int", candidate_name: "Chiku Ali", position: "Driver" }) })
    render(<HRInterviewsSubtab interviews={[interview()]} />)

    await userEvent.click(screen.getByRole("button", { name: /Schedule Interview/i }))
    const dialog = screen.getByRole("dialog")
    const [candidateInput, positionInput] = within(dialog).getAllByRole("textbox")
    await userEvent.type(candidateInput, "Chiku Ali")
    await userEvent.type(positionInput, "Driver")

    const dateInput = dialog.querySelector('input[type="date"]') as HTMLInputElement
    const timeInput = dialog.querySelector('input[type="time"]') as HTMLInputElement
    await userEvent.type(dateInput, "2026-04-01")
    await userEvent.type(timeInput, "09:00")

    await userEvent.click(within(dialog).getByRole("button", { name: /Save Interview/i }))

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith(
        "admin/hr/interviews",
        expect.objectContaining({ candidate_name: "Chiku Ali", position: "Driver" }),
      ),
    )
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(screen.getByText("Chiku Ali")).toBeInTheDocument()
  })
})

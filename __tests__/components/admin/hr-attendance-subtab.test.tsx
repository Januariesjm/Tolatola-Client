/**
 * Tests for HRAttendanceSubtab (components/admin/hr-attendance-subtab.tsx).
 *
 * A prop-driven attendance log: rows are filtered client-side by staff name
 * and a date picker that defaults to today, an "add" dialog posts a new
 * record (nulling out check-in/out for absent/leave) and prepends it to the
 * list, and delete is gated behind window.confirm. A failed save surfaces via
 * window.alert since this component has no toast wiring. What's worth
 * pinning: the date + search filter composition, the per-status badge
 * variants, that absent/leave hides the time inputs, the payload shape on
 * submit, and that a rejected save neither closes the dialog nor drops the
 * alert.
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
import { HRAttendanceSubtab } from "@/components/admin/hr-attendance-subtab"

const mockPost = jest.fn()
const mockDelete = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiPost: (...args: unknown[]) => mockPost(...args),
  clientApiDelete: (...args: unknown[]) => mockDelete(...args),
}))

const TODAY = new Date().toISOString().split("T")[0]

const STAFF = [
  { id: "s-1", full_name: "Asha Mwinyi", department: "Operations" },
  { id: "s-2", full_name: "Baraka John", department: "Engineering" },
]

function record(overrides: Record<string, unknown> = {}) {
  return {
    id: "att-1",
    staff_id: "s-1",
    date: TODAY,
    check_in_time: "09:00:00",
    check_out_time: "17:00:00",
    status: "present",
    notes: "",
    hr_staff_records: { full_name: "Asha Mwinyi" },
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  jest.spyOn(window, "confirm").mockReturnValue(true)
  jest.spyOn(window, "alert").mockImplementation(() => {})
  mockPost.mockResolvedValue({ data: record({ id: "new-att" }) })
  mockDelete.mockResolvedValue({})
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe("HRAttendanceSubtab", () => {
  it("shows the empty state when nothing matches today's date", () => {
    render(<HRAttendanceSubtab attendance={[]} staff={STAFF} />)

    expect(screen.getByText("No attendance records found for this date.")).toBeInTheDocument()
  })

  it("renders a record for today with its check-in/out times", () => {
    render(<HRAttendanceSubtab attendance={[record()]} staff={STAFF} />)

    expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument()
    expect(screen.getByText("09:00")).toBeInTheDocument()
    expect(screen.getByText("17:00")).toBeInTheDocument()
  })

  it("falls back to 'Unknown' when the staff relation is missing", () => {
    render(<HRAttendanceSubtab attendance={[record({ hr_staff_records: undefined })]} staff={STAFF} />)

    expect(screen.getByText("Unknown")).toBeInTheDocument()
  })

  it("hides a record dated on another day once the date filter changes", async () => {
    render(<HRAttendanceSubtab attendance={[record()]} staff={STAFF} />)

    const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
    await userEvent.clear(dateInput)
    await userEvent.type(dateInput, "2020-01-01")

    expect(screen.queryByText("Asha Mwinyi")).not.toBeInTheDocument()
  })

  it("filters by staff name search", async () => {
    render(
      <HRAttendanceSubtab
        attendance={[record(), record({ id: "att-2", staff_id: "s-2", hr_staff_records: { full_name: "Baraka John" } })]}
        staff={STAFF}
      />,
    )

    await userEvent.type(screen.getByPlaceholderText(/search by staff name/i), "baraka")

    expect(screen.getByText("Baraka John")).toBeInTheDocument()
    expect(screen.queryByText("Asha Mwinyi")).not.toBeInTheDocument()
  })

  it.each([
    ["present", "Present"],
    ["absent", "Absent"],
    ["half-day", "Half Day"],
    ["leave", "On Leave"],
  ])("shows the %s badge as '%s'", (status, label) => {
    render(<HRAttendanceSubtab attendance={[record({ status })]} staff={STAFF} />)

    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it("falls back to a plain badge with the raw value for an unrecognized status", () => {
    render(<HRAttendanceSubtab attendance={[record({ status: "on-trip" })]} staff={STAFF} />)

    expect(screen.getByText("on-trip")).toBeInTheDocument()
  })

  it("deletes a record when the confirmation is accepted", async () => {
    render(<HRAttendanceSubtab attendance={[record()]} staff={STAFF} />)

    await userEvent.click(screen.getByRole("button", { name: "" }))

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("admin/hr/attendance/att-1"))
    await waitFor(() => expect(screen.queryByText("Asha Mwinyi")).not.toBeInTheDocument())
  })

  it("does not delete when the confirmation is declined", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(false)
    render(<HRAttendanceSubtab attendance={[record()]} staff={STAFF} />)

    await userEvent.click(screen.getByRole("button", { name: "" }))

    expect(mockDelete).not.toHaveBeenCalled()
    expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument()
  })

  it("hides the check-in/out time fields when logging an absence", async () => {
    render(<HRAttendanceSubtab attendance={[]} staff={STAFF} />)

    await userEvent.click(screen.getByRole("button", { name: /Log Attendance/i }))
    expect(screen.getByText("Check-in Time")).toBeInTheDocument()

    // The status select is the second combobox (after the staff select).
    await userEvent.click(screen.getAllByRole("combobox")[1])
    await userEvent.click(await screen.findByRole("option", { name: "Absent" }))

    expect(screen.queryByText("Check-in Time")).not.toBeInTheDocument()
    expect(screen.queryByText("Check-out Time")).not.toBeInTheDocument()
  })

  it("submits a new present-day record and prepends it to the list", async () => {
    mockPost.mockResolvedValue({
      data: { id: "new-att", staff_id: "s-2", date: TODAY, status: "present", check_in_time: "09:00", check_out_time: "17:00" },
    })
    render(<HRAttendanceSubtab attendance={[record()]} staff={STAFF} />)

    await userEvent.click(screen.getByRole("button", { name: /Log Attendance/i }))
    await userEvent.click(screen.getAllByRole("combobox")[0])
    await userEvent.click(await screen.findByRole("option", { name: /Baraka John/ }))
    await userEvent.click(screen.getByRole("button", { name: /Save Record/i }))

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith(
        "admin/hr/attendance",
        expect.objectContaining({ staff_id: "s-2", status: "present", check_in_time: "09:00", check_out_time: "17:00" }),
      ),
    )
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(screen.getByText("Baraka John")).toBeInTheDocument()
  })

  it("nulls out check-in/out times in the payload when logging an absence", async () => {
    render(<HRAttendanceSubtab attendance={[]} staff={STAFF} />)

    await userEvent.click(screen.getByRole("button", { name: /Log Attendance/i }))
    await userEvent.click(screen.getAllByRole("combobox")[0])
    await userEvent.click(await screen.findByRole("option", { name: /Asha Mwinyi/ }))
    await userEvent.click(screen.getAllByRole("combobox")[1])
    await userEvent.click(await screen.findByRole("option", { name: "Absent" }))
    await userEvent.click(screen.getByRole("button", { name: /Save Record/i }))

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith(
        "admin/hr/attendance",
        expect.objectContaining({ status: "absent", check_in_time: null, check_out_time: null }),
      ),
    )
  })

  it("alerts and keeps the dialog open when the save request fails", async () => {
    mockPost.mockRejectedValue(new Error("duplicate record"))
    render(<HRAttendanceSubtab attendance={[]} staff={STAFF} />)

    await userEvent.click(screen.getByRole("button", { name: /Log Attendance/i }))
    await userEvent.click(screen.getAllByRole("combobox")[0])
    await userEvent.click(await screen.findByRole("option", { name: /Asha Mwinyi/ }))
    await userEvent.click(screen.getByRole("button", { name: /Save Record/i }))

    await waitFor(() => expect(window.alert).toHaveBeenCalled())
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })
})

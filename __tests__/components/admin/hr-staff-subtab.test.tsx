/**
 * Tests for HRStaffSubtab (components/admin/hr-staff-subtab.tsx).
 *
 * Combines a status-tab selector, a search box, an advanced role/date filter
 * panel and an add/edit dialog (HRStaffFormDialog, tested in isolation in
 * hr-staff-form-dialog.test.tsx) over a prop-driven staff list. Filtering and
 * counting are delegated to the real lib/admin/hr-staff helpers rather than
 * mocked, since those are already covered at the lib level -- what matters
 * here is that this component wires search/role/date state into them
 * correctly and that add/edit/delete round-trip through the API. What's
 * worth pinning: the four status tabs (including "EXITED" covering both
 * "inactive" and legacy "exited"), the advanced filter panel's role/date
 * fields, "Reset filters" clearing everything back to the active tab, the
 * add vs. edit dialog wiring, and that a failed save shows its error inline
 * without closing the dialog.
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
import { HRStaffSubtab } from "@/components/admin/hr-staff-subtab"
import type { HRStaff } from "@/lib/admin/hr-staff"

const mockPost = jest.fn()
const mockDelete = jest.fn()
jest.mock("@/lib/api-client", () => ({
  clientApiPost: (...args: unknown[]) => mockPost(...args),
  clientApiDelete: (...args: unknown[]) => mockDelete(...args),
}))

function staff(overrides: Partial<HRStaff> = {}): HRStaff {
  return {
    id: "s-1",
    full_name: "Asha Mwinyi",
    employee_id: "EMP-001",
    role: "Manager",
    department: "Operations",
    email: "asha@example.com",
    phone: "0700000001",
    join_date: "2024-01-15",
    status: "active",
    manager: "Grace Kessy",
    position: "Ops Manager",
    created_at: "2024-01-15T00:00:00.000Z",
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  jest.spyOn(console, "error").mockImplementation(() => {})
  jest.spyOn(window, "confirm").mockReturnValue(true)
  mockPost.mockResolvedValue({ data: staff({ id: "new-s" }) })
  mockDelete.mockResolvedValue({})
})

afterEach(() => {
  jest.restoreAllMocks()
})

/** The table row for an employee, located by their name. */
const rowFor = (name: string) => screen.getByText(name).closest("tr") as HTMLElement

describe("HRStaffSubtab", () => {
  it("shows the empty state when no staff match the active tab", () => {
    render(<HRStaffSubtab staff={[]} />)

    expect(screen.getByText("No staff records found matching your filters.")).toBeInTheDocument()
  })

  it("shows only active staff on the default tab, with per-tab counts", () => {
    render(
      <HRStaffSubtab
        staff={[
          staff({ id: "s-1", full_name: "Asha Mwinyi", status: "active" }),
          staff({ id: "s-2", full_name: "Baraka John", status: "suspended" }),
          staff({ id: "s-3", full_name: "Chiku Ali", status: "terminated" }),
        ]}
      />,
    )

    expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument()
    expect(screen.queryByText("Baraka John")).not.toBeInTheDocument()
    expect(screen.getByText("ACTIVE (1)")).toBeInTheDocument()
    expect(screen.getByText("SUSPEND (1)")).toBeInTheDocument()
    expect(screen.getByText("TERMINATED (1)")).toBeInTheDocument()
    expect(screen.getByText("EXITED (0)")).toBeInTheDocument()
  })

  it("switches tabs to show suspended, then exited (covering the legacy 'exited' status), then terminated staff", async () => {
    render(
      <HRStaffSubtab
        staff={[
          staff({ id: "s-1", full_name: "Asha Mwinyi", status: "active" }),
          staff({ id: "s-2", full_name: "Baraka John", status: "suspended" }),
          staff({ id: "s-3", full_name: "Chiku Ali", status: "exited" }),
          staff({ id: "s-4", full_name: "Dennis Paul", status: "terminated" }),
        ]}
      />,
    )

    await userEvent.click(screen.getByText(/SUSPEND/))
    expect(screen.getByText("Baraka John")).toBeInTheDocument()
    expect(screen.queryByText("Asha Mwinyi")).not.toBeInTheDocument()

    await userEvent.click(screen.getByText(/EXITED/))
    expect(screen.getByText("Chiku Ali")).toBeInTheDocument()

    await userEvent.click(screen.getByText(/TERMINATED/))
    expect(screen.getByText("Dennis Paul")).toBeInTheDocument()
  })

  it("filters by name, email or employee id search", async () => {
    render(
      <HRStaffSubtab
        staff={[staff({ id: "s-1", full_name: "Asha Mwinyi" }), staff({ id: "s-2", full_name: "Baraka John", employee_id: "EMP-002" })]}
      />,
    )

    await userEvent.type(screen.getByPlaceholderText(/search name or email/i), "emp-002")

    expect(screen.getByText("Baraka John")).toBeInTheDocument()
    expect(screen.queryByText("Asha Mwinyi")).not.toBeInTheDocument()
  })

  it("filters by role via the advanced filters panel", async () => {
    render(
      <HRStaffSubtab
        staff={[
          staff({ id: "s-1", full_name: "Asha Mwinyi", role: "Manager" }),
          staff({ id: "s-2", full_name: "Baraka John", role: "Intern" }),
        ]}
      />,
    )

    await userEvent.click(document.querySelector(".lucide-sliders-horizontal")!.closest("button")!)
    await userEvent.click(screen.getByRole("combobox"))
    await userEvent.click(await screen.findByRole("option", { name: "Intern" }))

    expect(screen.getByText("Baraka John")).toBeInTheDocument()
    expect(screen.queryByText("Asha Mwinyi")).not.toBeInTheDocument()
  })

  it("filters out staff created before the 'Created From' date", async () => {
    render(
      <HRStaffSubtab
        staff={[
          staff({ id: "s-1", full_name: "Asha Mwinyi", created_at: "2024-01-01T00:00:00.000Z" }),
          staff({ id: "s-2", full_name: "Baraka John", created_at: "2026-06-01T00:00:00.000Z" }),
        ]}
      />,
    )

    await userEvent.click(document.querySelector(".lucide-sliders-horizontal")!.closest("button")!)
    const [fromInput] = document.querySelectorAll('input[type="date"]')
    await userEvent.type(fromInput, "2026-01-01")

    expect(screen.getByText("Baraka John")).toBeInTheDocument()
    expect(screen.queryByText("Asha Mwinyi")).not.toBeInTheDocument()
  })

  it("resets search, role/date filters and the active tab via the reset button", async () => {
    render(
      <HRStaffSubtab
        staff={[
          staff({ id: "s-1", full_name: "Asha Mwinyi", status: "active" }),
          staff({ id: "s-2", full_name: "Baraka John", status: "suspended" }),
        ]}
      />,
    )

    await userEvent.type(screen.getByPlaceholderText(/search name or email/i), "no-match")
    await userEvent.click(screen.getByText(/SUSPEND/))
    expect(screen.queryByText("Baraka John")).not.toBeInTheDocument() // search still active

    await userEvent.click(document.querySelector(".lucide-rotate-ccw")!.closest("button")!)

    expect((screen.getByPlaceholderText(/search name or email/i) as HTMLInputElement).value).toBe("")
    expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument()
  })

  it("opens the add dialog titled 'Add New Employee' with a blank form", async () => {
    render(<HRStaffSubtab staff={[]} />)

    await userEvent.click(screen.getByRole("button", { name: /Add Employee/i }))

    expect(screen.getByText("Add New Employee")).toBeInTheDocument()
  })

  it("submits a new employee and adds them to the list", async () => {
    mockPost.mockResolvedValue({ data: staff({ id: "new-s", full_name: "Chiku Ali", employee_id: "EMP-009" }) })
    render(<HRStaffSubtab staff={[]} />)

    await userEvent.click(screen.getByRole("button", { name: /Add Employee/i }))
    const dialog = screen.getByRole("dialog")
    const textboxes = within(dialog).getAllByRole("textbox")
    // Order per HRStaffFormDialog: full_name, employee_id, role, position, manager, email, phone.
    await userEvent.type(textboxes[0], "Chiku Ali")
    await userEvent.type(textboxes[1], "EMP-009")
    await userEvent.type(textboxes[2], "Officer")
    await userEvent.type(textboxes[3], "Field Officer")
    // Join Date already defaults to today (set by handleAddClick), so it's
    // valid without being touched.

    await userEvent.click(within(dialog).getByRole("button", { name: "Save Record" }))

    await waitFor(() =>
      expect(mockPost).toHaveBeenCalledWith(
        "admin/hr/staff",
        expect.objectContaining({ full_name: "Chiku Ali", employee_id: "EMP-009", role: "Officer", position: "Field Officer" }),
      ),
    )
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(screen.getByText("Chiku Ali")).toBeInTheDocument()
  })

  it("opens the edit dialog pre-filled and patches the existing record on save", async () => {
    mockPost.mockResolvedValue({ data: staff({ id: "s-1", full_name: "Asha Mwinyi K.", employee_id: "EMP-001" }) })
    render(<HRStaffSubtab staff={[staff()]} />)

    // The row has two icon-only buttons: edit (Pencil) first, then delete (Trash2).
    const [editButton] = within(rowFor("Asha Mwinyi")).getAllByRole("button")
    await userEvent.click(editButton)
    expect(screen.getByText("Edit Employee Details")).toBeInTheDocument()

    const dialog = screen.getByRole("dialog")
    const [fullNameInput] = within(dialog).getAllByRole("textbox")
    await userEvent.clear(fullNameInput)
    await userEvent.type(fullNameInput, "Asha Mwinyi K.")

    await userEvent.click(within(dialog).getByRole("button", { name: "Save Record" }))

    await waitFor(() => expect(mockPost).toHaveBeenCalledWith("admin/hr/staff", expect.objectContaining({ id: "s-1" })))
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument())
    expect(screen.getByText("Asha Mwinyi K.")).toBeInTheDocument()
    expect(screen.getAllByText("Asha Mwinyi K.")).toHaveLength(1)
  })

  it("shows the error inline and keeps the dialog open when saving fails", async () => {
    mockPost.mockRejectedValue(new Error("employee_id already exists"))
    render(<HRStaffSubtab staff={[]} />)

    await userEvent.click(screen.getByRole("button", { name: /Add Employee/i }))
    const dialog = screen.getByRole("dialog")
    const textboxes = within(dialog).getAllByRole("textbox")
    await userEvent.type(textboxes[0], "Chiku Ali")
    await userEvent.type(textboxes[1], "EMP-009")
    await userEvent.type(textboxes[2], "Officer")
    await userEvent.type(textboxes[3], "Field Officer")
    // Join Date already defaults to today (set by handleAddClick), so it's
    // valid without being touched.

    await userEvent.click(within(dialog).getByRole("button", { name: "Save Record" }))

    expect(await screen.findByText("employee_id already exists")).toBeInTheDocument()
    expect(screen.getByRole("dialog")).toBeInTheDocument()
  })

  it("deletes a staff member when the confirmation is accepted", async () => {
    render(<HRStaffSubtab staff={[staff()]} />)

    const row = rowFor("Asha Mwinyi")
    const buttons = within(row).getAllByRole("button")
    await userEvent.click(buttons[buttons.length - 1])

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("admin/hr/staff/s-1"))
    await waitFor(() => expect(screen.queryByText("Asha Mwinyi")).not.toBeInTheDocument())
  })

  it("does not delete when the confirmation is declined", async () => {
    jest.spyOn(window, "confirm").mockReturnValue(false)
    render(<HRStaffSubtab staff={[staff()]} />)

    const row = rowFor("Asha Mwinyi")
    const buttons = within(row).getAllByRole("button")
    await userEvent.click(buttons[buttons.length - 1])

    expect(mockDelete).not.toHaveBeenCalled()
    expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument()
  })
})

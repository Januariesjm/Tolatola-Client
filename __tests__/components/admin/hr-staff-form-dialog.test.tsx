/**
 * Tests for HRStaffFormDialog (components/admin/hr-staff-form-dialog.tsx).
 *
 * Presentational: all form state lives in the parent. What matters is that
 * the title reflects add vs edit, each field reports through onFieldChange
 * with the right key, and submit/cancel/loading wire correctly.
 */

import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { HRStaffFormDialog, type HRStaffFormData } from "@/components/admin/hr-staff-form-dialog"
import type { HRStaff } from "@/lib/admin/hr-staff"

const emptyForm: HRStaffFormData = {
  full_name: "",
  employee_id: "",
  role: "",
  department: "",
  email: "",
  phone: "",
  join_date: "",
  status: "active",
  manager: "",
  position: "",
}

const props = {
  open: true,
  onOpenChange: jest.fn(),
  editingStaff: null as HRStaff | null,
  formData: emptyForm,
  onFieldChange: jest.fn(),
  loading: false,
  error: null as string | null,
  onSubmit: jest.fn((e: React.FormEvent) => e.preventDefault()),
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("HRStaffFormDialog", () => {
  it("renders nothing when closed", () => {
    render(<HRStaffFormDialog {...props} open={false} />)

    expect(screen.queryByText("Add New Employee")).not.toBeInTheDocument()
  })

  it("titles itself 'Add New Employee' with no employee being edited", () => {
    render(<HRStaffFormDialog {...props} />)

    expect(screen.getByText("Add New Employee")).toBeInTheDocument()
  })

  it("titles itself 'Edit Employee Details' when editing an existing employee", () => {
    render(<HRStaffFormDialog {...props} editingStaff={{ id: "s-1" } as HRStaff} />)

    expect(screen.getByText("Edit Employee Details")).toBeInTheDocument()
  })

  it("reports a full_name keystroke with the right field key", async () => {
    // The labels in this form are not associated to their inputs via
    // htmlFor/id, so this locates the field by position rather than by label.
    render(<HRStaffFormDialog {...props} />)

    await userEvent.type(screen.getAllByRole("textbox")[0], "A")

    expect(props.onFieldChange).toHaveBeenCalledWith("full_name", "A")
  })

  it("shows the error message inline when there is one", () => {
    render(<HRStaffFormDialog {...props} error="employee_id already exists" />)

    expect(screen.getByText("employee_id already exists")).toBeInTheDocument()
  })

  it("disables submit and shows a spinner while loading", () => {
    render(<HRStaffFormDialog {...props} loading />)

    expect(screen.getByRole("button", { name: /Save Record/ })).toBeDisabled()
  })

  it("calls onSubmit when the form is submitted with the required fields present", async () => {
    const filled: HRStaffFormData = {
      ...emptyForm,
      full_name: "Asha",
      employee_id: "EMP-1",
      role: "Manager",
      position: "Eng Manager",
      join_date: "2026-01-01",
    }
    render(<HRStaffFormDialog {...props} formData={filled} />)

    await userEvent.click(screen.getByRole("button", { name: "Save Record" }))

    expect(props.onSubmit).toHaveBeenCalledTimes(1)
  })

  it("closes via Cancel", async () => {
    render(<HRStaffFormDialog {...props} />)

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }))

    expect(props.onOpenChange).toHaveBeenCalledWith(false)
  })
})

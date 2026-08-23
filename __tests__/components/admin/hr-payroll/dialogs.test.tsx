/**
 * Tests for PayrollDialogs (components/admin/hr-payroll/dialogs.tsx).
 *
 * Three independent Radix dialogs, each gated by its own vm.isXOpen flag
 * (not by activeTab): generate-payroll, configure-staff-profile, and the
 * printable payslip detail. Each is tested closed (not rendered) and open.
 * What's worth pinning: the generate dialog's Cancel/Generate actions and
 * loading spinner; the profile form's four controlled inputs (each setting
 * one field via a full profileForm spread, not clobbering the others), the
 * inline error banner, and Cancel/Save wiring; and the payslip's computed
 * gross salary / total deductions, the "N/A" employee-id fallback, the
 * "0.00" fallbacks when no record is selected, and Close/Print wiring
 * (window.print).
 */
import React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PayrollDialogs } from "@/components/admin/hr-payroll/dialogs"
import { makeHRPayrollViewModel } from "../../../setup/hr-payroll-fixtures"
import type { HRStaff, PayrollRecord } from "@/hooks/use-hr-payroll"

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
    ...overrides,
  }
}

function record(overrides: Partial<PayrollRecord> = {}): PayrollRecord {
  return {
    id: "r-1",
    staff_id: "s-1",
    month: "2026-08",
    basic_salary: 4000000,
    allowances: 200000,
    deductions: 400000,
    paye: 150000,
    net_salary: 3650000,
    created_by: "admin@tolatola.co.tz",
    status: "generated",
    created_at: "2026-08-01T00:00:00.000Z",
    hr_staff_records: { full_name: "Asha Mwinyi", employee_id: "EMP-001" },
    ...overrides,
  }
}

describe("PayrollDialogs", () => {
  describe("Generate Payroll dialog", () => {
    it("is not rendered when isGenerateOpen is false", () => {
      render(<PayrollDialogs vm={makeHRPayrollViewModel({ isGenerateOpen: false })} />)

      expect(screen.queryByText("Generate Monthly Payroll")).not.toBeInTheDocument()
    })

    it("shows the target month and calls setGenMonth when changed", async () => {
      const setGenMonth = jest.fn()
      render(<PayrollDialogs vm={makeHRPayrollViewModel({ isGenerateOpen: true, genMonth: "2026-08", setGenMonth })} />)

      expect(screen.getByText("Generate Monthly Payroll")).toBeInTheDocument()
      const monthInput = screen.getByDisplayValue("2026-08")
      await userEvent.type(monthInput, "2026-09")

      expect(setGenMonth).toHaveBeenCalled()
    })

    it("closes on Cancel without generating", async () => {
      const setIsGenerateOpen = jest.fn()
      const handleGeneratePayroll = jest.fn()
      render(<PayrollDialogs vm={makeHRPayrollViewModel({ isGenerateOpen: true, setIsGenerateOpen, handleGeneratePayroll })} />)

      await userEvent.click(screen.getByRole("button", { name: "Cancel" }))

      expect(setIsGenerateOpen).toHaveBeenCalledWith(false)
      expect(handleGeneratePayroll).not.toHaveBeenCalled()
    })

    it("calls handleGeneratePayroll when 'Generate & Save' is clicked", async () => {
      const handleGeneratePayroll = jest.fn()
      render(<PayrollDialogs vm={makeHRPayrollViewModel({ isGenerateOpen: true, handleGeneratePayroll, loading: false })} />)

      await userEvent.click(screen.getByRole("button", { name: /generate & save/i }))

      expect(handleGeneratePayroll).toHaveBeenCalledTimes(1)
    })

    it("disables the Generate & Save button and shows a spinner while loading", () => {
      render(<PayrollDialogs vm={makeHRPayrollViewModel({ isGenerateOpen: true, loading: true })} />)

      const button = screen.getByRole("button", { name: /generate & save/i })
      expect(button).toBeDisabled()
      expect(button.querySelector(".animate-spin")).not.toBeNull()
    })

    it("does not show a spinner when not loading", () => {
      render(<PayrollDialogs vm={makeHRPayrollViewModel({ isGenerateOpen: true, loading: false })} />)

      const button = screen.getByRole("button", { name: /generate & save/i })
      expect(button).not.toBeDisabled()
      expect(button.querySelector(".animate-spin")).toBeNull()
    })
  })

  describe("Configure Salary dialog", () => {
    it("is not rendered when isProfileEditOpen is false", () => {
      render(<PayrollDialogs vm={makeHRPayrollViewModel({ isProfileEditOpen: false })} />)

      expect(screen.queryByText(/Configure Salary/)).not.toBeInTheDocument()
    })

    it("shows the selected staff member's name in the title", () => {
      render(
        <PayrollDialogs
          vm={makeHRPayrollViewModel({ isProfileEditOpen: true, selectedStaffForProfile: staff({ full_name: "Asha Mwinyi" }) })}
        />,
      )

      expect(screen.getByText("Configure Salary: Asha Mwinyi")).toBeInTheDocument()
    })

    it("pre-fills the form fields from profileForm", () => {
      render(
        <PayrollDialogs
          vm={makeHRPayrollViewModel({
            isProfileEditOpen: true,
            profileForm: { basic_salary: "4000000", allowances: "200000", deductions: "400000", paye: "150000" },
          })}
        />,
      )

      expect(screen.getByDisplayValue("4000000")).toBeInTheDocument()
      expect(screen.getByDisplayValue("200000")).toBeInTheDocument()
      expect(screen.getByDisplayValue("400000")).toBeInTheDocument()
      expect(screen.getByDisplayValue("150000")).toBeInTheDocument()
    })

    it("updates only the changed field, preserving the rest of profileForm", async () => {
      const setProfileForm = jest.fn()
      render(
        <PayrollDialogs
          vm={makeHRPayrollViewModel({
            isProfileEditOpen: true,
            profileForm: { basic_salary: "1000", allowances: "200", deductions: "300", paye: "400" },
            setProfileForm,
          })}
        />,
      )

      const basicSalaryInput = screen.getByDisplayValue("1000")
      await userEvent.type(basicSalaryInput, "5")

      // Last call should reflect the final keystroke with the other fields untouched.
      const lastCall = setProfileForm.mock.calls[setProfileForm.mock.calls.length - 1][0]
      expect(lastCall).toEqual({ basic_salary: "10005", allowances: "200", deductions: "300", paye: "400" })
    })

    it("updates the allowances, deductions and paye fields independently", async () => {
      const setProfileForm = jest.fn()
      render(
        <PayrollDialogs
          vm={makeHRPayrollViewModel({
            isProfileEditOpen: true,
            profileForm: { basic_salary: "1000", allowances: "200", deductions: "300", paye: "400" },
            setProfileForm,
          })}
        />,
      )

      await userEvent.type(screen.getByDisplayValue("200"), "1")
      expect(setProfileForm).toHaveBeenLastCalledWith({ basic_salary: "1000", allowances: "2001", deductions: "300", paye: "400" })

      await userEvent.type(screen.getByDisplayValue("300"), "1")
      expect(setProfileForm).toHaveBeenLastCalledWith({ basic_salary: "1000", allowances: "200", deductions: "3001", paye: "400" })

      await userEvent.type(screen.getByDisplayValue("400"), "1")
      expect(setProfileForm).toHaveBeenLastCalledWith({ basic_salary: "1000", allowances: "200", deductions: "300", paye: "4001" })
    })

    it("shows the inline error banner when vm.error is set", () => {
      render(<PayrollDialogs vm={makeHRPayrollViewModel({ isProfileEditOpen: true, error: "Failed to save payroll settings." })} />)

      expect(screen.getByText("Failed to save payroll settings.")).toBeInTheDocument()
    })

    it("does not show an error banner when vm.error is null", () => {
      render(<PayrollDialogs vm={makeHRPayrollViewModel({ isProfileEditOpen: true, error: null })} />)

      expect(screen.queryByText(/Failed to save/)).not.toBeInTheDocument()
    })

    it("closes on Cancel without saving", async () => {
      const setIsProfileEditOpen = jest.fn()
      const handleSaveProfile = jest.fn()
      render(<PayrollDialogs vm={makeHRPayrollViewModel({ isProfileEditOpen: true, setIsProfileEditOpen, handleSaveProfile })} />)

      await userEvent.click(screen.getByRole("button", { name: "Cancel" }))

      expect(setIsProfileEditOpen).toHaveBeenCalledWith(false)
      expect(handleSaveProfile).not.toHaveBeenCalled()
    })

    it("calls handleSaveProfile when the form is submitted via 'Save Settings'", async () => {
      const handleSaveProfile = jest.fn(async (e: React.FormEvent) => e.preventDefault())
      render(
        <PayrollDialogs
          vm={makeHRPayrollViewModel({
            isProfileEditOpen: true,
            // Basic Salary is a required field; the browser blocks submission
            // (and never calls onSubmit) while it's empty.
            profileForm: { basic_salary: "4000000", allowances: "", deductions: "", paye: "" },
            handleSaveProfile,
          })}
        />,
      )

      await userEvent.click(screen.getByRole("button", { name: "Save Settings" }))

      expect(handleSaveProfile).toHaveBeenCalledTimes(1)
    })

    it("disables Save Settings and shows a spinner while loading", () => {
      render(<PayrollDialogs vm={makeHRPayrollViewModel({ isProfileEditOpen: true, loading: true })} />)

      const button = screen.getByRole("button", { name: "Save Settings" })
      expect(button).toBeDisabled()
      expect(button.querySelector(".animate-spin")).not.toBeNull()
    })
  })

  describe("Payslip Detail dialog", () => {
    it("is not rendered when isPayslipOpen is false", () => {
      render(<PayrollDialogs vm={makeHRPayrollViewModel({ isPayslipOpen: false })} />)

      expect(screen.queryByText("Employee Payslip Detail")).not.toBeInTheDocument()
    })

    it("shows 0.00 fallbacks for every figure when no record is selected", () => {
      render(<PayrollDialogs vm={makeHRPayrollViewModel({ isPayslipOpen: true, selectedRecordForDetail: null })} />)

      const zeroValues = screen.getAllByText(/0\.00/)
      // Basic, Allowances, Gross, PAYE, Deductions, Total Deductions, Net = 7 lines.
      expect(zeroValues.length).toBeGreaterThanOrEqual(7)
    })

    it("renders the payslip figures, month badge and employee id for the selected record", () => {
      render(
        <PayrollDialogs
          vm={makeHRPayrollViewModel({
            isPayslipOpen: true,
            selectedRecordForDetail: record({
              month: "2026-08",
              basic_salary: 4000000,
              allowances: 200000,
              deductions: 400000,
              paye: 150000,
              net_salary: 3650000,
              created_by: "admin@tolatola.co.tz",
              hr_staff_records: { full_name: "Asha Mwinyi", employee_id: "EMP-001" },
            }),
          })}
        />,
      )

      expect(screen.getByText("2026-08")).toBeInTheDocument()
      expect(screen.getByText("Asha Mwinyi")).toBeInTheDocument()
      expect(screen.getByText("EMP-001")).toBeInTheDocument()
      expect(screen.getByText("TZS 4,000,000.00")).toBeInTheDocument()
      expect(screen.getByText("+ TZS 200,000.00")).toBeInTheDocument()
      // Gross = 4,000,000 + 200,000 = 4,200,000
      expect(screen.getByText("4,200,000.00", { exact: false })).toBeInTheDocument()
      expect(screen.getByText("- TZS 150,000.00")).toBeInTheDocument()
      expect(screen.getByText("- TZS 400,000.00")).toBeInTheDocument()
      // Total deductions = 400,000 + 150,000 = 550,000
      expect(screen.getByText("550,000.00", { exact: false })).toBeInTheDocument()
      expect(screen.getByText("TZS 3,650,000.00")).toBeInTheDocument()
      expect(screen.getByText(/Prepared By: admin@tolatola.co.tz/)).toBeInTheDocument()
    })

    it("falls back to 'N/A' when the record has no employee_id", () => {
      render(
        <PayrollDialogs
          vm={makeHRPayrollViewModel({
            isPayslipOpen: true,
            selectedRecordForDetail: record({ hr_staff_records: { full_name: "Asha Mwinyi", employee_id: "" } }),
          })}
        />,
      )

      expect(screen.getByText("N/A")).toBeInTheDocument()
    })

    it("closes on Close without printing", async () => {
      const setIsPayslipOpen = jest.fn()
      const printSpy = jest.spyOn(window, "print").mockImplementation(() => {})
      render(<PayrollDialogs vm={makeHRPayrollViewModel({ isPayslipOpen: true, setIsPayslipOpen })} />)

      const outlineButtons = screen.getAllByRole("button", { name: "Close" })
      // The dialog's built-in X close (sr-only "Close" text) also matches; the
      // footer's visible "Close" button is the outline-styled one.
      const footerClose = outlineButtons.find((btn) => btn.className.includes("outline")) as HTMLElement
      await userEvent.click(footerClose)

      expect(setIsPayslipOpen).toHaveBeenCalledWith(false)
      expect(printSpy).not.toHaveBeenCalled()
      printSpy.mockRestore()
    })

    it("calls window.print when 'Print Payslip' is clicked", async () => {
      const printSpy = jest.spyOn(window, "print").mockImplementation(() => {})
      render(<PayrollDialogs vm={makeHRPayrollViewModel({ isPayslipOpen: true })} />)

      await userEvent.click(screen.getByRole("button", { name: /print payslip/i }))

      expect(printSpy).toHaveBeenCalledTimes(1)
      printSpy.mockRestore()
    })
  })
})

/**
 * Tests for PayrollRecordsTab (components/admin/hr-payroll/records.tsx).
 *
 * Renders nothing unless activeTab === "records". When active: an empty
 * state with an inline "Generate Payroll" link when there are no records for
 * the month, otherwise a table of records plus a month-total row. What's
 * worth pinning: the empty-state link's two-step action (same as the
 * header's button), the "Employee" fallback when a record has no linked
 * staff name, the "View" button opening the payslip dialog for that record,
 * and the "Payslip" button doing the same plus deferring window.print via
 * setTimeout.
 */
import React from "react"
import { render, screen, within, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PayrollRecordsTab } from "@/components/admin/hr-payroll/records"
import { makeHRPayrollViewModel } from "../../../setup/hr-payroll-fixtures"
import type { PayrollRecord } from "@/hooks/use-hr-payroll"

function record(overrides: Partial<PayrollRecord> = {}): PayrollRecord {
  return {
    id: "r-1",
    staff_id: "s-1",
    month: "2026-08",
    basic_salary: 1000,
    allowances: 100,
    deductions: 50,
    paye: 20,
    net_salary: 1030,
    created_by: "admin@tolatola.co.tz",
    status: "generated",
    created_at: "2026-08-01T00:00:00.000Z",
    hr_staff_records: { full_name: "Asha Mwinyi", employee_id: "EMP-001" },
    ...overrides,
  }
}

describe("PayrollRecordsTab", () => {
  it("renders nothing when the records tab is not active", () => {
    const { container } = render(<PayrollRecordsTab vm={makeHRPayrollViewModel({ activeTab: "overview" })} />)

    expect(container).toBeEmptyDOMElement()
  })

  it("shows the records count badge", () => {
    render(<PayrollRecordsTab vm={makeHRPayrollViewModel({ activeTab: "records", records: [record(), record({ id: "r-2" })] })} />)

    expect(screen.getByText("Records: 2")).toBeInTheDocument()
  })

  it("calls setSelectedMonth when the month filter is changed", async () => {
    const setSelectedMonth = jest.fn()
    render(<PayrollRecordsTab vm={makeHRPayrollViewModel({ activeTab: "records", selectedMonth: "2026-08", setSelectedMonth })} />)

    const monthInput = screen.getByDisplayValue("2026-08")
    await userEvent.type(monthInput, "2026-09")

    expect(setSelectedMonth).toHaveBeenCalled()
  })

  describe("empty state", () => {
    it("shows the empty message naming the selected month", () => {
      render(<PayrollRecordsTab vm={makeHRPayrollViewModel({ activeTab: "records", records: [], selectedMonth: "2026-08" })} />)

      expect(screen.getByText(/No payroll records found for/)).toBeInTheDocument()
      expect(screen.getByText("2026-08", { exact: false })).toBeInTheDocument()
      expect(screen.queryByRole("table")).not.toBeInTheDocument()
    })

    it("seeds genMonth and opens the generate dialog when the inline link is clicked", async () => {
      const setGenMonth = jest.fn()
      const setIsGenerateOpen = jest.fn()
      render(
        <PayrollRecordsTab
          vm={makeHRPayrollViewModel({ activeTab: "records", records: [], selectedMonth: "2026-08", setGenMonth, setIsGenerateOpen })}
        />,
      )

      await userEvent.click(screen.getByText("Generate Payroll"))

      expect(setGenMonth).toHaveBeenCalledWith("2026-08")
      expect(setIsGenerateOpen).toHaveBeenCalledWith(true)
    })
  })

  describe("populated table", () => {
    it("renders a row per record with formatted figures and the month total row", () => {
      const vm = makeHRPayrollViewModel({
        activeTab: "records",
        records: [record()],
        monthlyTotals: { basic: 1000, allowances: 100, deductions: 50, paye: 20, net: 1030 },
      })
      render(<PayrollRecordsTab vm={vm} />)

      const row = screen.getByText("Asha Mwinyi").closest("tr") as HTMLElement
      expect(within(row).getByText("admin@tolatola.co.tz")).toBeInTheDocument()
      expect(screen.getByText("Month Total")).toBeInTheDocument()
    })

    it("falls back to 'Employee' when a record has no linked staff name", () => {
      render(
        <PayrollRecordsTab vm={makeHRPayrollViewModel({ activeTab: "records", records: [record({ hr_staff_records: undefined })] })} />,
      )

      expect(screen.getAllByText("Employee").length).toBeGreaterThan(0)
      const cells = screen.getAllByText("Employee")
      expect(cells.some((el) => el.tagName === "TD")).toBe(true)
    })

    it("opens the payslip dialog for the clicked record when 'View' is clicked", async () => {
      const setSelectedRecordForDetail = jest.fn()
      const setIsPayslipOpen = jest.fn()
      const rec = record()
      render(
        <PayrollRecordsTab
          vm={makeHRPayrollViewModel({ activeTab: "records", records: [rec], setSelectedRecordForDetail, setIsPayslipOpen })}
        />,
      )

      await userEvent.click(screen.getByRole("button", { name: "View" }))

      expect(setSelectedRecordForDetail).toHaveBeenCalledWith(rec)
      expect(setIsPayslipOpen).toHaveBeenCalledWith(true)
    })

    it("opens the payslip dialog and defers window.print when 'Payslip' is clicked", async () => {
      jest.useFakeTimers({ legacyFakeTimers: false })
      const printSpy = jest.spyOn(window, "print").mockImplementation(() => {})
      const setSelectedRecordForDetail = jest.fn()
      const setIsPayslipOpen = jest.fn()
      const rec = record()
      const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
      render(
        <PayrollRecordsTab
          vm={makeHRPayrollViewModel({ activeTab: "records", records: [rec], setSelectedRecordForDetail, setIsPayslipOpen })}
        />,
      )

      await user.click(screen.getByRole("button", { name: "Payslip" }))

      expect(setSelectedRecordForDetail).toHaveBeenCalledWith(rec)
      expect(setIsPayslipOpen).toHaveBeenCalledWith(true)
      expect(printSpy).not.toHaveBeenCalled()

      act(() => {
        jest.advanceTimersByTime(300)
      })
      expect(printSpy).toHaveBeenCalledTimes(1)

      printSpy.mockRestore()
      jest.useRealTimers()
    })
  })
})

/**
 * Tests for PayrollOverviewTab (components/admin/hr-payroll/overview.tsx).
 *
 * Renders nothing unless activeTab === "overview"; when active, shows a
 * month picker and four total cards derived from monthlyTotals, plus a
 * summary block with two record-count-dependent branches: the average net
 * salary guards against dividing by zero, and the "Month Status" badge
 * flips between "Generated & Paid" and "No Records" depending on whether
 * any records exist for the month.
 */
import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PayrollOverviewTab } from "@/components/admin/hr-payroll/overview"
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

describe("PayrollOverviewTab", () => {
  it("renders nothing when the overview tab is not active", () => {
    const { container } = render(<PayrollOverviewTab vm={makeHRPayrollViewModel({ activeTab: "records" })} />)

    expect(container).toBeEmptyDOMElement()
  })

  it("shows the month picker and calls setSelectedMonth on change", async () => {
    const setSelectedMonth = jest.fn()
    render(<PayrollOverviewTab vm={makeHRPayrollViewModel({ activeTab: "overview", selectedMonth: "2026-08", setSelectedMonth })} />)

    const monthInput = screen.getByDisplayValue("2026-08")
    await userEvent.type(monthInput, "2026-09")

    expect(setSelectedMonth).toHaveBeenCalled()
  })

  it("renders the four monthly total cards", () => {
    const vm = makeHRPayrollViewModel({
      activeTab: "overview",
      monthlyTotals: { basic: 500000, allowances: 20000, deductions: 10000, paye: 5000, net: 505000 },
    })
    render(<PayrollOverviewTab vm={vm} />)

    expect(screen.getByText("Total Net Payout")).toBeInTheDocument()
    expect(screen.getByText("TZS 505,000.00")).toBeInTheDocument()
    expect(screen.getByText("Total Basic Salary")).toBeInTheDocument()
    expect(screen.getByText("TZS 500,000.00")).toBeInTheDocument()
    expect(screen.getByText("Total Allowances")).toBeInTheDocument()
    expect(screen.getByText("TZS 20,000.00")).toBeInTheDocument()
    expect(screen.getByText("PAYE & Deductions")).toBeInTheDocument()
    // deductions + paye = 15000
    expect(screen.getByText("TZS 15,000.00")).toBeInTheDocument()
    expect(screen.getByText("PAYE: TZS 5,000.00")).toBeInTheDocument()
  })

  describe("when there are no records for the month", () => {
    it("shows 0.00 average net salary and the 'No Records' badge", () => {
      render(<PayrollOverviewTab vm={makeHRPayrollViewModel({ activeTab: "overview", records: [] })} />)

      expect(screen.getByText("Total Staff Count on Payroll:")).toBeInTheDocument()
      expect(screen.getByText("0 Employees")).toBeInTheDocument()
      const averageLabel = screen.getByText("Average Net Salary:")
      expect(averageLabel.nextElementSibling).toHaveTextContent("TZS 0.00")
      expect(screen.getByText("No Records")).toBeInTheDocument()
      expect(screen.queryByText("Generated & Paid")).not.toBeInTheDocument()
    })
  })

  describe("when records exist for the month", () => {
    it("computes the average net salary and shows the 'Generated & Paid' badge", () => {
      const vm = makeHRPayrollViewModel({
        activeTab: "overview",
        records: [record({ id: "r-1" }), record({ id: "r-2" })],
        monthlyTotals: { basic: 2000, allowances: 200, deductions: 100, paye: 40, net: 2060 },
      })
      render(<PayrollOverviewTab vm={vm} />)

      expect(screen.getByText("2 Employees")).toBeInTheDocument()
      // average = 2060 / 2 = 1030
      expect(screen.getByText("TZS 1,030.00")).toBeInTheDocument()
      expect(screen.getByText("Generated & Paid")).toBeInTheDocument()
      expect(screen.queryByText("No Records")).not.toBeInTheDocument()
    })
  })
})

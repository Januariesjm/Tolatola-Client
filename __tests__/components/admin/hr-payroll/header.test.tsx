/**
 * Tests for PayrollHeader (components/admin/hr-payroll/header.tsx).
 *
 * Pure presentational shell: a title card with a "Generate Payroll" button
 * that seeds genMonth from selectedMonth and opens the generate dialog, plus
 * three tab buttons that flip activeTab. What's worth pinning: the button's
 * two-step action (setGenMonth then setIsGenerateOpen), each tab click
 * reporting the right tab name, and the active-tab styling branch for all
 * three tabs (the ternary in the className is the only branch logic here).
 */
import React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PayrollHeader } from "@/components/admin/hr-payroll/header"
import { makeHRPayrollViewModel } from "../../../setup/hr-payroll-fixtures"

describe("PayrollHeader", () => {
  it("renders the title and description", () => {
    render(<PayrollHeader vm={makeHRPayrollViewModel()} />)

    expect(screen.getByText("Payroll Management")).toBeInTheDocument()
    expect(screen.getByText("Review history, update salaries, and generate payslips.")).toBeInTheDocument()
  })

  it("seeds the generate month and opens the generate dialog when 'Generate Payroll' is clicked", async () => {
    const setGenMonth = jest.fn()
    const setIsGenerateOpen = jest.fn()
    const vm = makeHRPayrollViewModel({ selectedMonth: "2026-05", setGenMonth, setIsGenerateOpen })
    render(<PayrollHeader vm={vm} />)

    await userEvent.click(screen.getByRole("button", { name: /generate payroll/i }))

    expect(setGenMonth).toHaveBeenCalledWith("2026-05")
    expect(setIsGenerateOpen).toHaveBeenCalledWith(true)
  })

  it.each([
    ["Overview", "overview"],
    ["Employee Profiles", "profiles"],
    ["Payroll Records", "records"],
  ])("clicking the '%s' tab sets activeTab to '%s'", async (label, tab) => {
    const setActiveTab = jest.fn()
    render(<PayrollHeader vm={makeHRPayrollViewModel({ setActiveTab })} />)

    await userEvent.click(screen.getByText(label))

    expect(setActiveTab).toHaveBeenCalledWith(tab)
  })

  it.each([
    ["overview", "Overview"],
    ["profiles", "Employee Profiles"],
    ["records", "Payroll Records"],
  ] as const)("highlights the '%s' tab as active and leaves the others inactive", (activeTab, activeLabel) => {
    render(<PayrollHeader vm={makeHRPayrollViewModel({ activeTab })} />)

    const labels = ["Overview", "Employee Profiles", "Payroll Records"]
    for (const label of labels) {
      const button = screen.getByText(label)
      if (label === activeLabel) {
        expect(button.className).toContain("border-primary")
        expect(button.className).toContain("text-primary")
      } else {
        expect(button.className).toContain("border-transparent")
      }
    }
  })
})

/**
 * Tests for PayrollProfilesTab (components/admin/hr-payroll/profiles.tsx).
 *
 * Renders nothing unless activeTab === "profiles". When active, shows an
 * empty state when staffWithProfiles is empty, otherwise a table of
 * staff/profile pairs with a "Configure" button per row. What's worth
 * pinning: the empty vs. populated branch, the formatted salary columns, and
 * that clicking "Configure" calls handleEditProfileClick with the exact
 * { staff, profile } pair for that row (not just the staff id).
 */
import React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { PayrollProfilesTab } from "@/components/admin/hr-payroll/profiles"
import { makeHRPayrollViewModel } from "../../../setup/hr-payroll-fixtures"
import type { HRStaff, StaffPayrollPair } from "@/hooks/use-hr-payroll"

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

function pair(overrides: Partial<StaffPayrollPair> = {}): StaffPayrollPair {
  return {
    staff: staff(),
    profile: { basic_salary: 4000000, allowances: 200000, deductions: 400000, paye: 150000 },
    ...overrides,
  }
}

describe("PayrollProfilesTab", () => {
  it("renders nothing when the profiles tab is not active", () => {
    const { container } = render(<PayrollProfilesTab vm={makeHRPayrollViewModel({ activeTab: "records" })} />)

    expect(container).toBeEmptyDOMElement()
  })

  it("shows the empty state when there are no active staff to configure", () => {
    render(<PayrollProfilesTab vm={makeHRPayrollViewModel({ activeTab: "profiles", staffWithProfiles: [] })} />)

    expect(screen.getByText("No active employees found to configure.")).toBeInTheDocument()
    expect(screen.queryByRole("table")).not.toBeInTheDocument()
  })

  it("renders a row per staff/profile pair with formatted salary figures", () => {
    const item = pair({
      staff: staff({ full_name: "Asha Mwinyi", employee_id: "EMP-001", role: "Manager", department: "Operations" }),
    })
    render(<PayrollProfilesTab vm={makeHRPayrollViewModel({ activeTab: "profiles", staffWithProfiles: [item] })} />)

    const row = screen.getByText("Asha Mwinyi").closest("tr") as HTMLElement
    expect(within(row).getByText("EMP-001")).toBeInTheDocument()
    expect(within(row).getByText("Manager")).toBeInTheDocument()
    expect(within(row).getByText("Operations")).toBeInTheDocument()
    expect(within(row).getByText("4,000,000.00")).toBeInTheDocument()
    expect(within(row).getByText("200,000.00")).toBeInTheDocument()
    expect(within(row).getByText("400,000.00")).toBeInTheDocument()
    expect(within(row).getByText("150,000.00")).toBeInTheDocument()
  })

  it("calls handleEditProfileClick with the exact staff/profile pair when 'Configure' is clicked", async () => {
    const handleEditProfileClick = jest.fn()
    const asha = pair({ staff: staff({ id: "s-1", full_name: "Asha Mwinyi" }) })
    const baraka = pair({ staff: staff({ id: "s-2", full_name: "Baraka John" }) })
    render(
      <PayrollProfilesTab
        vm={makeHRPayrollViewModel({ activeTab: "profiles", staffWithProfiles: [asha, baraka], handleEditProfileClick })}
      />,
    )

    const row = screen.getByText("Baraka John").closest("tr") as HTMLElement
    await userEvent.click(within(row).getByRole("button", { name: /configure/i }))

    expect(handleEditProfileClick).toHaveBeenCalledWith(baraka)
    expect(handleEditProfileClick).toHaveBeenCalledTimes(1)
  })

  it("renders one row per pair when multiple staff have profiles", () => {
    const asha = pair({ staff: staff({ id: "s-1", full_name: "Asha Mwinyi" }) })
    const baraka = pair({ staff: staff({ id: "s-2", full_name: "Baraka John" }) })
    render(<PayrollProfilesTab vm={makeHRPayrollViewModel({ activeTab: "profiles", staffWithProfiles: [asha, baraka] })} />)

    expect(screen.getAllByRole("row")).toHaveLength(3) // header + 2 rows
  })
})

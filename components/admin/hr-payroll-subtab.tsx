"use client"

import { useHRPayroll, type HRStaff } from "@/hooks/use-hr-payroll"
import { PayrollHeader } from "./hr-payroll/header"
import { PayrollOverviewTab } from "./hr-payroll/overview"
import { PayrollProfilesTab } from "./hr-payroll/profiles"
import { PayrollRecordsTab } from "./hr-payroll/records"
import { PayrollDialogs } from "./hr-payroll/dialogs"
import type { HRPayrollViewModel } from "./hr-payroll/view-model"

/**
 * HR payroll subtab shell.
 *
 * Owns only the currency formatter and composes the sections; all payroll
 * fetching, state and actions live in useHRPayroll.
 */
export function HRPayrollSubtab({ staff }: { staff: HRStaff[] }) {
  const state = useHRPayroll(staff)

  const formatCurrency = (val: number) => {
    return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const vm: HRPayrollViewModel = { ...state, formatCurrency }

  return (
    <div className="space-y-6">
      <PayrollHeader vm={vm} />
      <PayrollOverviewTab vm={vm} />
      <PayrollProfilesTab vm={vm} />
      <PayrollRecordsTab vm={vm} />
      <PayrollDialogs vm={vm} />
    </div>
  )
}

import type { HRPayrollState } from "@/hooks/use-hr-payroll"

/**
 * What the payroll sections render from: the hook's state plus the currency
 * formatter the subtab owns.
 *
 * Passed as one prop so the markup could be split into sections without
 * rewriting it or threading two dozen individual props.
 */
export interface HRPayrollViewModel extends HRPayrollState {
  formatCurrency: (val: number) => string
}

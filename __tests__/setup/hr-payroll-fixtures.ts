/**
 * Shared test fixtures for components/admin/hr-payroll/*.
 *
 * Every section takes a slice of `HRPayrollViewModel` (see
 * components/admin/hr-payroll/view-model.ts, which extends the hook state in
 * hooks/use-hr-payroll.ts), so rather than duplicating a huge mock object in
 * each of the five test files, `makeHRPayrollViewModel` builds one with sane
 * defaults (jest.fn() for every setter/handler, a real-ish formatCurrency) and
 * lets each test override just the fields it cares about.
 */
import type React from "react"
import type { HRPayrollViewModel } from "@/components/admin/hr-payroll/view-model"

export function formatCurrencyLike(val: number): string {
  return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function makeHRPayrollViewModel(overrides: Partial<HRPayrollViewModel> = {}): HRPayrollViewModel {
  const base: HRPayrollViewModel = {
    activeTab: "records",
    setActiveTab: jest.fn(),
    profiles: [],
    records: [],
    selectedMonth: "2026-08",
    setSelectedMonth: jest.fn(),
    isGenerateOpen: false,
    setIsGenerateOpen: jest.fn(),
    genMonth: "2026-08",
    setGenMonth: jest.fn(),
    isProfileEditOpen: false,
    setIsProfileEditOpen: jest.fn(),
    selectedStaffForProfile: null,
    profileForm: { basic_salary: "", allowances: "", deductions: "", paye: "" },
    setProfileForm: jest.fn(),
    selectedRecordForDetail: null,
    setSelectedRecordForDetail: jest.fn(),
    isPayslipOpen: false,
    setIsPayslipOpen: jest.fn(),
    loading: false,
    error: null,
    staffWithProfiles: [],
    monthlyTotals: { basic: 0, allowances: 0, deductions: 0, paye: 0, net: 0 },
    handleEditProfileClick: jest.fn(),
    handleSaveProfile: jest.fn(async (e: React.FormEvent) => {
      e.preventDefault()
    }),
    handleGeneratePayroll: jest.fn(async () => {}),
    refreshRecords: jest.fn(async () => {}),
    formatCurrency: jest.fn(formatCurrencyLike),
  }
  return { ...base, ...overrides }
}

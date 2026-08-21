"use client"

import { useEffect, useMemo, useState } from "react"
import { clientApiGet, clientApiPost, clientApiPut } from "@/lib/api-client"
import { logger, normalizeError } from "@/lib/logger"

const log = logger.child("admin.hr-payroll")

export interface HRStaff {
  id: string
  full_name: string
  employee_id: string
  role: string
  department: string
  email: string
  phone: string
  join_date: string
  status: string
}

export interface PayrollProfile {
  id?: string
  staff_id: string
  basic_salary: number
  allowances: number
  deductions: number
  paye: number
  hr_staff_records?: {
    full_name: string
    employee_id: string
  }
}

export interface PayrollRecord {
  id: string
  staff_id: string
  month: string
  basic_salary: number
  allowances: number
  deductions: number
  paye: number
  net_salary: number
  created_by: string
  status: string
  created_at: string
  hr_staff_records?: {
    full_name: string
    employee_id: string
  }
}

/**
 * Payroll data and actions for the HR payroll subtab: staff payroll profiles,
 * monthly records, the derived totals, and generating a month's payroll.
 *
 * Extracted from components/admin/hr-payroll-subtab.tsx, which was 804 lines of
 * this logic interleaved with the tables, dialogs and payslip markup.
 */
/**
 * A staff member paired with their payroll profile, or a zeroed stand-in when
 * they have none yet.
 */
export interface StaffPayrollPair {
  staff: HRStaff
  profile: Pick<PayrollProfile, "basic_salary" | "allowances" | "deductions" | "paye"> & Partial<PayrollProfile>
}

export function useHRPayroll(staff: HRStaff[]) {
  const [activeTab, setActiveTab] = useState<"overview" | "profiles" | "records">("records")

  // State for payroll data
  const [profiles, setProfiles] = useState<PayrollProfile[]>([])
  const [records, setRecords] = useState<PayrollRecord[]>([])

  // Selected month for records & overview (Format: YYYY-MM)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date()
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, "0")
    return `${y}-${m}`
  })

  // Modals & form state
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)
  const [genMonth, setGenMonth] = useState(selectedMonth)
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false)
  const [selectedStaffForProfile, setSelectedStaffForProfile] = useState<HRStaff | null>(null)

  const [profileForm, setProfileForm] = useState({
    basic_salary: "",
    allowances: "",
    deductions: "",
    paye: "",
  })

  const [selectedRecordForDetail, setSelectedRecordForDetail] = useState<PayrollRecord | null>(null)
  const [isPayslipOpen, setIsPayslipOpen] = useState(false)

  // Loading / Error states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load all payroll profiles
  const fetchProfiles = async () => {
    try {
      const res = await clientApiGet<{ data: PayrollProfile[] }>("admin/hr/payroll/profiles")
      if (res.data) {
        setProfiles(res.data)
      }
    } catch (err) {
      log.error("failed to fetch profiles", err)
    }
  }

  // Load payroll records for selected month
  const fetchRecords = async (month: string) => {
    try {
      const res = await clientApiGet<{ data: PayrollRecord[] }>(`admin/hr/payroll/records?month=${month}`)
      if (res.data) {
        setRecords(res.data)
      }
    } catch (err) {
      log.error("failed to fetch records", err)
    }
  }

  useEffect(() => {
    fetchProfiles()
  }, [])

  useEffect(() => {
    fetchRecords(selectedMonth)
  }, [selectedMonth])

  // Map profile details directly to the staff array
  const staffWithProfiles = useMemo(() => {
    const profileMap = new Map(profiles.map((p) => [p.staff_id, p]))
    return staff
      .filter((s) => s.status === "active")
      .map((s) => {
        const profile = profileMap.get(s.id)
        return {
          staff: s,
          profile: profile || {
            basic_salary: 0,
            allowances: 0,
            deductions: 0,
            paye: 0,
          },
        }
      })
  }, [staff, profiles])

  // Calculations for Totals in selected Month Records
  const monthlyTotals = useMemo(() => {
    return records.reduce(
      (acc, rec) => {
        acc.basic += Number(rec.basic_salary || 0)
        acc.allowances += Number(rec.allowances || 0)
        acc.deductions += Number(rec.deductions || 0)
        acc.paye += Number(rec.paye || 0)
        acc.net += Number(rec.net_salary || 0)
        return acc
      },
      { basic: 0, allowances: 0, deductions: 0, paye: 0, net: 0 },
    )
  }, [records])

  // Handle Edit Profile click
  const handleEditProfileClick = (item: StaffPayrollPair) => {
    setSelectedStaffForProfile(item.staff)
    setProfileForm({
      basic_salary: String(item.profile.basic_salary || ""),
      allowances: String(item.profile.allowances || ""),
      deductions: String(item.profile.deductions || ""),
      paye: String(item.profile.paye || ""),
    })
    setIsProfileEditOpen(true)
  }

  // Handle save of profile settings
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaffForProfile) return

    setLoading(true)
    setError(null)
    try {
      await clientApiPost("admin/hr/payroll/profiles", {
        staff_id: selectedStaffForProfile.id,
        basic_salary: Number(profileForm.basic_salary || 0),
        allowances: Number(profileForm.allowances || 0),
        deductions: Number(profileForm.deductions || 0),
        paye: Number(profileForm.paye || 0),
      })

      await fetchProfiles()
      setIsProfileEditOpen(false)
    } catch (err) {
      log.error("failed to save payroll settings", err)
      setError(normalizeError(err).message || "Failed to save payroll settings.")
    } finally {
      setLoading(false)
    }
  }

  // Handle Payroll Generation
  const handleGeneratePayroll = async () => {
    setLoading(true)
    setError(null)
    try {
      await clientApiPost("admin/hr/payroll/generate", { month: genMonth })
      setSelectedMonth(genMonth)
      await fetchRecords(genMonth)
      setIsGenerateOpen(false)
    } catch (err) {
      log.error("failed to generate payroll", err, { month: genMonth })
      setError(normalizeError(err).message || "Failed to generate payroll.")
    } finally {
      setLoading(false)
    }
  }

  return {
    activeTab,
    setActiveTab,
    profiles,
    records,
    selectedMonth,
    setSelectedMonth,
    isGenerateOpen,
    setIsGenerateOpen,
    genMonth,
    setGenMonth,
    isProfileEditOpen,
    setIsProfileEditOpen,
    selectedStaffForProfile,
    profileForm,
    setProfileForm,
    selectedRecordForDetail,
    setSelectedRecordForDetail,
    isPayslipOpen,
    setIsPayslipOpen,
    loading,
    error,
    staffWithProfiles,
    monthlyTotals,
    handleEditProfileClick,
    handleSaveProfile,
    handleGeneratePayroll,
    refreshRecords: fetchRecords,
  }
}

export type HRPayrollState = ReturnType<typeof useHRPayroll>

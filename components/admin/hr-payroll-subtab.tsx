"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Coins,
  FileSpreadsheet,
  Printer,
  Edit2,
  TrendingUp,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Loader2,
  Eye,
} from "lucide-react"
import { clientApiGet, clientApiPost } from "@/lib/api-client"

interface HRStaff {
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

interface PayrollProfile {
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

interface PayrollRecord {
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

export function HRPayrollSubtab({ staff }: { staff: HRStaff[] }) {
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
      console.error("Failed to fetch profiles:", err)
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
      console.error("Failed to fetch records:", err)
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
    const profileMap = new Map(profiles.map(p => [p.staff_id, p]))
    return staff
      .filter(s => s.status === "active")
      .map(s => {
        const profile = profileMap.get(s.id)
        return {
          staff: s,
          profile: profile || {
            basic_salary: 0,
            allowances: 0,
            deductions: 0,
            paye: 0,
          }
        }
      })
  }, [staff, profiles])

  // Calculations for Totals in selected Month Records
  const monthlyTotals = useMemo(() => {
    return records.reduce((acc, rec) => {
      acc.basic += Number(rec.basic_salary || 0)
      acc.allowances += Number(rec.allowances || 0)
      acc.deductions += Number(rec.deductions || 0)
      acc.paye += Number(rec.paye || 0)
      acc.net += Number(rec.net_salary || 0)
      return acc
    }, { basic: 0, allowances: 0, deductions: 0, paye: 0, net: 0 })
  }, [records])

  // Handle Edit Profile click
  const handleEditProfileClick = (item: { staff: HRStaff; profile: any }) => {
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
    } catch (err: any) {
      setError(err?.message || "Failed to save payroll settings.")
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
    } catch (err: any) {
      setError(err?.message || "Failed to generate payroll.")
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (val: number) => {
    return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <Card className="shadow-sm border border-slate-200/80 rounded-xl overflow-hidden bg-white">
        <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-slate-50/40 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-800">Payroll Management</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Review history, update salaries, and generate payslips.
            </p>
          </div>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl flex items-center gap-2 shadow-sm self-start sm:self-center"
            onClick={() => {
              setGenMonth(selectedMonth)
              setIsGenerateOpen(true)
            }}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Generate Payroll
          </Button>
        </div>

        <div className="px-6 border-b">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "overview"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("profiles")}
              className={`py-4 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "profiles"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              Employee Profiles
            </button>
            <button
              onClick={() => setActiveTab("records")}
              className={`py-4 text-sm font-semibold border-b-2 transition-all ${
                activeTab === "records"
                  ? "border-primary text-primary"
                  : "border-transparent text-slate-500 hover:text-slate-900"
              }`}
            >
              Payroll Records
            </button>
          </div>
        </div>
      </Card>

      {/* Main Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Label className="font-semibold text-slate-700">Select Month:</Label>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="max-w-[180px] rounded-xl bg-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-xl border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Net Payout
                </CardTitle>
                <Coins className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  TZS {formatCurrency(monthlyTotals.net)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">For the month of {selectedMonth}</p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Basic Salary
                </CardTitle>
                <DollarSign className="h-4 w-4 text-slate-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  TZS {formatCurrency(monthlyTotals.basic)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Before allowances/deductions</p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Allowances
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  TZS {formatCurrency(monthlyTotals.allowances)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">Bonuses, benefits, travel</p>
              </CardContent>
            </Card>

            <Card className="rounded-xl border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  PAYE & Deductions
                </CardTitle>
                <Badge className="bg-red-50 text-red-700 border-red-200">
                  Tax Deducted
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-900">
                  TZS {formatCurrency(monthlyTotals.deductions + monthlyTotals.paye)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  PAYE: TZS {formatCurrency(monthlyTotals.paye)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="rounded-xl border shadow-sm">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-base font-bold">Monthly Summary Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 max-w-md text-sm">
                <span className="text-slate-500 font-medium">Total Staff Count on Payroll:</span>
                <span className="font-bold text-right">{records.length} Employees</span>

                <span className="text-slate-500 font-medium">Average Net Salary:</span>
                <span className="font-bold text-right">
                  TZS {records.length ? formatCurrency(monthlyTotals.net / records.length) : "0.00"}
                </span>

                <span className="text-slate-500 font-medium">Month Status:</span>
                <span className="text-right">
                  {records.length > 0 ? (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-bold">
                      Generated & Paid
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 font-bold">
                      No Records
                    </Badge>
                  )}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "profiles" && (
        <Card className="rounded-xl border shadow-sm overflow-hidden bg-white">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-base font-bold">Payroll Configurations</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {staffWithProfiles.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No active employees found to configure.</div>
            ) : (
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Role & Dept</TableHead>
                    <TableHead className="text-right">Basic Salary (TZS)</TableHead>
                    <TableHead className="text-right">Allowances (TZS)</TableHead>
                    <TableHead className="text-right">Deductions (TZS)</TableHead>
                    <TableHead className="text-right">PAYE (TZS)</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffWithProfiles.map(({ staff, profile }) => (
                    <TableRow key={staff.id} className="hover:bg-slate-50/50">
                      <TableCell>
                        <div>
                          <p className="font-bold text-slate-800">{staff.full_name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{staff.employee_id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-semibold">{staff.role}</p>
                          <p className="text-xs text-muted-foreground">{staff.department}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(profile.basic_salary)}
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium">
                        {formatCurrency(profile.allowances)}
                      </TableCell>
                      <TableCell className="text-right text-red-600 font-medium">
                        {formatCurrency(profile.deductions)}
                      </TableCell>
                      <TableCell className="text-right text-pink-600 font-medium">
                        {formatCurrency(profile.paye)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-lg text-primary hover:text-primary hover:bg-slate-100/80 flex items-center gap-1.5 ml-auto"
                          onClick={() => handleEditProfileClick({ staff, profile })}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Configure
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "records" && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border rounded-xl bg-white">
            <div className="flex items-center gap-3">
              <Label className="font-semibold text-slate-700">Month:</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="max-w-[180px] rounded-xl bg-slate-50 border-slate-200"
              />
            </div>
            <Badge className="bg-slate-900 text-white rounded-md self-start sm:self-center font-bold px-3 py-1 font-mono text-xs">
              Records: {records.length}
            </Badge>
          </div>

          <Card className="rounded-xl border shadow-sm overflow-hidden bg-white">
            <CardContent className="p-0">
              {records.length === 0 ? (
                <div className="p-12 text-center text-slate-500">
                  No payroll records found for {selectedMonth}. Click <strong className="text-primary cursor-pointer hover:underline" onClick={() => { setGenMonth(selectedMonth); setIsGenerateOpen(true) }}>Generate Payroll</strong> to create them.
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead className="text-right">Basic Salary</TableHead>
                      <TableHead className="text-right">Allowances</TableHead>
                      <TableHead className="text-right">Deductions</TableHead>
                      <TableHead className="text-right">PAYE</TableHead>
                      <TableHead className="text-right">Net Salary</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((rec) => (
                      <TableRow key={rec.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-bold text-slate-800">
                          {rec.hr_staff_records?.full_name || "Employee"}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(rec.basic_salary)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-700">
                          {formatCurrency(rec.allowances)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-700">
                          {formatCurrency(rec.deductions)}
                        </TableCell>
                        <TableCell className="text-right text-pink-600 font-medium">
                          {formatCurrency(rec.paye)}
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-900">
                          {formatCurrency(rec.net_salary)}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {rec.created_by}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-lg text-slate-700 border-slate-200"
                              onClick={() => {
                                setSelectedRecordForDetail(rec)
                                setIsPayslipOpen(true)
                              }}
                            >
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 rounded-lg text-slate-700 border-slate-200"
                              onClick={() => {
                                setSelectedRecordForDetail(rec)
                                setIsPayslipOpen(true)
                                // Let the modal render, then print
                                setTimeout(() => window.print(), 300)
                              }}
                            >
                              Payslip
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {/* Month Total Sum Row */}
                    <TableRow className="bg-slate-50 font-bold hover:bg-slate-50 border-t-2 border-slate-200">
                      <TableCell className="text-slate-800 font-black">Month Total</TableCell>
                      <TableCell className="text-right">{formatCurrency(monthlyTotals.basic)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(monthlyTotals.allowances)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(monthlyTotals.deductions)}</TableCell>
                      <TableCell className="text-right text-pink-600">{formatCurrency(monthlyTotals.paye)}</TableCell>
                      <TableCell className="text-right text-slate-900 font-black">{formatCurrency(monthlyTotals.net)}</TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* MODAL 1: Generate Payroll */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Generate Monthly Payroll</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-500 leading-relaxed">
              This will automatically process and create payroll records for all <strong>active</strong> staff directory employees for the chosen month.
            </p>
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 p-3 rounded-lg leading-relaxed">
              <strong>Note:</strong> If payroll was already generated for this month, regenerating will update existing records to reflect their current configurations.
            </p>
            <div className="space-y-2">
              <Label>Target Month</Label>
              <Input
                type="month"
                value={genMonth}
                onChange={(e) => setGenMonth(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsGenerateOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button 
              onClick={handleGeneratePayroll}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              disabled={loading}
            >
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Generate & Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Configure Staff Payroll Profile */}
      <Dialog open={isProfileEditOpen} onOpenChange={setIsProfileEditOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Configure Salary: {selectedStaffForProfile?.full_name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveProfile} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Basic Salary (TZS)</Label>
              <Input
                type="number"
                required
                min="0"
                value={profileForm.basic_salary}
                onChange={(e) => setProfileForm({ ...profileForm, basic_salary: e.target.value })}
                className="rounded-xl font-semibold"
                placeholder="4000000"
              />
            </div>
            <div className="space-y-2">
              <Label>Allowances (TZS)</Label>
              <Input
                type="number"
                min="0"
                value={profileForm.allowances}
                onChange={(e) => setProfileForm({ ...profileForm, allowances: e.target.value })}
                className="rounded-xl font-semibold"
                placeholder="200000"
              />
            </div>
            <div className="space-y-2">
              <Label>Deductions (TZS)</Label>
              <Input
                type="number"
                min="0"
                value={profileForm.deductions}
                onChange={(e) => setProfileForm({ ...profileForm, deductions: e.target.value })}
                className="rounded-xl font-semibold"
                placeholder="400000"
              />
            </div>
            <div className="space-y-2">
              <Label>PAYE Tax (TZS)</Label>
              <Input
                type="number"
                min="0"
                value={profileForm.paye}
                onChange={(e) => setProfileForm({ ...profileForm, paye: e.target.value })}
                className="rounded-xl font-semibold font-mono text-pink-600"
                placeholder="0"
              />
            </div>

            {error && (
              <div className="p-3 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl">
                {error}
              </div>
            )}

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsProfileEditOpen(false)} className="rounded-xl">
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Settings
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Detailed Payslip (Printable) */}
      <Dialog open={isPayslipOpen} onOpenChange={setIsPayslipOpen}>
        <DialogContent className="max-w-2xl rounded-2xl overflow-y-auto max-h-[90vh]">
          <DialogHeader className="print-hide">
            <DialogTitle>Employee Payslip Detail</DialogTitle>
          </DialogHeader>

          {/* Payslip Content (Uses style tags to enforce clean print-only formats) */}
          <div id="payslip-printable-area" className="p-6 border rounded-xl bg-white text-slate-800 space-y-6">
            <style dangerouslySetInnerHTML={{__html: `
              @media print {
                body * {
                  visibility: hidden;
                }
                #payslip-printable-area, #payslip-printable-area * {
                  visibility: visible;
                }
                #payslip-printable-area {
                  position: absolute;
                  left: 0;
                  top: 0;
                  width: 100%;
                  border: none !important;
                  box-shadow: none !important;
                  padding: 0 !important;
                }
                .print-hide {
                  display: none !important;
                }
              }
            `}} />

            {/* Payslip Header */}
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-900 uppercase">TOLATOLA LTD</h1>
                <p className="text-xs text-muted-foreground">Plot 12, Victoria Area, Dar es Salaam</p>
                <p className="text-xs text-muted-foreground">Email: hr@tolatola.co.tz</p>
              </div>
              <div className="text-right">
                <h2 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Payslip</h2>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 mt-1 uppercase font-bold text-xs">
                  {selectedRecordForDetail?.month}
                </Badge>
              </div>
            </div>

            {/* Employee info */}
            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50/50 p-4 rounded-xl border">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Employee Name:</span>
                <span className="font-bold text-slate-800 text-base">{selectedRecordForDetail?.hr_staff_records?.full_name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block font-medium">Employee ID:</span>
                <span className="font-bold text-slate-800 font-mono">{selectedRecordForDetail?.hr_staff_records?.employee_id || "N/A"}</span>
              </div>
            </div>

            {/* Earnings & Deductions Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 border-b pb-1">Earnings</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Basic Salary</span>
                    <span className="font-semibold">TZS {selectedRecordForDetail ? formatCurrency(selectedRecordForDetail.basic_salary) : "0.00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Allowances</span>
                    <span className="font-semibold text-emerald-600">+ TZS {selectedRecordForDetail ? formatCurrency(selectedRecordForDetail.allowances) : "0.00"}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-slate-800">
                    <span>Gross Salary</span>
                    <span>TZS {selectedRecordForDetail ? formatCurrency(Number(selectedRecordForDetail.basic_salary) + Number(selectedRecordForDetail.allowances)) : "0.00"}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 border-b pb-1">Deductions</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">PAYE Tax</span>
                    <span className="font-semibold text-red-500">- TZS {selectedRecordForDetail ? formatCurrency(selectedRecordForDetail.paye) : "0.00"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Other Deductions</span>
                    <span className="font-semibold text-red-500">- TZS {selectedRecordForDetail ? formatCurrency(selectedRecordForDetail.deductions) : "0.00"}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-slate-800">
                    <span>Total Deductions</span>
                    <span>TZS {selectedRecordForDetail ? formatCurrency(Number(selectedRecordForDetail.deductions) + Number(selectedRecordForDetail.paye)) : "0.00"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net pay callout */}
            <div className="p-4 bg-slate-900 text-white rounded-xl flex justify-between items-center">
              <div>
                <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">Net Salary Payout</span>
                <span className="text-xs text-slate-400">Paid directly to bank account</span>
              </div>
              <span className="text-2xl font-black">
                TZS {selectedRecordForDetail ? formatCurrency(selectedRecordForDetail.net_salary) : "0.00"}
              </span>
            </div>

            {/* Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-8 border-t text-xs">
              <div className="space-y-4">
                <div className="h-12 border-b border-dashed border-slate-300"></div>
                <div className="text-center text-slate-500 font-medium">Prepared By: {selectedRecordForDetail?.created_by}</div>
              </div>
              <div className="space-y-4">
                <div className="h-12 border-b border-dashed border-slate-300"></div>
                <div className="text-center text-slate-500 font-medium">Employee Signature / Acknowledged</div>
              </div>
            </div>
          </div>

          <DialogFooter className="print-hide">
            <Button variant="outline" onClick={() => setIsPayslipOpen(false)} className="rounded-xl">
              Close
            </Button>
            <Button 
              className="bg-primary text-white rounded-xl flex items-center gap-1.5"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" />
              Print Payslip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

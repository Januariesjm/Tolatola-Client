"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
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
import type { PayrollRecord } from "@/hooks/use-hr-payroll"
import type { HRPayrollViewModel } from "./view-model"

/**
 * Generate payroll, configure a staff profile, and the printable payslip.
 *
 * Sliced verbatim out of hr-payroll-subtab.tsx, which was 804 lines of payroll
 * fetching and this markup in one file.
 */
export function PayrollDialogs({ vm }: { vm: HRPayrollViewModel }) {
  const {
    error,
    formatCurrency,
    genMonth,
    handleGeneratePayroll,
    handleSaveProfile,
    isGenerateOpen,
    isPayslipOpen,
    isProfileEditOpen,
    loading,
    profileForm,
    records,
    selectedRecordForDetail,
    selectedStaffForProfile,
    setGenMonth,
    setIsGenerateOpen,
    setIsPayslipOpen,
    setIsProfileEditOpen,
    setProfileForm,
  } = vm

  return (
    <>
      {/* MODAL 1: Generate Payroll */}
      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Generate Monthly Payroll</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-slate-500 leading-relaxed">
              This will automatically process and create payroll records for all <strong>active</strong> staff directory employees for the
              chosen month.
            </p>
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 p-3 rounded-lg leading-relaxed">
              <strong>Note:</strong> If payroll was already generated for this month, regenerating will update existing records to reflect
              their current configurations.
            </p>
            <div className="space-y-2">
              <Label>Target Month</Label>
              <Input type="month" value={genMonth} onChange={(e) => setGenMonth(e.target.value)} className="rounded-xl" />
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

            {error && <div className="p-3 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl">{error}</div>}

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
            <style
              dangerouslySetInnerHTML={{
                __html: `
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
            `,
              }}
            />

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
                <span className="font-bold text-slate-800 font-mono">
                  {selectedRecordForDetail?.hr_staff_records?.employee_id || "N/A"}
                </span>
              </div>
            </div>

            {/* Earnings & Deductions Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 border-b pb-1">Earnings</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Basic Salary</span>
                    <span className="font-semibold">
                      TZS {selectedRecordForDetail ? formatCurrency(selectedRecordForDetail.basic_salary) : "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Allowances</span>
                    <span className="font-semibold text-emerald-600">
                      + TZS {selectedRecordForDetail ? formatCurrency(selectedRecordForDetail.allowances) : "0.00"}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-slate-800">
                    <span>Gross Salary</span>
                    <span>
                      TZS{" "}
                      {selectedRecordForDetail
                        ? formatCurrency(Number(selectedRecordForDetail.basic_salary) + Number(selectedRecordForDetail.allowances))
                        : "0.00"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-900 border-b pb-1">Deductions</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500">PAYE Tax</span>
                    <span className="font-semibold text-red-500">
                      - TZS {selectedRecordForDetail ? formatCurrency(selectedRecordForDetail.paye) : "0.00"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Other Deductions</span>
                    <span className="font-semibold text-red-500">
                      - TZS {selectedRecordForDetail ? formatCurrency(selectedRecordForDetail.deductions) : "0.00"}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-slate-800">
                    <span>Total Deductions</span>
                    <span>
                      TZS{" "}
                      {selectedRecordForDetail
                        ? formatCurrency(Number(selectedRecordForDetail.deductions) + Number(selectedRecordForDetail.paye))
                        : "0.00"}
                    </span>
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
            <Button className="bg-primary text-white rounded-xl flex items-center gap-1.5" onClick={() => window.print()}>
              <Printer className="h-4 w-4" />
              Print Payslip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

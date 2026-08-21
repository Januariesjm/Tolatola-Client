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
 * Per-staff payroll profile list with the configure action.
 *
 * Sliced verbatim out of hr-payroll-subtab.tsx, which was 804 lines of payroll
 * fetching and this markup in one file.
 */
export function PayrollProfilesTab({ vm }: { vm: HRPayrollViewModel }) {
  const { activeTab, formatCurrency, handleEditProfileClick, profiles, staffWithProfiles } = vm

  return (
    <>
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
                      <TableCell className="text-right font-medium">{formatCurrency(profile.basic_salary)}</TableCell>
                      <TableCell className="text-right text-emerald-600 font-medium">{formatCurrency(profile.allowances)}</TableCell>
                      <TableCell className="text-right text-red-600 font-medium">{formatCurrency(profile.deductions)}</TableCell>
                      <TableCell className="text-right text-pink-600 font-medium">{formatCurrency(profile.paye)}</TableCell>
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
    </>
  )
}

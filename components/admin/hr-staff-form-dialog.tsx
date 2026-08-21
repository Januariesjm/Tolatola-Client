"use client"

/**
 * Add/edit dialog for the admin HR staff list.
 *
 * Extracted verbatim from components/admin/hr-staff-subtab.tsx. The form state
 * lives in the parent as a single object; this dialog receives it plus a
 * generic field setter rather than one callback per field.
 */

import type React from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { HRStaff } from "@/lib/admin/hr-staff"

export interface HRStaffFormData {
  full_name: string
  employee_id: string
  role: string
  department: string
  email: string
  phone: string
  join_date: string
  status: string
  manager: string
  position: string
}

export interface HRStaffFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingStaff: HRStaff | null
  formData: HRStaffFormData
  onFieldChange: <K extends keyof HRStaffFormData>(field: K, value: HRStaffFormData[K]) => void
  loading: boolean
  error: string | null
  onSubmit: (e: React.FormEvent) => void
}

export function HRStaffFormDialog({
  open,
  onOpenChange,
  editingStaff,
  formData,
  onFieldChange,
  loading,
  error,
  onSubmit,
}: HRStaffFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle>{editingStaff ? "Edit Employee Details" : "Add New Employee"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Full Name</Label>
              <Input
                required
                value={formData.full_name}
                onChange={(e) => onFieldChange("full_name", e.target.value)}
                className="rounded-lg text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Employee ID</Label>
              <Input
                required
                value={formData.employee_id}
                onChange={(e) => onFieldChange("employee_id", e.target.value)}
                className="rounded-lg text-sm"
                placeholder="e.g. EMP-001"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role (Job Level)</Label>
              <Input
                required
                value={formData.role}
                onChange={(e) => onFieldChange("role", e.target.value)}
                className="rounded-lg text-sm"
                placeholder="e.g. Manager, Intern, Executive"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Position (Job Title)</Label>
              <Input
                required
                value={formData.position}
                onChange={(e) => onFieldChange("position", e.target.value)}
                className="rounded-lg text-sm"
                placeholder="e.g. Human Resources Manager"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Department</Label>
              <Select value={formData.department} onValueChange={(val) => onFieldChange("department", val)}>
                <SelectTrigger className="rounded-lg text-sm">
                  <SelectValue placeholder="Select Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Engineering">Engineering</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="HR">HR & Admin</SelectItem>
                  <SelectItem value="Support">Customer Support</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Direct Manager</Label>
              <Input
                value={formData.manager}
                onChange={(e) => onFieldChange("manager", e.target.value)}
                className="rounded-lg text-sm"
                placeholder="Manager's Name"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => onFieldChange("email", e.target.value)}
                className="rounded-lg text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Phone</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => onFieldChange("phone", e.target.value)}
                className="rounded-lg text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Join Date</Label>
              <Input
                type="date"
                required
                value={formData.join_date}
                onChange={(e) => onFieldChange("join_date", e.target.value)}
                className="rounded-lg text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(val) => onFieldChange("status", val)}>
                <SelectTrigger className="rounded-lg text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="inactive">Exited (Inactive)</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <div className="p-3 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl">{error}</div>}

          <div className="flex justify-end gap-2 pt-2 border-t mt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" className="rounded-xl" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Record
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

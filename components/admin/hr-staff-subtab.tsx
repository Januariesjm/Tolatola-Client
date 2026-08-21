"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { HRStaffFormDialog } from "@/components/admin/hr-staff-form-dialog"
import { Users, Plus, Search, Trash2, SlidersHorizontal, RotateCcw, Shield, Calendar, Pencil } from "lucide-react"
import { clientApiPost, clientApiDelete } from "@/lib/api-client"
import { logger } from "@/lib/logger"
import { countStaffByStatus, distinctRoles, filterStaff, type HRStaff } from "@/lib/admin/hr-staff"

const log = logger.child("admin.hr-staff-subtab")

export function HRStaffSubtab({ staff: initialStaff }: { staff: HRStaff[] }) {
  const [staffList, setStaffList] = useState<HRStaff[]>(initialStaff)
  const [search, setSearch] = useState("")

  // Advanced filters toggle & criteria
  const [showFilters, setShowFilters] = useState(false)
  const [filterRole, setFilterRole] = useState("all")
  const [filterDateFrom, setFilterDateFrom] = useState("")
  const [filterDateTo, setFilterDateTo] = useState("")

  // Status tab selection
  const [activeStatusTab, setActiveStatusTab] = useState<"active" | "suspended" | "inactive" | "terminated">("active")

  // Modals & forms
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<HRStaff | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    full_name: "",
    employee_id: "",
    role: "",
    department: "",
    email: "",
    phone: "",
    join_date: "",
    status: "active",
    manager: "",
    position: "",
  })

  const uniqueRoles = useMemo(() => distinctRoles(staffList), [staffList])
  const counts = useMemo(() => countStaffByStatus(staffList), [staffList])

  const handleResetFilters = () => {
    setSearch("")
    setFilterRole("all")
    setFilterDateFrom("")
    setFilterDateTo("")
    setActiveStatusTab("active")
  }

  const filtered = useMemo(
    () =>
      filterStaff(staffList, {
        statusTab: activeStatusTab,
        query: search,
        role: filterRole,
        dateFrom: filterDateFrom,
        dateTo: filterDateTo,
      }),
    [staffList, search, filterRole, filterDateFrom, filterDateTo, activeStatusTab],
  )

  // Open Form for Adding
  const handleAddClick = () => {
    setEditingStaff(null)
    setFormData({
      full_name: "",
      employee_id: "",
      role: "",
      department: "",
      email: "",
      phone: "",
      join_date: new Date().toISOString().split("T")[0],
      status: "active",
      manager: "",
      position: "",
    })
    setError(null)
    setIsFormOpen(true)
  }

  // Open Form for Editing
  const handleEditClick = (staff: HRStaff) => {
    setEditingStaff(staff)
    setFormData({
      full_name: staff.full_name || "",
      employee_id: staff.employee_id || "",
      role: staff.role || "",
      department: staff.department || "",
      email: staff.email || "",
      phone: staff.phone || "",
      join_date: staff.join_date || "",
      status: staff.status || "active",
      manager: staff.manager || "",
      position: staff.position || "",
    })
    setError(null)
    setIsFormOpen(true)
  }

  // Handle Form Submission (Add or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload = editingStaff ? { id: editingStaff.id, ...formData } : formData

      const res = await clientApiPost<any>("admin/hr/staff", payload)
      if (res.data) {
        if (editingStaff) {
          // Update in local state
          setStaffList(staffList.map((s) => (s.id === editingStaff.id ? res.data : s)))
        } else {
          // Add to local state
          setStaffList([res.data, ...staffList])
        }
        setIsFormOpen(false)
      } else {
        setError("Failed to save employee: Invalid response from server.")
      }
    } catch (err: any) {
      log.error("failed to save staff", err)
      setError(err?.message || "Failed to save staff record.")
    } finally {
      setLoading(false)
    }
  }

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this staff record?")) return
    try {
      await clientApiDelete(`admin/hr/staff/${id}`)
      setStaffList(staffList.filter((s) => s.id !== id))
    } catch (err) {
      log.error("failed to delete staff", err)
    }
  }

  return (
    <Card className="shadow-sm rounded-xl border border-slate-200 bg-white">
      {/* Top Header Section */}
      <CardHeader className="pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b bg-slate-50/50 rounded-t-xl">
        <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
          <Users className="h-5 w-5 text-primary" />
          Employees Directory
        </CardTitle>
        <Button
          size="sm"
          className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold flex items-center gap-2 self-start sm:self-center"
          onClick={handleAddClick}
        >
          <Plus className="h-4 w-4" />
          Add Employee
        </Button>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Search & Filter Controls */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 h-10 rounded-xl bg-slate-50 border-slate-200 text-sm focus-visible:ring-1 focus-visible:ring-primary focus-visible:bg-white transition-all"
              />
            </div>
            <Button
              variant="outline"
              size="icon"
              className={`h-10 w-10 rounded-xl border-slate-200 transition-all ${
                showFilters ? "bg-primary/5 border-primary/25 text-primary" : "text-slate-500 hover:bg-slate-50"
              }`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl border-slate-200 text-slate-500 hover:bg-slate-50"
              onClick={handleResetFilters}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Shield className="h-3 w-3 text-slate-400" /> Role
                </Label>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="bg-white h-9 rounded-lg border-slate-200 text-xs">
                    <SelectValue placeholder="Select Role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="all">Select Role</SelectItem>
                    {uniqueRoles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-slate-400" /> Created From
                </Label>
                <Input
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="bg-white h-9 rounded-lg border-slate-200 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                  <Calendar className="h-3 w-3 text-slate-400" /> Created To
                </Label>
                <Input
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="bg-white h-9 rounded-lg border-slate-200 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Status Filtering Tabs */}
        <div className="border-b border-slate-100 pb-1.5 flex flex-wrap gap-2 sm:gap-6">
          <button
            onClick={() => setActiveStatusTab("active")}
            className={`flex items-center gap-2 pb-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeStatusTab === "active" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 block"></span>
            ACTIVE ({counts.active})
          </button>
          <button
            onClick={() => setActiveStatusTab("suspended")}
            className={`flex items-center gap-2 pb-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeStatusTab === "suspended" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 block"></span>
            SUSPEND ({counts.suspended})
          </button>
          <button
            onClick={() => setActiveStatusTab("inactive")}
            className={`flex items-center gap-2 pb-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeStatusTab === "inactive" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-500 block"></span>
            EXITED ({counts.exited})
          </button>
          <button
            onClick={() => setActiveStatusTab("terminated")}
            className={`flex items-center gap-2 pb-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeStatusTab === "terminated" ? "border-primary text-primary" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500 block"></span>
            TERMINATED ({counts.terminated})
          </button>
        </div>

        {/* Directory Table */}
        <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500">No staff records found matching your filters.</div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-bold text-slate-700">Name</TableHead>
                  <TableHead className="font-bold text-slate-700">Email</TableHead>
                  <TableHead className="font-bold text-slate-700">Role</TableHead>
                  <TableHead className="font-bold text-slate-700">Manager</TableHead>
                  <TableHead className="font-bold text-slate-700">Department</TableHead>
                  <TableHead className="font-bold text-slate-700">Position</TableHead>
                  <TableHead className="font-bold text-slate-700">Status</TableHead>
                  <TableHead className="text-right font-bold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/30">
                    <TableCell className="font-bold text-slate-800">
                      <div>
                        <p>{item.full_name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono font-medium">{item.employee_id}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{item.email || "-"}</TableCell>
                    <TableCell>
                      {item.role ? (
                        <Badge className="bg-amber-500/10 text-amber-700 hover:bg-amber-500/10 font-bold border-none text-xs rounded px-2 py-0.5">
                          {item.role}
                        </Badge>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 font-medium">{item.manager || "-"}</TableCell>
                    <TableCell className="text-sm text-slate-600">{item.department || "-"}</TableCell>
                    <TableCell className="text-sm text-slate-800 font-semibold">{item.position || "-"}</TableCell>
                    <TableCell>
                      {item.status === "active" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      ) : item.status === "suspended" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                          Suspend
                        </span>
                      ) : item.status === "terminated" ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-800">
                          Terminated
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-800">
                          Exited
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1.5 justify-end">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-teal-600 hover:text-teal-800 hover:bg-teal-50 border border-teal-100/50 rounded-lg p-0 bg-teal-50/20"
                          onClick={() => handleEditClick(item)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-100/50 rounded-lg p-0 bg-red-50/20"
                          onClick={() => handleDelete(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>

      {/* Dialog for Add / Edit Employee */}
      <HRStaffFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        editingStaff={editingStaff}
        formData={formData}
        onFieldChange={(field, value) => setFormData((prev) => ({ ...prev, [field]: value }))}
        loading={loading}
        error={error}
        onSubmit={handleSubmit}
      />
    </Card>
  )
}

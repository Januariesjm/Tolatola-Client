"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Loader2, 
  SlidersHorizontal, 
  RotateCcw, 
  Shield, 
  Calendar,
  Pencil,
  Building,
  Briefcase,
  Mail,
  Phone
} from "lucide-react"
import { clientApiPost, clientApiDelete } from "@/lib/api-client"

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
  manager?: string
  position?: string
  created_at?: string
}

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

  // Dynamic role list from current staff data
  const uniqueRoles = useMemo(() => {
    const roles = new Set(staffList.map((s) => s.role).filter(Boolean))
    return Array.from(roles)
  }, [staffList])

  // Count employees in each category
  const counts = useMemo(() => {
    return staffList.reduce(
      (acc, s) => {
        if (s.status === "active") acc.active++
        else if (s.status === "suspended") acc.suspended++
        else if (s.status === "inactive" || s.status === "exited") acc.exited++
        else if (s.status === "terminated") acc.terminated++
        return acc
      },
      { active: 0, suspended: 0, exited: 0, terminated: 0 }
    )
  }, [staffList])

  // Reset all search and filters
  const handleResetFilters = () => {
    setSearch("")
    setFilterRole("all")
    setFilterDateFrom("")
    setFilterDateTo("")
    setActiveStatusTab("active")
  }

  // Filtered staff list
  const filtered = useMemo(() => {
    return staffList.filter((s) => {
      // 1. Status Tab filter
      const tabMatch =
        (activeStatusTab === "active" && s.status === "active") ||
        (activeStatusTab === "suspended" && s.status === "suspended") ||
        (activeStatusTab === "inactive" && (s.status === "inactive" || s.status === "exited")) ||
        (activeStatusTab === "terminated" && s.status === "terminated")

      if (!tabMatch) return false

      // 2. Search filter (Name or Email)
      if (search) {
        const query = search.toLowerCase()
        const nameMatch = s.full_name?.toLowerCase().includes(query)
        const emailMatch = s.email?.toLowerCase().includes(query)
        const idMatch = s.employee_id?.toLowerCase().includes(query)
        if (!nameMatch && !emailMatch && !idMatch) return false
      }

      // 3. Advanced Role filter
      if (filterRole !== "all" && s.role !== filterRole) {
        return false
      }

      // 4. Date range filter
      if (filterDateFrom) {
        const fromDate = new Date(filterDateFrom)
        const recordDate = s.created_at ? new Date(s.created_at) : new Date(s.join_date)
        if (recordDate < fromDate) return false
      }

      if (filterDateTo) {
        const toDate = new Date(filterDateTo)
        // set to end of day
        toDate.setHours(23, 59, 59, 999)
        const recordDate = s.created_at ? new Date(s.created_at) : new Date(s.join_date)
        if (recordDate > toDate) return false
      }

      return true
    })
  }, [staffList, search, filterRole, filterDateFrom, filterDateTo, activeStatusTab])

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
      const payload = editingStaff 
        ? { id: editingStaff.id, ...formData }
        : formData

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
      console.error("Failed to save staff:", err)
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
      console.error("Failed to delete staff:", err)
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
              activeStatusTab === "active"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 block"></span>
            ACTIVE ({counts.active})
          </button>
          <button
            onClick={() => setActiveStatusTab("suspended")}
            className={`flex items-center gap-2 pb-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeStatusTab === "suspended"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 block"></span>
            SUSPEND ({counts.suspended})
          </button>
          <button
            onClick={() => setActiveStatusTab("inactive")}
            className={`flex items-center gap-2 pb-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeStatusTab === "inactive"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-500 block"></span>
            EXITED ({counts.exited})
          </button>
          <button
            onClick={() => setActiveStatusTab("terminated")}
            className={`flex items-center gap-2 pb-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all ${
              activeStatusTab === "terminated"
                ? "border-primary text-primary"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500 block"></span>
            TERMINATED ({counts.terminated})
          </button>
        </div>

        {/* Directory Table */}
        <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              No staff records found matching your filters.
            </div>
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
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editingStaff ? "Edit Employee Details" : "Add New Employee"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="rounded-lg text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Employee ID</Label>
                <Input
                  required
                  value={formData.employee_id}
                  onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                  className="rounded-lg text-sm"
                  placeholder="e.g. EMP-001"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Role (Job Level)</Label>
                <Input
                  required
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="rounded-lg text-sm"
                  placeholder="e.g. Manager, Intern, Executive"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Position (Job Title)</Label>
                <Input
                  required
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="rounded-lg text-sm"
                  placeholder="e.g. Human Resources Manager"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select
                  value={formData.department}
                  onValueChange={(val) => setFormData({ ...formData, department: val })}
                >
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
                  onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                  className="rounded-lg text-sm"
                  placeholder="Manager's Name"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="rounded-lg text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="rounded-lg text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Join Date</Label>
                <Input
                  type="date"
                  required
                  value={formData.join_date}
                  onChange={(e) => setFormData({ ...formData, join_date: e.target.value })}
                  className="rounded-lg text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
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

            {error && (
              <div className="p-3 text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t mt-4">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)} className="rounded-xl">
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
    </Card>
  )
}

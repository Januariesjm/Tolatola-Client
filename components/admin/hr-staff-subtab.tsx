"use client"

import { useState } from "react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Users, Plus, Search, Trash2, Loader2, Building, Briefcase, Mail, Phone } from "lucide-react"
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
}

export function HRStaffSubtab({ staff: initialStaff }: { staff: HRStaff[] }) {
  const [staffList, setStaffList] = useState<HRStaff[]>(initialStaff)
  const [search, setSearch] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    full_name: "",
    employee_id: "",
    role: "",
    department: "",
    email: "",
    phone: "",
    join_date: "",
    status: "active",
  })

  const filtered = staffList.filter((s) =>
    !search ||
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.employee_id.toLowerCase().includes(search.toLowerCase()) ||
    s.department.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await clientApiPost("admin/hr/staff", formData)
      if (res.data) {
        setStaffList([res.data, ...staffList])
        setIsAddOpen(false)
        setFormData({
          full_name: "",
          employee_id: "",
          role: "",
          department: "",
          email: "",
          phone: "",
          join_date: "",
          status: "active",
        })
      }
    } catch (err) {
      console.error("Failed to add staff:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this staff record?")) return
    try {
      await clientApiDelete(`admin/hr/staff/${id}`)
      setStaffList(staffList.filter((s) => s.id !== id))
    } catch (err) {
      console.error("Failed to delete staff:", err)
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await clientApiPost("admin/hr/staff", { id, status: newStatus })
      if (res.data) {
        setStaffList(staffList.map(s => s.id === id ? res.data : s))
      }
    } catch (err) {
      console.error("Failed to update status:", err)
    }
  }

  return (
    <Card className="shadow-sm rounded-xl">
      <CardHeader className="pb-3 flex flex-row items-center justify-between border-b bg-slate-50/50">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Staff Directory
        </CardTitle>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Add Staff Record
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input required value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Employee ID</Label>
                  <Input required value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})} placeholder="e.g. EMP-001" />
                </div>
                <div className="space-y-2">
                  <Label>Role / Job Title</Label>
                  <Input required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select value={formData.department} onValueChange={(val) => setFormData({...formData, department: val})}>
                    <SelectTrigger><SelectValue placeholder="Select dept"/></SelectTrigger>
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
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Join Date</Label>
                  <Input type="date" required value={formData.join_date} onChange={e => setFormData({...formData, join_date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full rounded-xl mt-4" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Record
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 border-b">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl bg-slate-50 border-slate-200"
            />
          </div>
        </div>
        
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No staff records found.
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Role & Dept</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(staff => (
                <TableRow key={staff.id}>
                  <TableCell>
                    <div>
                      <p className="font-semibold text-sm">{staff.full_name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{staff.employee_id}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium flex items-center gap-1"><Briefcase className="h-3 w-3 text-primary/50" /> {staff.role}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Building className="h-3 w-3" /> {staff.department}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-slate-600 space-y-1">
                      {staff.email && <p className="flex items-center gap-1"><Mail className="h-3 w-3 text-slate-400" /> {staff.email}</p>}
                      {staff.phone && <p className="flex items-center gap-1"><Phone className="h-3 w-3 text-slate-400" /> {staff.phone}</p>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(staff.join_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Select value={staff.status} onValueChange={(val) => handleStatusChange(staff.id, val)}>
                      <SelectTrigger className="h-8 w-[100px] text-xs">
                        {staff.status === "active" ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                        ) : staff.status === "inactive" ? (
                          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">Inactive</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Suspended</Badge>
                        )}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(staff.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}

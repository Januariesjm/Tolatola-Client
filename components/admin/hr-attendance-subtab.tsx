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
import { Textarea } from "@/components/ui/textarea"
import { ClipboardCheck, Plus, Search, Trash2, Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from "lucide-react"
import { clientApiPost, clientApiDelete } from "@/lib/api-client"

interface HRAttendance {
  id: string
  staff_id: string
  date: string
  check_in_time?: string
  check_out_time?: string
  status: string
  notes?: string
  hr_staff_records?: { full_name: string }
}

export function HRAttendanceSubtab({ attendance: initialAttendance, staff }: { attendance: HRAttendance[], staff: any[] }) {
  const [attendance, setAttendance] = useState<HRAttendance[]>(initialAttendance)
  const [search, setSearch] = useState("")
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0])
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    staff_id: "",
    date: new Date().toISOString().split('T')[0],
    check_in_time: "09:00",
    check_out_time: "17:00",
    status: "present",
    notes: "",
  })

  const filtered = attendance.filter((a) =>
    (!search || a.hr_staff_records?.full_name.toLowerCase().includes(search.toLowerCase())) &&
    (!dateFilter || a.date === dateFilter)
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1"/> Present</Badge>
      case "absent":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1"/> Absent</Badge>
      case "half-day":
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><AlertCircle className="h-3 w-3 mr-1"/> Half Day</Badge>
      case "leave":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Clock className="h-3 w-3 mr-1"/> On Leave</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = {
        ...formData,
        check_in_time: formData.status === 'absent' || formData.status === 'leave' ? null : formData.check_in_time,
        check_out_time: formData.status === 'absent' || formData.status === 'leave' ? null : formData.check_out_time,
      }
      
      const res = await clientApiPost("admin/hr/attendance", payload)
      if (res.data) {
        const staffObj = staff.find(s => s.id === formData.staff_id)
        const newRecord = { ...res.data, hr_staff_records: staffObj }
        setAttendance([newRecord, ...attendance.filter(a => a.id !== newRecord.id)])
        setIsAddOpen(false)
        setFormData({
          ...formData,
          staff_id: "",
          notes: "",
        })
      }
    } catch (err) {
      console.error("Failed to save attendance:", err)
      alert("Failed to save. This employee might already have a record for this date.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this attendance record?")) return
    try {
      await clientApiDelete(`admin/hr/attendance/${id}`)
      setAttendance(attendance.filter((a) => a.id !== id))
    } catch (err) {
      console.error("Failed to delete:", err)
    }
  }

  return (
    <Card className="shadow-sm rounded-xl">
      <CardHeader className="pb-3 flex flex-row items-center justify-between border-b bg-slate-50/50">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          Daily Attendance
        </CardTitle>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Log Attendance
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Employee Attendance</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Employee</Label>
                  <Select required value={formData.staff_id} onValueChange={(val) => setFormData({...formData, staff_id: val})}>
                    <SelectTrigger><SelectValue placeholder="Select staff member"/></SelectTrigger>
                    <SelectContent>
                      {staff.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.full_name} ({s.department})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="half-day">Half Day</SelectItem>
                      <SelectItem value="leave">On Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {(formData.status === 'present' || formData.status === 'half-day') && (
                  <>
                    <div className="space-y-2">
                      <Label>Check-in Time</Label>
                      <Input type="time" required value={formData.check_in_time} onChange={e => setFormData({...formData, check_in_time: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <Label>Check-out Time</Label>
                      <Input type="time" required value={formData.check_out_time} onChange={e => setFormData({...formData, check_out_time: e.target.value})} />
                    </div>
                  </>
                )}
              </div>
              
              <div className="space-y-2">
                <Label>Notes (Optional)</Label>
                <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Reason for absence or late arrival..." />
              </div>
              
              <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Record
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="p-0">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by staff name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl bg-slate-50 border-slate-200"
            />
          </div>
          <div className="w-full sm:w-[200px]">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-xl"
            />
          </div>
        </div>
        
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No attendance records found for this date.
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(record => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {record.hr_staff_records?.full_name || "Unknown"}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(record.status)}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {record.check_in_time ? record.check_in_time.substring(0, 5) : "-"}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {record.check_out_time ? record.check_out_time.substring(0, 5) : "-"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                    {record.notes || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(record.id)}>
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

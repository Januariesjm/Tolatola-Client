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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CalendarDays, Plus, Search, Trash2, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react"
import { clientApiPost, clientApiDelete } from "@/lib/api-client"

interface HRInterview {
  id: string
  candidate_name: string
  position: string
  interview_date: string
  interview_time: string
  interviewer: string
  status: string
  notes?: string
}

export function HRInterviewsSubtab({ interviews: initialInterviews }: { interviews: HRInterview[] }) {
  const [interviews, setInterviews] = useState<HRInterview[]>(initialInterviews)
  const [search, setSearch] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    candidate_name: "",
    position: "",
    interview_date: "",
    interview_time: "",
    interviewer: "",
    status: "scheduled",
    notes: "",
  })

  const filtered = interviews.filter((i) =>
    !search ||
    i.candidate_name.toLowerCase().includes(search.toLowerCase()) ||
    i.position.toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><Clock className="h-3 w-3 mr-1"/> Scheduled</Badge>
      case "completed":
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200"><CheckCircle2 className="h-3 w-3 mr-1"/> Completed</Badge>
      case "cancelled":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="h-3 w-3 mr-1"/> Cancelled</Badge>
      case "hired":
        return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">Hired</Badge>
      case "rejected":
        return <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-300">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await clientApiPost("admin/hr/interviews", formData)
      if (res.data) {
        setInterviews([res.data, ...interviews])
        setIsAddOpen(false)
        setFormData({
          candidate_name: "",
          position: "",
          interview_date: "",
          interview_time: "",
          interviewer: "",
          status: "scheduled",
          notes: "",
        })
      }
    } catch (err) {
      console.error("Failed to add interview:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this interview?")) return
    try {
      await clientApiDelete(`admin/hr/interviews/${id}`)
      setInterviews(interviews.filter((i) => i.id !== id))
    } catch (err) {
      console.error("Failed to delete:", err)
    }
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await clientApiPost("admin/hr/interviews", { id, status: newStatus })
      if (res.data) {
        setInterviews(interviews.map(i => i.id === id ? res.data : i))
      }
    } catch (err) {
      console.error("Failed to update status:", err)
    }
  }

  return (
    <Card className="shadow-sm rounded-xl">
      <CardHeader className="pb-3 flex flex-row items-center justify-between border-b bg-slate-50/50">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          Interviews Schedule
        </CardTitle>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Schedule Interview
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Interview</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Candidate Name</Label>
                  <Input required value={formData.candidate_name} onChange={e => setFormData({...formData, candidate_name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Position</Label>
                  <Input required value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" required value={formData.interview_date} onChange={e => setFormData({...formData, interview_date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input type="time" required value={formData.interview_time} onChange={e => setFormData({...formData, interview_time: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Interviewer Name</Label>
                  <Input value={formData.interviewer} onChange={e => setFormData({...formData, interviewer: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="scheduled">Scheduled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes / Details</Label>
                <Textarea value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Meeting link or location details..." />
              </div>
              <Button type="submit" className="w-full rounded-xl" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Interview
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
              placeholder="Search candidate or position..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl bg-slate-50 border-slate-200"
            />
          </div>
        </div>
        
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No interviews scheduled.
          </div>
        ) : (
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Interviewer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(interview => (
                <TableRow key={interview.id}>
                  <TableCell className="font-medium">{interview.candidate_name}</TableCell>
                  <TableCell>{interview.position}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-medium">{new Date(interview.interview_date).toLocaleDateString()}</span>
                      <span className="text-muted-foreground ml-2">{interview.interview_time}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{interview.interviewer || "TBA"}</TableCell>
                  <TableCell>
                    <Select value={interview.status} onValueChange={(val) => handleStatusChange(interview.id, val)}>
                      <SelectTrigger className="h-8 w-[130px] text-xs">
                        {getStatusBadge(interview.status)}
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="scheduled">Scheduled</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="hired">Hired</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(interview.id)}>
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

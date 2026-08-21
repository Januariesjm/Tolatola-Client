"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Search,
  FileText,
  ExternalLink,
  Trash2,
  CheckCircle2,
  Loader2,
  Users,
  Briefcase,
  Download,
  GraduationCap,
  FileSignature,
  Eye,
  Star,
  XCircle,
  Clock,
} from "lucide-react"
import { clientApiPost, clientApiDelete, clientApiGet } from "@/lib/api-client"
import { logger } from "@/lib/logger"
import { CareerApplicationDetailDialog } from "@/components/admin/career-application-detail-dialog"
import { APPLICATION_STATUS_CONFIG } from "@/components/admin/career-application-status"
import {
  countApplicationsByStatus,
  distinctPositions,
  filterApplications,
  formatApplicationDate,
  type CareerApplication,
} from "@/lib/admin/career-applications"

const log = logger.child("admin.hr-applications-subtab")

export function HRApplicationsSubtab({ applications: initialApplications }: { applications: CareerApplication[] }) {
  const [applications, setApplications] = useState<CareerApplication[]>(initialApplications)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [positionFilter, setPositionFilter] = useState<string>("all")
  const [selectedApp, setSelectedApp] = useState<CareerApplication | null>(null)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const positions = distinctPositions(applications)
  const filtered = filterApplications(applications, { query: search, statusFilter, positionFilter })
  const statusCounts = countApplicationsByStatus(applications)

  const handleStatusChange = async (id: string, newStatus: string, notes?: string) => {
    setLoadingId(id)
    try {
      await clientApiPost(`admin/career-applications/${id}/status`, {
        status: newStatus,
        admin_notes: notes,
      })
      setApplications((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,
                status: newStatus as CareerApplication["status"],
                ...(notes !== undefined ? { admin_notes: notes } : {}),
                updated_at: new Date().toISOString(),
              }
            : a,
        ),
      )
    } catch (e) {
      log.error("failed to update status", e)
    } finally {
      setLoadingId(null)
    }
  }

  const handleDialogStatusChange = (id: string, newStatus: string) => {
    handleStatusChange(id, newStatus)
    if (selectedApp?.id === id) setSelectedApp({ ...selectedApp, status: newStatus as CareerApplication["status"] })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this application?")) return
    setLoadingId(id)
    try {
      await clientApiDelete(`admin/career-applications/${id}`)
      setApplications((prev) => prev.filter((a) => a.id !== id))
      if (selectedApp?.id === id) {
        setIsDetailOpen(false)
        setSelectedApp(null)
      }
    } catch (e) {
      log.error("failed to delete application", e)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card
          className={`shadow-sm rounded-xl cursor-pointer transition-all ${
            statusFilter === "all" ? "border-primary/40 bg-primary/5" : "hover:border-primary/20"
          }`}
          onClick={() => setStatusFilter("all")}
        >
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-black">{statusCounts.all}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card
          className={`shadow-sm rounded-xl cursor-pointer transition-all ${
            statusFilter === "pending" ? "border-amber-400/40 bg-amber-50" : "hover:border-amber-200"
          }`}
          onClick={() => setStatusFilter("pending")}
        >
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-black text-amber-700">{statusCounts.pending}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card
          className={`shadow-sm rounded-xl cursor-pointer transition-all ${
            statusFilter === "reviewed" ? "border-blue-400/40 bg-blue-50" : "hover:border-blue-200"
          }`}
          onClick={() => setStatusFilter("reviewed")}
        >
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-black text-blue-700">{statusCounts.reviewed}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Reviewed</div>
          </CardContent>
        </Card>
        <Card
          className={`shadow-sm rounded-xl cursor-pointer transition-all ${
            statusFilter === "shortlisted" ? "border-emerald-400/40 bg-emerald-50" : "hover:border-emerald-200"
          }`}
          onClick={() => setStatusFilter("shortlisted")}
        >
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-black text-emerald-700">{statusCounts.shortlisted}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Shortlisted</div>
          </CardContent>
        </Card>
        <Card
          className={`shadow-sm rounded-xl cursor-pointer transition-all ${
            statusFilter === "rejected" ? "border-red-400/40 bg-red-50" : "hover:border-red-200"
          }`}
          onClick={() => setStatusFilter("rejected")}
        >
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-black text-red-700">{statusCounts.rejected}</div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rejected</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm rounded-xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Career Applications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or position..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="w-full md:w-[240px] rounded-xl">
                <SelectValue placeholder="Filter by position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Positions</SelectItem>
                {positions.map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    {pos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-semibold">No applications found</p>
              <p className="text-sm mt-1">
                {applications.length === 0 ? "Applications will appear here when candidates apply." : "Try adjusting your filters."}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="font-bold text-xs uppercase tracking-wider w-[50px]">#</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Applicant</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Position</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Date</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Status</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider">Docs</TableHead>
                    <TableHead className="font-bold text-xs uppercase tracking-wider text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((app, index) => {
                    const status = APPLICATION_STATUS_CONFIG[app.status]
                    return (
                      <TableRow
                        key={app.id}
                        className="cursor-pointer hover:bg-muted/20"
                        onClick={() => {
                          setSelectedApp(app)
                          setIsDetailOpen(true)
                        }}
                      >
                        <TableCell className="font-medium text-muted-foreground">{index + 1}</TableCell>
                        <TableCell>
                          <div>
                            <p className="font-semibold text-sm">{app.full_name}</p>
                            <p className="text-xs text-muted-foreground">{app.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm font-medium">{app.position}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">{formatApplicationDate(app.created_at)}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`${status.color} gap-1 text-[10px] font-bold uppercase tracking-wider`}>
                            {status.icon}
                            {status.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              title="CV"
                              onClick={() => window.open(app.cv_url, "_blank")}
                            >
                              <FileText className="h-3.5 w-3.5" />
                            </Button>
                            {app.certificates_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title="Certificates"
                                onClick={() => window.open(app.certificates_url, "_blank")}
                              >
                                <GraduationCap className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {app.application_letter_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0"
                                title="Application Letter"
                                onClick={() => window.open(app.application_letter_url, "_blank")}
                              >
                                <FileSignature className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                            {app.status === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                  disabled={loadingId === app.id}
                                  onClick={() => handleStatusChange(app.id, "reviewed")}
                                >
                                  {loadingId === app.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Eye className="h-3 w-3 mr-1" />}
                                  Review
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  disabled={loadingId === app.id}
                                  onClick={() => handleStatusChange(app.id, "shortlisted")}
                                >
                                  <Star className="h-3 w-3 mr-1" />
                                  Shortlist
                                </Button>
                              </>
                            )}
                            {app.status === "reviewed" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                  disabled={loadingId === app.id}
                                  onClick={() => handleStatusChange(app.id, "shortlisted")}
                                >
                                  <Star className="h-3 w-3 mr-1" />
                                  Shortlist
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                  disabled={loadingId === app.id}
                                  onClick={() => handleStatusChange(app.id, "rejected")}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </>
                            )}
                            {app.status === "shortlisted" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={loadingId === app.id}
                                onClick={() => handleStatusChange(app.id, "rejected")}
                              >
                                <XCircle className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            )}
                            {app.status === "rejected" && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                disabled={loadingId === app.id}
                                onClick={() => handleStatusChange(app.id, "pending")}
                              >
                                <Clock className="h-3 w-3 mr-1" />
                                Reopen
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                              disabled={loadingId === app.id}
                              onClick={() => handleDelete(app.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <CareerApplicationDetailDialog
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        application={selectedApp}
        loadingId={loadingId}
        onStatusChange={handleDialogStatusChange}
        onDelete={handleDelete}
      />
    </div>
  )
}
